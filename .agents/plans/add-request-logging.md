# Implementation Plan: Logs estruturados de requisições e startup do Bun

- **Plan ID**: `add-request-logging`
- **Status**: Done
- **Date**: 2026-10-20

## 1. Requirements & Objectives

- **Goal**: Adicionar logs estruturados em `index.ts` para startup do servidor e para cada requisição tratada por `Bun.file`, `render` e `json`, com o código relacionado a logging centralizado em `static/`.
- **Scope (in)**:
  - Refatorar `static/logs.ts` (WIP do desenvolvedor, autorizado a alterar) para expor um logger estruturado.
  - Criar `static/files.ts` com `fileResponse(req, path)` para preservar o comportamento das file routes ao envolvê-las em handlers (404, `Last-Modified` e `304`).
  - Formato único de log com: nome da aplicação entre `[]`, timestamp ISO local sem offset/milissegundos, method colorido, path (sem query string), tipo de origem (`BUN.FILE`, `RENDER`, `JSON`, `REDIRECT`), status HTTP colorido por classe e resultado (`HTML`, `JSON`, `FILE`, `REDIRECT`, `ERROR`).
  - Cores ANSI distintas por origem, method, status e resultado.
  - `log.startup(url)` para o evento de início do servidor.
  - `withRequestLog(source, handler)` para envolver rotas em `index.ts`, medir o resultado e capturar exceções.
  - Envolver todas as rotas atuais: redirect `/`, 3 renders e 5 arquivos (`Bun.file`/favicon).
  - Adicionar uma rota de exemplo `GET /api/health` retornando JSON, apenas para validar o log JSON.
  - Atribuir o retorno de `Bun.serve` a uma variável e logar `server.url` no startup.
  - Exportar o logger e o helper de arquivos no barrel `static/index.ts`.
  - Atualizar documentação (`.agents/PROJECT.md`, `.agents/ARCHITECTURE.md`) e memória do projeto.
- **Out of Scope**:
  - Testes unitários do logger (o desenvolvedor dispensou explicitamente).
  - Persistência de logs em arquivo, níveis configuráveis, formato JSON de log ou integração com serviços externos.
  - Log de body, query string, duração, IP, user-agent ou headers.
  - Alterações no CORS, nas views/controllers ou nas regras de negócio.
  - Tratamento/renderização de páginas de erro (`error.*.eta`); erros continuam sendo relançados para o Bun.
  - Suporte a `NO_COLOR`/desligamento de cores (cores sempre ativas nesta v1).
  - Log de rotas não registradas (o 404 padrão do Bun não passa pelo wrapper).
  - Status exato de `Range` no log: o handler registra `200`; o cliente pode receber `206` (o range continua sendo tratado pelo Bun).
  - Captura de erros ocorridos durante o streaming, depois que o handler já retornou a resposta.
  - `ETag`/`If-None-Match`; o helper restaura `Last-Modified`/`If-Modified-Since` (paridade com a file route atual).

### Formato de log definido

```text
[finances_dashboard] 2026-10-20T14:32:05 GET /tesouro-direto RENDER 200 → HTML
[finances_dashboard] 2026-10-20T14:32:05 GET /styles/theme.css BUN.FILE 200 → FILE
[finances_dashboard] 2026-10-20T14:32:05 GET /styles/theme.css BUN.FILE 304 → FILE
[finances_dashboard] 2026-10-20T14:32:05 GET /styles/missing.css BUN.FILE 404 → ERROR
[finances_dashboard] 2026-10-20T14:32:05 GET /api/health JSON 200 → JSON
[finances_dashboard] 2026-10-20T14:32:05 GET / REDIRECT 302 → REDIRECT
[finances_dashboard] 2026-10-20T14:32:05 SERVER STARTED http://localhost:3000/
```

