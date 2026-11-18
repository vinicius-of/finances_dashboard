# Memória — Serviços de Domínio

Este documento é a referência persistente de memória do domínio de serviços (`src/api/services/`) do projeto Finances Dashboard.
ID nova: siga a sequência global do `INDEX.md` (formato `MEM-<AAAA>-<NNN>`).

---

## Índice de Consulta

| #   | ID           | Memória                                                   | Tipo     | Status | Atualizada em |
| --- | ------------ | --------------------------------------------------------- | -------- | ------ | ------------- |
| 1   | MEM-2026-026 | Contrato da camada de serviços (`src/api/services`)       | Contrato | Ativa  | 2026-10-23    |
| 2   | MEM-2026-027 | Testes antes da implementação e reuso entre serviços      | Decisão  | Ativa  | 2026-10-23    |
| 3   | MEM-2026-031 | `PortfolioService` e rendering do Tesouro com dados reais | Decisão  | Ativa  | 2026-11-12    |
| 4   | MEM-2026-033 | Controller HTTP de snapshots (POST, PATCH, DELETE)        | Contrato | Ativa  | 2026-11-18    |
| 5   | MEM-2026-035 | Controller `POST /api/ventures` e criação normalizada     | Contrato | Ativa  | 2026-11-16    |

## MEM-2026-026 — Contrato da camada de serviços (`src/api/services`) {#mem-2026-026}

- **Tipo**: Contrato
- **Status**: Ativa
- **Criada em**: 2026-10-23
- **Atualizada em**: 2026-10-23
- **Tags**: `services`, `contrato`, `ports`, `di`, `api-error`
- **Fonte**: `src/api/services/services.types.ts`, `src/api/services/index.ts`, `src/api/services/mappers.ts`

### Descrição

Serviços de domínio são classes com dependências injetadas que implementam `IService<TInput, TOutput>` e expõem `execute`; cada serviço tem um `<serviço>.types.ts` com inputs, outputs, _ports_ e a união discriminada de ações.

### Detalhes

- Interface geral: `IService<TInput, TOutput> { execute(input: TInput): TOutput | Promise<TOutput> }`.
- Serviços: `VenturesService`, `SnapshotsService` e `ExportService`, reexportados por `src/api/services/index.ts`.
- _Ports_ definidos nos `.types.ts` e satisfeitos estruturalmente pelos repositórios — ex.: `IVenturesRepository` estende `IVenturesReader`; `SnapshotsService` depende apenas de `IVenturesReader`.
- `execute` recebe união discriminada (`action`): `ventures` (`validate`, `create`, `update`, `get`, `getAll`, `softDelete`), `snapshots` (`save`, `update`, `softDelete`, `get`, `getAll`, `tracking`) e `export` (`download`).
- `ExportService` depende de `IExportVenturesReader`/`IExportSnapshotsReader` (serviços, não repositórios) e retorna `Response` JSON com `Content-Disposition: attachment`.
- Dinheiro em **centavos** e datas em `Date` nas interfaces; `mappers.ts` converte para `YYYY-MM-DD`/ISO e `centsToReais` no payload de exportação.
- Erros: `ApiError` com `400` (entrada estrutural), `404` (inexistente) e `422` (regra); `details: { field, rule }` nas validações.
- Identificadores e timestamps são delegados aos repositórios/DB.

### Referências

- `src/api/services/ventures/`, `src/api/services/snapshots/`, `src/api/services/export/`
- `src/repositories/`, `contracts/`
- `#mem-2026-019`, `#mem-2026-027`
- `.agents/plans/add-data-services-layer-execution.md`

## MEM-2026-027 — Testes antes da implementação e reuso entre serviços {#mem-2026-027}

- **Tipo**: Decisão
- **Status**: Ativa
- **Criada em**: 2026-10-23
- **Atualizada em**: 2026-10-23
- **Tags**: `services`, `testes`, `red-green`, `reuso`
- **Fonte**: `src/api/services/*/*.test.ts`, `.agents/plans/add-data-services-layer.md`

### Descrição

A camada de serviços foi construída em ciclos vermelho/verde: tipos e _ports_ primeiro, testes com fakes antes das implementações, fase vermelha por ausência dos módulos `*.service` e implementação só depois.

### Detalhes

- Fase vermelha: `bun test` → **6 pass / 3 fail / 3 errors**, com `Cannot find module './<serviço>.service'`; nenhuma falha por mock ausente (todos os _ports_ têm fakes).
- Fase verde: `bun test` → **49 pass / 0 fail** (184 asserções) e `bunx tsc --noEmit` sem erros.
- Decisão de não criar stubs de implementação: a ausência do módulo é o vermelho esperado.
- Reuso: `ExportService` consome `ventures` e `snapshots` via interfaces estreitas, não os repositórios; `SnapshotsService` reutiliza `toVenture` de `ventures.service`.
- Snapshot inicial parte de `venture.initialValue`; `currentTotalValue` usa a precedência valor informado → preço × quantidade → snapshot anterior → `initialValue`.
- Gate de aprovação da Fase 2 do `DEFAULT_EXECUTE` foi dispensado pelo desenvolvedor; o vermelho foi registrado e a implementação seguiu no mesmo ciclo.

