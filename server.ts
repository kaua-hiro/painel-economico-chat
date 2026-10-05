import { createServer } from "node:http";
import next from "next";
import { Server, type Socket } from "socket.io";
import { getRecentMessages, purgeExpiredMessages, saveMessage } from "./src/lib/chat/service";
import {
  field,
  validateMessage,
  validateNickname,
  validateRoom,
} from "./src/lib/chat/validation";
import { RateLimiter } from "./src/lib/security/rateLimit";
import { allowedOrigins, isOriginAllowed } from "./src/lib/security/origins";
import {
  ASSISTANT_NAME,
  askAssistant,
  mentionsAssistant,
  stripMention,
} from "./src/lib/assistant";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

/** Mapa sala -> (socketId -> apelido). Presença é estado efêmero da conexão. */
const roomUsers = new Map<string, Map<string, string>>();

/** Limites por conexão: mensagens, trocas de sala e eventos de digitação. */
const messageLimiter = new RateLimiter({ limit: 10, windowMs: 10_000 });
const joinLimiter = new RateLimiter({ limit: 8, windowMs: 60_000 });
const typingLimiter = new RateLimiter({ limit: 20, windowMs: 10_000 });
/** O assistente custa chamada de API: limite mais apertado que o das mensagens. */
const assistantLimiter = new RateLimiter({ limit: 5, windowMs: 60_000 });

/** Conexões simultâneas por IP, para uma única origem não esgotar o servidor. */
const MAX_SOCKETS_PER_IP = 12;
const socketsPerIp = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  messageLimiter.prune(now);
  joinLimiter.prune(now);
  typingLimiter.prune(now);
}, 60_000).unref();

function presenceFor(room: string): string[] {
  return Array.from(roomUsers.get(room)?.values() ?? []);
}

function leaveRoom(io: Server, room: string, socketId: string, username: string | null) {
  const users = roomUsers.get(room);
  if (!users) return;

  users.delete(socketId);
  if (users.size === 0) {
    roomUsers.delete(room);
  }

  io.to(room).emit("presence", presenceFor(room));
  if (username) {
    io.to(room).emit("system-message", `${username} saiu da sala.`);
  }
}

function clientIp(socket: Socket): string {
  const forwarded = socket.handshake.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (first ?? socket.handshake.address ?? "desconhecido").trim();
}

/**
 * Nenhum handler pode derrubar o processo nem depender do catch global do
 * framework: toda falha é contida, registrada sem dado do usuário e devolvida
 * ao cliente como recusa.
 */
function guard<T extends unknown[]>(
  socket: Socket,
  event: string,
  handler: (...args: T) => Promise<void> | void,
) {
  return async (...args: T) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error(`[socket] falha ao processar "${event}":`, error);
      socket.emit("action-rejected", { event, reason: "Não foi possível processar o pedido." });
    }
  };
}

/**
 * Responde em segundo plano: a mensagem do visitante já foi entregue à sala, e
 * a resposta do assistente chega quando ficar pronta. Falha aqui nunca derruba
 * a conversa — no pior caso ninguém recebe resposta.
 */