- `[finances_dashboard]`: negrito + ciano.
- Timestamp: `dim`, horário local, formato `YYYY-MM-DDTHH:mm:ss` (sem `Z`, offset ou milissegundos).
- Method, origem, status e resultado: cores próprias (tabela abaixo).
- Path: sem query string, obtido de `new URL(req.url).pathname`.
- Separador `→`: `dim`.
- Erros: mesma linha com status `500`/classe correspondente e resultado `ERROR`, escritos em `stderr`; a exceção é relançada.

### Mapa de cores

| Campo     | Valor                         | Cor             |
| --------- | ----------------------------- | --------------- |
| Aplicação | `[finances_dashboard]`        | Ciano + negrito |
| Timestamp | ISO local                     | Dim             |
| Method    | `GET`                         | Azul            |
| Method    | `POST`                        | Verde           |
| Method    | `PUT`                         | Amarelo         |
| Method    | `PATCH`                       | Magenta         |
| Method    | `DELETE`                      | Vermelho        |
| Method    | outros (`OPTIONS`, `HEAD`, …) | Cinza           |
| Origem    | `BUN.FILE`                    | Ciano           |
| Origem    | `RENDER`                      | Verde           |
| Origem    | `JSON`                        | Amarelo         |
| Origem    | `REDIRECT`                    | Azul            |
| Status    | `2xx`                         | Verde           |
| Status    | `3xx`                         | Ciano           |
| Status    | `4xx`                         | Amarelo         |
| Status    | `5xx`                         | Vermelho        |
| Resultado | `HTML`                        | Verde           |
| Resultado | `JSON`                        | Amarelo         |
| Resultado | `FILE`                        | Ciano           |
| Resultado | `REDIRECT`                    | Azul            |
| Resultado | `ERROR`                       | Vermelho        |

### Classificação do resultado

1. `status >= 400` → `ERROR` (status colorido pela classe 4xx/5xx).
2. `status === 304` → `FILE` (cache hit; status ciano).
3. `status` entre `300` e `399` (exceto 304) → `REDIRECT`.
4. Caso contrário, pela origem: `render` → `HTML`, `json` → `JSON`, `file` → `FILE`.
5. Exceção lançada no handler → log com status `500` e `ERROR`, seguido de `throw`.

### Decisões confirmadas pelo desenvolvedor

| Tema                        | Decisão                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `static/logs.ts`            | Pode alterar o arquivo WIP.                                                                                            |
| Nome da aplicação           | `finances_dashboard`.                                                                                                  |
| Resultado de arquivo        | `FILE`; redirect `/` → `REDIRECT`.                                                                                     |
| ERROR                       | Status `>= 400` e exceções; status HTTP incluído e colorido por classe.                                                |
| Timestamp                   | Horário local, ISO, sem offset e sem milissegundos.                                                                    |
| Endpoint                    | Somente path, sem query string.                                                                                        |
| Cores                       | Confirmadas conforme a tabela acima.                                                                                   |
| Startup                     | `[app] <ISO> SERVER STARTED <url>`.                                                                                    |
| JSON                        | Adicionar a rota de exemplo `GET /api/health`.                                                                         |
| Exceções                    | Logar e relançar o erro.                                                                                               |
| Testes do logger            | Dispensados pelo desenvolvedor.                                                                                        |
| Preservação das file routes | Incluir `static/files.ts` com `fileResponse` para manter 404, `Last-Modified` e `304` (ajuste aprovado em 2026-10-20). |

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `static/logs.ts` (Modify — refatorar o WIP; hoje expõe `log.info/warn/error` com `toLocaleTimeString` e sem os campos exigidos).
  - `static/files.ts` (Create — `fileResponse(req, path)` com 404, `Last-Modified` e `304`).
  - `static/index.ts` (Modify — exportar `./logs` e `./files`).
  - `index.ts` (Modify — envolver as rotas, adicionar `/api/health`, atribuir `Bun.serve` a uma variável e logar o startup).
  - `.agents/PROJECT.md` (Modify — documentar `static/logs.ts`, `static/files.ts` e a rota de exemplo).
  - `.agents/ARCHITECTURE.md` (Modify — registrar as responsabilidades de logging e de resposta de arquivos em `static/`).
  - `.agents/memory/INDEX.md` e `.agents/memory/` (Modify/Create — registrar o contrato de logging).
