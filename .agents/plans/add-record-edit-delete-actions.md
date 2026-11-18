# Implementation Plan: Ações de editar e excluir nos registros do investimento

- **Plan ID**: add-record-edit-delete-actions
- **Status**: Done
- **Date**: 2026-11-18

## 1. Requirements & Objectives

- **Goal**: permitir corrigir e remover snapshots (registros) de um investimento pela própria tabela, com edição via modal reutilizado e exclusão via confirmação, ambos persistindo por `PATCH`/`DELETE /api/snapshots` com validação de vínculo venture↔snapshot.
- **Scope**:
  - Dois botões `btn-outline-*` com ícone + texto ("Editar", "Excluir") ao final de cada item da lista de registros (depois da nota).
  - Modal de edição derivado do `registerSnapshotModal`: campos preenchidos, `Tipo` travado, sem "Registrar e próximo", botão principal com texto "Confirmar".
  - Edição envia `PATCH /api/snapshots` com JSON `{ ventureId, snapshotId, value, referenceDate, notes }`; o campo `value` (centavos) edita `currentTotalValue` para **todos** os tipos.
  - Exclusão abre modal de confirmação ("ação não reversível") e envia `DELETE /api/snapshots` com JSON `{ ventureId, snapshotId }`, executando **soft delete**.
  - Backend valida: snapshot existe (não soft-deleted) e `ventureId` enviado é igual ao `venture_id` do registro; qualquer divergência → `404` **sem escrita** e com log de manutenção.
  - Sucesso de PATCH e DELETE → `200 { snapshot }`; client mostra toast, fecha o modal e recarrega a página (padrão atual), de modo que o registro excluído não volte no GET e as linhas vizinhas recalculem suas diferenças no próximo render.
