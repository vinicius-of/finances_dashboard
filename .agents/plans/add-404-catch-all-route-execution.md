# Execução — Rota 404 para recursos inexistentes

- **Data:** 2026-10-23 · **Branch:** `main` · **Registro:** `add-404-catch-all-route-execution`
- **Resultado:** concluído

## Task

Responder com a página 404 quando qualquer recurso requisitado não existir, sem interferir nas rotas e assets já registrados. Critério de pronto: caminho desconhecido retorna `404` com o template `errorViews/error.404.eta`.

## Fase 1 — Análise

- **Área afetada:** [`index.ts`](../../index.ts), [`src/api/controllers/views.ts`](../../src/api/controllers/views.ts), [`src/errors/ViewError.ts`](../../src/errors/ViewError.ts).
- **Testes relacionados:** [`src/api/controllers/views.test.ts`](../../src/api/controllers/views.test.ts) — **5 pass / 0 fail** (68 asserções).
- **Lacuna de cobertura:** `notFound()` e a rota catch-all.
- **Proposta:** rota `"/*"` no `Bun.serve`, método `notFound()` usando `ViewError`, e `ViewError.handle()` retornando o status real; teste unitário do controller e smoke test da rota.

**Resposta do desenvolvedor:**

> Sim, pode seguir

## Fase 2 — Testes e causas

Não executada como fase separada: o caso de teste aprovado na Fase 1 foi implementado junto da solução.

## Fase 3 — Implementação

- [`index.ts`](../../index.ts) — adicionada a rota `"/*"` após `staticAssetRoutes`, chamando `viewsController.notFound()`.
- [`src/api/controllers/views.ts`](../../src/api/controllers/views.ts) — novo `notFound(): Response`, que instancia `ViewError(404, "Página não encontrada")` e delega ao `handle(eta)`.
- [`src/errors/ViewError.ts`](../../src/errors/ViewError.ts) — `handle()` passou a retornar `status: this.statusCode`, usar `PageHeadersInit` e título `Erro <status>`.
- [`src/api/controllers/views.test.ts`](../../src/api/controllers/views.test.ts) — novo `describe("ViewsController.notFound")` verificando status, content-type e conteúdo.
- **Testes:** `bun test` **6 pass / 0 fail** (73 asserções) · `bunx tsc --noEmit` **ok**.
- **Smoke test** (servidor temporário na porta 3999): `/api/health` → `200`, `/nao-existe` → `404`, `/views/acoes/styles.css` → `200`, `/` → `302`.

## Fase 4 — Relatório

- `ViewsController.notFound > responde 404 com HTML e a mensagem de recurso não encontrado` → garante status `404`, `content-type: text/html; charset=utf-8`, `<title>`, heading `404 - Página Não Encontrada` e mensagem `Página não encontrada`.

## Pendências

- [`src/views/errorViews/error.403.eta`](../../src/views/errorViews/error.403.eta) e [`error.500.eta`](../../src/views/errorViews/error.500.eta) continuam vazios (0 bytes) — pré-existente, fora do escopo.