### Referências

- `.agents/plans/add-data-services-layer.md`
- `.agents/plans/add-data-services-layer-execution.md`
- `#mem-2026-026`

## MEM-2026-031 — `PortfolioService` e rendering do Tesouro com dados reais {#mem-2026-031}

- **Tipo**: Decisão
- **Status**: Ativa
- **Criada em**: 2026-11-12
- **Atualizada em**: 2026-11-12
- **Tags**: `services`, `portfolio`, `views`, `tesouro-direto`, `tracking`, `database`
- **Fonte**: `src/api/services/portfolio/`, `src/views/views.controller.ts`, `index.ts`

### Descrição

A tabela do Tesouro Direto passou a consumir dados reais do SQLite por meio de um serviço de leitura dedicado, injetado no controller de views.

### Detalhes

- `PortfolioService` (`listTracking({ type })` / `execute`) compõe `venturesService.getAll()` e `snapshotsService.tracking(id)`, filtrando por `VentureType`; mantém a ordem de `getAll`.
- Ports estreitos: `IPortfolioVenturesReader` (`getAll`), `IPortfolioSnapshotsReader` (`tracking`) e `IPortfolioTrackingReader` (`listTracking`) — permitem fakes sem banco.
- `ViewsController(eta, portfolio)` busca `listTracking({ type: TREASURY })` e mantém toolbar/ordenação (`applyToolbarState`, `toToolbarView`) e `emptyMessage`.
- Wiring em `index.ts`: repositórios → `VenturesService`/`SnapshotsService` → `PortfolioService` → `ViewsController`.
- Testes: somente `portfolio.test.ts` com fakes (6 casos). Por decisão do desenvolvedor, `src/views/views.test.ts` foi **removido** — não há mais testes de view/controller/mapper.
- Limitação: N+1 (uma leitura de snapshots por venture) — aceitável no volume atual.
- Dados reais hoje: 2 ventures TREASURY; página exibe 2027 (R$ 23.411,57 / +132,95%) e 2031 (R$ 7.612,65 / +363,60%).

### Referências

- `src/api/services/portfolio/portfolio.service.ts`, `portfolio.types.ts`, `portfolio.test.ts`
- `src/views/views.controller.ts`, `index.ts`
- `#mem-2026-026`, `#mem-2026-030`
- `.agents/plans/render-tesouro-table-from-database.md`

## MEM-2026-033 — Controller HTTP de snapshots (POST, PATCH, DELETE) {#mem-2026-033}

- **Tipo**: Contrato
- **Status**: Ativa
- **Criada em**: 2026-11-13
- **Atualizada em**: 2026-11-18
- **Tags**: `controllers`, `api`, `snapshots`, `post`, `patch`, `delete`, `soft-delete`, `validacao`, `montante`
- **Fonte**: `src/api/controllers/{snapshots.controller.ts,snapshots.controller.types.ts,snapshots.controller.test.ts}`, `src/api/services/snapshots/snapshots.service.ts`, `index.ts`

### Descrição

Criada a primeira camada de controllers HTTP do projeto: `SnapshotsController` recebe `POST`, `PATCH` e `DELETE` em `/api/snapshots`, valida o payload e delega ao `SnapshotsService`, devolvendo `201 { snapshot }` na criação e `200 { snapshot }` na atualização/exclusão.

### Detalhes

- Contrato do endpoint: `POST /api/snapshots` com `{ ventureId, type, value, referenceDate, notes? }`.
  - `value` em **centavos**, inteiro > 0; `referenceDate` no formato `YYYY-MM-DD`; `notes` opcional com até 280 caracteres.
  - Mapeamento: `MONTHLY_RECORD` → `currentTotalValue`; `CONTRIBUTION`/`WITHDRAWAL` → `movementValue` (o controller nunca envia os dois).
  - Resposta: `201 { snapshot: IVentureSnapshot }` (datas em ISO). Erros usam `ApiError.handle()` → `{ error: true, statusCode, message, details }`.
  - Validações do controller (`400`, `details: { field, rule }`): `body`/`json`, `ventureId`/`required`, `type`/`enum`, `value`/`integer_positive`, `referenceDate`/`format|date`, `notes`/`max_length`.