- **Out of Scope**:
  - Recálculo em cascata de `totalContributed`/`grossProfit`/`profitPercentage` dos snapshots posteriores (limitação registrada; plano próprio).
  - Alterar `type`/`movementValue` de um snapshot existente (regra atual do service permanece).
  - Testes de view/SSR dos botões e modais (decisão do desenvolvedor: manter o padrão do projeto).
  - Paginação, i18n, autenticação/guards, exportação.
  - Alterações de `package.json`, `bun.lock`, `.env`, `.nvmrc`, `opencode.json` e `contracts/`.

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/api/services/snapshots/snapshots.service.ts` (Modify) — `update`/`softDelete` passam a receber `ventureId` e validar vínculo antes da escrita.
  - `src/api/services/snapshots/snapshots.types.ts` (Modify) — `SnapshotsServiceInput` (`update`/`softDelete` com `ventureId`).
  - `src/api/services/snapshots/snapshots.errors.ts` (Reuse) — usa `snapshotNotFound` para "não existe" e "não pertence".
  - `src/api/controllers/snapshots/snapshots.controller.ts` (Modify) — novos métodos `update` e `remove`, com `try/catch`, `log.error` e `ApiError.handle()`.
  - `src/api/controllers/snapshots/snapshots.controller.types.ts` (Modify) — payloads, porta e interface do controller.
  - `src/api/controllers/snapshots/snapshots.utils.ts` (Modify) — parsers de PATCH/DELETE.
  - `src/api/controllers/snapshots/snapshots.mappers.ts` (Modify) — `toUpdateSnapshotInput`.
  - `src/utils/logs.ts` (Modify) — `log.error(message, details)`.
  - `index.ts` (Modify) — `PATCH` e `DELETE` em `/api/snapshots`.
  - `src/views/types.ts` (Modify) — `ITesouroDiretoRecordRow` ganha dados crus (`id`, `ventureId`, `type`, `value`, `referenceDate`).
  - `src/views/components/tesouroDiretoTable/records.ts` (Modify) — mapper preenche os dados crus.
  - `src/views/components/tesouroDiretoTable/view.eta` (Modify) — botões de ação por registro e `data-*`.
  - `src/views/components/tesouroDiretoTable/styles.css` (Modify) — layout dos botões.
  - `src/views/components/registerSnapshotModal/view.eta` (Modify) — hidden `snapshotId`.
  - `src/views/components/registerSnapshotModal/modal.js` (Modify) — modo edição + `PATCH`.
  - `src/views/components/deleteSnapshotModal/` (Create) — `index.ts`, `view.eta`, `styles.css`, `modal.js`.
  - `src/views/components/index.ts` (Modify) — barrel.
  - `src/views/tesouroDireto/view.eta` (Modify) — include do modal de exclusão.
  - `src/views/views.controller.ts` (Modify) — `extraStyles` do novo componente.
  - `src/utils/staticAssets.ts` (Modify) — `viewStyles` + rota de `/views/components/deleteSnapshotModal/modal.js`.
  - `src/api/services/snapshots/snapshots.test.ts` (Modify) — assinaturas + casos de vínculo.
  - `src/api/controllers/snapshots/snapshots.controller.test.ts` (Modify) — casos de PATCH/DELETE.
  - `src/views/components/tesouroDiretoTable/records.test.ts` (Modify) — dados crus.
  - `.agents/PROJECT.md` (Modify) — nota de endpoints (L85).
  - `.agents/memory/SERVICES_MEMORY.md` (Modify) — `MEM-2026-033`.
  - `.agents/memory/VIEWS_MEMORY.md` (Modify) — `MEM-2026-028` e `MEM-2026-034`.
- **Dependencies Required**: nenhuma nova (Bun, Eta, Bootstrap já presentes).
- **Contexto relevante**:
  - `ventureSnapshotsRepository.get/getAll/patch/softDelete` já filtram `deletedAt IS NULL` (`src/repositories/ventureSnapshots.ts`), portanto o soft delete já impede o retorno no GET/tracking.
  - `SnapshotsService.update` já proíbe `type`/`movementValue` (`400`) e recalcula `grossProfit`/`profitPercentage` sobre `existing.totalContributed`.
  - O `registerSnapshotModal/modal.js` já centraliza `form`, `resetForm`, `fillVenture`, busy state, toast e reload — o modo edição será uma evolução dele, sem novo script para edição.
  - `records.ts` calcula `previousValue` encadeado no render; como o reload re-renderiza a lista, as diferenças das linhas vizinhas se ajustam automaticamente.

## 3. Architectural Options & Decision

### Option A: vínculo venture↔snapshot no service, com `ventureId` explícito

- **Pros**: regra de domínio na camada correta; um único caminho de escrita para PATCH/DELETE; permite `404` com log distinto; fácil de testar com fakes de repositório.
- **Cons**: altera assinaturas de `update`/`softDelete` (5 chamadas existentes em `snapshots.test.ts`).

### Option B: vínculo validado no controller

- **Pros**: não altera o service.
- **Cons**: lógica duplicada em dois métodos HTTP; o service continua expondo escrita sem vínculo; regra de negócio vazando para a borda.

### Option C: restringir no repositório (`WHERE id AND venture_id`)

- **Pros**: uma única query atômica.
- **Cons**: não distingue "snapshot inexistente" de "snapshot de outra venture", perdendo o detalhe exigido para o log de manutenção.

> **Decision**: Option A. A checagem ocorre **antes** de qualquer escrita — `repository.patch` e `repository.softDelete` só são chamados após validar existência e vínculo, garantindo que falhas não alterem a linha.

### Contratos internos (rascunho)

- `SnapshotsService.update(ventureId: string, id: string, data: UpdateSnapshotInput): IVentureSnapshot`
- `SnapshotsService.softDelete(ventureId: string, id: string): IVentureSnapshot`
- `ISnapshotCommands` (porta do controller): `save`, `update`, `softDelete`.
- `ISnapshotsController`: `create(req)`, `update(req)`, `remove(req)`.
- `IUpdateSnapshotPayload`: `{ ventureId, snapshotId, value, referenceDate, notes? }` (JSON; `value` em centavos = `currentTotalValue`).
- `IDeleteSnapshotPayload`: `{ ventureId, snapshotId }` (JSON).
- `ITesouroDiretoRecordRow` (view): `+ id`, `+ ventureId`, `+ type`, `+ value` (centavos), `+ referenceDate` (`YYYY-MM-DD`).

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Testes (DEFAULT_EXECUTE Fase 2, antes do código de produção)**:
  - `snapshots.test.ts`: `update`/`softDelete` com `ventureId` correto, divergente e snapshot inexistente; asserção de que `repository.patch`/`repository.softDelete` **não** são chamados nos erros; ajuste das 5 chamadas existentes para a nova assinatura.
  - `snapshots.controller.test.ts`: `PATCH` (sucesso, 400 por ids/valor/data/nota, 404 propagado, log do erro) e `DELETE` (sucesso, 400, 404 propagado, log do erro).
  - `records.test.ts`: `id`, `ventureId`, `type`, `value`, `referenceDate` e `notes` nas linhas.
- [x] **Step 2 — Backend**:
  - `snapshots.service.ts`: vínculo em `update`/`softDelete` (`existing.ventureId !== ventureId` → `snapshotNotFound(id)`), sempre antes da escrita.
  - `snapshots.types.ts`: `ventureId` em `SnapshotsServiceInput`; nova porta `ISnapshotCommands`.
  - `snapshots.utils.ts` + `snapshots.mappers.ts`: `parseSnapshotUpdatePayload`, `parseSnapshotDeletePayload`, `toUpdateSnapshotInput` (`value` → `currentTotalValue`, `notes` sempre presente).
  - `snapshots.controller.ts`: `update` (200 `{ snapshot }`) e `remove` (200 `{ snapshot }`), com `try/catch` → `log.error` + `ApiError.handle()`; erros não-`ApiError` são logados e repropagados.
  - `logs.ts`: `log.error(message, details)` reutilizando `appLabel()`.
  - `index.ts`: `PATCH` e `DELETE` em `/api/snapshots`.
- [x] **Step 3 — UI/SSR**:
  - `types.ts` + `records.ts`: dados crus por registro.
  - `tesouroDiretoTable/view.eta`: `<div class="venture-table__record-actions">` com dois `button type="button" class="btn btn-sm btn-outline-secondary"` (`bi-pencil-square`/`bi-trash`) e `data-edit-snapshot`/`data-delete-snapshot` + `data-venture-id`, `data-snapshot-id`, `data-snapshot-type`, `data-snapshot-value`, `data-snapshot-date`, `data-snapshot-notes`.
  - `styles.css`: `.venture-table__record-actions` (flex, `gap`, `flex-shrink: 0`) e ajuste de alinhamento do `.venture-table__record`.
  - `registerSnapshotModal`: hidden `snapshotId`; `modal.js` com modo edição (título "Editar registro", `Tipo` desabilitado, ocultar `data-action="register-next"`, label "Confirmar", prefill de valor/data/nota/tipo, `PATCH` no submit, restauração no `hidden.bs.modal`).
  - `deleteSnapshotModal`: novo componente (view com `Cancelar`/`Excluir` e aviso de irreversibilidade; `modal.js` com `DELETE`, busy state, toast e reload; fecha em sucesso, permanece aberto em erro).
  - `components/index.ts`, `tesouroDireto/view.eta`, `views.controller.ts`, `staticAssets.ts`: registro do componente (barrel, include, `extraStyles`, `viewStyles` e rota estática do script).
- [x] **Step 4 — Validação**:
  - Testes do escopo, suíte completa e `tsc` (comandos na Seção 5).
  - Smoke manual em `PORT=3999`: PATCH/DELETE felizes, 404 de vínculo, GET sem o registro excluído, HTML com os novos `data-*`.
- [x] **Step 5 — Documentação e registro**:
  - Atualizar `MEM-2026-033` (SERVICES), `MEM-2026-028` e `MEM-2026-034` (VIEWS) via skill `create-new-memory`.
  - Atualizar `.agents/PROJECT.md:85` com os novos métodos/rotas.
  - Criar `.agents/plans/<plan-id>-execution.md` (DEFAULT_EXECUTE Fase 5).

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bun test src/api/services/snapshots/snapshots.test.ts src/api/controllers/snapshots/snapshots.controller.test.ts src/views/components/tesouroDiretoTable/records.test.ts`
  - `bun test`
  - `bunx tsc --noEmit`
