# Implementation Plan: Camada de serviços (export, snapshots, ventures)

- **Plan ID**: `add-data-services-layer`
- **Status**: Done
- **Date**: 2026-10-23

## 1. Requirements & Objectives

- **Goal**: criar a camada de serviços em `src/api/services/` orientada a interfaces, com testes unitários escritos **antes** das implementações. Na fase vermelha, os testes devem falhar exclusivamente por ausência de implementação (módulos de serviço inexistentes), nunca por falta de mocks. Cobrir os serviços `export`, `snapshots` e `ventures`; `import` fica fora.
- **Scope**:
  - Interface geral `IService<TInput, TOutput>` com `execute`, implementada por todos os serviços.
  - Um arquivo `<serviço>.types.ts` por serviço com inputs, outputs, _ports_ de dependência e uniões discriminadas de ação.
  - Serviços como classes com dependências injetadas no construtor (objeto de dependências).
  - Testes `*.test.ts` ao lado do serviço, com fakes em memória dos _ports_ (sem banco).
  - Conversão `Date` ↔ string (`YYYY-MM-DD`/ISO) e centavos → reais no payload de exportação.
  - Regras de validação de venture: as 3 anotadas no WIP `validateVentures.ts` + campos obrigatórios por categoria.
  - Reutilização entre serviços: `export` consome `ventures` e `snapshots` por interfaces estreitas, não os repositórios.
  - Barrels, documentação e memória.
