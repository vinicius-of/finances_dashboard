# Implementation Plan: Tabela de investimentos do Tesouro Direto (componentes visuais)

- **Plan ID**: `add-tesouro-direto-investments-table`
- **Status**: Done
- **Date**: 2026-10-29

## 1. Requirements & Objectives

- **Goal**: Criar o componente visual de tabela da página **Tesouro Direto**, listando um investimento por linha (base no `venture` + valores monetários do último `snapshot`), com headers, linhas, coluna de ações e menu de opções — sem qualquer regra de negócio ou persistência nesta etapa.
- **Scope (in)**:
  - Componente próprio `src/views/components/tesouroDiretoTable/` (`view.eta`, `styles.css`, `index.ts`) no padrão `IViewConfig` já usado por `menu`.
  - Colunas na ordem: **Investimento · Tipo · Indexador · Montante · Rentabilidade · Expiração · Opções**.
  - Tipo de view enxuto (somente para `src/views/`), desacoplado do contrato de domínio e pronto para renderização.
  - Conversão `IVentureTracking` (venture + snapshots + `latestValue` + `totalProfitabilityPercentage`) → linha da tabela.
  - Última coluna com botão que abre menu (CSS-only, `<details>`/`<summary>`) com **Guardar · Sacar · Arquivar · Editar**, todos inertes (`type="button"`, sem handler).
  - Implementação dos formatadores vazios `src/utils/formatMoneyToBRL.ts` e `src/utils/formatDate.ts`, mais `src/utils/formatPercentage.ts`.
  - Dados de _preview_ (mock) para a tabela aparecer populada no navegador.
  - Testes de renderização, do mapper e dos formatadores.
  - Registro em `.agents/PROJECT.md`, `.agents/ARCHITECTURE.md` e `.agents/memory/`.
- **Out of Scope**:
  - Integração real com `VenturesService`/`SnapshotsService`/repositórios e banco.
  - Comportamento dos botões (Guardar, Sacar, Arquivar, Editar), modais, formulários, rotas de API e persistência.
  - Bootstrap JS / bundle de dropdown; qualquer JavaScript novo no projeto.
  - Busca, ordenação, filtros e paginação.
  - Tabela reutilizada em Rendas Fixas e Ações (fica para uma task própria).
  - `formatMoneyToUSD.ts` (permanece vazio e fora do escopo).
  - Alteração de `package.json`, `bun.lock`, `.env`, `opencode.json` e de mudanças WIP do desenvolvedor (ex.: `src/api/middlewares/cors` removido, reestruturação de views já não commitada).

### Decisões confirmadas pelo desenvolvedor

| Tema           | Decisão                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Dados na tela  | **Mock/preview** no controller; a tabela deve aparecer populada no navegador.                    |
| Tipo de linha  | **Criar um tipo de view enxuto**, usado somente dentro de `src/views/`.                          |
| Menu de opções | **CSS-only** com `<details>`/`<summary>` (sem JS).                                               |
| Formatação     | Implementar `formatMoneyToBRL` (centavos), `formatDate` e a rentabilidade com sinal (+/−) e cor. |
| Coluna "Tipo"  | Rótulo genérico traduzido do `VentureType` **+ nova coluna "Indexador"**.                        |
| Componente     | **Específico** em `src/views/components/tesouroDiretoTable/` (não genérico).                     |

### Premissas declaradas (validar na aprovação)

