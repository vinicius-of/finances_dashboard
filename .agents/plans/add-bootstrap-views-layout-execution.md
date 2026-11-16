# Execução — Views básicas com layout Bootstrap e menu lateral (ETA)

- **Data:** 2026-10-19 · **Branch:** `main` · **Registro:** `add-bootstrap-views-layout-execution`
- **Plano:** [add-bootstrap-views-layout.md](./add-bootstrap-views-layout.md)
- **Resultado:** concluído

## Task

Implementar as views SSR básicas com ETA + Bootstrap: `layout.eta` compartilhado, partial de menu lateral, três páginas navegáveis (Tesouro Direto, Rendas Fixas e Ações), tema com a paleta do projeto e controller de views. Critério de pronto: testes verdes, typecheck sem erros novos e smoke test das rotas/assets.

## Fase 1 — Análise

- **Área afetada:** `index.ts`, `src/api/controllers/views.ts`, `src/views/layout.eta`, `src/views/components/menu.eta`, `src/views/index.eta`, `src/views/rendasFixas.eta`, `src/views/acoes.eta`, `static/styles/theme.css`, `src/api/controllers/views.test.ts`.
- **Testes relacionados:** nenhum; `bun test src/api/controllers` não encontrou arquivos de teste (86 arquivos pesquisados).
- **Lacuna de cobertura:** renderização das páginas, estado ativo do menu, shell/layout e assets de estilização.
- **Proposta:** 5 casos — páginas com 200/content-type/título/h2; menu com 3 opções em todas as páginas; exatamente um item ativo/`aria-current`; links de CSS do layout; paleta e medidas no `theme.css`.

**Resposta do desenvolvedor:**

> Pode seguir

## Fase 2 — Testes e causas

- **Testes escritos:** `src/api/controllers/views.test.ts` com os casos:
  - `renderiza as três páginas com 200 e content-type HTML`
  - `exibe as três opções do menu em todas as páginas`
  - `destaca exatamente o item correspondente à página atual`
  - `inclui os assets de estilização no layout`
  - `define a paleta e o layout do menu/conteúdo`
- **Execução inicial:** `0 pass / 1 fail / 1 error` — `Cannot find module './views'`.
- **Causas:** `src/api/controllers/views.ts`, `src/views/layout.eta`, `src/views/components/menu.eta`, `src/views/rendasFixas.eta`, `src/views/acoes.eta` e `static/styles/theme.css` inexistentes; `src/views/index.eta` vazio. A falha ocorre na importação porque a feature é nova e o caminho `./views` é exatamente o módulo planejado.

**Resposta do desenvolvedor:**

> Implemente

## Fase 3 — Implementação

- **Arquivos de produção criados/alterados:**
  - [`index.ts`](../../index.ts) — instancia `ViewsController`; rotas `/` (302 → `/tesouro-direto`), `/tesouro-direto`, `/rendas-fixas`, `/acoes`, CSS/fontes e favicon.
  - [`src/api/controllers/views.ts`](../../src/api/controllers/views.ts) — `NAV_ITEMS`, `NavKey`, mapa de páginas e `ViewsController`.
  - [`src/views/layout.eta`](../../src/views/layout.eta) — shell HTML com Bootstrap, Bootstrap Icons, tema, menu e `it.body`.
  - [`src/views/components/menu.eta`](../../src/views/components/menu.eta) — partial do menu com destaque do item ativo.
  - [`src/views/index.eta`](../../src/views/index.eta) — página Tesouro Direto.
  - [`src/views/rendasFixas.eta`](../../src/views/rendasFixas.eta) — página Rendas Fixas.
  - [`src/views/acoes.eta`](../../src/views/acoes.eta) — página Ações.
  - [`static/styles/theme.css`](../../static/styles/theme.css) — paleta, sidebar de 200px/100vh, estados do menu e padding do conteúdo.
  - [`static/headers.ts`](../../static/headers.ts) — tipos ajustados para `Record<string, string>` (compatibilidade do `PageHeadersInit` com `Response`).
- **Testes do escopo:** `bun test src/api/controllers/views.test.ts` → **5 pass / 0 fail**, 62 asserções.
- **Regressão:** `bun test` → **5 pass / 0 fail** · `bunx tsc --noEmit` → **1 erro pré-existente** (`cors` não utilizado em `index.ts:5`), removido em seguida a pedido do desenvolvedor (typecheck final: **0 erros**).
- **Smoke test:** `/` → `302` com `Location: /tesouro-direto`; `/tesouro-direto`, `/rendas-fixas`, `/acoes` → `200 text/html; charset=utf-8`; `/styles/theme.css`, `/vendor/bootstrap/bootstrap.min.css`, `/vendor/bootstrap-icons/bootstrap-icons.min.css` → `200 text/css`; `/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2` → `200 font/woff2`.

## Fase 4 — Relatório

- `renderiza as três páginas com 200 e content-type HTML` → garante status, content-type, `<title>` e `<h2>` com ícone + título em cada página.
- `exibe as três opções do menu em todas as páginas` → garante os três `href`, rótulos e ícones do menu no HTML de cada página.
- `destaca exatamente o item correspondente à página atual` → garante um único `app-menu__link--active` e `aria-current="page"`, no link correto.
- `inclui os assets de estilização no layout` → garante os links de Bootstrap, Bootstrap Icons, `theme.css` e favicon.
- `define a paleta e o layout do menu/conteúdo` → garante os hexadecimais da paleta, `white-space: nowrap`, sidebar de `200px` e `padding: 200px 16px 16px`.

## Pendências

- `index.ts:5` — import `cors` não utilizado **removido** a pedido do desenvolvedor; `bunx tsc --noEmit` passou a retornar **0 erros** e `bun test` permaneceu **5 pass / 0 fail**.
- A reconciliação `index.eta` = página Tesouro Direto foi implementada conforme a Seção 1 do plano.
- Componentes Bootstrap com valores compilados em Sass (ex.: `.btn-primary`) não são re-tematizados pelas CSS variables; nesta v1 não são usados.
- A validação visual foi feita por asserções de CSS/HTML e smoke test; não houve inspeção em navegador real.

## Refactor posterior

- Views reorganizadas em diretórios próprios (`view.eta`, `styles.css`, `index.ts`), com estilos de layout/menu/views dentro de `src/views`. Ver [refactor-views-by-directory-execution.md](./refactor-views-by-directory-execution.md).