- **Edge cases to verify**:
  - `snapshotId` inexistente → `404`, sem escrita e com log.
  - `ventureId` divergente do `venture_id` do banco → `404`, sem escrita e com log.
  - Snapshot já soft-deleted → `404` (`get` filtra `deletedAt`).
  - `PATCH` com `value` não inteiro, `<= 0`, data inválida ou `notes > 280` → `400`.
  - `PATCH` não altera `type`/`movementValue` (payload não os envia; service bloqueia se enviados).
  - `notes` vazio no PATCH limpa a nota (persiste `""`, renderiza `—`).
  - `DELETE` grava `deletedAt` e o registro desaparece de `getAll`, `tracking` e do GET da página.
  - Falha em qualquer validação → nenhum campo/flag alterado (asserções de "repositório não chamado").
  - Sem cascata: snapshots posteriores mantêm `totalContributed`/`grossProfit` antigos (limitação documentada).
  - Log de manutenção contém método, `ventureId`, `snapshotId`, status e mensagem — sem corpo da requisição nem notas.

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - **Fase 2 (respostas literais)**:
    > 1. /api/snapshots
    > 2. SnapshotsController
    > 3. JSON em ambos
    > 4. A
    > 5. Seguir o recomendado
    > 6. Recomendado, mas faça um log na execução do aplicativo informando o erro para manutenção.
    > 7. Recomendado
    > 8. Recomendado
    > 9. Recomendado
  - Interpretação aplicada: `PATCH`/`DELETE` em `/api/snapshots`; vínculo no `SnapshotsController`→`SnapshotsService`; JSON nos dois métodos; edição sempre em `currentTotalValue` com `Tipo` travado; sem cascata; `200 { snapshot }` + `404` no vínculo; reload com toast; sem testes de SSR; modal de exclusão dedicado; log de erro na execução.

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Each item must be atomic, verifiable and traceable to its source step in Section 4. This list is the single source of truth for execution progress: update it in the same iteration as any plan change.