- A coluna **"Indexador"** entra imediatamente **após "Tipo"**.
- Sem snapshot no histórico: "Montante" e "Rentabilidade" exibem `—` (traço).
- `expiresIn` ausente ou `indexer` ausente (ativo variável): exibe `—`.
- Nome exibe `venture.name` e, quando houver, `internalCode` como texto secundário.
- A tabela não terá título/card próprio; entra logo abaixo do `<h2>` da página.

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/views/components/tesouroDiretoTable/index.ts` (**Create** — `tesouroDiretoTable` config `as const satisfies IViewConfig`, mapas de rótulos e `toTesouroDiretoTableRow`).
  - `src/views/components/tesouroDiretoTable/view.eta` (**Create** — `<thead>` com 7 colunas, `<tbody>`, estado vazio e menu de opções).
  - `src/views/components/tesouroDiretoTable/styles.css` (**Create** — tabela, badge de tipo, cores de rentabilidade, menu absoluto, breakpoint de scroll).
  - `src/views/components/index.ts` (**Modify** — re-exportar o componente).
  - `src/views/types.ts` (**Modify** — `ITesouroDiretoTableRow` e `ProfitabilityTrend`).
  - `src/views/tesouroDireto/view.eta` (**Modify** — incluir o componente com `it.rows`).
  - `src/views/views.controller.ts` (**Modify** — `PREVIEW_TRACKING`/`PREVIEW_ROWS`, `render(page, { rows, extraStyles })`, estilo do componente só na página do Tesouro).
  - `src/utils/staticAssets.ts` (**Modify** — registrar `tesouroDiretoTable` em `viewStyles`).
  - `src/utils/formatMoneyToBRL.ts` (**Modify** — arquivo existe com 0 bytes).
  - `src/utils/formatDate.ts` (**Modify** — arquivo existe com 0 bytes).
  - `src/utils/formatPercentage.ts` (**Create**).
  - `src/utils/formatMoneyToBRL.test.ts`, `src/utils/formatDate.test.ts`, `src/utils/formatPercentage.test.ts` (**Create**).
  - `src/views/views.test.ts` (**Modify** — testes da tabela e do mapper).
  - `.agents/PROJECT.md`, `.agents/ARCHITECTURE.md`, `.agents/memory/VIEWS_MEMORY.md`, `.agents/memory/INDEX.md` (**Modify/Create** — documentação e memória).
  - `.agents/plans/add-tesouro-direto-investments-table.md` (este plano).
- **Dependencies Required**: **nenhuma nova**. Usa `eta`, `bootstrap` (`.table`, `.table-responsive`), `bootstrap-icons`, `Intl` nativo e `bun:test`.
- **Contexto relevante**:
  - `IVentureTracking` (`contracts/ventureTracking.ts`) já entrega `venture`, `snapshots`, `latestValue` e `totalProfitabilityPercentage` — é a fonte da linha.
  - `IVenture` tem `name`, `internalCode?`, `type`, `expiresIn?`; `IFixedIncomeVenture` acrescenta `indexer`. `VentureType` = `TREASURY | CDB | LCI | LCA | STOCK | FII`; `IndexerType` = `CDI | IPCA | SELIC | PRE | FIXED`.
  - **Valores monetários em centavos** (models `ventures`/`venture_snapshots` e regra dos serviços); `profitPercentage` é `real` (ex.: `8.42`).
  - Datas de calendário são `Date` criadas de `YYYY-MM-DD` (`toDate`), ou seja, **meia-noite UTC** — formatar com componentes UTC evita deslocar o dia em `America/Sao_Paulo`.
  - `ViewsController.render()` hoje recebe só a página e passa `title`, `icon`, `active`, `items`, `styles`; nenhuma view recebe dados de domínio.
  - O `layout/view.eta` **não carrega JS** (nem Bootstrap bundle); logo o menu não pode depender de JS.
  - `src/utils/staticAssets.ts` só serve CSS registrado em `viewStyles` — o CSS do novo componente precisa ser registrado, senão o link `/views/components/tesouroDiretoTable/styles.css` retorna 404.
  - Convenção de testes: `<arquivo>.test.ts` ao lado do arquivo testado; `views.test.ts` hoje cobre páginas, nav ativo e assets (não cobre conteúdo de tabela).
  - `tsconfig` é `strict` com `noUnusedLocals`; imports via alias `@/...`.
  - AGENTS.md §2: **sem comentários no código**; nomenclatura `PascalCase` para tipos/interfaces e prefixo `I`.

## 3. Architectural Options & Decision

### Opção A: Linha de tabela pré-formatada (view model) + mapper (escolhida)

`ITesouroDiretoTableRow` carrega strings prontas (`amountLabel`, `profitabilityLabel`, `expiresAtLabel`) e um enum de tendência; `toTesouroDiretoTableRow(tracking)` faz conversão de centavos, datas e rótulos.

- **Pros**: template sem lógica; tipo enxuto e desacoplado do domínio (pedido do desenvolvedor); formatação testável isoladamente; a borda (mapper) é o único ponto que conhece `IVentureTracking`; formatações novas entram sem tocar no HTML.
- **Cons**: o valor numérico original não fica disponível na linha (não é necessário para exibição hoje); exige mapper + testes.

### Opção B: Linha com valores crus e formatação no `view.eta`

- **Pros**: um único tipo numérico; menos código no controller.
- **Cons**: ETA passa a concentrar regra de formatação; centavos/datas vazam para o template; impossível testar formatação sem renderizar HTML; fere a separação apresentação × dados.

### Opção C: Repassar `IVentureTracking[]` direto ao template

- **Pros**: zero mapeamento.
- **Cons**: acopla a view ao contrato de domínio (contraria a decisão de tipo enxuto), expõe histórico de snapshots e campos não usados, e ainda exigiria lógica no template.

> **Decision**: **Opção A**. `src/views/types.ts` recebe `ITesouroDiretoTableRow` e `ProfitabilityTrend`; o mapper vive em `src/views/components/tesouroDiretoTable/index.ts` e é o único consumidor dos formatadores dentro desta entrega.

### Menu de opções: `<details>` nativo (escolhida)

- **Escolhida**: `<details class="...__menu">` + `<summary>` + `<ul>` de `<button type="button">`. Sem JS, foco/teclado nativos (Tab/Enter/Space), sem alterar o `layout`.
- **Alternativas descartadas**: dropdown Bootstrap (exigiria bundle JS, `<script>` no layout e rota de asset novo); `popover` API (top layer + posicionamento exige CSS anchor positioning, suporte irregular).
- **Trade-off documentado**: não fecha com clique fora nem com `Esc` (comportamento nativo do `<details>`); mais de um menu pode ficar aberto. Aceitável nesta etapa visual; será revisto quando as ações reais forem implementadas.

### Tipos e rótulos

- `VentureType` → rótulo: `TREASURY` → "Tesouro Direto", `CDB` → "CDB", `LCI` → "LCI", `LCA` → "LCA", `STOCK` → "Ações", `FII` → "FII".
- `IndexerType` → rótulo: `CDI` → "CDI", `IPCA` → "IPCA", `SELIC` → "Selic", `PRE` → "Prefixado", `FIXED` → "Fixo".
- Ausência de indexador (ativo variável) → `—`.
- Tendência: `up` (`profitabilityPercentage > 0`), `down` (`< 0`), `neutral` (`0` ou sem snapshot).

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Formatadores em `src/utils/`**:
  - `formatMoneyToBRL(valueInCents: number): string` — divide por 100 e formata via `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`; normaliza espaço não separável para espaço simples; valores negativos preservam o sinal.
  - `formatDate(date: Date): string` — `dd/mm/aaaa` com componentes **UTC** (`getUTCDate`/`getUTCMonth`/`getUTCFullYear`); data inválida lança `RangeError` (não mascarar erro).
  - `formatPercentage(value: number): string` — duas casas, vírgula decimal, sinal explícito exceto zero (`+8,42%`, `-3,10%`, `0,00%`).
  - Testes dos três formatadores (bordas: 0, 1 centavo, negativo, milhar, data UTC meia-noite, data inválida, zero/positivo/negativo).

- [x] **Step 2 — Contrato de view**:
  - Em `src/views/types.ts`, adicionar `export type ProfitabilityTrend = "up" | "down" | "neutral"` e `export interface ITesouroDiretoTableRow` com: `id`, `name`, `internalCode?`, `typeLabel`, `indexerLabel`, `amountLabel`, `profitabilityLabel`, `profitabilityTrend`, `expiresAtLabel`.
  - Sem importar `contracts/` em `src/views/types.ts` (o tipo é puramente de apresentação).

- [x] **Step 3 — Componente de tabela**:
  - `index.ts`: `tesouroDiretoTable` (`template: "components/tesouroDiretoTable/view"`, `style: "/views/components/tesouroDiretoTable/styles.css"`, `stylePath: "src/views/components/tesouroDiretoTable/styles.css"`) `as const satisfies IViewConfig`; mapas de rótulo; `toTesouroDiretoTableRow(tracking: IVentureTracking): ITesouroDiretoTableRow` (narrow por `category === "FIXED"` para ler `indexer`; `snapshots.length === 0` → `—`).
  - `view.eta`: wrapper `table-responsive` + `<table class="table ...">`, `<caption class="visually-hidden">`, `<thead>` na ordem definida, `<tbody>` com um `<tr>` por linha, estado vazio (`colspan="7"`) e `<th scope="row">` no nome; menu `<details>` na última célula com os 4 `<button type="button">`.
  - `styles.css`: layout da tabela, badge do tipo (fundo `--app-secondary`, texto `--app-black`), `--up` com `var(--app-primary)` e `--down` com `var(--bs-danger)`, `--neutral` com `var(--bs-secondary-color)`, posicionamento absoluto do menu (`right: 0`), `overflow-x: auto` no wrapper apenas em `max-width: 992px` (desktop com `overflow: visible` para não recortar o menu).
  - Re-exportar em `src/views/components/index.ts`.

- [x] **Step 4 — Página, controller e assets**:
  - `src/views/tesouroDireto/view.eta`: incluir o componente via `<%~ include("/components/tesouroDiretoTable/view", { rows: it.rows ?? [] }) %>` abaixo do título.
  - `views.controller.ts`: `PREVIEW_TRACKING: IVentureTracking[]` (3 ativos do Tesouro, com 1 snapshot cada) e `PREVIEW_ROWS = PREVIEW_TRACKING.map(toTesouroDiretoTableRow)`; `render(page, options: { rows?, extraStyles? })`; `index()` passa `rows` + `extraStyles: [tesouroDiretoTable.style]`; `rendasFixas()`/`acoes()` permanecem sem tabela e sem estilo extra.
  - `src/utils/staticAssets.ts`: adicionar `tesouroDiretoTable` ao array `viewStyles`.

- [x] **Step 5 — Testes**:
  - `src/views/views.test.ts`: headers na ordem exata; uma linha por preview com nome/código/tipo/indexador/montante/rentabilidade/expiração formatados; 4 itens de menu por linha (Guardar, Sacar, Arquivar, Editar) e `<summary>` com `aria-label`; link do CSS do componente presente no HTML; mapper (rótulos, `—` sem snapshot, `—` sem `expiresIn`/`indexer`, tendência `up`/`down`/`neutral`); estado vazio renderizando o componente isolado via `eta.render`.
  - Rodar apenas os testes do escopo.

- [x] **Step 6 — Documentação, memória e verificação**:
  - Atualizar `.agents/PROJECT.md` (`components/tesouroDiretoTable/`, `types.ts`) e `.agents/ARCHITECTURE.md` (§3, views) se necessário.
  - Registrar memória `MEM-2026-028` em `.agents/memory/VIEWS_MEMORY.md` e no `INDEX.md` (contrato `ITesouroDiretoTableRow`, componente específico, menu CSS-only).
  - Rodar `bun test` completo e `bunx tsc --noEmit`.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bun test src/utils/formatMoneyToBRL.test.ts src/utils/formatDate.test.ts src/utils/formatPercentage.test.ts`
  - `bun test src/views/views.test.ts`
  - `bun test`
  - `bunx tsc --noEmit`
  - Verificação visual: `bun run index.ts` e abrir `/tesouro-direto` (tabela populada; menu abre/fecha; `/rendas-fixas` e `/acoes` sem tabela).
