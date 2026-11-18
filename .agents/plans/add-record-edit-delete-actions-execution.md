# Execução — Ações de editar e excluir nos registros do investimento

- **Data:** 2026-11-18 · **Branch:** `main` · **Registro:** `add-record-edit-delete-actions-execution`
- **Resultado:** concluído

## Task

Permitir editar e excluir snapshots pela lista de registros da tabela do Tesouro Direto, com `PATCH`/`DELETE /api/snapshots` validando o vínculo venture↔snapshot, soft delete sem perda de histórico e feedback por toast. Pronto = endpoints cobertos por testes, modal de edição reutilizando o de registro, modal de exclusão e registro removido do GET após o soft delete.

## Fase 1 — Análise

- **Área afetada:** [`src/api/services/snapshots/`](src/api/services/snapshots), [`src/api/controllers/snapshots/`](src/api/controllers/snapshots), [`src/utils/logs.ts`](src/utils/logs.ts), [`index.ts`](index.ts), [`src/views/types.ts`](src/views/types.ts), [`src/views/components/tesouroDiretoTable/`](src/views/components/tesouroDiretoTable), [`src/views/components/registerSnapshotModal/`](src/views/components/registerSnapshotModal), [`src/views/components/deleteSnapshotModal/`](src/views/components/deleteSnapshotModal) (novo), [`src/utils/staticAssets.ts`](src/utils/staticAssets.ts), [`src/views/views.controller.ts`](src/views/views.controller.ts).
- **Testes relacionados:** [`snapshots.test.ts`](src/api/services/snapshots/snapshots.test.ts), [`snapshots.controller.test.ts`](src/api/controllers/snapshots/snapshots.controller.test.ts), [`records.test.ts`](src/views/components/tesouroDiretoTable/records.test.ts) — 33 pass antes da task; nenhum cobria vínculo venture↔snapshot, `PATCH`/`DELETE` ou os dados crus da linha.
- **Lacuna de cobertura:** ausência de `update`/`remove` no controller, de checagem de vínculo no service, de `log.error` e dos campos crus do registro.
- **Proposta:** casos de service para vínculo (com spy de escrita), casos de controller para PATCH/DELETE (200/400/404/log) e caso do mapper de registros com `id`/`ventureId`/`type`/`value`/`referenceDate`.

**Resposta do desenvolvedor:**

> Pode executar o plano file:///home/vinicius-edge/projects/finances_dashboard/.agents/plans/add-record-edit-delete-actions.md

## Fase 2 — Testes e causas

- **Testes escritos/alterados:** [`snapshots.test.ts`](src/api/services/snapshots/snapshots.test.ts) (5 chamadas migradas + 2 casos de vínculo + `spyOn`), [`snapshots.controller.test.ts`](src/api/controllers/snapshots/snapshots.controller.test.ts) (14 casos de PATCH/DELETE + stub `createCommands`), [`records.test.ts`](src/views/components/tesouroDiretoTable/records.test.ts) (dados crus).
- **Execução:** `bun test` nos 3 arquivos → **49 pass / 19 fail**.
- **Causas:**
  - [`snapshots.service.ts:107`](src/api/services/snapshots/snapshots.service.ts) e `:182` — assinaturas `(id, data)`/`(id)` sem `ventureId`; `update`/`softDelete` caem em 404 e não validam vínculo.
  - [`snapshots.controller.ts`](src/api/controllers/snapshots/snapshots.controller.ts) — `update`/`remove` inexistentes (`is not a function`).
  - [`records.ts:51`](src/views/components/tesouroDiretoTable/records.ts) e [`views/types.ts:18`](src/views/types.ts) — linha sem dados crus (`rows[0].id` `undefined`).

**Resposta do desenvolvedor:**

> Pode seguir

## Fase 3 — Implementação

