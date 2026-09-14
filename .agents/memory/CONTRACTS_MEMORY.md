# Compilado de Contratos (Memória)

Este documento serve como referência de memória para todos os contratos (tipos e interfaces TypeScript) definidos no diretório `src/contracts/` do **Finances Dashboard**.

---

## 1. Enuns e Tipos Básicos (`enums.ts`)

Define os domínios e categorias principais utilizados para classificar os investimentos e snapshots.

* **`VentureCategory`**: `"FIXED" | "VARIABLE"`
  * Classifica se o investimento é de Renda Fixa ou Renda Variável.
* **`VentureType`**: `"TREASURY" | "CDB" | "LCI" | "LCA" | "STOCK" | "FII"`
  * Especifica o tipo detalhado do ativo financeiro.
* **`IndexerType`**: `"CDI" | "IPCA" | "SELIC" | "PRE" | "FIXED"`
  * Indicador de rentabilidade para a renda fixa.
* **`SnapshotType`**: `"MONTHLY_RECORD" | "CONTRIBUTION" | "WITHDRAWAL"`
  * Tipo de evento/registro no histórico temporal do investimento.

---

## 2. Contrato Base de Ativos (`ventures.ts`)

* **`IVenture`**: Interface base que representa qualquer investimento/ativo cadastrado.
  * `id`: `string` - Identificador único.
  * `name`: `string` - Nome descritivo do ativo.
  * `internalCode`?: `string` - Código de negociação/ticker (ex: `"PETR4"`, `"BBDC4"`).
  * `category`: `VentureCategory` - Categoria (`FIXED` ou `VARIABLE`).
  * `type`: `VentureType` - Tipo do ativo.
  * `initialValue`: `number` - Valor inicial investido.
  * `boughtAt`: `Date` - Data da compra/início.
  * `expiresIn`?: `Date` - Data de vencimento (comum em renda fixa).
  * `createdAt`: `Date` - Data de criação do registro.
  * `updatedAt`: `Date` - Data da última atualização.

---

## 3. Renda Fixa (`fixedVentures.ts`)

* **`IFixedIncomeVenture`**: Estende `IVenture` para ativos de Renda Fixa.
  * Herda todas as propriedades de `IVenture` com `category: "FIXED"`.
  * `indexer`: `IndexerType` - Indexador (ex: `CDI`, `IPCA`, etc.).
  * `rate`: `number` - Taxa/percentual acordado.
  * `source`: `string` - Instituição emissora ou corretora (ex: `"Banco Inter"`, `"Tesouro Direto"`).

---

## 4. Renda Variável (`variableVentures.ts`)

* **`IVariableIncomeVenture`**: Estende `IVenture` para ativos de Renda Variável.
  * Herda todas as propriedades de `IVenture` com `category: "VARIABLE"`.
  * `quantity`: `number` - Quantidade de cotas ou ações adquiridas inicialmente.
  * `unitPrice`: `number` - Preço médio unitário na compra.
  * `totalPrice`: `number` - Preço total da aquisição inicial.

---

## 5. Snapshots e Histórico de Ativos (`ventureSnaphots.ts`)

* **`IVentureSnapshot`**: Representa a evolução temporal, aportes, resgates e balanços de um investimento em uma data de referência.
  * `id`: `string` - Identificador do snapshot.
  * `ventureId`: `string` - ID do ativo associado (`IVenture`).
  * `referenceDate`: `Date` - Data de referência da apuração.
  * `currentUnitPrice`?: `number` - Preço unitário/cota na data (relevante p/ Ações/FIIs).
  * `currentQuantityHeld`?: `number` - Quantidade mantida na data.
  * `currentTotalValue`: `number` - Valor total bruto acumulado na data.
  * `totalContributed`: `number` - Soma de todos os aportes até esta data.
  * `grossProfit`: `number` - Lucro/Rendimento bruto em valor (`currentTotalValue - totalContributed`).
  * `profitPercentage`: `number` - Rentabilidade percentual acumulada.
  * `type`: `SnapshotType` - Tipo do registro (`MONTHLY_RECORD`, `CONTRIBUTION`, `WITHDRAWAL`).
  * `movementValue`?: `number` - Valor movimentado caso tenha havido aporte ou resgate no período.
  * `notes`?: `string` - Anotações do usuário sobre o período.
  * `createdAt`: `Date` - Data de criação do registro.

---

## 6. Rastreamento e Visão Consolidada do Ativo (`ventureTracking.ts`)

* **`IVentureTracking`**: Agrega o ativo e seu histórico completo de snapshots com métricas consolidadas.
  * `venture`: `IVenture | IFixedIncomeVenture | IVariableIncomeVenture` - Dados do ativo.
  * `snapshots`: `IVentureSnapshot[]` - Lista cronológica de snapshots.
  * `latestValue`: `number` - Valor atual do investimento baseado no último snapshot.
  * `totalProfitabilityPercentage`: `number` - Rentabilidade acumulada total.

---

## 7. Sumário Geral da Carteira (`portfolioSummary.ts`)

* **`IPortfolioSummary`**: Visão agregada de toda a carteira de investimentos do usuário.
  * `totalInvested`: `number` - Soma do valor inicial/aportado de todos os ativos.
  * `currentTotalBalance`: `number` - Soma do valor atual de todos os últimos snapshots.
  * `totalGrossProfit`: `number` - Lucro bruto global da carteira.
  * `overallProfitabilityPercentage`: `number` - Rentabilidade percentual geral.
  * `fixedIncomeTotal`: `number` - Total alocado em Renda Fixa.
  * `variableIncomeTotal`: `number` - Total alocado em Renda Variável.
  * `lastUpdated`: `Date` - Data da última atualização dos dados.