async function responderAssistente(io: Server, socket: Socket, room: string, content: string) {
  if (!assistantLimiter.take(socket.id)) {
    socket.emit("action-rejected", {
      event: "assistant",
      reason: "Você está perguntando ao @bcb rápido demais. Aguarde um minuto.",
    });
    return;
  }

  io.to(room).emit("typing", { username: ASSISTANT_NAME, isTyping: true });

  try {
    const { text, mode } = await askAssistant(stripMention(content));
    const message = await saveMessage(room, ASSISTANT_NAME, text);
    io.to(room).emit("message", { ...message, assistantMode: mode });
  } catch (error) {
    console.error("[assistente] falha ao responder:", error);
  } finally {
    io.to(room).emit("typing", { username: ASSISTANT_NAME, isTyping: false });
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    path: "/api/socket",
    // WebSocket não passa por CORS no navegador: a origem é verificada aqui.
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      callback(null, isOriginAllowed(origin));
    },
    cors: { origin: allowedOrigins(), credentials: false },
    // Mensagens legítimas têm menos de 2 KB; o padrão de 1 MB é desnecessário.
    maxHttpBufferSize: 16_000,
    pingTimeout: 20_000,
    connectTimeout: 10_000,
  });

  io.on("connection", (socket) => {
    const ip = clientIp(socket);
    const openSockets = socketsPerIp.get(ip) ?? 0;

    if (openSockets >= MAX_SOCKETS_PER_IP) {
      socket.emit("action-rejected", {
        event: "connection",
        reason: "Muitas conexões simultâneas desta origem.",
      });
      socket.disconnect(true);
      return;
    }
    socketsPerIp.set(ip, openSockets + 1);

    let currentRoom: string | null = null;
    let currentUser: string | null = null;

    socket.on(
      "join-room",
      guard(socket, "join-room", async (payload: unknown) => {
        if (!joinLimiter.take(socket.id)) {
          socket.emit("action-rejected", {
            event: "join-room",
            reason: "Muitas trocas de sala seguidas. Aguarde alguns segundos.",
          });
          return;
        }

        const room = validateRoom(field(payload, "room"));
        if (!room.ok) {
          socket.emit("action-rejected", { event: "join-room", reason: room.reason });
          return;
        }

        const nickname = validateNickname(field(payload, "username"));
        if (!nickname.ok) {
          socket.emit("action-rejected", { event: "join-room", reason: nickname.reason });
          return;
        }

        if (currentRoom) {
          socket.leave(currentRoom);
          leaveRoom(io, currentRoom, socket.id, currentUser);
        }

        currentRoom = room.value;
        currentUser = nickname.value;
        socket.join(currentRoom);

        if (!roomUsers.has(currentRoom)) roomUsers.set(currentRoom, new Map());
        roomUsers.get(currentRoom)!.set(socket.id, currentUser);

        try {
          socket.emit("history", await getRecentMessages(currentRoom));
        } catch (error) {
          console.error("[chat] falha ao carregar histórico:", error);
          socket.emit("history", []);
        }

        io.to(currentRoom).emit("presence", presenceFor(currentRoom));
        socket.to(currentRoom).emit("system-message", `${currentUser} entrou na sala.`);
      }),
    );

    socket.on(
      "send-message",
      guard(socket, "send-message", async (payload: unknown) => {
        if (!currentRoom || !currentUser) {
          socket.emit("action-rejected", {
            event: "send-message",
            reason: "Entre em uma sala antes de enviar mensagens.",
          });
          return;
        }

        if (!messageLimiter.take(socket.id)) {
          socket.emit("action-rejected", {
            event: "send-message",
            reason: "Você está enviando mensagens rápido demais.",
          });
          return;
        }

        const content = validateMessage(field(payload, "content"));
        if (!content.ok) {
          socket.emit("action-rejected", { event: "send-message", reason: content.reason });
          return;
        }

        const message = await saveMessage(currentRoom, currentUser, content.value);
        io.to(currentRoom).emit("message", message);

        if (mentionsAssistant(content.value)) {
          void responderAssistente(io, socket, currentRoom, content.value);
        }
      }),
    );

    socket.on(
      "typing",
      guard(socket, "typing", (isTyping: unknown) => {
        if (!currentRoom || !currentUser) return;
        if (typeof isTyping !== "boolean") return;
        if (!typingLimiter.take(socket.id)) return;
        socket.to(currentRoom).emit("typing", { username: currentUser, isTyping });
      }),
    );

    socket.on("disconnect", () => {
      const remaining = (socketsPerIp.get(ip) ?? 1) - 1;
      if (remaining <= 0) socketsPerIp.delete(ip);
      else socketsPerIp.set(ip, remaining);

      messageLimiter.forget(socket.id);
      joinLimiter.forget(socket.id);
      typingLimiter.forget(socket.id);

      if (currentRoom) {
        leaveRoom(io, currentRoom, socket.id, currentUser);
      }
    });
  });

  const purge = () => {
    purgeExpiredMessages()
      .then((count) => count > 0 && console.log(`[chat] ${count} mensagens expiradas removidas`))
      .catch((error) => console.error("[chat] falha ao aplicar retenção:", error));
  };
  purge();
  setInterval(purge, 6 * 60 * 60 * 1000).unref();

  httpServer.listen(port, () => {
    console.log(`> Servidor pronto em http://localhost:${port} (dev=${dev})`);
    console.log(`> Origens aceitas no WebSocket: ${allowedOrigins().join(", ")}`);
  });
});