- **Arquivos de produção alterados:**
  - [`src/api/services/snapshots/snapshots.service.ts`](src/api/services/snapshots/snapshots.service.ts) — `update(ventureId, id, data)`/`softDelete(ventureId, id)` com `requireOwned` antes da escrita.
  - [`src/api/services/snapshots/snapshots.types.ts`](src/api/services/snapshots/snapshots.types.ts) — `ventureId` nas ações e porta `ISnapshotCommands`.
  - [`src/api/controllers/snapshots/snapshots.controller.ts`](src/api/controllers/snapshots/snapshots.controller.ts) — `update`/`remove`, `respond` com `log.error`, `writableCommands`.
  - [`src/api/controllers/snapshots/snapshots.utils.ts`](src/api/controllers/snapshots/snapshots.utils.ts) — `parseSnapshotUpdatePayload`, `parseSnapshotDeletePayload`, `parseRequiredId`.
  - [`src/api/controllers/snapshots/snapshots.mappers.ts`](src/api/controllers/snapshots/snapshots.mappers.ts) — `toUpdateSnapshotInput`.
  - [`src/api/controllers/snapshots/snapshots.controller.types.ts`](src/api/controllers/snapshots/snapshots.controller.types.ts) — payloads/parsed e métodos do controller.
  - [`src/utils/logs.ts`](src/utils/logs.ts) — `log.error`.
  - [`index.ts`](index.ts) — `PATCH`/`DELETE` em `/api/snapshots`.
  - [`src/views/types.ts`](src/views/types.ts) e [`records.ts`](src/views/components/tesouroDiretoTable/records.ts) — dados crus por registro.
  - [`src/views/components/tesouroDiretoTable/view.eta`](src/views/components/tesouroDiretoTable/view.eta) e [`styles.css`](src/views/components/tesouroDiretoTable/styles.css) — botões Editar/Excluir.
  - [`src/views/components/registerSnapshotModal/`](src/views/components/registerSnapshotModal) — `snapshotId` + modo edição/`PATCH`.
  - [`src/views/components/deleteSnapshotModal/`](src/views/components/deleteSnapshotModal) — componente novo de confirmação.
  - [`src/views/components/index.ts`](src/views/components/index.ts), [`src/views/tesouroDireto/view.eta`](src/views/tesouroDireto/view.eta), [`src/views/views.controller.ts`](src/views/views.controller.ts), [`src/utils/staticAssets.ts`](src/utils/staticAssets.ts) — wiring.
- **Ajuste autorizado em teste congelado:** duas asserções de `toContain` passaram a `String(body.details?.field)` (apenas tipagem).
- **Testes do escopo:** 68 pass / 0 fail.
- **Regressão:** `bun test` 158 pass / 0 fail (11 arquivos) · `bunx tsc --noEmit` 0 erros.
- **Smoke (`PORT=3999`, cópia do DB em `/tmp`):** `GET /tesouro-direto` 200 com 8 botões Editar, 8 Excluir e o modal de exclusão; `PATCH` com `ventureId` divergente → 404 com log; `PATCH` correto → 200; `DELETE` → 200; no banco, `deleted_at` preenchido e a página seguinte não exibiu mais o registro.

**Resposta do desenvolvedor:**

> Sim, pode aplicar, eu modifiquei aqui, mas pode modificar, você tem a permissão

## Fase 4 — Relatório

- `atualiza recalculando os derivados` → `update` com `ventureId` correto recalcula derivados e chama `patch` uma vez — [`snapshots.test.ts`](src/api/services/snapshots/snapshots.test.ts).
- `retorna 404 ao atualizar snapshot de outra venture sem escrever` → vínculo divergente gera 404 sem `patch` e sem alterar a linha.
- `rejeita alteração de type/movementValue com 400` → payload com `type` continua bloqueado pelo service.
- `retorna 404 ao atualizar snapshot inexistente` → 404 preservado na nova assinatura.
- `faz softDelete de snapshot existente` → `deletedAt` preenchido na linha correta.
- `retorna 404 ao fazer softDelete de snapshot de outra venture sem escrever` → 404 sem `softDelete` no repositório e sem flag.
- `retorna 404 ao fazer softDelete de snapshot inexistente` → 404 preservado.
- `atualiza currentTotalValue a partir de value e devolve 200` → `PATCH` mapeia `value` para `currentTotalValue` e devolve `{ snapshot }`.
- `envia notes vazio para limpar a nota do registro` → `notes: ""` chega ao service (limpeza suportada).
- `ignora type e movementValue enviados no corpo` → PATCH não encaminha campos imutáveis.
- `retorna 400 quando ventureId ou snapshotId estão ausentes` → validação de ids no PATCH.
- `retorna 400 quando value não é um inteiro positivo` → validação `integer_positive`.
- `retorna 400 quando referenceDate está ausente ou inválida` → validação de data ISO.
- `retorna 400 quando notes excede 280 caracteres` → limite preservado (280 aceito).
- `retorna 400 quando o corpo não é JSON válido` → erro `body`/`json`.
- `propaga 404 do service e registra log de manutenção` → `ApiError` respondido e logado com id/status.
- `registra log e repropaga erro inesperado` → erro não-`ApiError` logado e relançado.
- `faz soft delete com ventureId e snapshotId e devolve 200` → `DELETE` delega ids corretos.
- `retorna 400 quando ventureId ou snapshotId estão ausentes` (remove) → ids obrigatórios no DELETE.
- `retorna 400 quando o corpo não é JSON válido` (remove) → erro `body`/`json`.
- `propaga 404 do service e registra log de manutenção` (remove) → 404 respondido e logado.
- `expõe os dados crus necessários para editar e excluir o registro` → linha carrega `id`, `ventureId`, `type`, `value`, `referenceDate` e `notes`.

## Pendências

- Sem recálculo em cascata: snapshots posteriores mantêm `totalContributed`/`grossProfit` calculados sobre o histórico anterior à edição/exclusão (limitação registrada no plano).
- `tsc` imprime erros quando existem, mas retorna exit code 0 neste ambiente — validar pela saída, não só pelo código de saída.
- Alterações não commitadas; o registro acompanha o commit da task.