- Porta estreita `ISnapshotWriter { save(data: SnapshotInput): IVentureSnapshot }` — o controller recebe o `SnapshotsService` estruturalmente e é testado com stub que registra chamadas.
- `PATCH /api/snapshots` (`SnapshotsController.update`): corpo `{ ventureId, snapshotId, value, referenceDate, notes? }`; `value` (centavos) atualiza `currentTotalValue`; `type`/`movementValue` são ignorados; `notes` é sempre enviado (vazio limpa a nota); resposta `200 { snapshot }`.
- `DELETE /api/snapshots` (`SnapshotsController.remove`): corpo `{ ventureId, snapshotId }`; executa `softDelete` e responde `200 { snapshot }` (a linha permanece no banco com `deletedAt`).
- Vínculo venture↔snapshot no domínio: `SnapshotsService.update(ventureId, id, data)` e `softDelete(ventureId, id)` chamam `requireOwned` (lê o snapshot e compara `ventureId`) **antes** de qualquer escrita; snapshot inexistente ou de outra venture → `404` sem alteração.
- Falhas de `PATCH`/`DELETE` são registradas por `log.error` (`src/utils/logs.ts`) com método, status, ids, mensagem e detalhes, antes da resposta de erro; erros inesperados são logados e repropagados.
- `index.ts`: rotas `PATCH` e `DELETE` no mesmo `"/api/snapshots"` (`withRequestLog("json", ...)`).
- `ISnapshotCommands` (porta com `save`/`update`/`softDelete`) estende `ISnapshotWriter` para os testes existentes.
- Mudança de comportamento no `SnapshotsService.save`: quando `currentTotalValue` não é informado, o fallback passa a ser `(snapshot anterior ?? initialValue) + movement`. Aporte soma e resgate subtrai o montante; `grossProfit` permanece igual. Envios explícitos de `currentTotalValue` e `MONTHLY_RECORD` ficam inalterados.
- Erros do service preservados no HTTP: `404` venture inexistente, `422` `movementValue` ausente/≤ 0, resgate acima do aportado e valores negativos.
- Cobertura: 13 casos em `snapshots.controller.test.ts` (POST) + 14 casos (PATCH/DELETE) + 5 casos novos em `snapshots.test.ts` (vínculo).

### Referências

- `src/api/controllers/snapshots.controller.ts`, `snapshots.controller.types.ts`, `snapshots.controller.test.ts`
- `src/api/services/snapshots/snapshots.service.ts`, `snapshots.test.ts`
- `#mem-2026-026`, `#mem-2026-031`
- `.agents/plans/add-register-snapshot-flow.md`

## MEM-2026-035 — Controller `POST /api/ventures` e criação normalizada {#mem-2026-035}

- **Tipo**: Contrato
- **Status**: Ativa
- **Criada em**: 2026-11-16
- **Atualizada em**: 2026-11-16
- **Tags**: `controllers`, `api`, `ventures`, `post`, `validacao`, `categoria`, `unicidade`
- **Fonte**: `src/api/controllers/ventures/`, `src/api/services/ventures/`, `index.ts`

### Descrição

`VenturesController.create(req)` recebe `POST /api/ventures`, valida o payload condicional por categoria e delega ao `VenturesService`, que normaliza o input, deriva a categoria do tipo, calcula totais de renda variável e devolve `201 { venture }`.

### Detalhes

- Contrato do endpoint: `POST /api/ventures` com `{ name, internalCode?, type, boughtAt, expiresIn?, initialValue?, indexer?, rate?, source?, quantity?, unitPrice? }`.
  - `boughtAt`/`expiresIn` em `YYYY-MM-DD`; `initialValue`/`unitPrice` em **centavos**; `rate` em percentual decimal.
  - `FIXED`: exige `initialValue` inteiro ≥ 0, `indexer`, `rate` ≥ 0 e `source`; `VARIABLE`: exige `quantity` > 0 e `unitPrice` inteiro > 0; `totalPrice`/`initialValue` de variável não são aceitos do client.
  - Resposta: `201 { venture }` (datas em ISO). Erros: `400` estrutural (`details: { field, rule }`), `409` `internalCode` duplicado e `422` regras do service.
- `ICreateVentureInput` (`ventures.types.ts`) mantém `category`, `initialValue` e `totalPrice` opcionais; `resolveCategory(type)` define `STOCK`/`FII` → `VARIABLE` e o restante → `FIXED`.
- `VenturesService.create`: `normalizeVentureInput` (trim de `name`/`internalCode`/`source`, string vazia → `undefined`, categoria derivada) → `resolveVentureInput` (VARIABLE: `totalPrice = Math.round(quantity × unitPrice)` e `initialValue = totalPrice`) → `validateVentures` → `repository.post`.
- Violação do índice único parcial `ventures.internal_code` é convertida em `ApiError(409, "internalCode já cadastrado", { field: "internalCode", rule: "unique" })`; demais erros do repositório são repropagados.
- Porta estreita `IVentureWriter { create(data: ICreateVentureInput): Venture }`; `index.ts` registra `"/api/ventures": withRequestLog("json", ...)`.
- Cobertura: 23 casos em `ventures.controller.test.ts` e 12 casos novos em `ventures.test.ts`.

### Referências

- `src/api/controllers/ventures/{ventures.controller.ts,ventures.controller.types.ts,ventures.utils.ts,ventures.mappers.ts,ventures.errors.ts}`
- `src/api/services/ventures/{ventures.service.ts,ventures.types.ts,ventures.utils.ts,validateVentures.ts,ventures.errors.ts}`
- `#mem-2026-026`, `#mem-2026-033`
- `.agents/plans/add-create-venture-modal-flow.md`
