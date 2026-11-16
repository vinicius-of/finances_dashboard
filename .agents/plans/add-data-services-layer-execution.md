# Execução — Camada de serviços (export, snapshots, ventures)

- **Data:** 2026-10-23 · **Branch:** `main` · **Registro:** `add-data-services-layer-execution`
- **Resultado:** concluído

## Task

Criar a camada de serviços em `src/api/services/` orientada a interfaces, com testes unitários escritos antes das implementações (`red` → `green`), cobrindo `export`, `snapshots` e `ventures`; `import` fora do escopo. Critério de pronto: interfaces gerais e por serviço, testes com fakes, fase vermelha por ausência de implementação, implementação verde e typecheck limpo.

## Fase 1 — Análise

- **Área afetada:** `src/api/services/` (novos tipos, testes e serviços), docs `.agents/`; `src/api/services/ventures/validateVentures.ts` (WIP substituído).
- **Testes relacionados:** `src/views/views.test.ts` — 6 pass / 0 fail (73 asserções). Nenhum teste de serviço existia.
- **Lacuna de cobertura:** validação e CRUD de ventures, cálculos e tracking de snapshots, payload de exportação e resumo.
- **Proposta:** `IService` + `*.types.ts` por serviço + classes com DI + testes-first com fakes; fases vermelho/verde. Plano: `.agents/plans/add-data-services-layer.md`.

**Respostas do desenvolvedor (Fase 2 do planejamento):**

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

**Revisão do plano:**

> 1. Eu confirmo que pode adicionar também.
> 2. Sim
> 3. Sim
> 4. Sim
> 5. Sim
>
> Pode revisar o plano e analisar se o plano precisa ser modificado

**Aprovação:**

> Tudo certo, pode iniciar a execução!

## Fase 2 — Testes e causas

- **Testes escritos:**
  - `src/api/services/ventures/ventures.test.ts` — 21 casos (validação, CRUD, `execute`).
  - `src/api/services/snapshots/snapshots.test.ts` — 20 casos (cálculos, CRUD, tracking, `execute`).
  - `src/api/services/export/export.test.ts` — 2 casos (payload completo e vazio).
- **Fakes:** repositórios em memória para `IVenturesRepository`/`IVentureSnapshotsRepository` e readers para o export; nenhuma dependência real de banco.
- **Execução inicial (vermelho):** `bun test` → **6 pass / 3 fail / 3 errors** (73 asserções).
  - `Cannot find module './export.service'`
  - `Cannot find module './ventures.service'`
  - `Cannot find module './snapshots.service'`
- **Causas:** módulos de implementação intencionalmente inexistentes (decisão do desenvolvedor); nenhuma falha por mock ausente.
- **Gate da Fase 2:** dispensado pelo desenvolvedor; o vermelho foi registrado e a implementação seguiu no mesmo ciclo.

## Fase 3 — Implementação

- `src/api/services/services.types.ts` — `IService<TInput, TOutput>`.
- `src/api/services/mappers.ts` — `toDateOnly`, `toDate`, `centsToReais`.
- `src/api/services/ventures/ventures.types.ts` — `IVenturesReader`, `IVenturesRepository`, inputs, ações e saídas.
- `src/api/services/ventures/validateVentures.ts` — regras (`initialValue >= 0`, `boughtAt` não futuro, `STOCK` sem `expiresIn`, obrigatórios por categoria).
- `src/api/services/ventures/ventures.service.ts` — `VenturesService` (`validate`, `create`, `update`, `get`, `getAll`, `softDelete`, `execute`) e `toVenture`.
- `src/api/services/snapshots/snapshots.types.ts` — inputs, `SnapshotPatch`, repositório, ações e saídas.
- `src/api/services/snapshots/snapshots.service.ts` — `SnapshotsService` (`save`, `update`, `softDelete`, `get`, `getAll`, `tracking`, `execute`).
- `src/api/services/export/export.types.ts` — readers, payload e ação `download`.
- `src/api/services/export/export.service.ts` — `ExportService` (Response de download com `ventures`/`snapshots`/`tracking`/`summary`, reais).
- `src/api/services/index.ts` — barrel dos tipos e serviços.
- **Testes do escopo:** `bun test` → **49 pass / 0 fail** (184 asserções).
- **Regressão:** `bun test` **49 pass / 0 fail** · `bunx tsc --noEmit` **ok**.

## Fase 4 — Relatório

- `VenturesService` (21): validação das 3 regras + campos por categoria; criação com conversão de datas; update por merge + validação; 404 em get/update/softDelete; especialização FIXED/VARIABLE; despacho via `execute`.
- `SnapshotsService` (20): base em `initialValue` no primeiro snapshot; aporte/resgate; `movementValue` obrigatório; resgate acima do aportado; precedência de `currentTotalValue`; recálculo no update; bloqueio de `type`/`movementValue`; 404s; tracking ordenado.
- `ExportService` (2): `Response` com `Content-Disposition` datado, payload completo em reais, resumo por categoria e caso vazio.
- Views (6): regressão preservada.

## Desvios do plano

- `SnapshotsService` depende de `IVenturesReader` (interface estreita) em vez de `IVenturesRepository`; os repositórios reais continuam satisfazendo estruturalmente.
- `ExportPayload.summary.lastUpdated` é `Date` na tipagem e vira string no JSON; o teste faz _narrowing_ explícito para comparar o valor serializado.
- Sem alterações em controllers, rotas, `index.ts`, schema ou contratos de domínio.

## Pendências

- Serviço `import` permanece fora do escopo.
- Integração com controllers/rotas não foi feita (fora do escopo).
- `update` de snapshot restringe `type`/`movementValue` a `400` para evitar recálculo histórico em cascata.
- `error.403.eta` e `error.500.eta` continuam vazios (pendência anterior, não relacionada).
