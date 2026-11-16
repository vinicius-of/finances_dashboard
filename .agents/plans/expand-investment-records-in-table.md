# Implementation Plan: Expansion of investment records inside the table

- **Plan ID**: `expand-investment-records-in-table`
- **Status**: Done
- **Date**: 2026-11-12

> Título em inglês seguindo o padrão dos demais planos; textos da UI permanecem em PT-BR.

## 1. Requirements & Objectives

- **Goal**: Adicionar uma primeira coluna com botão de seta que expande, abaixo da linha do investimento, a lista de snapshots (registros) interligados, exibindo data do registro, valor adicionado/removido e nota (máx. 3 linhas).
- **Scope (in)**:
  - Nova coluna (primeira) com cabeçalho **sem texto visível** (label acessível) e botão de seta por linha.
  - Linha extra (`<tr>`) oculta por padrão, com `<td colspan="8">`, contendo a lista de registros.
  - Tipo de view `ITesouroDiretoRecordRow` e extensão de `ITesouroDiretoTableRow` com `records`.
  - Mapper `toTesouroDiretoRecordRows` (data `dd/mm/aaaa`, movimento com sinal, nota, ordem decrescente).
  - Toggle cliente com `aria-expanded` + `hidden` (script escopado, sem framework).
  - CSS: alinhamento à esquerda, `gap` pequeno, clamp de 3 linhas na nota.
  - Teste unitário do mapper de registros (função pura, sem DOM).
  - Atualização de documentação/memória.
- **Out of Scope**:
  - Ações de registrar/guardar/sacar (o botão de opções continua inerte).
  - Histórico paginado, edição ou exclusão de registros.
  - Alterações em serviços (o `PortfolioService` já entrega `snapshots`).
  - Testes de DOM/JS e testes de view.
  - Coluna de rentabilidade por registro.