- **Dependencies Required**: nenhuma nova. Usa apenas ANSI escapes nativos, `console`, `URL`, `Bun.serve` e `Bun.file`.
- **Contexto relevante**:
  - `static/logs.ts` está **não rastreado** (WIP do desenvolvedor) e não é usado em nenhum arquivo; a alteração foi autorizada.
  - O `index.ts` atual tem: `/` (redirect), `/tesouro-direto`, `/rendas-fixas`, `/acoes` (render), `/styles/theme.css`, três assets do Bootstrap/Bootstrap Icons e `/favicon.ico` (`Bun.file`). Não há rota JSON.
  - `Bun.serve` é chamado com `void`; para logar a URL de startup, o retorno deve ser atribuído a `const server`.
  - As rotas atuais usam `Bun.file` direto como valor de rota (file route preguiçosa, sem buffer no startup). Para logar, passarão a handlers.
  - **Comportamento medido no Bun 1.4.0** ao trocar `Bun.file` direto por `new Response(Bun.file(...))`:

    | Comportamento                   | `Bun.file` direto       | Handler + `new Response(Bun.file(...))` |
    | ------------------------------- | ----------------------- | --------------------------------------- |
    | Arquivo existente               | `200` + `Last-Modified` | `200`, sem `Last-Modified`              |
    | `If-Modified-Since`             | `304`                   | `200`                                   |
    | `Range`                         | `206` + `Content-Range` | `206` + `Content-Range`                 |
    | `Content-Type`/`Content-Length` | corretos                | corretos                                |
    | Arquivo inexistente             | `404`                   | `500` (`ENOENT`)                        |
    | Memória                         | lazy                    | lazy                                    |

  - O helper `fileResponse` restaura o `404`, o `Last-Modified` e o `304`, mantendo o `Range` delegado ao Bun. Custo: um `await file.exists()` (stat) por requisição de asset.
  - `Bun.file(...).lastModified` e `await Bun.file(...).exists()` foram confirmados no runtime.
  - O `cors` existe em `src/api/middlewares/cors`, mas não está aplicado no `index.ts` atual; permanece fora do escopo.
  - Linha de base atual: `bunx tsc --noEmit` → **0 erros**; `bun test` → **5 pass / 0 fail**.

## 3. Architectural Options & Decision

### Opção A: Logger estruturado em `static/logs.ts` + `fileResponse` em `static/files.ts` + wrapper por rota no `index.ts` (escolhida)

- **Pros**: cobre redirect, arquivos, render e JSON; mantém `index.ts` como ponto de composição; formato/cores centralizados; preserva 404/`Last-Modified`/`304` das file routes; não depende de middleware global.
- **Cons**: cada rota precisa ser envolvida explicitamente; rotas novas devem lembrar de usar o wrapper; `fileResponse` adiciona um stat por asset.

### Opção B: Logging dentro do controller/response helpers

- **Pros**: automático para `render` e `json`.
- **Cons**: não cobre `Bun.file` nem o redirect; mistura logging com regra de resposta; o desenvolvedor pediu os logs aplicados no `index.ts`.

### Opção C: Middleware global via `fetch` fallback do `Bun.serve`

- **Pros**: um único ponto de entrada.
- **Cons**: as rotas registradas em `routes` não passam pelo `fetch` fallback; arquivos e renders não seriam logados sem reestruturar todas as rotas; não atende ao requisito.

> **Decision**: **Opção A**, com logging em `static/logs.ts`, resposta de arquivos em `static/files.ts`, ambos exportados por `static/index.ts` e aplicados rota a rota no `index.ts`.

### Pseudo-assinaturas

```ts
export type LogSource = "file" | "render" | "json" | "redirect";

export const log: {
  startup(url: string): void;
};

export function withRequestLog(
  source: LogSource,
  handler: (
    req: Request,
  ) => Response | Bun.BunFile | Promise<Response | Bun.BunFile>,
): (req: Request) => Promise<Response>;

export function fileResponse(req: Request, path: string): Promise<Response>;
```

