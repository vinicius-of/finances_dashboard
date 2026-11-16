# Execução — Views por diretórios próprios

- **Data:** 2026-10-20 · **Branch:** `main` · **Registro:** `refactor-views-by-directory-execution`
- **Resultado:** concluído

## Task

Reorganizar as views em diretórios próprios, cada um com `view.eta`, `styles.css` e `index.ts`, e mover os estilos específicos de layout, menu e views para dentro de `src/views`. A paleta global permanece em `static/styles/theme.css`.

## Implementação

- `src/views/layout/` — `view.eta`, `styles.css` e `index.ts` (`layoutView`).
- `src/views/components/menu/` — `view.eta`, `styles.css` e `index.ts` (`menuView`).
- `src/views/tesouroDireto/` — `view.eta`, `styles.css` e `index.ts` (`tesouroDireto`).
- `src/views/rendasFixas/` — `view.eta`, `styles.css` e `index.ts` (`rendasFixas`).
- `src/views/acoes/` — `view.eta`, `styles.css` e `index.ts` (`acoes`).
- Barrels: `src/views/index.ts` e `src/views/components/index.ts`.
- `src/api/controllers/views.ts` — importa as configurações dos diretórios, monta `NAV_ITEMS` a partir delas e passa `styles: [layout, menu, view]` no render.
- `src/utils/staticAssets.ts` — gera as rotas `/views/*/styles.css` a partir de `style`/`stylePath` exportados por cada diretório.
- `static/styles/theme.css` — mantém apenas a paleta e as CSS variables do Bootstrap.
- Estilos movidos:
  - layout → `src/views/layout/styles.css`;
  - menu → `src/views/components/menu/styles.css`;
  - views → `src/views/<view>/styles.css` (com `--view-accent`).
- `src/api/controllers/views.test.ts` atualizado para os novos caminhos e links de CSS; nenhum teste novo foi criado.

## Validação

- `bunx tsc --noEmit` → **0 erros**.
- `bun test` → **5 pass / 0 fail** (68 asserções).
- Smoke test: páginas `200`; `/views/layout/styles.css`, `/views/components/menu/styles.css` e os três `styles.css` de views `200`; links corretos no HTML; logs `RENDER`/`BUN.FILE` emitidos.

## Observações

- As views usam caminhos absolutos dentro do diretório de templates (`layout("/layout/view")` e `include("/components/menu/view")`).
- Os `styles.css` das páginas começam com `--view-accent: var(--app-primary)` para permitir customizações específicas sem alterar o layout global.
- Os templates de erro (`error.*.eta`) permanecem na raiz de `src/views`.