- **Edge cases to verify**:
  - Centavos: `0` → `R$ 0,00`; `1` → `R$ 0,01`; `123456789` → `R$ 1.234.567,89`; negativo → `-R$ …`.
  - Data UTC: `2029-03-01` renderiza `01/03/2029` independentemente do fuso local; data inválida lança `RangeError`.
  - Percentual: `0` → `0,00%` (sem sinal); `8.42` → `+8,42%`; `-3.1` → `-3,10%`.
  - Rentabilidade positiva/negativa/neutra com classes distintas.
  - Tracking sem snapshot → `—` em montante e rentabilidade (`neutral`).
  - `expiresIn` e `indexer` ausentes → `—`; `internalCode` ausente → só o nome.
  - `rows` vazio → linha única de estado vazio com `colspan="7"`.
  - 7 colunas e 7 headers, na ordem: Investimento, Tipo, Indexador, Montante, Rentabilidade, Expiração, Opções.
  - Menu: 4 botões por linha, inertes, acessíveis por teclado (foco no `<summary>` e nos `<button>`).
  - CSS do componente servido em `/views/components/tesouroDiretoTable/styles.css` (200) e referenciado no `<head>` somente da página do Tesouro.
  - Acentuação PT-BR preservada em UTF-8; nenhum JS novo adicionado ao layout.
  - Páginas `/rendas-fixas` e `/acoes` continuam sem `venture-table` e sem o CSS do componente.

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - 2026-10-29 — Clarificações respondidas (Fase 2): (1) mock/preview; (2) tipo de view enxuto; (3) menu CSS-only com `<details>`; (4) formatadores em `src/utils/`; (5) rótulo genérico do tipo **+ coluna "Indexador"**; (6) componente específico do Tesouro Direto.
  - 2026-10-29 — Aprovação registrada: "Aprovo". Plan ID `add-tesouro-direto-investments-table` atribuído após verificação de unicidade (planos, histórico, branches e commits).
  - 2026-10-29 — Fase 1 (execução): linha de base `bun test src/views/views.test.ts` 6 pass / 0 fail; `bunx tsc --noEmit` 0 erros. Resposta do desenvolvedor: "Pode seguir".
  - 2026-10-29 — Fase 2: 4 arquivos de teste escritos (2 utils + 1 novo util + views); execução `0 pass / 4 fail / 4 errors` por ausência de módulos/exports. Resposta do desenvolvedor: "Pode seguir" (testes congelados).
  - 2026-10-29 — Fase 3: implementados formatadores, componente, tipos, preview no controller e registro do CSS. Escopo `20 pass / 0 fail`; regressão `bun test` 63 pass / 0 fail; `bunx tsc --noEmit` 0 erros; smoke na instância ativa (porta 3333) `/tesouro-direto` 200, 12 itens de menu, CSS 200.
  - 2026-10-29 — Registro de execução: `.agents/plans/add-tesouro-direto-investments-table-execution.md`.

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Each item must be atomic, verifiable and traceable to its source step in Section 4. This list is the single source of truth for execution progress: update it in the same iteration as any plan change.

