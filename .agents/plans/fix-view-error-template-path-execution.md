# Execução — Caminho do template padrão no ViewError

- **Data:** 2026-10-23 · **Branch:** `main` · **Registro:** `fix-view-error-template-path-execution`
- **Resultado:** concluído

## Task

Corrigir o template padrão de [`ViewError`](../../src/errors/ViewError.ts), que apontava para `./404` (arquivo inexistente), passando a apontar para os templates movidos em `src/views/errorViews/`. Critério de pronto: `ViewError` resolve `errorViews/error.<status>.eta` com o status informado.

## Fase 1 — Análise

- **Área afetada:** [`src/errors/ViewError.ts`](../../src/errors/ViewError.ts).
- **Testes relacionados:** nenhum teste cobre `ViewError`/`AppError`; `bun test` — **5 pass / 0 fail**.
- **Lacuna de cobertura:** caminho do template padrão e renderização dos erros sem cobertura.
- **Proposta:** alterar o default para `errorViews/error.${statusCode}.eta`.

**Resposta do desenvolvedor:**

> Ajuste

## Fase 2 — Testes e causas

Não executada: continuidade direta da pendência reportada na task anterior, com ajuste pontual solicitado pelo desenvolvedor.

## Fase 3 — Implementação

- [`src/errors/ViewError.ts`](../../src/errors/ViewError.ts) — `template` padrão passou de `"./404"` para `` `errorViews/error.${statusCode}.eta` ``.
- A extensão `.eta` é obrigatória: `Eta.resolvePath` só anexa `defaultExtension` quando `path.extname(template)` é vazio; `error.404` seria interpretado como já possuindo extensão.
- **Validação do template:** render direto de `errorViews/error.404.eta` com `Eta` → `h1=true`, `message=true`.
- **Regressão:** `bun test` **5 pass / 0 fail** (68 asserções) · `bunx tsc --noEmit` **ok**.

## Fase 4 — Relatório

- Nenhum teste novo ou alterado (escopo pontual, sem cobertura prévia de erros).
- Testes existentes permaneceram verdes.

## Pendências

- [`src/errors/AppError.ts`](../../src/errors/AppError.ts) falha ao instanciar no Bun: `ReferenceError: 'super()' must be called in derived constructor before accessing |this|`. O construtor usa parameter property (`public statusCode`) com `super()` dentro do corpo, e o transpiler emite a atribuição de `this.statusCode` antes de `super(message)`. Bug pré-existente, não corrigido por estar fora do escopo; impede o smoke test ponta a ponta de `ViewError`.
