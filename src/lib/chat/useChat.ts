"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ChatMessage } from "./types";

interface UseChatOptions {
  room: string;
  username: string | null;
}

interface SystemEntry {
  id: string;
  text: string;
}

export function useChat({ room, username }: UseChatOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemLog, setSystemLog] = useState<SystemEntry[]>([]);
  const [presence, setPresence] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [rejection, setRejection] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const socket = io({ path: "/api/socket" });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", { room, username });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on("message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("system-message", (text: string) => {
      setSystemLog((prev) => [...prev.slice(-20), { id: crypto.randomUUID(), text }]);
    });

    socket.on("presence", (users: string[]) => {
      setPresence(users);
    });

    socket.on("action-rejected", ({ reason }: { event: string; reason: string }) => {
      setRejection(reason);
    });

    socket.on("typing", ({ username: who, isTyping }: { username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const withoutUser = prev.filter((name) => name !== who);
        return isTyping ? [...withoutUser, who] : withoutUser;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setMessages([]);
      setSystemLog([]);
      setPresence([]);
      setTypingUsers([]);
      setConnected(false);
      setRejection(null);
    };
  }, [room, username]);

  const sendMessage = useCallback((content: string) => {
    setRejection(null);
    socketRef.current?.emit("send-message", { content });
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    socketRef.current?.emit("typing", isTyping);
  }, []);

  return {
    messages,
    systemLog,
    presence,
    typingUsers,
    connected,
    rejection,
    sendMessage,
    setTyping,
  };
}
