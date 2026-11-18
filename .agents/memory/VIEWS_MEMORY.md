# Memória — Views SSR

Este documento é a referência persistente de memória do domínio de views SSR do projeto.
ID nova: siga a sequência global do `INDEX.md` (formato `MEM-<AAAA>-<NNN>`).

---

## Índice de Consulta

| #   | ID           | Memória                                       | Tipo      | Status | Atualizada em |
| --- | ------------ | --------------------------------------------- | --------- | ------ | ------------- |
| 1   | MEM-2026-021 | Shell de views SSR com ETA                    | Decisão   | Ativa  | 2026-10-23    |
| 2   | MEM-2026-022 | Paleta e layout visual do shell               | Regra     | Ativa  | 2026-10-19    |
| 3   | MEM-2026-024 | Contrato das configurações de view            | Interface | Ativa  | 2026-10-23    |
| 4   | MEM-2026-028 | Tabela de investimentos do Tesouro Direto     | Interface | Ativa  | 2026-11-18    |
| 5   | MEM-2026-029 | Toolbar e filtros da tabela do Tesouro Direto | Decisão   | Ativa  | 2026-11-08    |
| 6   | MEM-2026-032 | Expansão de registros (snapshots) na tabela   | Interface | Ativa  | 2026-11-12    |
| 7   | MEM-2026-034 | Modal "Registrar" e componente de toast       | Interface | Ativa  | 2026-11-18    |
| 8   | MEM-2026-036 | Botão e modal "Novo investimento"             | Interface | Ativa  | 2026-11-16    |

## MEM-2026-021 — Shell de views SSR com ETA (layout + partial + controller) {#mem-2026-021}

- **Tipo**: Decisão
- **Status**: Ativa
- **Criada em**: 2026-10-19
- **Atualizada em**: 2026-10-23
- **Tags**: `views`, `eta`, `layout`, `menu`, `bootstrap`
- **Fonte**: `src/views/layout/`, `src/views/components/menu/`, `src/views/tesouroDireto/`, `src/views/rendasFixas/`, `src/views/acoes/`, `src/views/views.controller.ts`, `index.ts`

### Descrição

As views SSR vivem em diretórios próprios, cada um com `view.eta`, `styles.css` e `index.ts`; o shell está em `layout/`, o menu em `components/menu/` e o controller `ViewsController` (em `src/views/views.controller.ts`) compõe as páginas sem duplicar `<head>`/menu.

### Detalhes

- Páginas: `tesouroDireto/view.eta`, `rendasFixas/view.eta` e `acoes/view.eta`; cada uma chama `layout("/layout/view", { title, icon, active, items, styles })` e imprime apenas seu conteúdo.
- Templates de erro: `errorViews/error.403.eta`, `errorViews/error.404.eta` e `errorViews/error.500.eta`.
- O layout `layout/view.eta` inclui `components/menu/view.eta` e imprime `it.body` dentro de `<main class="app-content">`; os `styles.css` das views são carregados via `it.styles`.
- Cada diretório exporta sua configuração pelo `index.ts`: `template`, `style`, `stylePath`; as páginas também exportam `key`, `label`, `href` e `icon`.
- `ViewsController(eta)` expõe `index()`, `rendasFixas()`, `acoes()` e `notFound()`, retornando `Response` com `PageHeadersInit`; as rotas são registradas em `index.ts`.
- Rotas: `/` redireciona para `/tesouro-direto`; `/tesouro-direto`, `/rendas-fixas` e `/acoes` renderizam as páginas; `/*` (catch-all) renderiza o 404 via `ViewError`, com status `404`.
- Bootstrap `5.3.8` e Bootstrap Icons `1.13.2` são servidos localmente a partir de `node_modules` nas rotas `/vendor/...`.

### Referências

- `src/views/layout/`
- `src/views/components/menu/`
- `src/views/tesouroDireto/`, `src/views/rendasFixas/`, `src/views/acoes/`
- `src/views/views.controller.ts`, `src/views/views.test.ts`
- `index.ts`
- `.agents/plans/add-bootstrap-views-layout.md`

