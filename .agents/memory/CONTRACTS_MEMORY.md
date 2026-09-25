# Memória — Contratos de Domínio

Este documento é a referência persistente de memória do domínio de contratos (`contracts/`) do projeto Finances Dashboard.
ID nova: siga a sequência global do `INDEX.md` (formato `MEM-<AAAA>-<NNN>`).

---

## Índice de Consulta

| #   | ID           | Memória                                           | Tipo      | Status | Atualizada em |
| --- | ------------ | ------------------------------------------------- | --------- | ------ | ------------- |
| 1   | MEM-2026-001 | Enums e tipos básicos do domínio                  | Contrato  | Ativa  | 2026-09-24    |
| 2   | MEM-2026-002 | Contrato base de ativos (`IVenture`)              | Interface | Ativa  | 2026-09-24    |
| 3   | MEM-2026-003 | Renda fixa (`IFixedIncomeVenture`)                | Interface | Ativa  | 2026-09-24    |
| 4   | MEM-2026-004 | Renda variável (`IVariableIncomeVenture`)         | Interface | Ativa  | 2026-09-24    |
| 5   | MEM-2026-005 | Snapshots e histórico (`IVentureSnapshot`)        | Interface | Ativa  | 2026-09-24    |
| 6   | MEM-2026-006 | Rastreamento consolidado (`IVentureTracking`)     | Interface | Ativa  | 2026-09-24    |
| 7   | MEM-2026-007 | Sumário da carteira (`IPortfolioSummary`)         | Interface | Ativa  | 2026-09-24    |
| 8   | MEM-2026-008 | Enums como objeto `as const` (não `enum` do TS)   | Decisão   | Ativa  | 2026-09-24    |
| 9   | MEM-2026-009 | Barrel `contracts/index.ts` e alias `@/contracts` | Fato      | Ativa  | 2026-09-24    |

---

## MEM-2026-001 — Enums e tipos básicos do domínio {#mem-2026-001}

- **Tipo**: Contrato
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `contratos`, `enums`, `dominio`
- **Fonte**: `contracts/enums.ts`

### Descrição

Define os domínios e categorias usados para classificar investimentos e snapshots. Cada enum é exportado como valor (`as const`) e como tipo derivado de mesmo nome — ver `#mem-2026-008`.

### Detalhes

- **`VentureCategory`**: `FIXED` | `VARIABLE`
  - Classifica se o investimento é de Renda Fixa ou Renda Variável.
- **`VentureType`**: `TREASURY` | `CDB` | `LCI` | `LCA` | `STOCK` | `FII`
  - Especifica o tipo detalhado do ativo financeiro.
- **`IndexerType`**: `CDI` | `IPCA` | `SELIC` | `PRE` | `FIXED`
  - Indicador de rentabilidade para a renda fixa.
- **`SnapshotType`**: `MONTHLY_RECORD` | `CONTRIBUTION` | `WITHDRAWAL`
  - Tipo de evento/registro no histórico temporal do investimento.
- Uso: `VentureCategory.FIXED` (valor em runtime) ou `category: VentureCategory` (tipo).

### Referências

- `contracts/enums.ts`
- `#mem-2026-008`

---

## MEM-2026-002 — Contrato base de ativos (`IVenture`) {#mem-2026-002}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `contratos`, `venture`, `base`
- **Fonte**: `contracts/ventures.ts`

### Descrição

Interface base que representa qualquer investimento/ativo cadastrado; é estendida pelas especializações de renda fixa e variável.

### Detalhes

- `id`: `string` - Identificador único.
- `name`: `string` - Nome descritivo do ativo.
- `internalCode`?: `string` - Código de negociação/ticker (ex: `"PETR4"`, `"BBDC4"`).
- `category`: `VentureCategory` - Categoria (`FIXED` ou `VARIABLE`).
- `type`: `VentureType` - Tipo do ativo.
- `initialValue`: `number` - Valor inicial investido.
- `boughtAt`: `Date` - Data da compra/início.
- `expiresIn`?: `Date` - Data de vencimento (comum em renda fixa).
- `createdAt`: `Date` - Data de criação do registro.
- `updatedAt`: `Date` - Data da última atualização.

