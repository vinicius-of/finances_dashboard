# Execução — Interface padronizada para as views exportadas

- **Data:** 2026-10-23 · **Branch:** `main` · **Registro:** `standardize-view-config-interface-execution`
- **Resultado:** concluído

## Task

Padronizar os atributos exportados pelas views em `src/views/` por meio de interfaces TypeScript compartilhadas, fazendo cada módulo de configuração validar a forma esperada em compilação. Critério de pronto: todas as views tipadas pelo contrato e suíte verde.

## Fase 1 — Análise

- **Área afetada:** [`src/views/acoes/index.ts`](../../src/views/acoes/index.ts), [`src/views/tesouroDireto/index.ts`](../../src/views/tesouroDireto/index.ts), [`src/views/rendasFixas/index.ts`](../../src/views/rendasFixas/index.ts), [`src/views/layout/index.ts`](../../src/views/layout/index.ts), [`src/views/components/menu/index.ts`](../../src/views/components/menu/index.ts), [`src/api/controllers/views.ts`](../../src/api/controllers/views.ts), [`src/utils/staticAssets.ts`](../../src/utils/staticAssets.ts).
- **Testes relacionados:** [`src/api/controllers/views.test.ts`](../../src/api/controllers/views.test.ts) — **5 pass / 0 fail** (68 asserções).
- **Lacuna de cobertura:** nenhum teste/contrato verificava a forma dos módulos exportados nem a coerência entre `template`, `style` e `stylePath`.
- **Proposta:** `IViewConfig` e `IPageViewConfig` em `src/views/types.ts`, aplicados com `as const satisfies`, mais testes de forma e existência dos `styles.css`.

**Resposta do desenvolvedor:**

> Pode seguir diretamente para a fase 3 e não é necessário fazer para este cenário.

## Fase 2 — Testes e causas

Não executada: o desenvolvedor dispensou a criação dos testes para este cenário e autorizou seguir direto para a Fase 3.

## Fase 3 — Implementação

- [`src/views/types.ts`](../../src/views/types.ts) — novo contrato: `IViewConfig` (`template`, `style`, `stylePath`), `IPageViewConfig` (acrescenta `key`, `label`, `href`, `icon`) e `NavItem`.
- [`src/views/layout/index.ts`](../../src/views/layout/index.ts), [`src/views/components/menu/index.ts`](../../src/views/components/menu/index.ts) — `as const satisfies IViewConfig`.
- [`src/views/tesouroDireto/index.ts`](../../src/views/tesouroDireto/index.ts), [`src/views/rendasFixas/index.ts`](../../src/views/rendasFixas/index.ts), [`src/views/acoes/index.ts`](../../src/views/acoes/index.ts) — `as const satisfies IPageViewConfig`.
- [`src/views/index.ts`](../../src/views/index.ts) — passou a re-exportar `./types`.
- [`src/api/controllers/views.ts`](../../src/api/controllers/views.ts) — removeu o `IPageConfig` local; `PAGES` e `render` usam `IPageViewConfig` e `NAV_ITEMS` valida `readonly NavItem[]`.
- **Testes do escopo:** `bun test src/api/controllers/views.test.ts` → **5 pass / 0 fail**.
- **Regressão:** `bun test` **5 pass / 0 fail** (68 asserções) · `bunx tsc --noEmit` **ok**.

## Fase 4 — Relatório

- Nenhum teste novo ou alterado; a conformidade do contrato é garantida em compilação por `satisfies` e checada por `bunx tsc --noEmit`.
- Testes existentes de renderização, menu, item ativo e assets permaneceram verdes, cobrindo os consumidores das configurações.

## Pendências

Nenhuma.