- **Decisões confirmadas pelo desenvolvedor**:
  | Tema                      | Decisão                                                                                                               |
  | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
  | Valor adicionado/removido | **`movementValue`** com sinal (`+` para `CONTRIBUTION`, `-` para `WITHDRAWAL`, `—` em `MONTHLY_RECORD`/sem movimento) |
  | Data exibida              | `snapshot.referenceDate` (data do registro)                                                                           |
  | Ordem                     | Mais recente primeiro (desc)                                                                                          |
  | Expansão                  | JS de toggle com `aria-expanded` e `hidden`                                                                           |
  | Sem registros             | Botão `disabled`; se aberto, “Nenhum registro.”                                                                       |
  | Nota                      | `—` quando vazia; clamp de 3 linhas + `title` com o texto completo                                                    |
  | Testes                    | Teste unitário do mapper de registros                                                                                 |

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/views/types.ts` (**Modify** — `ITesouroDiretoRecordRow`; `records` em `ITesouroDiretoTableRow`).
  - `src/views/components/tesouroDiretoTable/records.ts` (**Create** — `toTesouroDiretoRecordRows`).
  - `src/views/components/tesouroDiretoTable/records.test.ts` (**Create**).
  - `src/views/components/tesouroDiretoTable/index.ts` (**Modify** — usar o mapper de registros).
  - `src/views/components/tesouroDiretoTable/view.eta` (**Modify** — nova coluna, botão, linha de registros, `colspan="8"`, script).
  - `src/views/components/tesouroDiretoTable/styles.css` (**Modify** — botão/seta, lista, clamp).
  - `src/views/components/tesouroDiretoTable/records.js` (**Create** — toggle).
  - `src/utils/staticAssets.ts` (**Modify** — rota do `records.js`).
  - `.agents/PROJECT.md`, `.agents/memory/VIEWS_MEMORY.md`, `.agents/memory/INDEX.md` (**Modify**).
  - `.agents/plans/expand-investment-records-in-table.md` (este plano).
- **Dependencies Required**: **nenhuma nova**.
- **Contexto relevante**:
  - `IVentureTracking.snapshots` já está disponível no `PortfolioService`; o mapper atual (`toTesouroDiretoTableRow`) descarta os snapshots.
  - Dados reais: 7 snapshots TREASURY, todos `MONTHLY_RECORD`, `movement_value = NULL`; apenas 1 com nota. A coluna de movimento ficará `—` até existirem aportes/resgates.
  - A tabela tem 7 colunas e `colspan="7"` no estado vazio; passa a 8.
  - Não há `src/views/views.test.ts`; a cobertura de view foi removida por decisão anterior. O novo teste será do mapper puro.
  - Já existe precedente de script escopado (`menu.js` + rota em `staticAssetRoutes` + `<script defer>` no componente).
  - `formatDate` usa componentes UTC (evita deslocar o dia); `formatMoneyToBRL` recebe centavos e normaliza o espaço.
  - Snapshot com `movementValue` mas tipo `MONTHLY_RECORD` deve exibir `—` (o valor só conta em `CONTRIBUTION`/`WITHDRAWAL`).

## 3. Architectural Options & Decision

### Opção A: Mapper de registros dedicado + JS toggle (escolhida)

- **Pros**: mantém a linha da tabela apresentacional (strings prontas); testável sem DOM; toggle instantâneo com `aria-expanded`/`hidden`; CSS controla clamp e alinhamento.
- **Cons**: exige um segundo script escopado; sem JS o botão não abre (progressive enhancement limitado).

### Opção B: Expandir via SSR (`?registros=<id>`)

- **Pros**: funciona sem JS; testável no controller.
- **Cons**: recarrega a página, perde scroll e exige preservar todo o estado da toolbar na URL; interação pior para um detalhe de linha.

### Opção C: Renderizar a lista sempre visível

- **Pros**: sem JS.
- **Cons**: não atende “abrir/fechar”; polui a tabela.

> **Decision**: **Opção A**.

### Regras do mapper

- Ordenar uma cópia dos snapshots por `referenceDate` **desc**; empate → `createdAt` desc.
- `dateLabel` = `formatDate(referenceDate)`.
- `movementLabel`:
  - `CONTRIBUTION` + `movementValue` → `+ ${formatMoneyToBRL(Math.abs(value))}`;
  - `WITHDRAWAL` + `movementValue` → `- ${formatMoneyToBRL(Math.abs(value))}`;
  - demais casos (inclui `MONTHLY_RECORD`, valor ausente) → `—`.
- `notes` = `snapshot.notes` (undefined quando ausente; template exibe `—` e só adiciona `title` quando houver texto).

### Markup previsto

```html
<th scope="col" class="venture-table__expand-header">
  <span class="visually-hidden">Registros</span>
</th>

<tr>
  <td class="venture-table__expand-cell">
    <button
      type="button"
      class="venture-table__expand"
      aria-expanded="false"
      aria-controls="records-<id>"
      aria-label="Registros de <nome>"
      [disabled]
    >
      <i class="bi bi-chevron-right" aria-hidden="true"></i>
    </button>
  </td>
  ...
</tr>
<tr class="venture-table__records-row" id="records-<id>" hidden>
  <td colspan="8" class="venture-table__records-cell">
    <ul class="venture-table__records list-unstyled mb-0">
      <li class="venture-table__record">
        <span class="venture-table__record-date">09/09/2026</span>
        <span class="venture-table__record-movement">—</span>
        <span class="venture-table__record-notes" title="...">...</span>
      </li>
    </ul>
  </td>