## MEM-2026-024 — Contrato das configurações de view {#mem-2026-024}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-10-23
- **Atualizada em**: 2026-10-23
- **Tags**: `views`, `contrato`, `typescript`
- **Fonte**: `src/views/types.ts`

### Descrição

Padroniza os atributos exportados pelos módulos de configuração em `src/views/`, validando a forma em compilação com `as const satisfies` e servindo de tipo único para `ViewsController` e `staticAssets`.

### Detalhes

- `IViewConfig`: `template: string`, `style: string`, `stylePath: string` — usado por `layoutView` e `menuView`.
- `IPageViewConfig extends IViewConfig`: acrescenta `key: string`, `label: string`, `href: string`, `icon: string` — usado por `tesouroDireto`, `rendasFixas` e `acoes`.
- `NavItem = Pick<IPageViewConfig, "key" | "label" | "href" | "icon">` — forma dos itens de `NAV_ITEMS`.
- Cada view declara `as const satisfies <contrato>`, preservando os literais para `NavKey` e falhando em compilação se faltar/sobrar atributo.
- `src/views/index.ts` re-exporta `./types`.

### Referências

- `src/views/types.ts`
- `src/views/views.controller.ts`
- `src/utils/staticAssets.ts`
- MEM-2026-021
- `.agents/plans/standardize-view-config-interface-execution.md`

## MEM-2026-022 — Paleta e layout visual do shell {#mem-2026-022}

- **Tipo**: Regra
- **Status**: Ativa
- **Criada em**: 2026-10-19
- **Atualizada em**: 2026-10-20
- **Tags**: `bootstrap`, `theme`, `css`, `layout`
- **Fonte**: `static/styles/theme.css`, `src/views/layout/styles.css`, `src/views/components/menu/styles.css`, `src/views/*/styles.css`

### Descrição

Define a paleta global e separa os estilos específicos de layout, menu e cada view dentro de `src/views/`.

### Detalhes

- Cores: primária `#2C5745`, secundária `#EBE3A7`, terciária `#EB7D00`, “preta” `#2E2910` e branco `#FFFFFF`, definidas em `static/styles/theme.css`.
- Bootstrap: variáveis `--bs-*` e `--bs-*-rgb` sobrescritas em `:root`; componentes com valores compilados em Sass (ex.: `.btn-primary`) não são re-tematizados sem build SCSS.
- Layout: `src/views/layout/styles.css` contém `.app-body`, `.app-shell`, `.app-content` (`padding: 16px`) e `.app-content__title`.
- Menu: `src/views/components/menu/styles.css` contém a sidebar de `200px`/`100vh`, os links com `white-space: nowrap`, hover/foco e o item ativo.
- Views: cada `src/views/<view>/styles.css` define `--view-accent` (hoje `var(--app-primary)`) para futuras customizações.

### Referências

- `static/styles/theme.css`
- `src/views/layout/styles.css`
- `src/views/components/menu/styles.css`
- `src/views/tesouroDireto/styles.css`, `src/views/rendasFixas/styles.css`, `src/views/acoes/styles.css`
- `.agents/plans/add-bootstrap-views-layout.md`

## MEM-2026-028 — Tabela de investimentos do Tesouro Direto (componente de view) {#mem-2026-028}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-10-29
- **Atualizada em**: 2026-11-18
- **Tags**: `views`, `eta`, `tabela`, `tesouro-direto`, `bootstrap`, `formatacao`
- **Fonte**: `src/views/components/tesouroDiretoTable/`, `src/views/types.ts`, `src/views/views.controller.ts`, `src/utils/formatMoneyToBRL.ts`, `src/utils/formatDate.ts`, `src/utils/formatPercentage.ts`

### Descrição

Componente específico da página Tesouro Direto que renderiza um investimento por linha a partir de `IVentureTracking`, com linha de tabela enxuta pré-formatada e menu de ações CSS-only.

### Detalhes