- **Out of Scope**:
  - Serviço `import` (nenhum arquivo novo).
  - Controllers, rotas, `index.ts`, UI e chamadas HTTP.
  - Alteração de schema, migrações ou contratos de `contracts/`.
  - Alteração de assinaturas dos repositórios (apenas compatibilidade estrutural com os _ports_).
  - Serviço de resumo de carteira isolado (o resumo é calculado dentro do `export`).

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/api/services/services.types.ts` (Create) — contrato geral.
  - `src/api/services/mappers.ts` (Create) — conversões de data e moeda.
  - `src/api/services/index.ts` (Create) — barrel.
  - `src/api/services/export/export.types.ts` (Create)
  - `src/api/services/export/export.test.ts` (Create — fase vermelha)
  - `src/api/services/export/export.service.ts` (Create — fase verde)
  - `src/api/services/snapshots/snapshots.types.ts` (Create)
  - `src/api/services/snapshots/snapshots.test.ts` (Create — fase vermelha)
  - `src/api/services/snapshots/snapshots.service.ts` (Create — fase verde)
  - `src/api/services/ventures/ventures.types.ts` (Create)
  - `src/api/services/ventures/ventures.test.ts` (Create — fase vermelha)
  - `src/api/services/ventures/ventures.service.ts` (Create — fase verde)
  - `src/api/services/ventures/validateVentures.ts` (Modify — implementar as regras; WIP autorizado)
  - `src/views/views.test.ts` (Read — regressão)
- **Contexto lido**: `contracts/*`, `database/models/*`, `src/configs/database/index.ts`, `src/repositories/*`, `src/errors/*`, `src/api/services/ventures/validateVentures.ts` (WIP não rastreado).
- **Dependencies Required**: nenhuma nova biblioteca.
- **Fatos que condicionam o desenho**:
  - Dinheiro no banco em **centavos** (`INTEGER`); datas de calendário em `TEXT YYYY-MM-DD`; auditoria em ISO8601.
  - Repositórios são objetos de módulo; os _ports_ serão interfaces estruturais e os objetos reais passam a satisfazê-las sem alteração.
  - `ApiError` disponível em `src/errors/ApiError.ts` (barrel `src/errors/index.ts` está vazio).
  - Suíte atual: `bun test` → 6 pass / 0 fail.
  - `src/api/services/ventures/validateVentures.ts` é WIP do desenvolvedor e foi autorizado a ser substituído pela implementação.
  - Imports via alias `@/...` e `import type` por causa de `verbatimModuleSyntax`.

## 3. Architectural Options & Decision

### Option A: classes + injeção de dependências + _ports_ + `execute` discriminado (escolhida)

- **Pros**: testável sem banco; serviços implementam `IService`; dependências explícitas; ações múltiplas convivem na interface geral via união discriminada; repositórios reais satisfazem os _ports_ por estrutura; `export` reutiliza `ventures`/`snapshots`.
- **Cons**: mais tipagem (uniões de input/output); `execute` precisa de `switch`.

### Option B: funções de módulo recebendo dependências por parâmetro

- **Pros**: menos cerimônia; alinhado ao estilo de `src/repositories`.
- **Cons**: não implementa uma interface de instância com `execute`; composição/teste menos explícita.

### Option C: serviços importando os repositórios diretamente

- **Pros**: implementação mais curta.
- **Cons**: testes dependeriam do banco real; contraria o requisito de testes sem mocks ausentes.

> **Decision**: **Opção A**. O desenvolvedor confirmou classes com injeção, `execute` obrigatório, _ports_ nos `.types.ts`, testes sem banco e fase vermelha por ausência de implementação. `export` reutiliza os serviços de `ventures` e `snapshots` por interfaces estreitas.

### Contratos propostos (rascunho)

```ts
// src/api/services/services.types.ts
export interface IService<TInput, TOutput> {
  execute(input: TInput): TOutput | Promise<TOutput>;
}

// src/api/services/mappers.ts
export const toDateOnly = (date: Date): string; // "YYYY-MM-DD" (UTC)
export const toDate = (value: string): Date;
export const centsToReais = (value: number): number; // value / 100
```

- **Dinheiro**: centavos nas interfaces de serviço; o payload do `export` converte para reais.
- **Datas**: `Date` nas interfaces; conversão para `YYYY-MM-DD`/ISO na borda com o repositório.
- **Identificadores/auditoria**: delegados ao repositório/DB; serviços não geram `id`/`createdAt`/`updatedAt`.
- **Erros**: `ApiError` — `400` para entrada estruturalmente inválida (ex.: `Date` inválida), `404` para registro inexistente, `422` para violação de regra de negócio. Validações carregam `details: { field, rule }`.
- **Dependências**:
  - `VenturesService`: `{ venturesRepository: IVenturesRepository }`.
  - `SnapshotsService`: `{ venturesRepository: IVenturesRepository; snapshotsRepository: IVentureSnapshotsRepository }`.
  - `ExportService`: `{ venturesService: IVenturesReader; snapshotsService: ISnapshotsReader }` (interfaces estreitas definidas em `export.types.ts`).
- **Ações de `execute`**:
  - `ventures`: `validate | create | update | get | getAll | softDelete`.
  - `snapshots`: `save | update | softDelete | get | getAll | tracking`.
  - `export`: `download`.

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Contratos e tipos**: criar `services.types.ts`, `mappers.ts`, os três `*.types.ts` e o barrel exportando apenas tipos.
  - _Ports_ (`ventures.types.ts` / `snapshots.types.ts`): subconjunto de `get`/`getAll`/`post`/`patch`/`softDelete` com os tipos inferidos (`Select*`/`Insert*`).
  - `VentureInput`: formato único com campos de especialização opcionais (`indexer`, `rate`, `source`, `quantity`, `unitPrice`, `totalPrice`); `UpdateVentureInput = Partial<VentureInput>`.
  - `SnapshotInput`: `ventureId`, `referenceDate: Date`, `type`, `currentUnitPrice?`, `currentQuantityHeld?`, `currentTotalValue?`, `movementValue?`, `notes?`; `UpdateSnapshotInput` restrito a `referenceDate`, `currentUnitPrice`, `currentQuantityHeld`, `currentTotalValue`, `notes`.
  - Interfaces estreitas do `export`: `IVenturesReader { getAll(): Venture[] }` e `ISnapshotsReader { getAll(): IVentureSnapshot[]; tracking(ventureId: string): IVentureTracking }`.
- [x] **Step 2 — Testes (fase vermelha)**: criar `ventures.test.ts`, `snapshots.test.ts` e `export.test.ts` com fakes em memória. Rodar `bun test` e registrar a falha por módulos `*.service` inexistentes. **Gate de aprovação da Fase 2 do `DEFAULT_EXECUTE` dispensado pelo desenvolvedor**: após registrar o vermelho, seguir direto para o Step 3.
- [x] **Step 3 — Implementação (fase verde)**:
  - `validateVentures.ts`: `initialValue >= 0`; `boughtAt` não futuro; `STOCK` sem `expiresIn`; `FIXED` exige `indexer`/`rate`/`source`; `VARIABLE` exige `quantity`/`unitPrice`/`totalPrice` (violações → `ApiError 422`).
  - `ventures.service.ts`: `validate`, `create`, `update`, `get`, `getAll`, `softDelete` + `execute`; conversão de datas; `404` em leitura/atualização/exclusão inexistente; `update` carrega o registro, mescla e valida o resultado antes do `patch`.
  - `snapshots.service.ts`: `save`, `update`, `softDelete`, `get`, `getAll`, `tracking` + `execute`.
    - `save`: venture inexistente → `404`; `movementValue` obrigatório e `> 0` em `CONTRIBUTION`/`WITHDRAWAL` (`422`); resgate não pode exceder o total aportado (`422`).
    - **Base do total aportado**: `previous?.totalContributed ?? venture.initialValue`; movimento soma (`CONTRIBUTION`) ou subtrai (`WITHDRAWAL`).
    - **Valor atual**: `input.currentTotalValue ?? round(currentUnitPrice * currentQuantityHeld) ?? previous?.currentTotalValue ?? venture.initialValue`.
    - Derivados: `grossProfit = currentTotalValue - totalContributed`; `profitPercentage = totalContributed > 0 ? grossProfit / totalContributed * 100 : 0`.
    - `update`: recalcula derivados com precedência `patch.currentTotalValue ?? (patch.currentUnitPrice & patch.currentQuantityHeld) ?? valor atual existente`; `type`/`movementValue` no patch → `400`.
    - `tracking`: snapshots ordenados por `referenceDate` e, em empate, `createdAt`; `latestValue`/`totalProfitabilityPercentage` do último (ou `0` sem snapshots).
  - `export.service.ts`: `execute({ action: "download" })` retorna `Response` 200 com `ApiHeadersInit` + `Content-Disposition: attachment; filename="finances-export-<YYYY-MM-DD>.json"`, contendo `exportedAt`, `ventures`, `snapshots`, `tracking` e `summary`; valores monetários em reais; `IPortfolioSummary` calculado a partir do último snapshot de cada venture.
  - Atualizar o barrel `src/api/services/index.ts` com as classes. Imports entre serviços por caminho direto (nunca pelo barrel) para evitar ciclos.
- [x] **Step 4 — Documentação e memória**: atualizar `PROJECT.md`, `ARCHITECTURE.md`, criar `SERVICES_MEMORY.md` + `INDEX.md` e o registro de execução.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - Fase vermelha: `bun test src/api/services/ventures/ventures.test.ts`, `bun test src/api/services/snapshots/snapshots.test.ts`, `bun test src/api/services/export/export.test.ts` → falha esperada por `Cannot find module './<serviço>.service'`.
  - Fase verde: os mesmos comandos → 100% pass; depois `bun test` (regressão) e `bunx tsc --noEmit`.
- **Casos de teste previstos**:
  - `ventures.test.ts`: FIXED válida; VARIABLE válida; `initialValue` negativo (`422`); `boughtAt` futuro (`422`); `STOCK` com `expiresIn` (`422`); FIXED sem `indexer`/`rate`/`source` (`422`); VARIABLE sem `quantity`/`unitPrice`/`totalPrice` (`422`); `create` converte datas e delega ao `post`; `create` inválido não persiste; `update` 404 / mescla + valida + `patch`; `update` preserva campos não enviados; `get`/`softDelete` 404; `getAll` mapeia e especializa por categoria; `execute` despacha todas as ações.
  - `snapshots.test.ts`: primeiro `MONTHLY_RECORD` parte de `venture.initialValue`; `CONTRIBUTION` soma `movementValue`; `WITHDRAWAL` subtrai; `movementValue` ausente/`<= 0` (`422`); resgate acima do aportado (`422`); venture inexistente (`404`); `currentTotalValue` explícito; derivado de `unitPrice * quantity` (com arredondamento); herança do snapshot anterior; fallback para `initialValue`; `profitPercentage` zero sem aporte; `update` recalcula derivados, rejeita `type`/`movementValue` (`400`), 404; `softDelete`/`get` 404; `getAll`; `tracking` ordena, empata por `createdAt` e calcula `latestValue`/`totalProfitabilityPercentage`; `execute` despacha.
  - `export.test.ts`: `Response` 200 com `application/json` e `Content-Disposition` com nome datado; corpo com `exportedAt`/`ventures`/`snapshots`/`tracking`/`summary`; centavos → reais em todos os campos monetários; datas ISO; sem dados → arrays vazios e resumo zerado; `fixedIncomeTotal`/`variableIncomeTotal` por categoria; usa os _ports_ de `ventures`/`snapshots` (fakes) e não repositórios.
- **Edge cases to verify**:
  - `totalContributed = 0` (rentabilidade `0`, sem divisão por zero).
  - `unitPrice * quantity` com arredondamento para centavos (`Math.round`).
  - Snapshot mais recente por `referenceDate` e, em empate, `createdAt`.
  - Datas de calendário sem deslocamento de fuso (convenção UTC em `mappers.ts`).
  - `update` de venture que altera `category` e torna campos de especialização inválidos → `422`.
  - Fakes cobrindo **todas** as dependências: nenhuma falha por mock ausente.
- **Nota**: durante a fase vermelha, `bunx tsc --noEmit` também falhará pelos módulos `*.service` ausentes; a verificação de tipos só é exigida na fase verde.

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - 2026-10-23 — Respostas literais do desenvolvedor:
    > 1. Isso, pode manter no plural, conforme padrão
    > 2. Pode seguir
    > 3. nome/execute; Sim, todos os serviços devem implementar.
    > 4. Deixar os módulos de implementação inexistentes
    > 5. Sim
    > 6. Pode escrever direto e verificar via bun test.
    > 7. Será em centavos e haverá sim conversão
    > 8. Date como no contrato e sim, deve haver conversão de Date para string para salvar no banco como ISO.
    > 9. Delega ao repositório. Pode ser
    > 10. Usar ApiError. 400, 404, 422.
    > 11. Retorna tudo; Retorna response pronta
    > 12. Sim, o serviço calcula; Sim, payload do cliente me último snapshot; movementValue é sim required; Sim, adicione consulta e tracking.
    > 13. inclua get/getAll/softDelete; Sim, pode adicionar essas regras para o FIXED e VARIABLE; Pode sim.
    > 14. Sim
    > 15. Sim, estão fora por enquanto.
  - 2026-10-23 — Revisão do plano confirmada pelo desenvolvedor:
    > 1. Eu confirmo que pode adicionar também.
    > 2. Sim
    > 3. Sim
    > 4. Sim
    > 5. Sim
    >
    > Pode revisar o plano e analisar se o plano precisa ser modificado
  - 2026-10-23 — Ajustes aplicados nesta revisão: dependência de `IVenturesReader` no `SnapshotsService`; base do `totalContributed` no `initialValue`; `ExportService` reutiliza `ventures`/`snapshots` por interfaces estreitas; dispensa registrada do gate da Fase 2; precedência de recálculo no `update` de snapshot; `details` nos `ApiError`; casos de teste e TODO atualizados.
  - 2026-10-23 — Plano aprovado pelo desenvolvedor: "Tudo certo, pode iniciar a execução!". Execução concluída em `add-data-services-layer-execution.md`.

## 7. TODO List (Execution Checklist)

> Obrigatório (Fase 5). Cada item é atômico, verificável e rastreável ao passo da Seção 4.

### Step 1: Contratos e tipos

- [x] `TODO-01` Criar `src/api/services/services.types.ts` com `IService<TInput, TOutput>` e `execute`.
- [x] `TODO-02` Criar `src/api/services/mappers.ts` com `toDateOnly`, `toDate` e `centsToReais`.
- [x] `TODO-03` Criar `src/api/services/ventures/ventures.types.ts` com `IVenturesRepository`, `VentureInput`, `UpdateVentureInput`, ações e saídas.
- [x] `TODO-04` Criar `src/api/services/snapshots/snapshots.types.ts` com `IVenturesRepository` + `IVentureSnapshotsRepository`, `SnapshotInput`, `UpdateSnapshotInput`, ações e saídas.
- [x] `TODO-05` Criar `src/api/services/export/export.types.ts` com `IVenturesReader`, `ISnapshotsReader`, `ExportPayload` e ação `download`.
- [x] `TODO-06` Criar `src/api/services/index.ts` reexportando apenas os tipos.

### Step 2: Testes (fase vermelha)

- [x] `TODO-07` Criar `src/api/services/ventures/ventures.test.ts` com fakes e todos os casos de validação/CRUD.
- [x] `TODO-08` Criar `src/api/services/snapshots/snapshots.test.ts` com fakes e todos os casos de cálculo/CRUD/tracking.
- [x] `TODO-09` Criar `src/api/services/export/export.test.ts` com fakes dos readers e casos de payload/Response.
- [x] `TODO-10` Rodar `bun test` e registrar a falha por ausência dos módulos `*.service`.

### Step 3: Implementação (fase verde)

- [x] `TODO-11` Implementar as regras em `src/api/services/ventures/validateVentures.ts`.
- [x] `TODO-12` Implementar `src/api/services/ventures/ventures.service.ts` (`validate`, `create`, `update`, `get`, `getAll`, `softDelete`, `execute`).
- [x] `TODO-13` Implementar `src/api/services/snapshots/snapshots.service.ts` (`save`, `update`, `softDelete`, `get`, `getAll`, `tracking`, `execute`), incluindo a base em `venture.initialValue`.
- [x] `TODO-14` Implementar `src/api/services/export/export.service.ts` reutilizando os readers, com `Response` de download e `summary`.
- [x] `TODO-15` Atualizar `src/api/services/index.ts` com as três classes.
- [x] `TODO-16` Rodar `bun test` e atingir a fase verde.
- [x] `TODO-17` Rodar `bunx tsc --noEmit` e corrigir desvios de tipo.

### Final Verification

- [x] `TODO-18` Rodar `bun test` (suíte completa) e registrar as contagens.
- [x] `TODO-19` Atualizar `PROJECT.md` com a camada de serviços e seus arquivos.
- [x] `TODO-20` Atualizar `ARCHITECTURE.md` com a responsabilidade de `src/api/services/`.
- [x] `TODO-21` Registrar `MEM-2026-026` (contrato geral dos serviços) e `MEM-2026-027` (decisões/testes first) em `SERVICES_MEMORY.md` + `INDEX.md`.
- [x] `TODO-22` Criar o registro de execução em `.agents/plans/` correspondente.