</tr>
```

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Tipos e mapper de registros**:
  - Em `src/views/types.ts`, criar `ITesouroDiretoRecordRow` (`dateLabel`, `movementLabel`, `notes?`) e adicionar `records: ITesouroDiretoRecordRow[]` em `ITesouroDiretoTableRow`.
  - Criar `records.ts` com `toTesouroDiretoRecordRows(snapshots)`: ordena desc (`referenceDate`, depois `createdAt`), formata data e movimento, preserva nota.
  - Atualizar `toTesouroDiretoTableRow` para incluir `records: toTesouroDiretoRecordRows(tracking.snapshots)`.

- [x] **Step 2 — Testes do mapper**:
  - `records.test.ts` com fixtures de snapshots: data formatada; `+`/`-` e `—`; nota preservada/ausente; ordem desc com desempate; lista vazia.
  - Sem DOM, sem banco.

- [x] **Step 3 — Template e estilos**:
  - `view.eta`: nova primeira coluna no `<thead>` (label acessível), botão de seta por linha (`disabled` sem registros), linha de registros com `colspan="8"` e lista; estado vazio da tabela para `colspan="8"`; `<script defer src=".../records.js">`.
  - `styles.css`: célula/botão da seta, rotação em `[aria-expanded="true"]`, linha de registros destacada, lista em coluna, itens em flex com `gap: 0.5rem`, nota com `line-clamp: 3` e `overflow: hidden`, `—` para vazio.

- [x] **Step 4 — Script de toggle e assets**:
  - Criar `records.js` idempotente: delegação de `click`, alterna `aria-expanded`, classe `--open` e `hidden` da linha controlada por `aria-controls`.
  - Registrar `/views/components/tesouroDiretoTable/records.js` em `staticAssetRoutes`.

- [x] **Step 5 — Documentação, memória e verificação**:
  - Atualizar `.agents/PROJECT.md` e registrar `MEM-2026-032` em `VIEWS_MEMORY.md` + `INDEX.md`.
  - Rodar testes, `tsc`, smoke da página e do asset; criar registro de execução.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bun test src/views/components/tesouroDiretoTable/records.test.ts`
  - `bun test`
  - `bunx tsc --noEmit`
  - Smoke: `/tesouro-direto`, `/views/components/tesouroDiretoTable/records.js`, `?search=2031`, `?sort=amount`.
- **Edge cases to verify**:
  - 8 headers; primeiro sem texto visível (contém “Registros” em `visually-hidden`).
  - 2 botões de expansão habilitados (as 2 linhas têm registros).
  - Lista de 2027 com 4 registros e 2031 com 3, em ordem desc: `09/09/2026`, `09/07/2026`, `02/03/2026`, `08/01/2026`.
  - Movimento `—` em todos (dados atuais); nota da 2031 (`revisar: valor fora da série histórica`) com `title`.
  - Nota longa limitada a 3 linhas visualmente (CSS), sem truncar o conteúdo HTML.
  - Investimento sem snapshots: botão `disabled`; lista com “Nenhum registro.”.
  - `WITHDRAWAL` → `- R$ …`; `CONTRIBUTION` → `+ R$ …`; `MONTHLY_RECORD` com `movementValue` → `—`.
  - Registros sobrevivem a filtro/busca/ordenação (linha acompanha o investimento).
  - Estado vazio da tabela usa `colspan="8"`.
  - `records.js` responde 200 com `text/javascript`; sem erros de importação.
  - Nenhum registro de HTML quebrado (linha extra dentro de `<tbody>`).
  - `bun test` verde e `tsc` sem erros.

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - 2026-11-12 — Clarificações: (1) A (`movementValue` com sinal); (2) `referenceDate`; (3) mais recente primeiro; (4) `aria-expanded` + `hidden`; (5) botão `disabled` + “Nenhum registro.”; (6) `—` + clamp 3 linhas + `title`; (7) teste do mapper.
  - 2026-11-12 — Aprovação registrada: “Pode executar”. Plan ID `expand-investment-records-in-table` atribuído após verificação de unicidade.
  - 2026-11-12 — Execução: mapper `records.ts` + testes (9 casos), nova coluna/linha de registros, `records.js` e rota do asset. Suíte `85 pass / 0 fail`; `tsc` 0 erros; smoke: 8 headers, 2 botões, 7 registros em ordem desc, movimento `—`, nota com `title`, asset 200 (`text/javascript`).

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Each item must be atomic, verifiable and traceable to its source step in Section 4. This list is the single source of truth for execution progress: update it in the same iteration as any plan change.