- `ITesouroDiretoTableRow` (`src/views/types.ts`): `id`, `name`, `internalCode?`, `typeLabel`, `indexerLabel`, `amountLabel`, `profitabilityLabel`, `profitabilityTrend` (`up | down | neutral`), `expiresAtLabel` — somente strings de apresentação, sem importar `contracts/`.
- `toTesouroDiretoTableRow(tracking)` (`src/views/components/tesouroDiretoTable/index.ts`) é a única bridge `IVentureTracking` → linha: formata centavos em BRL, data em UTC e rentabilidade com sinal; usa `—` quando não há snapshot, `expiresIn` ou `indexer` (ativo variável).
- Colunas: Investimento, Tipo, Indexador, Montante, Rentabilidade, Expiração, Opções. `VentureType` → rótulo PT-BR; `IndexerType` → rótulo ("Selic", "Prefixado", "Fixo"…).
- Menu de ações em `<details>`/`<summary>` com Registrar, Arquivar e Editar: `Registrar` abre o modal de registro (`data-register-venture`/`data-venture-name`); `Arquivar` e `Editar` seguem inertes. Não existe ação `Sacar` — resgates são registrados pelo tipo "Resgate" (`WITHDRAWAL`) no próprio modal. No cliente, `menu.js` fecha o menu ao sair do foco (`focusout`), ao clicar fora e com `Esc`. O layout segue sem carregar scripts — o próprio componente inclui o seu.
- CSS em `src/views/components/tesouroDiretoTable/styles.css`, registrado em `viewStyles` (`src/utils/staticAssets.ts`) e carregado apenas na página do Tesouro via `extraStyles` do `ViewsController.render`.
- `ViewsController.render(page, { rows?, extraStyles? })` injeta `rows` em todas as páginas; hoje `index()` usa `PREVIEW_TRACKING` (mock) + mapper.
- Formatadores: `formatMoneyToBRL` (centavos → BRL, NBSP normalizado), `formatDate` (UTC, `RangeError` em data inválida) e `formatPercentage` (`signDisplay: exceptZero`).

### Referências

- `src/views/components/tesouroDiretoTable/`
- `src/views/types.ts`, `src/views/views.controller.ts`
- `src/utils/formatMoneyToBRL.ts`, `src/utils/formatDate.ts`, `src/utils/formatPercentage.ts`
- `src/utils/staticAssets.ts`
- MEM-2026-021, MEM-2026-024
- `.agents/plans/add-tesouro-direto-investments-table.md`

## MEM-2026-029 — Toolbar e filtros da tabela do Tesouro Direto {#mem-2026-029}

- **Tipo**: Decisão
- **Status**: Ativa
- **Criada em**: 2026-11-08
- **Atualizada em**: 2026-11-08
- **Tags**: `views`, `eta`, `toolbar`, `filtros`, `ordenacao`, `ssr`
- **Fonte**: `src/views/components/tesouroDiretoToolbar/`, `src/views/tesouroDireto/ventures.ts`, `src/views/views.controller.ts`, `index.ts`

### Descrição

Filtros e ordenação da tabela do Tesouro Direto acontecem no servidor via query string, sem JavaScript; a toolbar renderiza um formulário GET e links canônicos de ordenação.

### Detalhes

- Contrato da query: `search`, `indexer` (`IndexerType`), `sort` (`expires` padrão | `amount`) e `dir` (`asc`/`desc`; padrão `expires`→`asc`, `amount`→`desc`). Valores inválidos são ignorados.
- `parseToolbarState`, `filterTrackings`, `sortTrackings`, `applyToolbarState`, `buildIndexerOptions`, `buildToolbarLinks`, `hasActiveFilters` e `toToolbarView` em `state.ts` (funções puras, cobertas por `state.test.ts`).
- Busca por nome: `trim`, `NFD`, remoção de diacríticos e minúsculas, comparação por substring. Indexador: igualdade e só se aplica a renda fixa. O filtro por tipo não existe (a coluna “Tipo” permanece na tabela).
- Ordenação: um critério primário por vez (expiração ou montante); o outro desempata com direção fixa (expiração asc, montante desc); sem `expiresIn` sempre no fim; empate total mantém a ordem estável.
- Opções de indexador são dinâmicas (valores presentes) + “Todos”, ordenadas por rótulo; rótulos e guard compartilhados em `tesouroDireto/ventures.ts`.
- Links canônicos omitem `sort=expires` e o `dir` padrão; “Limpar filtros” aponta para `/tesouro-direto` e só aparece com estado ativo.
- `ViewsController.index(req?)` lê a URL e `index.ts` passa `req`; `emptyMessage` distingue “Nenhum investimento encontrado.” de “Nenhum investimento cadastrado.”.
- Exportar/Importar são botões inertes (`type="button"`), sem serviço implementado.

