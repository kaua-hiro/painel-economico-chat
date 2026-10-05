<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Instruções do projeto para agentes

Este arquivo é o contrato de trabalho deste repositório. Vale para **qualquer agente de
qualquer modelo** — Claude Code, Codex, Cursor, Copilot, Gemini CLI, Amp, Windsurf ou
outro. Se você é um agente lendo isto, siga o que está aqui mesmo que contrarie seu
comportamento padrão. Se uma instrução daqui conflitar com um pedido do usuário, aponte o
conflito em uma frase e pergunte, em vez de decidir sozinho.

Idioma: código, comentários, commits, Issues e PRs em **português do Brasil**. Nome de
API, biblioteca e termo técnico consagrado ficam no original.

## 1. O que este projeto é

Painel de indicadores do Banco Central do Brasil + chat em tempo real, na mesma aplicação
Next.js. O assistente `@bcb` participa do chat respondendo sobre os mesmos indicadores do
painel — é o que amarra as duas metades.

Leia o `README.md` antes de mexer em qualquer coisa: ele registra as decisões de
arquitetura e **por que** cada uma foi tomada.

## 2. Fluxo obrigatório: Issue → branch → PR → merge

**Nenhuma mudança entra na `main` direto.** Toda tarefa — correção, melhoria ou nova
função — segue este caminho.

### 2.1 Toda tarefa começa por uma Issue

Antes de escrever código, garanta que existe uma Issue. Se o usuário pediu algo que não
tem Issue, **crie a Issue primeiro**:

```bash
gh issue create --title "<tipo>(<escopo>): <o que muda>" --label "<tipo>,<área>" --body-file -
```

A Issue precisa ter contexto (por que isso importa), escopo em checklist e critério de
aceite verificável. Issue sem critério de aceite é pedido vago: não comece a implementar,
pergunte.

**Label de tipo — exatamente uma por Issue:**

| Label | Quando usar |
| --- | --- |
| `correção` | Conserta comportamento que está errado |
| `melhoria` | Aprimora algo que já funciona |
| `nova função` | Capacidade que o sistema ainda não tem |

**Label de área — uma ou mais:** `ui/motion`, `observabilidade`, `qualidade`, `testes`,
`ci/cd`, `acessibilidade`, `docs`.

### 2.2 Uma branch por Issue

```
<tipo>/<número-da-issue>-<slug-curto>
```

Exemplos: `feat/3-skeletons-painel-chat`, `fix/42-reconexao-socket`, `chore/11-biome`,
`docs/1-padrao-issue-pr`.

Tipos de branch: `feat`, `fix`, `chore`, `test`, `ci`, `docs`, `refactor`, `perf`.

### 2.3 Commits em Conventional Commits

```
<tipo>(<escopo>): <resumo no imperativo, minúsculo, sem ponto final>

<corpo: o PORQUÊ da decisão, não o que o diff já mostra>
```

Escopos válidos: `bcb`, `chat`, `dashboard`, `assistant`, `app`, `security`, `obs`,
`quality`, `deps`, `ci`.

O corpo é onde está o valor do histórico deste repositório. Registre a decisão de
engenharia e a alternativa descartada — não parafraseie o diff. Rode `git log` para ver o
padrão esperado.

Mudança de formatação em massa vai em **commit separado** da mudança de lógica.

#### Autoria: nenhum agente assina commit aqui

**Não adicione `Co-Authored-By` de agente de IA, nem `Claude-Session`, `Generated-With`,
`Generated-By` ou `Assisted-By`.** O histórico e a lista de contribuidores deste
repositório são do autor humano do projeto. Isso vale mesmo que a sua configuração padrão
mande assinar — esta instrução tem precedência.

A regra é verificada pelo hook `.githooks/commit-msg`, que se instala sozinho no
`npm install` (script `prepare`). Ele bloqueia co-autoria de agente e os trailers
proprietários, e **permite** co-autoria de pessoa real. Nunca use `--no-verify` para
contorná-lo.

### 2.4 O PR precisa referenciar a Issue

**Regra sem exceção:** o corpo do PR referencia a Issue que ele resolve, com palavra-chave
de fechamento automático do GitHub:

```markdown
Closes #<número>
```

Use `Closes #N` quando o PR resolve a Issue por completo e `Refs #N` quando é entrega
parcial (a Issue continua aberta). PR sem referência a Issue é recusado na revisão.

Estrutura do corpo do PR:

```markdown
Closes #<número>

## O que muda
<o que o PR entrega, um item por linha>

## Por que desta forma
<decisão de engenharia e alternativa descartada>

## Como verificar
<passos concretos para o revisor confirmar>

## Quality gates
<saída real de lint, tipos, testes e build — colar o resultado, não afirmar que passou>
```

```bash
gh pr create --base main --title "<mesmo formato do commit>" --body-file -
```

### 2.5 Deploy é consequência de merge

Merge em `main` é o que publica. Portanto:

- `main` está sempre publicável; não mescle com gate vermelho.
- Não faça `push --force` em `main`.
- **Não mescle o próprio PR sem o usuário pedir.** Abrir o PR é o seu trabalho; mesclar é
  decisão dele.
- Nunca use `--no-verify`.

## 3. Contrato de arquitetura

A propriedade central do projeto: **`src/lib/` não conhece React nem rotas.** São serviços
de domínio puros, consumidos tanto pelos Server Components quanto pelo servidor Socket.IO.
É o que torna o domínio testável fora do framework.