- `fileResponse`:
  1. cria `const file = Bun.file(path)`;
  2. se `!(await file.exists())`, retorna `404` (o wrapper loga `404 → ERROR`);
  3. define `Last-Modified` com `new Date(file.lastModified).toUTCString()`;
  4. se `If-Modified-Since` for maior ou igual a `file.lastModified`, retorna `304` com `Last-Modified`;
  5. caso contrário, retorna `new Response(file, { headers: { "Last-Modified": ... } })`, deixando o `Range` para o Bun.
- `withRequestLog` normaliza `BunFile` para `Response`, loga após a resposta ser criada e, em exceção, loga `500/ERROR` e relança.
- `log.startup` escreve a linha de inicialização com app, timestamp local e URL.

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Logger em `static/logs.ts`**:
  - Centralizar `APP_NAME`, paleta ANSI, timestamp ISO local sem offset/ms e helpers de pintura.
  - Implementar `log.startup(url)`.
  - Implementar `withRequestLog(source, handler)` com path, method, status, origem, resultado, cores e catch/rethrow.
- [x] **Step 2 — Helper de arquivos em `static/files.ts`**:
  - Criar `fileResponse(req, path)` com `exists`, 404, `Last-Modified`, `If-Modified-Since`/304 e resposta com `BunFile`.
  - Exportar `./logs` e `./files` no barrel `static/index.ts`.
- [x] **Step 3 — Aplicação no `index.ts`**:
  - Envolver o redirect `/`, as 3 rotas de render, as 5 rotas de arquivo e o favicon.
  - Usar `fileResponse` nas rotas de arquivo.
  - Adicionar `GET /api/health` retornando `Response.json({ status: "ok" })`, envolvido como `json`.
  - Atribuir `Bun.serve` a `const server` e chamar `log.startup(server.url.toString())`.
- [x] **Step 4 — Documentação e memória**:
  - Atualizar `.agents/PROJECT.md` e `.agents/ARCHITECTURE.md`.
  - Registrar o contrato de logging em `.agents/memory/` via skill `create-new-memory`, atualizando o `INDEX.md`.