### Referências

- `src/views/components/tesouroDiretoToolbar/`
- `src/views/tesouroDireto/ventures.ts`, `src/views/tesouroDireto/view.eta`
- `src/views/views.controller.ts`, `index.ts`
- `src/utils/staticAssets.ts`
- MEM-2026-021, MEM-2026-028
- `.agents/plans/add-tesouro-direto-table-toolbar.md`

## MEM-2026-032 — Expansão de registros (snapshots) na tabela {#mem-2026-032}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-11-12
- **Atualizada em**: 2026-11-12
- **Tags**: `views`, `tabela`, `snapshots`, `registros`, `tesouro-direto`, `acessibilidade`
- **Fonte**: `src/views/types.ts`, `src/views/components/tesouroDiretoTable/{records.ts,records.test.ts,view.eta,styles.css,records.js}`

### Descrição

A tabela do Tesouro Direto ganhou uma primeira coluna (cabeçalho sem texto visível) que expande, abaixo de cada investimento, a lista de snapshots com data, diferença de saldo, valores anterior/novo e nota.

### Detalhes

- `ITesouroDiretoRecordRow`: `dateLabel`, `differenceLabel`, `previousValueLabel`, `currentValueLabel`, `notes?`; `ITesouroDiretoTableRow` ganhou `records: ITesouroDiretoRecordRow[]`.
- `toTesouroDiretoRecordRows(snapshots, initialValue)` ordena cronologicamente para calcular o par anterior/novo (o primeiro registro usa `initialValue`) e depois inverte para exibir **desc** (desempate `createdAt` desc). Formata:
  - `dateLabel` = `formatDate(referenceDate)`;
  - `differenceLabel` = `currentTotalValue − valor anterior` com sinal (`+ R$ …`, `- R$ …`, `R$ 0,00`), independente do tipo; `differenceTrend` (`up`/`down`/`neutral`) colore a coluna com a paleta (`--app-success` para alta, `--app-danger` para baixa, `--bs-secondary-color` no zero);
- Template: `<th>` vazio com `<span class="visually-hidden">Registros</span>`; botão `aria-expanded`/`aria-controls` com ícone puro `bi-chevron-down` (gira 180° para cima quando aberto); linha extra com `colspan="8"` e `hidden`; estado vazio da tabela usa `colspan="8"`.
- `records.js` (idempotente) alterna `aria-expanded`, classe `--open` e `hidden` da linha controlada; botão fica `disabled` sem registros (lista mostra “Nenhum registro.”).
- A célula da lista de registros tem recuo à esquerda (`padding-left: 1.5rem`) e borda esquerda destacada (`3px solid var(--app-primary)`) para indicar o investimento de origem.
- Nota exibida com `line-clamp: 3` e `title` com o texto completo; ausente → `—`.
- Cada registro carrega dados crus para as ações (`id`, `ventureId`, `type`, `value` em centavos, `referenceDate` em `YYYY-MM-DD` e `notes`) e renderiza, depois da nota, dois botões outline “Editar”/“Excluir” (`data-edit-snapshot`/`data-delete-snapshot` + `data-snapshot-*`), com `flex-wrap` na linha e `margin-left: auto` no grupo de ações.
- Dados atuais (7 snapshots TREASURY, todos `MONTHLY_RECORD`) mostram a diferença calculada na segunda coluna (ex.: `+ R$ 546,51`).