### Step 1: Formatadores em `src/utils/`

- [x] `TODO-01` Implementar `formatMoneyToBRL(valueInCents)` em `src/utils/formatMoneyToBRL.ts` (centavos → `R$`, `Intl` pt-BR, espaço NBSP normalizado).
- [x] `TODO-02` Implementar `formatDate(date)` em `src/utils/formatDate.ts` (`dd/mm/aaaa` com componentes UTC; `RangeError` para data inválida).
- [x] `TODO-03` Criar `src/utils/formatPercentage.ts` com `formatPercentage(value)` (duas casas, sinal explícito exceto zero).
- [x] `TODO-04` Criar `src/utils/formatMoneyToBRL.test.ts` cobrindo `0`, `1`, milhar e negativo.
- [x] `TODO-05` Criar `src/utils/formatDate.test.ts` cobrindo meia-noite UTC, virada de mês/ano e data inválida.
- [x] `TODO-06` Criar `src/utils/formatPercentage.test.ts` cobrindo `0`, positivo e negativo.
- [x] `TODO-07` Rodar `bun test src/utils/formatMoneyToBRL.test.ts src/utils/formatDate.test.ts src/utils/formatPercentage.test.ts` e registrar o resultado.

### Step 2: Contrato de view

- [x] `TODO-08` Adicionar `ProfitabilityTrend` e `ITesouroDiretoTableRow` em `src/views/types.ts` com os 9 campos definidos na Seção 4.
- [x] `TODO-09` Confirmar que `src/views/types.ts` não importa `@/contracts`.