### Step 1: Testes (antes da implementação)

- [x] `TODO-01` Em `snapshots.test.ts`, escrever `update` com `ventureId` correto (deve atualizar) e registrar a asserção de `patch` chamado.
- [x] `TODO-02` Em `snapshots.test.ts`, escrever `update` com `ventureId` divergente → `404` e `patch` não chamado.
- [x] `TODO-03` Em `snapshots.test.ts`, escrever `softDelete` com `ventureId` correto, divergente (`404`) e snapshot inexistente (`404`), com `softDelete` do repositório não chamado nos erros.
- [x] `TODO-04` Ajustar as 5 chamadas existentes de `update`/`softDelete` em `snapshots.test.ts` para a nova assinatura.
- [x] `TODO-05` Em `snapshots.controller.test.ts`, escrever `PATCH`: 200 `{ snapshot }` e delegação com `(ventureId, snapshotId, { currentTotalValue, referenceDate, notes })`.
- [x] `TODO-06` Em `snapshots.controller.test.ts`, escrever `PATCH`: 400 para ids ausentes, `value` inválido, data inválida e `notes > 280`; 404 propagado.
- [x] `TODO-07` Em `snapshots.controller.test.ts`, escrever `DELETE`: 200 e delegação `(ventureId, snapshotId)`; 400 para ids ausentes; 404 propagado.
- [x] `TODO-08` Em `snapshots.controller.test.ts`, escrever asserção de log de erro (`spyOn(console, "error")`) nos casos de falha de PATCH/DELETE.
- [x] `TODO-09` Em `records.test.ts`, escrever asserções de `id`, `ventureId`, `type`, `value`, `referenceDate` e `notes` nas linhas mapeadas.
- [x] `TODO-10` Rodar os 3 arquivos de teste e registrar as falhas esperadas (DEFAULT_EXECUTE Fase 2).

### Step 2: Backend

- [x] `TODO-11` Em `snapshots.types.ts`, adicionar `ventureId` às variantes `update`/`softDelete` de `SnapshotsServiceInput`.
- [x] `TODO-12` Em `snapshots.types.ts`, criar `ISnapshotCommands` (`save`, `update`, `softDelete`).
- [x] `TODO-13` Em `snapshots.service.ts`, implementar `update(ventureId, id, data)` validando `existing.ventureId` antes de `repository.patch`.
- [x] `TODO-14` Em `snapshots.service.ts`, implementar `softDelete(ventureId, id)` validando `existing.ventureId` antes de `repository.softDelete`.
- [x] `TODO-15` Em `snapshots.utils.ts` (controller), criar `parseSnapshotUpdatePayload` (ids, `value` inteiro `> 0`, data `YYYY-MM-DD`, `notes` ≤ 280).
- [x] `TODO-16` Em `snapshots.utils.ts` (controller), criar `parseSnapshotDeletePayload` (ids obrigatórios).
- [x] `TODO-17` Em `snapshots.mappers.ts`, criar `toUpdateSnapshotInput` (`value` → `currentTotalValue`, `notes` sempre presente).
- [x] `TODO-18` Em `snapshots.controller.types.ts`, declarar `IUpdateSnapshotPayload`, `IDeleteSnapshotPayload` e `ISnapshotsController.update/remove`.
- [x] `TODO-19` Em `snapshots.controller.ts`, implementar `update` (200 `{ snapshot }`) e `remove` (200 `{ snapshot }`) com `try/catch`.
- [x] `TODO-20` Em `logs.ts`, criar `log.error(message, details)` com `appLabel()`.
- [x] `TODO-21` Em `snapshots.controller.ts`, chamar `log.error` em `ApiError` (com status/ids) e antes de repropagar erros inesperados.
- [x] `TODO-22` Em `index.ts`, adicionar `PATCH` e `DELETE` na rota `/api/snapshots`.
- [x] `TODO-23` Rodar os testes de service/controller e registrar o resultado verde.