### Referências

- `src/views/components/tesouroDiretoTable/records.ts`, `records.test.ts`
- `src/views/components/tesouroDiretoTable/view.eta`, `styles.css`, `records.js`
- MEM-2026-028, MEM-2026-029
- `.agents/plans/expand-investment-records-in-table.md`

## MEM-2026-034 — Modal "Registrar" e componente de toast {#mem-2026-034}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-11-13
- **Atualizada em**: 2026-11-18
- **Tags**: `views`, `modal`, `bootstrap`, `toast`, `snapshots`, `registrar`, `editar`, `excluir`, `javascript`
- **Fonte**: `src/views/components/registerSnapshotModal/`, `src/views/components/toast/`, `src/views/components/tesouroDiretoTable/view.eta`, `src/views/tesouroDireto/view.eta`, `src/utils/staticAssets.ts`

### Descrição

O item `Registrar` do menu de opções da linha abre um modal Bootstrap que cria snapshots via `POST /api/snapshots`; o mesmo modal edita registros existentes via `PATCH`, e um modal dedicado os exclui via `DELETE` (soft delete). O feedback usa um componente de toast próprio.

### Detalhes

- `registerSnapshotModal` (componente `IViewConfig`): `modal fade` do Bootstrap com título “Registrar”, nome do investimento, `select` de tipo (`MONTHLY_RECORD` “Rendimento mensal” padrão, “Aporte”, “Resgate”), `input number` de valor em reais, `input date` (pré-preenchido com hoje) e `textarea` de nota (`maxlength=280`); rodapé com `Cancelar` (`data-bs-dismiss`), `Registrar` e `Registrar e próximo` (`data-action`).
- O projeto passou a servir o `bootstrap.bundle.min.js` em `staticAssetRoutes` (`/vendor/bootstrap/bootstrap.bundle.min.js`); o layout continua sem scripts — a página `tesouroDireto/view.eta` carrega o bundle uma única vez e cada componente inclui o seu próprio `<script defer>` de modal (o `registerSnapshotModal` deixou de incluir o bundle).
- `modal.js` (IIFE idempotente): abre por `[data-register-venture]` da linha, preenche `ventureId` e nome, reseta o form; converte reais → centavos (`Math.round(valor * 100)`); desabilita submits durante o `fetch`; em `201` mostra toast e, para `register`, fecha e recarrega a página após 1,2 s (preserva filtros via query string); para `register-next`, avança pelo DOM (`tr[data-venture-id]`), e no último fecha e recarrega; em erro exibe a `message` do backend no toast com o modal aberto.
- `toastView` + `toast.js`: container `#toastStack` (`aria-live="polite"`), `window.AppToast.show({ variant, message })`, variantes `success`/`danger` com `--app-success`/`--app-danger`, auto-dismiss de 4 s e empilhamento no canto inferior direito.
- A `<tr>` de cada investimento ganhou `data-venture-id`/`data-venture-name` e o botão de menu `data-register-venture`, permitindo a navegação de “próximo” sem duplicar dados no SSR.
- `ViewsController.index` inclui `registerSnapshotModal.style` e `toastView.style` em `extraStyles`; os dois componentes são exportados por `src/views/components/index.ts`.
- Modo edição do `registerSnapshotModal`: o botão `[data-edit-snapshot]` preenche `snapshotId`, tipo, valor (`currentTotalValue / 100`), data e nota; o título vira “Editar registro”, o `select` de tipo fica desabilitado, “Registrar e próximo” é ocultado e o submit vira “Confirmar”. O submit envia `PATCH` (sem `type`), mostra “Registro atualizado com sucesso.” e recarrega; `hidden.bs.modal` restaura o modo registro.
- `deleteSnapshotModal` (componente `IViewConfig` novo): confirma exclusão com o aviso “Esta ação não é reversível” e botões `Cancelar`/`Excluir`; `modal.js` envia `DELETE /api/snapshots` com `{ ventureId, snapshotId }`, mostra “Registro excluído com sucesso.”, fecha e recarrega em sucesso, e mantém o modal aberto com toast de erro em falha.
- `deleteSnapshotModal` está em `viewStyles` (`src/utils/staticAssets.ts`), em `extraStyles` do `ViewsController.index`, no barrel `src/views/components/index.ts` e em `src/views/tesouroDireto/view.eta`; o script é servido em `/views/components/deleteSnapshotModal/modal.js`.