### Step 3: Componente de tabela

- [x] `TODO-10` Criar `src/views/components/tesouroDiretoTable/index.ts` com `tesouroDiretoTable` (`as const satisfies IViewConfig`).
- [x] `TODO-11` Implementar em `src/views/components/tesouroDiretoTable/index.ts` os mapas `VentureType`→rótulo e `IndexerType`→rótulo.
- [x] `TODO-12` Implementar `toTesouroDiretoTableRow(tracking: IVentureTracking)` no `index.ts` (narrow de `indexer`, `—` sem snapshot, `—` sem `expiresIn`, tendência).
- [x] `TODO-13` Criar `src/views/components/tesouroDiretoTable/view.eta` com wrapper `.table-responsive`, `<caption class="visually-hidden">`, `<thead>` de 7 colunas na ordem definida e `<tbody>` iterando `it.rows`.
- [x] `TODO-14` Implementar no `view.eta` o estado vazio (`colspan="7"`) e o `<th scope="row">` com nome + `internalCode`.
- [x] `TODO-15` Implementar no `view.eta` o menu `<details>` com `<summary aria-label="Opções de <nome>">` e 4 `<button type="button">` (Guardar, Sacar, Arquivar, Editar).
- [x] `TODO-16` Criar `src/views/components/tesouroDiretoTable/styles.css` com tabela, badge do tipo, classes `--up`/`--down`/`--neutral`, menu absoluto e breakpoint de `overflow-x`.
- [x] `TODO-17` Re-exportar o componente em `src/views/components/index.ts`.
- [x] `TODO-18` Registrar `tesouroDiretoTable` em `viewStyles` de `src/utils/staticAssets.ts`.