### Referências

- `contracts/ventures.ts`
- `#mem-2026-001`, `#mem-2026-003`, `#mem-2026-004`

---

## MEM-2026-003 — Renda fixa (`IFixedIncomeVenture`) {#mem-2026-003}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `contratos`, `venture`, `renda-fixa`
- **Fonte**: `contracts/fixedVentures.ts`

### Descrição

Estende `IVenture` para ativos de Renda Fixa, refinando `category` para o literal `"FIXED"`.

### Detalhes

- Herda todas as propriedades de `IVenture` com `category: "FIXED"`.
- `indexer`: `IndexerType` - Indexador (ex: `CDI`, `IPCA`, etc.).
- `rate`: `number` - Taxa/percentual acordado.
- `source`: `string` - Instituição emissora ou corretora (ex: `"Banco Inter"`, `"Tesouro Direto"`).

### Referências

- `contracts/fixedVentures.ts`
- `#mem-2026-002`, `#mem-2026-006`

---

## MEM-2026-004 — Renda variável (`IVariableIncomeVenture`) {#mem-2026-004}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `contratos`, `venture`, `renda-variavel`
- **Fonte**: `contracts/variableVentures.ts`

### Descrição

Estende `IVenture` para ativos de Renda Variável, refinando `category` para o literal `"VARIABLE"`.

### Detalhes

- Herda todas as propriedades de `IVenture` com `category: "VARIABLE"`.
- `quantity`: `number` - Quantidade de cotas ou ações adquiridas inicialmente.
- `unitPrice`: `number` - Preço médio unitário na compra.
- `totalPrice`: `number` - Preço total da aquisição inicial.

### Referências

- `contracts/variableVentures.ts`
- `#mem-2026-002`, `#mem-2026-006`

---

## MEM-2026-005 — Snapshots e histórico (`IVentureSnapshot`) {#mem-2026-005}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `contratos`, `snapshot`, `historico`
- **Fonte**: `contracts/ventureSnaphots.ts`

### Descrição

Representa a evolução temporal, aportes, resgates e balanços de um investimento em uma data de referência.

### Detalhes

- `id`: `string` - Identificador do snapshot.
- `ventureId`: `string` - ID do ativo associado (`IVenture`).
- `referenceDate`: `Date` - Data de referência da apuração.
- `currentUnitPrice`?: `number` - Preço unitário/cota na data (relevante p/ Ações/FIIs).
- `currentQuantityHeld`?: `number` - Quantidade mantida na data.
- `currentTotalValue`: `number` - Valor total bruto acumulado na data.
- `totalContributed`: `number` - Soma de todos os aportes até esta data.
- `grossProfit`: `number` - Lucro/Rendimento bruto em valor (`currentTotalValue - totalContributed`).
- `profitPercentage`: `number` - Rentabilidade percentual acumulada.
- `type`: `SnapshotType` - Tipo do registro (`MONTHLY_RECORD`, `CONTRIBUTION`, `WITHDRAWAL`).
- `movementValue`?: `number` - Valor movimentado caso tenha havido aporte ou resgate no período.
- `notes`?: `string` - Anotações do usuário sobre o período.
- `createdAt`: `Date` - Data de criação do registro.

### Referências

- `contracts/ventureSnaphots.ts`
- `#mem-2026-001`, `#mem-2026-006`

---

## MEM-2026-006 — Rastreamento consolidado (`IVentureTracking`) {#mem-2026-006}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `contratos`, `tracking`, `agregado`
- **Fonte**: `contracts/ventureTracking.ts`

### Descrição

Agrega o ativo e seu histórico completo de snapshots com métricas consolidadas. É um dado **derivado** (calculado sob demanda), não persistido.

### Detalhes

- `venture`: `IVenture | IFixedIncomeVenture | IVariableIncomeVenture` - Dados do ativo.
- `snapshots`: `IVentureSnapshot[]` - Lista cronológica de snapshots.
- `latestValue`: `number` - Valor atual do investimento baseado no último snapshot.
- `totalProfitabilityPercentage`: `number` - Rentabilidade acumulada total.

