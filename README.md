# Painel econômico + chat em tempo real

Projeto de portfólio que junta duas capacidades que costumam ser pedidas separadas:
consumo de uma API pública real transformada em informação útil, e comunicação em
tempo real sobre WebSockets — na mesma aplicação Next.js.

- **Painel** (`/dashboard`): Selic, CDI, IPCA e dólar PTAX consultados no SGS (Sistema
  Gerenciador de Séries Temporais) do Banco Central do Brasil, com tendência, histórico
  e leituras derivadas (juro real, distância da meta de inflação, oscilação cambial,
  rendimento do CDI).
- **Chat** (`/chat`): salas múltiplas com Socket.IO, histórico persistido, lista de
  presença e indicador de digitação.
- **Assistente `@bcb`**: participante do chat que responde perguntas sobre os
  indicadores usando as mesmas séries que o painel consome — é o que amarra as
  duas metades do projeto.

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 (tokens em `globals.css`) |
| Gráficos | Recharts |
| Tempo real | Socket.IO sobre servidor HTTP Node customizado |
| Persistência | Prisma + SQLite |
| Dados externos | API de dados abertos do BCB (sem autenticação) |

## Como rodar

```bash
npm install
cp .env.example .env
npx prisma migrate dev     # cria o SQLite e aplica a migração
npm run dev                # http://localhost:3000
```

Para ver o tempo real funcionando, abra `/chat` em duas janelas com apelidos diferentes.

Build de produção:

```bash
npm run build
npm start
```

## Organização

```
server.ts                      servidor Node: Next.js + Socket.IO no mesmo processo
prisma/schema.prisma           modelo Message (sala, autor, conteúdo, data)
src/
  app/
    page.tsx                   landing
    dashboard/page.tsx         painel (Server Component, ISR de 1h)
    chat/page.tsx              chat
    api/indicators/route.ts    endpoint REST usado pelo ticker do topo
  lib/
    bcb/service.ts             integração com o SGS: fetch, retry e normalização
    bcb/insights.ts            cruzamentos derivados das séries brutas
    bcb/types.ts               contratos do domínio
    chat/service.ts            persistência das mensagens (Prisma)
    chat/useChat.ts            cliente Socket.IO como hook React
    chat/useNickname.ts        apelido via useSyncExternalStore
    prisma.ts                  singleton do Prisma Client
    format.ts                  formatação pt-BR
  components/
    layout/                    navbar, ticker de cotações, footer
    dashboard/                 cards, sparkline, gráfico, composição do painel
    chat/                      gate de apelido, lista de mensagens, composer
```

A regra de separação seguida aqui: `lib/` não conhece React nem rotas — são serviços de
domínio puros, consumidos tanto pelos Server Components quanto pelo servidor Socket.IO.
Componentes só formatam e exibem.

## Decisões que valem explicação

**Servidor customizado em vez de rota de API.** Socket.IO precisa de um servidor HTTP de
longa duração para manter as conexões abertas; rotas do App Router são efêmeras. Por isso
`server.ts` cria o HTTP server, entrega as requisições para o handler do Next e anexa o
Socket.IO no caminho `/api/socket`. Um processo só, um deploy só.

**Resiliência na integração com o BCB.** O gateway do Banco Central às vezes responde com
um envelope XML de erro usando status 200, e o endpoint `/dados/ultimos/{n}` rejeita
requisições acima de 20 valores. O serviço valida o corpo como JSON antes de aceitá-lo,
tenta novamente com backoff e, no agregador, usa `Promise.allSettled` — uma série fora do
ar não derruba o painel inteiro.

**Cache de uma hora.** As séries do SGS são diárias ou mensais, então o `fetch` usa
`revalidate: 3600`. O ticker do topo revalida pelo endpoint REST a cada minuto para manter
a sensação de dado vivo sem martelar a API pública.

**Presença em memória, mensagens em banco.** Quem está online é estado efêmero da conexão
e vive em um `Map` no servidor. Mensagem é fato: vai para o SQLite via Prisma e volta como
histórico quando alguém entra na sala.

## O assistente `@bcb`

Mencione `@bcb` em qualquer sala e ele responde com os números reais do Banco
Central — "como está a Selic?", "quanto rendem R$ 5.000 no CDI?", "a inflação
está acima da meta?".

Ele tem **dois motores por trás da mesma interface** (`src/lib/assistant/`):

| Motor | Quando roda | O que faz |
| --- | --- | --- |
| Determinístico (`local.ts`) | padrão, sem configuração | Interpreta a pergunta e calcula a resposta direto das séries: valor atual, variação, juro real, IPCA acumulado, rendimento de um valor no CDI |
| Claude (`claude.ts`) | quando `ANTHROPIC_API_KEY` existe | Mesma pergunta, respondida pelo modelo `claude-opus-5` tendo como única fonte factual o snapshot das séries injetado no turno |

A interface marca cada resposta com a origem (`Claude` ou `dados do BCB`), para
nunca passar por modelo o que foi calculado em código — e vice-versa.

**Decisões de projeto:**