### Step 4: Página, controller e assets

- [x] `TODO-19` Incluir `<%~ include("/components/tesouroDiretoTable/view", { rows: it.rows ?? [] }) %>` em `src/views/tesouroDireto/view.eta`.
- [x] `TODO-20` Adicionar `PREVIEW_TRACKING` (3 ativos do Tesouro com 1 snapshot cada) e `PREVIEW_ROWS` em `src/views/views.controller.ts`.
- [x] `TODO-21` Ajustar `ViewsController.render` para aceitar `{ rows?, extraStyles? }` e concatenar `extraStyles` em `styles`.
- [x] `TODO-22` Passar `rows` e `extraStyles: [tesouroDiretoTable.style]` apenas em `index()`; manter `rendasFixas()` e `acoes()` inalterados.

### Step 5: Testes da view e do mapper

- [x] `TODO-23` Adicionar em `src/views/views.test.ts` o teste dos 7 headers na ordem exata.
- [x] `TODO-24` Adicionar teste de uma linha por preview com valores formatados (nome, código, tipo, indexador, montante, rentabilidade, expiração).
- [x] `TODO-25` Adicionar teste do menu com 4 itens por linha e `aria-label` do `<summary>`.
- [x] `TODO-26` Adicionar teste do link do CSS do componente no HTML e da ausência da tabela em `/rendas-fixas` e `/acoes`.
- [x] `TODO-27` Adicionar testes de `toTesouroDiretoTableRow` (rótulos, `—` sem snapshot/expiração/indexer, tendência `up`/`down`/`neutral`).
- [x] `TODO-28` Adicionar teste do estado vazio renderizando o componente isolado com `rows: []`.
- [x] `TODO-29` Rodar `bun test src/views/views.test.ts` e registrar o resultado.

### Step 6: Documentação e memória

- [x] `TODO-30` Atualizar `.agents/PROJECT.md` com `components/tesouroDiretoTable/` e o novo `src/views/types.ts`.
- [x] `TODO-31` Atualizar `.agents/ARCHITECTURE.md` (§3) se a estrutura de componentes mudar.
- [x] `TODO-32` Criar a memória `MEM-2026-028` em `.agents/memory/VIEWS_MEMORY.md` e adicionar a linha no `.agents/memory/INDEX.md`.

### Final Verification

- [x] `TODO-33` Rodar `bun test` (suíte completa) e registrar as contagens.
- [x] `TODO-34` Rodar `bunx tsc --noEmit` e confirmar 0 erros.
- [x] `TODO-35` Subir `bun run index.ts` e verificar visualmente `/tesouro-direto` (tabela populada, menu abrindo) e `/rendas-fixas` + `/acoes` sem tabela.