### Step 3: UI/SSR

- [x] `TODO-24` Em `src/views/types.ts`, adicionar `id`, `ventureId`, `type`, `value` e `referenceDate` a `ITesouroDiretoRecordRow`.
- [x] `TODO-25` Em `records.ts`, mapear os novos campos crus a partir do snapshot.
- [x] `TODO-26` Em `tesouroDiretoTable/view.eta`, adicionar `venture-table__record-actions` com os botões "Editar" e "Excluir" e os `data-*` definidos na Seção 3.
- [x] `TODO-27` Em `tesouroDiretoTable/styles.css`, criar `.venture-table__record-actions` e ajustar `.venture-table__record` para acomodar os botões.
- [x] `TODO-28` Em `registerSnapshotModal/view.eta`, adicionar `<input type="hidden" name="snapshotId">`.
- [x] `TODO-29` Em `registerSnapshotModal/modal.js`, implementar modo edição (prefill, `Tipo` desabilitado, ocultar "Registrar e próximo", label "Confirmar", `PATCH`, restauração em `hidden.bs.modal`).
- [x] `TODO-30` Em `registerSnapshotModal/modal.js`, interpolá-lo com o modo registro para o submit escolher `POST`/`PATCH` e as mensagens de toast por ação.
- [x] `TODO-31` Criar `deleteSnapshotModal/index.ts` no padrão `IViewConfig`.
- [x] `TODO-32` Criar `deleteSnapshotModal/view.eta` com aviso de irreversibilidade, hidden `ventureId`/`snapshotId` e botões `Cancelar`/`Excluir`.
- [x] `TODO-33` Criar `deleteSnapshotModal/styles.css` usando os tokens do tema.
- [x] `TODO-34` Criar `deleteSnapshotModal/modal.js` com `DELETE`, busy state, toast e reload (fecha em sucesso, mantém aberto em erro).
- [x] `TODO-35` Em `src/views/components/index.ts`, exportar `deleteSnapshotModal`.
- [x] `TODO-36` Em `src/views/tesouroDireto/view.eta`, incluir o `deleteSnapshotModal`.
- [x] `TODO-37` Em `src/views/views.controller.ts`, adicionar `deleteSnapshotModal.style` ao `extraStyles` de `index()`.
- [x] `TODO-38` Em `src/utils/staticAssets.ts`, adicionar `deleteSnapshotModal` ao `viewStyles` e a rota `/views/components/deleteSnapshotModal/modal.js`.

### Step 4: Validação

- [x] `TODO-39` Rodar `bun test` (suíte completa) e registrar contagens.
- [x] `TODO-40` Rodar `bunx tsc --noEmit` e registrar o resultado.
- [x] `TODO-41` Smoke manual em `PORT=3999`: `PATCH` feliz, `PATCH` com `ventureId` divergente (`404`), `DELETE` feliz, GET da página sem o registro excluído e HTML contendo os novos `data-*`.

### Step 5: Documentação e registro

- [x] `TODO-42` Atualizar `MEM-2026-033` em `.agents/memory/SERVICES_MEMORY.md` (novos métodos/rotas e regra de vínculo).
- [x] `TODO-43` Atualizar `MEM-2026-028` e `MEM-2026-034` em `.agents/memory/VIEWS_MEMORY.md` (dados crus, botões, modo edição e modal de exclusão).
- [x] `TODO-44` Atualizar `.agents/PROJECT.md:85` com `PATCH`/`DELETE /api/snapshots`.
- [x] `TODO-45` Criar o registro de execução `.agents/plans/<plan-id>-execution.md` conforme DEFAULT_EXECUTE Fase 5.