### Step 1: Tipos e mapper de registros

- [x] `TODO-01` Criar `ITesouroDiretoRecordRow` em `src/views/types.ts`.
- [x] `TODO-02` Adicionar `records: ITesouroDiretoRecordRow[]` em `ITesouroDiretoTableRow`.
- [x] `TODO-03` Criar `src/views/components/tesouroDiretoTable/records.ts` com `toTesouroDiretoRecordRows`.
- [x] `TODO-04` Implementar ordenação desc por `referenceDate` com desempate por `createdAt`.
- [x] `TODO-05` Implementar `movementLabel` com `+`/`-`/`—` e `Math.abs`.
- [x] `TODO-06` Atualizar `toTesouroDiretoTableRow` para incluir `records`.

### Step 2: Testes do mapper

- [x] `TODO-07` Criar `records.test.ts` com fixtures de snapshots.
- [x] `TODO-08` Cobrir formatação de data `dd/mm/aaaa`.
- [x] `TODO-09` Cobrir `CONTRIBUTION` (`+`), `WITHDRAWAL` (`-`) e `MONTHLY_RECORD` (`—`).
- [x] `TODO-10` Cobrir nota presente/ausente.
- [x] `TODO-11` Cobrir ordem desc e desempate por `createdAt`.
- [x] `TODO-12` Cobrir lista vazia.
- [x] `TODO-13` Rodar `bun test src/views/components/tesouroDiretoTable/records.test.ts` e registrar.

### Step 3: Template e estilos

- [x] `TODO-14` Adicionar a primeira coluna no `<thead>` com `<span class="visually-hidden">Registros</span>`.
- [x] `TODO-15` Adicionar o botão de seta em cada linha com `aria-expanded`, `aria-controls` e `disabled` sem registros.
- [x] `TODO-16` Adicionar a `<tr>` de registros com `colspan="8"`, lista e estado “Nenhum registro.”.
- [x] `TODO-17` Trocar `colspan="7"` do estado vazio por `colspan="8"`.
- [x] `TODO-18` Incluir `<script defer src="/views/components/tesouroDiretoTable/records.js">` no componente.
- [x] `TODO-19` Estilizar botão/seta e rotação em `[aria-expanded="true"]`.
- [x] `TODO-20` Estilizar a lista (flex, `gap: 0.5rem`, alinhamento à esquerda) e o clamp de 3 linhas da nota.

### Step 4: Script de toggle e assets

- [x] `TODO-21` Criar `records.js` com guarda de idempotência e delegação de `click`.
- [x] `TODO-22` Alternar `aria-expanded`, classe `--open` e `hidden` da linha via `aria-controls`.
- [x] `TODO-23` Registrar a rota do `records.js` em `src/utils/staticAssets.ts`.

### Step 5: Documentação, memória e verificação

- [x] `TODO-24` Atualizar `.agents/PROJECT.md` com a expansão de registros e o novo script.
- [x] `TODO-25` Criar `MEM-2026-032` em `.agents/memory/VIEWS_MEMORY.md` e a linha no `INDEX.md`.
- [x] `TODO-26` Criar o registro de execução em `.agents/plans/expand-investment-records-in-table-execution.md`.

### Final Verification

- [x] `TODO-27` Rodar `bun test` e registrar as contagens.
- [x] `TODO-28` Rodar `bunx tsc --noEmit` e confirmar 0 erros.
- [x] `TODO-29` Smoke `/tesouro-direto`: 8 headers, 2 botões, 4+3 registros em ordem desc.
- [x] `TODO-30` Smoke do asset `records.js` (200, `text/javascript`).
- [x] `TODO-31` Smoke `?search=2031` e `?sort=amount` mantendo as linhas de registros.