- **O motor local não é um stub.** Ele responde de verdade, e continua sendo a
  rede de segurança quando a chamada ao modelo falha ou estoura o tempo: o chat
  nunca quebra por causa do assistente.
- **Separação entre dado e instrução.** A pergunta do visitante entra no turno
  do usuário, dentro de `<pergunta_do_visitante>`, e os números em `<dados>`. O
  prompt do sistema manda tratar o texto do visitante como conteúdo, nunca como
  comando — é a mitigação de prompt injection (OWASP LLM01).
- **O apelido `@bcb` é infalsificável.** A validação de apelidos não aceita `@`,
  então nenhum visitante consegue se passar pelo assistente.
- **Consumo limitado.** 5 perguntas por minuto por conexão, resposta limitada a
  700 tokens e timeout de 20s na chamada — contra abuso e custo descontrolado
  (OWASP LLM06).

## Segurança

O WebSocket é a única superfície que aceita entrada de terceiros, e é tratada como
hostil: o cliente pode emitir qualquer payload, em qualquer ordem, na velocidade que
quiser.

| Controle | Onde |
| --- | --- |
| Validação de tipo, tamanho e allowlist de sala | `src/lib/chat/validation.ts` |
| Rate limiting por conexão (mensagem, troca de sala, digitação) | `src/lib/security/rateLimit.ts` + `server.ts` |
| Rate limiting por IP no endpoint REST | `src/app/api/indicators/route.ts` |
| Verificação de origem no handshake (anti-CSWSH) | `src/lib/security/origins.ts` |
| Limite de conexões simultâneas por IP | `server.ts` |
| Headers (CSP, HSTS, nosniff, frame-ancestors, Referrer-Policy) | `next.config.ts` |
| Retenção de 7 dias nas mensagens | `src/lib/chat/service.ts` |

Decisões que valem registrar:

- **Falha fechada.** Em produção o servidor recusa subir sem `ALLOWED_ORIGINS`. Nenhum
  handler de socket depende do catch global do framework: cada um é embrulhado por
  `guard()`, que contém o erro, registra sem dado do usuário e devolve uma recusa ao
  cliente.
- **Ausência de `Origin` é permitida de propósito.** O navegador só envia o cabeçalho
  quando a requisição vem de outra origem — justamente o caso do ataque. Recusar a
  ausência quebraria o handshake de mesma origem.
- **Sem dado pessoal.** O apelido é pseudônimo, fica no `localStorage` do visitante e
  nunca é associado a e-mail, IP ou identificador. Os logs do servidor não registram IP
  nem conteúdo de mensagem.
- **Escopo.** Não há login, upload, pagamento ou dado de terceiro. Se o projeto evoluir
  para ter conta de usuário, entram os itens que hoje não se aplicam: hash de senha
  (Argon2id), expiração e revogação de sessão, MFA, autorização por recurso e trilha de
  auditoria.
- **Limitação conhecida.** O rate limiting vive em memória: funciona para uma instância.
  Com mais de uma réplica, cada uma aplicaria o próprio limite — nesse cenário o
  contador precisa ir para Redis.

### Antes de publicar

HTTPS, redirecionamento HTTP→HTTPS e backup do banco são responsabilidade do ambiente de
deploy (proxy/plataforma). O HSTS já é enviado pela aplicação em produção, mas só tem
efeito atrás de TLS. Defina `ALLOWED_ORIGINS` com o domínio real.

## Deploy

O app roda como **um processo Node de longa duração** servindo o Next.js e o Socket.IO
juntos. Isso descarta hospedagem estática (GitHub Pages) e torna o Render a escolha
natural: `render.yaml` declara o serviço web e um Postgres gerenciado, e o Render cria os
dois juntos injetando a `DATABASE_URL`.

```
Render → New → Blueprint → selecionar este repositório → Apply
```

**Por que não Vercel.** A Vercel suporta WebSocket, mas a própria documentação avisa que
conexões novas não caem necessariamente na mesma instância de função. Como a presença e o
broadcast de sala vivem na memória do processo, dois visitantes em instâncias diferentes
não se enxergariam — seria preciso um adaptador de Redis e um repensar da presença. O
Render preserva a arquitetura de um processo registrada acima.

**Banco em dois schemas.** `prisma/schema.prisma` continua SQLite para o desenvolvimento
local, sem exigir banco instalado na máquina; `prisma/production/schema.prisma` é o mesmo
modelo em PostgreSQL, com migração própria. O build e o start em produção apontam para o
segundo via `--schema`. A duplicação é de dez linhas e o preço de manter o setup local em
um comando — se os dois divergirem, o `migrate deploy` falha no deploy, não em produção.

**Depois do primeiro deploy.** Confirme que `ALLOWED_ORIGINS` tem o domínio real que o
Render atribuiu. O servidor recusa subir sem essa variável, e com o valor errado o
handshake do WebSocket é recusado — o chat conecta e não troca mensagem.

## Fonte dos dados

[API de Dados Abertos do Banco Central do Brasil](https://dadosabertos.bcb.gov.br/) —
séries 432 (Selic meta), 12 (CDI diário), 433 (IPCA mensal) e 1 (dólar PTAX venda).