- [x] **Step 5 — Verificação**:
  - Typecheck, suíte de testes existente, smoke test com captura dos logs e paridade das file routes.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bunx tsc --noEmit` (esperado: 0 erros).
  - `bun test` (esperado: 5 pass / 0 fail — nenhum teste novo de logger).
  - Smoke test do servidor (porta temporária, ex.: `PORT=3100`), capturando `stdout`/`stderr`:
    - `GET /` → log `REDIRECT 302 → REDIRECT`.
    - `GET /tesouro-direto`, `/rendas-fixas`, `/acoes` → logs `RENDER 200 → HTML`.
    - `GET /api/health` → log `JSON 200 → JSON`.
    - `GET /styles/theme.css`, assets do Bootstrap/Icons e `/favicon.ico` → logs `BUN.FILE 200 → FILE`.
    - Startup → `[finances_dashboard] <ISO local> SERVER STARTED http://localhost:3100/`.
  - **Paridade das file routes**:
    - `GET /styles/theme.css` deve retornar `200` com `Last-Modified`.
    - `GET /styles/theme.css` com `If-Modified-Since` futuro deve retornar `304` e logar `304 → FILE`.
    - `GET /styles/theme.css` com `Range: bytes=0-9` deve retornar `206` com `Content-Range`.
    - Script temporário (não versionado) chamando `fileResponse` com path inexistente deve retornar `404`; o wrapper deve logar `404 → ERROR`.
  - Verificação do path sem query: `GET /tesouro-direto?x=1` deve logar `/tesouro-direto`.
  - Verificação do formato ISO: regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$`, sem `Z`, `+`, `-` de offset ou `.milissegundos`.
  - Verificação de cores: os logs capturados devem conter as sequências ANSI esperadas para method/origem/status/resultado.
  - Verificação do caminho de erro: script temporário que chama `withRequestLog` com um handler que lança; deve emitir `500 → ERROR` em `stderr` e relançar. Nenhuma rota de erro será adicionada ao servidor.
- **Edge cases to verify**:
  - Métodos sem cor dedicada (`OPTIONS`, `HEAD`) caem no cinza.
  - Status 4xx retornado por um handler é logado como `ERROR` com status amarelo; 5xx com status vermelho.
  - Exceção lançada não é engolida: o log é emitido e o erro é relançado.
  - Arquivos continuam sendo servidos com o content-type correto após a conversão para handler.
  - O redirect mantém `302` e `Location: /tesouro-direto`.
  - O log não inclui query string, body, duração, IP ou user-agent.
  - `Range` mantém o `206` no cliente; o log registra `200` (limitação documentada).
  - Rotas não registradas (404 padrão do Bun) não são logadas por não passarem pelo wrapper (fora do escopo).

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - 2026-10-20 — Aprovação registrada: “Pode seguir com a execução”. Plan ID `add-request-logging` atribuído após verificação de unicidade (planos, histórico, branches e commits). Linha de base: `bunx tsc --noEmit` → 0 erros; `bun test` → 5 pass / 0 fail.
  - 2026-10-19 — Respostas do desenvolvedor: (1) “Pode alterar” o `static/logs.ts`; (2) nome `finances_dashboard`; (3) `FILE` e `REDIRECT`; (4) ERROR para status e exceções, com status HTTP colorido por classe; (5) horário local sem offset e sem milissegundos; (6) somente path, sem query string; (7) cores confirmadas; (8) startup no formato `[app] <ISO> SERVER STARTED <url>`; (9) adicionar rota de exemplo para validar o log JSON; (10) logar e relançar exceções; (11) testes do logger dispensados.
  - 2026-10-20 — Ajuste aprovado após a análise do trade-off: incluir `static/files.ts` com `fileResponse` para preservar `404`, `Last-Modified` e `304`; o `Range` continua delegado ao Bun. Plano revisado (escopo, contexto, passos e TODO list).
  - 2026-10-20 — Fase 3 executada: `static/logs.ts`, `static/files.ts` e wrappers no `index.ts` implementados; `bunx tsc --noEmit` → **0 erros**; `bun test` → **5 pass / 0 fail**; smoke test confirmou startup, redirect, render, JSON, file, `304`, `404`, `Range` (`206` no cliente) e rethrow de exceção; cores ANSI confirmadas.
  - 2026-10-20 — Refactor pós-execução (execução direta, sem testes): `static/logs.ts` movido para `src/utils/logs.ts`; rotas de assets centralizadas em `src/utils/staticAssets.ts` (`staticAssetRoutes`); `index.ts` atualizado. `bunx tsc --noEmit` → 0 erros; `bun test` → 5 pass / 0 fail; smoke test confirmou as rotas e os logs.

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Each item must be atomic, verifiable and traceable to its source step in Section 4. This list is the single source of truth for execution progress: update it in the same iteration as any plan change.

### Step 1: Logger em `static/logs.ts`

- [x] `TODO-01` Refatorar `static/logs.ts` definindo `APP_NAME = "finances_dashboard"`, a paleta ANSI e o timestamp ISO local sem offset/milissegundos.
- [x] `TODO-02` Implementar `log.startup(url)` no formato `[finances_dashboard] <ISO> SERVER STARTED <url>`.
- [x] `TODO-03` Implementar `withRequestLog(source, handler)` extraindo o path de `new URL(req.url).pathname` e emitindo method, origem, status e resultado.
- [x] `TODO-04` Implementar a classificação de resultado (`ERROR` para status >= 400; `FILE` para 304; `REDIRECT` para 3xx exceto 304; `HTML`/`JSON`/`FILE` pela origem) e as cores de method/origem/status/resultado.
- [x] `TODO-05` Implementar o `catch` do wrapper: logar status `500`/`ERROR` em `stderr` e relançar a exceção.

### Step 2: Helper de arquivos em `static/files.ts`

- [x] `TODO-06` Criar `static/files.ts` com `fileResponse(req, path)` usando `Bun.file(path)`.
- [x] `TODO-07` Em `fileResponse`, retornar `404` quando `!(await file.exists())`.
- [x] `TODO-08` Em `fileResponse`, definir `Last-Modified` com `new Date(file.lastModified).toUTCString()`.
- [x] `TODO-09` Em `fileResponse`, tratar `If-Modified-Since` maior ou igual a `file.lastModified` retornando `304` com `Last-Modified`.
- [x] `TODO-10` Em `fileResponse`, retornar `new Response(file, { headers: { "Last-Modified": ... } })` para preservar content-type/length e o `Range` do Bun.
- [x] `TODO-11` Adicionar `export * from "./logs"` e `export * from "./files"` em `static/index.ts`.

### Step 3: Aplicação no `index.ts`

- [x] `TODO-12` Envolver a rota `/` com `withRequestLog("redirect", () => Response.redirect("/tesouro-direto"))`.
- [x] `TODO-13` Envolver `/tesouro-direto`, `/rendas-fixas` e `/acoes` com `withRequestLog("render", ...)`.
- [x] `TODO-14` Envolver `/styles/theme.css`, Bootstrap, Bootstrap Icons, fontes e `/favicon.ico` com `withRequestLog("file", (req) => fileResponse(req, path))`.
- [x] `TODO-15` Adicionar `GET /api/health` retornando `Response.json({ status: "ok" })`, envolvido com `withRequestLog("json", ...)`.
- [x] `TODO-16` Atribuir `Bun.serve` a `const server` e chamar `log.startup(server.url.toString())` após a criação do servidor.

### Step 4: Documentação e memória

- [x] `TODO-17` Atualizar `.agents/PROJECT.md` com as responsabilidades de `static/logs.ts`/`static/files.ts` e a rota de exemplo `/api/health`.
- [x] `TODO-18` Atualizar `.agents/ARCHITECTURE.md` registrando o logging e a resposta de arquivos em `static/` e o wrapper de rotas no `index.ts`.
- [x] `TODO-19` Registrar o contrato de logging em `.agents/memory/` via skill `create-new-memory` e atualizar `.agents/memory/INDEX.md`.

### Step 5: Verificação

- [x] `TODO-20` Rodar `bunx tsc --noEmit` e confirmar 0 erros. (Confirmado em 2026-10-20.)
- [x] `TODO-21` Rodar `bun test` e confirmar 5 pass / 0 fail (sem novos testes de logger). (Confirmado: 5 pass / 0 fail.)
- [x] `TODO-22` Executar o smoke test de startup e das rotas, capturando os logs e conferindo app, ISO local, method, path, origem, status e resultado. (Startup, redirect, 3 renders, JSON e files logados; cores ANSI confirmadas.)
- [x] `TODO-23` Confirmar que `/tesouro-direto?x=1` loga apenas `/tesouro-direto` e que o ISO não tem offset/ms. (Confirmado no smoke test.)
- [x] `TODO-24` Verificar a paridade das file routes: `Last-Modified`, `If-Modified-Since` → `304`, `Range` → `206` e path inexistente → `404`. (Todos confirmados; `Range` loga `200` e o cliente recebe `206`, limitação documentada.)
- [x] `TODO-25` Exercitar o caminho de erro com script temporário (log `500 → ERROR` + rethrow) e remover o script. (Confirmado: `500 → ERROR` e `RETHROWN`; script `bun -e` não versionado.)
- [x] `TODO-26` Revisar a árvore real, atualizar a TODO list e reportar arquivos, validações e pendências.

### Final Verification

- [x] `TODO-27` Rodar typecheck e testes finais e registrar os resultados no relatório.
- [x] `TODO-28` Confirmar que nenhuma rota, view ou regra de negócio fora do escopo foi alterada.
