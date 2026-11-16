# Execução — Logs estruturados de requisições e startup do Bun

- **Data:** 2026-10-20 · **Branch:** `main` · **Registro:** `add-request-logging-execution`
- **Plano:** [add-request-logging.md](./add-request-logging.md)
- **Resultado:** concluído

## Task

Adicionar logs estruturados no `index.ts` para startup e para requisições `Bun.file`, `render` e `json`, com implementação em `static/`, cores distintas e preservação do comportamento das file routes (`404`, `Last-Modified`, `304`). Critério de pronto: typecheck sem erros, suíte existente verde e smoke test comprovando formato, cores e paridade das rotas.

## Fase 1 — Análise

- **Área afetada:** `static/logs.ts`, `static/files.ts` (novo), `static/index.ts`, `index.ts`, documentação e memória.
- **Testes relacionados:** nenhum cobre logging ou as rotas do `index.ts`; a suíte existente (`src/api/controllers/views.test.ts`) está verde (5 pass / 0 fail).
- **Lacuna de cobertura:** formato/cores do log, classificação de resultado, wrappers de rota, paridade das file routes (`404`, `Last-Modified`, `304`, `206`) e caminho de erro.
- **Proposta:** sem testes novos de logger por decisão do desenvolvedor; validação por typecheck, suíte existente e smoke test.
- **Linha de base:** `bunx tsc --noEmit` → 0 erros; `bun test` → 5 pass / 0 fail.

**Resposta do desenvolvedor:**

> Pode seguir diretamente para a fase 3
>
> Continue

## Fase 2 — Testes e causas

Não aplicável. O desenvolvedor dispensou explicitamente os testes do logger (resposta 11 do planejamento). Nenhum arquivo de teste foi criado ou alterado.

## Fase 3 — Implementação

- **Arquivos criados/alterados:**
  - [`static/logs.ts`](../../static/logs.ts) — `APP_NAME`, paleta ANSI, timestamp ISO local, `log.startup`, `withRequestLog`, classificação e cores.
  - [`static/files.ts`](../../static/files.ts) — `fileResponse` com `exists`, `404`, `Last-Modified`, `If-Modified-Since`/`304` e `new Response(Bun.file(...))`.
  - [`static/index.ts`](../../static/index.ts) — exporta `./logs` e `./files`.
  - [`index.ts`](../../index.ts) — wrappers em todas as rotas, `GET /api/health` (JSON de exemplo), `const server = Bun.serve(...)` e `log.startup(server.url.toString())`.
- **Testes do escopo:** nenhum novo teste (decisão do desenvolvedor).
- **Regressão:** `bun test` → **5 pass / 0 fail** · `bunx tsc --noEmit` → **0 erros**.
- **Smoke test (porta 3100):**
  - Startup: `[finances_dashboard] 2026-10-20T16:14:39 SERVER STARTED http://localhost:3100/`.
  - `/` → `302` e log `REDIRECT 302 → REDIRECT`.
  - `/tesouro-direto`, `/rendas-fixas`, `/acoes` → `200` e logs `RENDER 200 → HTML`.
  - `/api/health` → `200` e log `JSON 200 → JSON`.
  - `/styles/theme.css`, fonte e `/favicon.ico` → `200` e logs `BUN.FILE 200 → FILE`.
  - `/styles/theme.css` com `Range: bytes=0-9` → cliente `206`; log `BUN.FILE 200 → FILE` (limitação documentada).
  - `/styles/theme.css` com `If-Modified-Since` futuro → `304` e log `BUN.FILE 304 → FILE`.
  - `Last-Modified` presente no header da resposta de arquivo.
  - Query string omitida: `/tesouro-direto?x=1` logado como `/tesouro-direto`.
  - ISO local sem offset/ms: `2026-10-20T16:14:39`.
  - Cores ANSI confirmadas via `cat -v` (app em negrito/ciano, timestamp dim, methods e origens coloridos).
- **Caminho de erro:** script temporário `bun -e` com handler que lança → log `RENDER 500 → ERROR` em `stderr` e `RETHROWN`.

## Fase 4 — Relatório

- `startup` → `[finances_dashboard] <ISO local> SERVER STARTED <url>`.
- `redirect` → method/path/`REDIRECT`/status/result.
- `render` → method/path/`RENDER`/status/`HTML`.
- `json` → method/path/`JSON`/status/`JSON`.
- `file` → method/path/`BUN.FILE`/status/`FILE`.
- `file` + `304` → status ciano e resultado `FILE`.
- `file` + arquivo ausente → `404` e resultado `ERROR`.
- Exceção → `500`/`ERROR` + rethrow.

## Pendências

- `Range`: o cliente recebe `206`, mas o log registra `200`, pois o status é lido antes do Bun finalizar o streaming. Documentado no plano e na memória `MEM-2026-023`.
- Erros ocorridos após o retorno do handler (streaming) não são capturados pelo wrapper.
- O logger não possui testes unitários por decisão do desenvolvedor.
- `GET /api/health` é uma rota de exemplo para validar o log JSON; pode ser removida quando não for mais necessária.
- O `cors` continua existindo em `src/api/middlewares/cors` e não está aplicado no `index.ts`.

## Ajuste pós-execução

- `static/logs.ts` movido para `src/utils/logs.ts`.
- Rotas de assets (tema, Bootstrap, Bootstrap Icons, fontes e favicon) centralizadas em `src/utils/staticAssets.ts` (`staticAssetRoutes`).
- `index.ts` importa `log`/`withRequestLog` de `@/src/utils/logs` e espalha `...staticAssetRoutes`.
- Validação: `bunx tsc --noEmit` → 0 erros; `bun test` → 5 pass / 0 fail; smoke test → startup, redirect, render, JSON, tema e favicon logados corretamente.