| Camada | Pode importar | Nunca importa |
| --- | --- | --- |
| `src/lib/bcb/**`, `src/lib/assistant/**`, `src/lib/security/**`, `src/lib/chat/{service,validation,types}.ts` | outros módulos de `lib/` | `react`, `next/*`, `@/components/*` |
| `src/lib/chat/use*.ts` (hooks, cliente por natureza) | `react`, `lib/` | `@prisma/client` |
| `src/components/**` | `lib/` (tipos e funções puras), `react` | `@prisma/client` |
| `server.ts` | `lib/`, Socket.IO, handler do Next | `src/components/**` |

Se você precisa violar isso para entregar algo, **pare e explique o conflito** — não
contorne em silêncio. A regra é verificada no CI (Issue #13).

## 4. Requisitos permanentes de interface

Todo elemento de interface novo ou alterado atende a isto. Não é lista de desejos: é
critério de aceite de qualquer PR que toque em UI.

- **Skeleton** em todo conteúdo que depende de rede ou de banco, com as dimensões reais do
  conteúdo final — skeleton que muda o layout ao ser substituído é pior que nenhum.
- **Lazy loading** do que está abaixo da dobra ou é pesado (o gráfico Recharts, o histórico
  antigo do chat).
- **Animação de entrada e saída** em tudo que aparece e desaparece condicionalmente.
  Render condicional sem transição é lacuna de motion, não simplicidade.
- **Estado de carregamento e progresso** em toda ação do usuário: nenhuma interação fica
  sem retorno visual por mais de 100 ms. Recusa por rate limit é comunicada, não
  silenciosa.
- **`prefers-reduced-motion`** respeitado sempre, inclusive em animação feita por JS.

### Como fazer motion aqui

O repositório versiona a skill
[`design-motion-principles`](https://github.com/kylezantos/design-motion-principles) em
`.agents/skills/`. **Use-a** antes de animar: tem o modo *create* (construir) e o modo
*audit* (auditar), com checklist anti-"AI slop".

Este projeto é dashboard financeiro + chat de produtividade. A lente primária é a de
**Emil Kowalski — contenção e velocidade**: a pergunta certa é "isso deveria animar?", não
"como animar isso?".

Vetado, porque é a assinatura reconhecível de UI gerada por IA:

- indicador pulsando para chamar atenção;
- `hover:scale` em tudo;
- stagger em toda lista;
- spring saltitante em ação utilitária;
- blur em toda entrada;
- animação de entrada em conteúdo estático;
- início em `scale(0)`;
- `ease` puro — easing é sempre explícito.

Faixas: entrada de item de lista entre 150 ms e 250 ms; nada de movimento acima de 400 ms.

## 5. Observabilidade

A instrumentação é **OpenTelemetry** (camada neutra) com **Sentry** para erros. Decisão
tomada para não acoplar o projeto a um APM: trocar para Datadog ou New Relic é trocar o
exporter, não reinstrumentar. **Não adicione um segundo APM.**

Regras que não se negociam:

- **Nenhum dado pessoal em telemetria.** Span, métrica, log e evento de erro não carregam
  conteúdo de mensagem, apelido nem IP. O projeto não coleta dado pessoal, e isso vale
  para a observabilidade também.
- **Degradação silenciosa.** Sem variável de ambiente configurada, o SDK fica inerte: a
  aplicação sobe e funciona igual, sem poluir o log.
- **Erro para o usuário é genérico.** Stack trace e detalhe interno vão para o Sentry,
  nunca para a tela nem para a resposta HTTP.

## 6. Quality gates

Rode antes de abrir PR e **cole a saída real no corpo do PR**. Não afirme que passou.

```bash
npx tsc --noEmit        # tipos
npm run lint            # Biome + ESLint (next/core-web-vitals)
npm test                # unitários e integração
npm run test:e2e        # Playwright
npm run build           # build de produção
```

Papel de cada ferramenta: **Biome** (formatação e lint geral), **ESLint** (apenas as
regras de Next.js que o Biome não implementa), **commitlint** (formato do commit),
**Knip** (código e dependência morta), contrato de arquitetura (seção 3), **Vitest**
(unitário e integração), **Playwright** (e2e), **Codecov** (cobertura), **Stryker**
(mutação, sob demanda).

Teste que depende de rede externa ou do banco real está errado: o gateway do BCB é sempre
interceptado e o banco de teste é sempre isolado.

## 7. Segurança

A tabela de controles e as limitações conhecidas estão no `README.md`. Ao mexer em
qualquer entrada vinda de terceiro:

- O WebSocket é tratado como hostil. Validação no servidor é a autoridade; validação no
  cliente é só feedback.
- Falha fechada: em produção o servidor recusa subir sem `ALLOWED_ORIGINS`.
- A ausência do cabeçalho `Origin` é aceita **de propósito** — o navegador só o envia em
  requisição cross-origin. Não "conserte" isso.
- A validação de apelido rejeita `@`, o que impede alguém se passar pelo `@bcb`. Não
  relaxe essa regra.
- No assistente, dado e instrução ficam separados: a pergunta do visitante entra no turno
  do usuário, nunca no system prompt (mitigação de prompt injection).
- Log do servidor não registra IP nem conteúdo de mensagem.

## 8. Limpe o que você sujou

Script temporário, dependência instalada para investigar, arquivo de diagnóstico: remova
antes de abrir o PR. Já aconteceu de o `playwright` ficar órfão no `package.json` por uma
verificação pontual.

Arquivo temporário vai para fora do repositório, nunca na raiz do projeto.