### Referências

- `contracts/ventureTracking.ts`
- `#mem-2026-002`, `#mem-2026-003`, `#mem-2026-004`, `#mem-2026-005`

---

## MEM-2026-007 — Sumário da carteira (`IPortfolioSummary`) {#mem-2026-007}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `contratos`, `carteira`, `agregado`
- **Fonte**: `contracts/portfolioSummary.ts`

### Descrição

Visão agregada de toda a carteira de investimentos do usuário. Assim como `IVentureTracking`, é **derivado** (calculado sob demanda), não persistido.

### Detalhes

- `totalInvested`: `number` - Soma do valor inicial/aportado de todos os ativos.
- `currentTotalBalance`: `number` - Soma do valor atual de todos os últimos snapshots.
- `totalGrossProfit`: `number` - Lucro bruto global da carteira.
- `overallProfitabilityPercentage`: `number` - Rentabilidade percentual geral.
- `fixedIncomeTotal`: `number` - Total alocado em Renda Fixa.
- `variableIncomeTotal`: `number` - Total alocado em Renda Variável.
- `lastUpdated`: `Date` - Data da última atualização dos dados.

### Referências

- `contracts/portfolioSummary.ts`
- `#mem-2026-006`

---

## MEM-2026-008 — Enums como objeto `as const` (não `enum` do TS) {#mem-2026-008}

- **Tipo**: Decisão
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `enums`, `typescript`, `padrao`
- **Fonte**: `contracts/enums.ts`

### Descrição

Os enums do domínio são declarados como objeto `as const` com tipo derivado de mesmo nome, em vez da palavra-chave `enum` do TypeScript:

```ts
export const VentureCategory = {
  FIXED: "FIXED",
  VARIABLE: "VARIABLE",
} as const;
export type VentureCategory =
  (typeof VentureCategory)[keyof typeof VentureCategory];
```

### Detalhes

**Contexto**: `enum` do TS é nominal — `"FIXED"` não é atribuível a `VentureCategory`.

**Motivo da escolha** (não reabrir sem motivo forte):

- Preserva os refinamentos por literal nos contratos (`IFixedIncomeVenture.category = "FIXED"`, `IVariableIncomeVenture.category = "VARIABLE"`).
- Dados vindos do SQLite/JSON são `string` puros; comparações como `venture.category === "FIXED"` e atribuições diretas continuam válidas, sem casts.
- `enum` não é _erasable syntax_ (gera IIFE; bloqueado por `erasableSyntaxOnly`) e `const enum` é incompatível com `verbatimModuleSyntax`, já habilitado no `tsconfig.json`.
- Mantém a ergonomia de enum: `VentureCategory.FIXED`, iteração e autocomplete.

**Consequência**: o schema Drizzle importa os enums de `@/contracts` e deriva os tuples das colunas a partir dos seus membros (ver memória da camada de banco).

### Referências

- `contracts/enums.ts`
- `#mem-2026-001`, `#mem-2026-009`

---

## MEM-2026-009 — Barrel `contracts/index.ts` e alias `@/contracts` {#mem-2026-009}

- **Tipo**: Fato
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `contratos`, `imports`, `alias`
- **Fonte**: `contracts/index.ts`, `tsconfig.json`

### Descrição

`contracts/index.ts` re-exporta todos os contratos do domínio (`enums`, `ventures`, `fixedVentures`, `variableVentures`, `ventureSnaphots`, `ventureTracking`, `portfolioSummary`), servindo de ponto único de importação.

### Detalhes

- Os contratos ficam na raiz em `contracts/` (não em `src/contracts/`).
- Alias de importação configurado no `tsconfig.json`: `"@/*": ["./*"]` — ex.: `import { IVenture } from "@/contracts"`.
- O alias é resolvido tanto pelo Bun (runtime) quanto pelo `tsc`/`drizzle-kit`.
- Em `database/models`, imports de valor (ex.: `VentureCategory`) e de tipo usam o mesmo caminho `@/contracts`.

### Referências

- `contracts/index.ts`, `tsconfig.json`
- `#mem-2026-001`, `#mem-2026-008`