### Referências

- `src/views/components/registerSnapshotModal/{index.ts,view.eta,styles.css,modal.js}`
- `src/views/components/deleteSnapshotModal/{index.ts,view.eta,styles.css,modal.js}`
- `src/views/components/toast/{index.ts,view.eta,styles.css,toast.js}`
- `src/utils/staticAssets.ts`, `src/views/views.controller.ts`
- `#mem-2026-028`, `#mem-2026-029`, `#mem-2026-032`, `#mem-2026-033`
- `.agents/plans/add-register-snapshot-flow.md`

## MEM-2026-036 — Botão e modal "Novo investimento" {#mem-2026-036}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-11-16
- **Atualizada em**: 2026-11-16
- **Tags**: `views`, `modal`, `bootstrap`, `ventures`, `novo-investimento`, `javascript`, `success`, `danger`
- **Fonte**: `src/views/components/newVentureModal/`, `src/views/tesouroDireto/view.eta`, `src/views/views.controller.ts`, `static/styles/theme.css`, `src/utils/staticAssets.ts`

### Descrição

Um botão outlined verde abaixo da toolbar do Tesouro Direto abre o modal “Novo investimento Tesouro Direto”, que cria ventures via `POST /api/ventures`.

### Detalhes

- `newVentureModal` (componente `IViewConfig`): botão `btn btn-outline-success` com `bi bi-plus-lg` antes do texto “Novo investimento”, seguido de `modal fade` Bootstrap com título dinâmico.
- `NEW_VENTURE_MODAL_CONFIG` mapeia página → título + tipos; nesta iteração apenas `tesouro-direto` é renderizado (somente `TREASURY`). `rendas-fixas` e `acoes` já possuem configuração pronta, mas sem trigger.
- Campos comuns: `name` (obrigatório), `internalCode` (opcional), `type` (obrigatório), `boughtAt` (obrigatório, máximo hoje). Blocos condicionais por categoria derivada do tipo: `FIXED` (`expiresIn`, `initialValue`, `indexer`, `rate`, `source`) e `VARIABLE` (`quantity`, `unitPrice`).
- `modal.js` (IIFE idempotente): abre por `[data-new-venture]`, reseta o form, alterna blocos/`required`/`disabled` ao trocar o tipo, converte reais → centavos, envia `POST /api/ventures`, mostra toast e recarrega a página após 1,2 s em sucesso; em erro mantém o modal aberto com a `message` do backend.
- `static/styles/theme.css` passou a mapear `--bs-success: var(--app-success)`/`--bs-success-rgb: 74, 140, 58` e `--bs-danger: var(--app-danger)`/`--bs-danger-rgb: 200, 62, 43`, fazendo `btn-outline-success`/`btn-success` e `btn-outline-danger`/`btn-danger` usarem as cores do tema. O botão `Cancelar` do modal usa `btn-outline-danger`.
- `ViewsController.index` passa `ventureModal: toNewVentureModalView("tesouro-direto")` e inclui `newVentureModal.style` em `extraStyles`; o bundle Bootstrap é carregado uma única vez pela página.

### Referências

- `src/views/components/newVentureModal/{index.ts,view.eta,styles.css,modal.js}`
- `src/views/tesouroDireto/view.eta`, `src/views/views.controller.ts`, `src/utils/staticAssets.ts`
- `static/styles/theme.css`
- `#mem-2026-034`, `#mem-2026-035`
- `.agents/plans/add-create-venture-modal-flow.md`
