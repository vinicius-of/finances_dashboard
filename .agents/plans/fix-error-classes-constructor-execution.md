# Execução — Construtores das classes de erro

- **Data:** 2026-10-23 · **Branch:** `main` · **Registro:** `fix-error-classes-constructor-execution`
- **Resultado:** concluído

## Task

Corrigir a falha de instanciação de `AppError`/`ApiError` no Bun (`ReferenceError: 'super()' must be called in derived constructor before accessing |this|`), que impedia o uso ponta a ponta de `ViewError`. Critério de pronto: `new ViewError(...)` e `new ApiError(...)` funcionando em tempo de execução.

## Fase 1 — Análise

- **Área afetada:** [`src/errors/AppError.ts`](../../src/errors/AppError.ts), [`src/errors/ApiError.ts`](../../src/errors/ApiError.ts); consumidor afetado: [`src/errors/ViewError.ts`](../../src/errors/ViewError.ts).
- **Testes relacionados:** nenhum teste cobre a hierarquia de erros; `bun test` — **5 pass / 0 fail**.
- **Lacuna de cobertura:** instanciação e `handle()` das classes de erro.
- **Proposta:** manter `super()` como instrução isolada e atribuir campos explicitamente.

**Resposta do desenvolvedor:**

> Corrija

## Fase 2 — Testes e causas

Não executada: correção pontual de bug pré-existente, com causa já reproduzida em smoke test na task anterior.

## Fase 3 — Implementação

- [`src/errors/AppError.ts`](../../src/errors/AppError.ts) — `statusCode` passou a ser campo explícito; `super(message)` isolado, seguido de `this.statusCode` e `this.name`.
- [`src/errors/ApiError.ts`](../../src/errors/ApiError.ts) — `details` passou a ser campo explícito, atribuído após `super`.
- Causa confirmada por experimento: parameter property com `super()` isolado funciona; `super()` dentro de sequência `(super(...), ...)` falha.
- **Validação:** `ViewError(404).handle(eta)` renderiza o template (`true`); `ApiError(400)` retorna status `400` e corpo JSON com `details`.
- **Regressão:** `bun test` **5 pass / 0 fail** (68 asserções) · `bunx tsc --noEmit` **ok**.

## Fase 4 — Relatório

- Nenhum teste novo ou alterado.
- Smoke tests confirmaram as duas classes e a renderização de `ViewError`.

## Pendências

- [`src/views/errorViews/error.403.eta`](../../src/views/errorViews/error.403.eta) e [`error.500.eta`](../../src/views/errorViews/error.500.eta) estão vazios (0 bytes) — pré-existente, fora do escopo.
- `ViewError.handle()` monta a resposta de sucesso sem `status: this.statusCode`, retornando `200` para páginas de erro — pré-existente, fora do escopo.
