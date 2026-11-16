# Implementation Plan: Fluxo "Registrar" (modal + controller POST + toast)

- **Plan ID**: `add-register-snapshot-flow`
- **Status**: Done
- **Date**: 2026-11-13

## 1. Requirements & Objectives

- **Goal**: dar ao usuário a capacidade de criar novos snapshots em qualquer investimento da tabela do Tesouro Direto por meio de um modal, persistindo via um novo controller POST da API, com feedback por toast e três ações (Cancelar / Registrar / Registrar e próximo).

- **Scope**:
  - Renomear a ação `Guardar` → `Registrar` no menu de opções da linha (`src/views/components/tesouroDiretoTable/view.eta:50`) e ligá-la ao modal.
  - Novo controller HTTP `POST /api/snapshots` em `src/api/controllers/` (camada ainda inexistente), com payload JSON de campos unificados e validação de entrada.
  - Ajuste no `SnapshotsService.save` para que `CONTRIBUTION`/`WITHDRAWAL` somem/subtraiam o movimento ao montante anterior quando o montante não for informado explicitamente.
  - Novo componente de modal Bootstrap (`registerSnapshotModal`) com título do investimento, tipo, valor, data de aplicação e nota.
  - Novo componente de toast (`toast`) com variantes `success`/`danger` usando os tokens do tema.
  - Ações do modal: `Cancelar` (fecha sem alterar), `Registrar` (POST → toast → fecha e recarrega a página), `Registrar e próximo` (POST → toast → reabre no próximo investimento da ordem da tabela).
  - Testes unitários do controller (service mockado) e complemento das lacunas de cobertura do service.

- **Out of Scope**:
  - Implementação das ações `Sacar`, `Arquivar` e `Editar` (permanecem inertes).
  - Exportar/importar, outros tipos de investimento (Rendas Fixas, Ações) e reuso do modal fora do Tesouro Direto.
  - Cálculo/registro de rentabilidade passiva vs. ativa (feature anteriormente cancelada pelo desenvolvedor).
  - Testes unitários de view/SSR e de scripts de UI (decisão 10 do desenvolvedor: apenas controller e service).
  - Alterações de `package.json`, `bun.lock`, `.env`, `.nvmrc`, `opencode.json`; autenticação/guards; i18n; paginação; edição/exclusão de snapshot pelo modal.

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/api/controllers/` — **Create** (diretório não existe): `index.ts`, `snapshots.controller.ts`, `snapshots.controller.types.ts`, `snapshots.controller.test.ts`.
  - `src/api/services/snapshots/snapshots.service.ts` — **Modify** (`save`: movimento no montante e reuso de `resolveMovement`).
  - `src/api/services/snapshots/snapshots.test.ts` — **Modify** (5 casos novos de lacuna).
  - `index.ts` — **Modify** (instanciar `SnapshotsController` e registrar `POST /api/snapshots`).
  - `src/utils/staticAssets.ts` — **Modify** (bundle JS do Bootstrap + scripts dos novos componentes + CSS no `viewStyles`).
  - `src/views/components/index.ts` — **Modify** (barrel dos novos componentes).
  - `src/views/components/registerSnapshotModal/{index.ts,view.eta,styles.css,modal.js}` — **Create**.
  - `src/views/components/toast/{index.ts,view.eta,styles.css,toast.js}` — **Create**.
  - `src/views/components/tesouroDiretoTable/view.eta` — **Modify** (`Registrar` + `data-*` do investimento).
  - `src/views/tesouroDireto/view.eta` — **Modify** (incluir toast e modal).
  - `src/views/views.controller.ts` — **Modify** (`extraStyles` do modal e do toast).
  - `.agents/memory/VIEWS_MEMORY.md`, `.agents/memory/SERVICES_MEMORY.md`, `.agents/memory/INDEX.md` — **Modify** (memória `MEM-2026-033`).
  - `.agents/PROJECT.md` — **Read/Modify** (registrar `src/api/controllers/` em uso).

- **Fatos apurados no código**:
  - `src/api/` contém apenas `services/`; não há controller HTTP, guard ou middleware aplicado. `index.ts:36-50` declara as rotas direto no `Bun.serve`.
  - `withRequestLog(source, handler)` aceita `Request` e devolve `Response | BunFile | Promise<...>`; `LogSource = "file" | "render" | "json" | "redirect"` (`src/utils/logs.ts:44`).
  - `ApiError.handle()` serializa `{ error: true, statusCode, message, details? }` com o `status` correspondente.
  - `SnapshotsService.save` (`snapshots.service.ts:147`) valida data (400), venture (404), valores negativos (422), `movementValue` (422), resgate > aportado (422) e deriva `totalContributed`, `grossProfit` e `profitPercentage`.
  - **Lacuna de comportamento**: `resolveCurrentTotalValue` (`snapshots.service.ts:71`) herda o montante anterior e **não** aplica o movimento — um aporte não altera o montante.
  - `SnapshotInput` (`snapshots.types.ts:12`) já contempla `movementValue`, `currentTotalValue` e `notes`.
  - Layout carrega apenas CSS do Bootstrap (`layout/view.eta:8-9`); nenhum JS. `node_modules/bootstrap/dist/js/bootstrap.bundle.min.js` **existe** e será servido como asset (sem dependência nova).
  - Padrão de script de componente: IIFE com guarda em `document.documentElement.dataset.*` e `<script defer>` no próprio template (`tesouroDiretoTable/view.eta:103-104`).
  - `theme.css` expõe `--app-success: #4a8c3a` e `--app-danger: #c83e2b`; a tabela já usa essas cores em `venture-table__record-difference--{up,down}`.
  - `ViewsController.index` monta `extraStyles: [toolbar.style, table.style]` (`views.controller.ts:89`).
  - Ordem filtrada/ordenada das linhas é produzida no servidor por `applyToolbarState` (`tesouroDiretoToolbar/state.ts:136`); reproduzi-la no client exige ler o DOM renderizado.
  - `views.test.ts` foi removido por decisão anterior do desenvolvedor: não há testes de view.
  - Linha de base atual (2026-11-13): `bun test` → **87 pass / 0 fail**; `bunx tsc --noEmit` → **0 erros**.

- **Dependencies Required**: nenhuma. `bootstrap` e `bootstrap-icons` já instalados; o bundle JS passa a ser servido por `staticAssetRoutes`.

## 3. Architectural Options & Decision

### Option A: Controller fino + `SnapshotsService` responsável pelo cálculo + modal Bootstrap

Payload unificado (`value` em centavos) mapeado no controller para `currentTotalValue` (MONTHLY_RECORD) ou `movementValue` (CONTRIBUTION/WITHDRAWAL); o service ajusta o montante quando ele não é informado. Modal via `bootstrap.bundle.min.js` servido como asset estático.

- **Pros**: mantém a regra de negócio na camada de serviço (testável, reusável por outros controllers); controller apenas valida/mapeia/serializa; modal Bootstrap reaproveita CSS já carregado e resolve acessibilidade (foco, `Esc`, `backdrop`) sem código próprio; zero dependências novas; `snapshot` retornado permite toast preciso e futura atualização de linha.
- **Cons**: adiciona um asset JS de ~80 kB; muda um comportamento do service (aporte passa a alterar o montante) e exige teste novo; o client precisa ler o DOM para saber o "próximo".

### Option B: Modal nativo `<dialog>` + cálculo de montante no client

Controller recebe `currentTotalValue` pronto e o client calcula `anterior ± movimento` a partir do DOM.

- **Pros**: nenhum asset novo; markup mais simples.
- **Cons**: duplica a regra de negócio na UI (divergência garantida com o service); o client precisa do montante anterior, que pode não estar renderizado (filtros/valores vazios); menos acessível e sem padrão de foco robusto.

### Option C: Controller expõe o payload cru do service

Client envia `currentTotalValue` e/ou `movementValue` conforme o tipo.

- **Pros**: controller mais fino ainda.
- **Cons**: transfere complexidade e conhecimento de domínio para o script do modal; validações do formulário ficam acopladas ao contrato interno do service.

> **Decision**: **Option A**, com modal **Bootstrap** (resposta 6B do desenvolvedor). Centraliza a regra no service, mantém o controller testável por injeção e evita uma segunda fonte de verdade para montante/aporte. O bundle JS do Bootstrap já está em `node_modules`, então não há dependência nova.

### Decisões do desenvolvedor (Fase 2, literais)

1. **A** — campo único "Valor" com significado por tipo (MONTHLY_RECORD = montante; CONTRIBUTION/WITHDRAWAL = movimento, com montante recalculado pelo backend).
2. **A** — `referenceDate` pré-preenchida com hoje, editável e obrigatória.
3. **A** — `201` + `{ snapshot }`.
4. **A** — após "Registrar", reload da página preservando filtros/ordenação.
5. **A** — "Registrar e próximo" usa a ordem da tabela renderizada (filtros + ordenação aplicados).
   5b. **A** — no último investimento, fecha o modal.
6. **B** — modal Bootstrap (markup Bootstrap + `bootstrap.bundle.min.js` como asset).
7. **A** — toast próprio (`success`/`danger`), canto inferior direito, auto-dismiss 4s, empilhável.
8. **A** — apenas `Guardar` → `Registrar`; `Sacar` permanece inerte.
9. **A** — exibir a `message` PT-BR do `ApiError` no toast, com validação prévia no client.
10. **B** — testes apenas de controller e service.

### Contratos (pseudo-assinaturas)

```ts
// POST /api/snapshots — Request body
interface IRegisterSnapshotPayload {
  ventureId: string;
  type: SnapshotType; // "MONTHLY_RECORD" | "CONTRIBUTION" | "WITHDRAWAL"
  value: number; // centavos, inteiro > 0
  referenceDate: string; // "YYYY-MM-DD"
  notes?: string; // até 280 caracteres
}

// 201 Created
interface IRegisterSnapshotResponse {
  snapshot: IVentureSnapshot; // datas serializadas em ISO
}

// Mapeamento interno (controller → service)
// MONTHLY_RECORD             → { currentTotalValue: value }
// CONTRIBUTION / WITHDRAWAL  → { movementValue: value }
```

```ts
// src/api/controllers/snapshots.controller.types.ts
export interface ISnapshotWriter {
  save(data: SnapshotInput): IVentureSnapshot;
}

export interface ISnapshotsController {
  create(req: Request): Promise<Response>;
}
```

Ajuste no service (`snapshots.service.ts:159-173`):

```ts
const movement = resolveMovement(data);
const baseContributed = previous?.totalContributed ?? venture.initialValue;
const totalContributed = baseContributed + movement;
// ...
const fallback =
  (previous?.currentTotalValue ?? venture.initialValue) + movement;
const currentTotalValue = resolveCurrentTotalValue(data, fallback);
```

## 4. Step-by-Step Execution Plan

- [x] **Step 1: Preparação e contrato do controller**
  - Criar `src/api/controllers/snapshots.controller.types.ts` com `ISnapshotWriter`, `IRegisterSnapshotPayload`, `IRegisterSnapshotResponse` e `ISnapshotsController`.
  - Criar `src/api/controllers/snapshots.controller.ts` com `create(req)` → parsing do JSON, validação de `ventureId`/`type`/`value`/`referenceDate`/`notes`, mapeamento para `SnapshotInput` e resposta `201 { snapshot }`; erros de validação como `ApiError(400, ..., { field, rule })` e `ApiError` do service propagado via `handle()`.
  - Criar `src/api/controllers/index.ts` (barrel).

- [x] **Step 2: Ajuste de comportamento no service**
  - Reusar o resultado de `resolveMovement` no cálculo de `totalContributed` e no fallback de `currentTotalValue` (aporte soma, resgate subtrai o montante anterior).
  - Manter intactas todas as validações e o cálculo de `grossProfit`/`profitPercentage`.

- [x] **Step 3: Rota e assets**
  - Instanciar `SnapshotsController` em `index.ts` e registrar `"/api/snapshots": withRequestLog("json", (req) => snapshotsController.create(req))`.
  - Em `src/utils/staticAssets.ts`: adicionar `/vendor/bootstrap/bootstrap.bundle.min.js`, `/views/components/registerSnapshotModal/modal.js`, `/views/components/toast/toast.js` e incluir os dois componentes em `viewStyles`.

- [x] **Step 4: Componente de toast**
  - `src/views/components/toast/{index.ts,view.eta,styles.css,toast.js}`; o template renderiza o container `#toastStack` (`aria-live="polite"`) e o script, que expõe `window.AppToast.show({ variant, message })`, monta o toast com `role="status"`, remove após 4s e empilha.

- [x] **Step 5: Componente do modal**
  - `src/views/components/registerSnapshotModal/{index.ts,view.eta,styles.css,modal.js}` com markup `modal fade` do Bootstrap, título dinâmico, `select` de tipo (MONTHLY_RECORD/CONTRIBUTION/WITHDRAWAL com rótulos PT-BR), `input number` de valor (reais → centavos), `input date` de data de aplicação, `textarea` de nota e os três botões (`Cancelar` via `data-bs-dismiss`, `Registrar` e `Registrar e próximo` como submit com `data-action`).
  - `modal.js`: abrir pelo botão da linha (`data-register-venture`), preencher título/`ventureId`, resetar defaults (tipo `MONTHLY_RECORD`, data = hoje), bloquear botões durante o POST, tratar `201` (toast success + reload ou próximo) e erro (toast danger com a `message`, modal aberto), resolver o próximo pela ordem de `tr[data-venture-id]` do DOM e, no último, fechar e recarregar.

- [x] **Step 6: Integração na tabela e na página**
  - `tesouroDiretoTable/view.eta`: `Guardar` → `Registrar`, adicionar `data-register-venture`, `data-venture-id` e `data-venture-name` no item de menu; manter `Sacar`/`Arquivar`/`Editar` inertes.
  - `tesouroDireto/view.eta`: incluir o toast antes do modal (garante ordem dos `defer`) após o include da tabela.
  - `views.controller.ts`: adicionar `registerSnapshotModal.style` e `toast.style` ao `extraStyles` de `index()`; ajustar o barrel de componentes.

- [x] **Step 7: Testes e validação**
  - Criar `src/api/controllers/snapshots.controller.test.ts` (service stub injetado, `Request` reais) com os casos da Seção 5.
  - Adicionar ao `snapshots.test.ts` os 5 casos de lacuna.
  - Rodar escopo, regressão e typecheck; smoke test do `POST /api/snapshots` com o servidor local.

- [x] **Step 8: Documentação e memória**
  - Registrar `MEM-2026-033` (camada de controllers HTTP + contrato do POST de snapshot + comportamento de aporte no montante) em `VIEWS_MEMORY.md`/`SERVICES_MEMORY.md` e no `INDEX.md`.
  - Atualizar `.agents/PROJECT.md` para refletir `src/api/controllers/` em uso.
  - Gerar o registro de execução (Fase 5 do `DEFAULT_EXECUTE.md`) em `.agents/plans/add-register-snapshot-flow-execution.md`.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bun test src/api/controllers/snapshots.controller.test.ts`
  - `bun test src/api/services/snapshots/snapshots.test.ts`
  - `bun test`
  - `bunx tsc --noEmit`
  - Smoke test (servidor local): `POST /api/snapshots` com payload válido → `201`; payload sem `type` → `400`; `ventureId` inexistente → `404`; resgate acima do aportado → `422`.

- **Controller — casos de teste** (`snapshots.controller.test.ts`, service stub que registra chamadas):
  1. `MONTHLY_RECORD` → `201`, corpo `{ snapshot }` e service chamado com `currentTotalValue` igual ao `value`.
  2. `CONTRIBUTION` → service chamado com `movementValue` e **sem** `currentTotalValue`.
  3. `WITHDRAWAL` → service chamado com `movementValue` e **sem** `currentTotalValue`.
  4. `notes` presente é repassada; ausente chega como `undefined`.
  5. `referenceDate` convertida para `Date` em UTC (`2026-11-13` → `2026-11-13T00:00:00.000Z`).
  6. JSON inválido → `400` com `{ error: true, statusCode: 400 }`.
  7. `type` ausente ou fora do enum → `400` com `details.field === "type"`.
  8. `value` ausente, `0`, negativo ou fracionário → `400` com `details.field === "value"`.
  9. `ventureId` ausente/vazio → `400` com `details.field === "ventureId"`.
  10. `referenceDate` ausente ou inválida → `400` com `details.field === "referenceDate"`.
  11. `notes` acima de 280 caracteres → `400` com `details.field === "notes"`.
  12. `ApiError(404)` do service → status `404` e corpo `{ error: true, message: "Venture não encontrada" }` preservados.
  13. `ApiError(422)` do service → status `422` e `details` preservados.

- **Service — casos novos** (`snapshots.test.ts`):
  1. `CONTRIBUTION` sem `currentTotalValue` soma o movimento ao montante anterior.
  2. `WITHDRAWAL` sem `currentTotalValue` subtrai o movimento do montante anterior.
  3. `referenceDate` inválida → `400` (`rule: "date"`).
  4. `currentTotalValue` negativo → `422` (`rule: "min"`).
  5. `notes` é persistida no registro criado.

- **Edge cases to verify**:
  - Aporte/resgate sem snapshot anterior parte de `venture.initialValue`.
  - `value` em centavos arredondado no client (`Math.round(reais * 100)`) — sem floats no payload.
  - Fuso: `type="date"` gera `2026-11-13` e deve persistir `2026-11-13` (sem deslocar para 12).
  - "Registrar e próximo" no último item da tabela fecha o modal e recarrega.
  - Tabela vazia/filtro sem resultados: nenhum botão `Registrar` disponível.
  - Duplo clique no envio: botões desabilitados até a resposta.
  - Modal reaberto para o mesmo investimento após erro mantém os dados digitados.
  - `Escape`/`Cancelar` fecham sem POST.
  - Toast com mensagem longa do backend não quebra o layout.

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - 2026-11-13 — Fase 1 executada (auditoria do diretório `src/api`, service, views, assets). Nenhum arquivo alterado.
  - 2026-11-13 — Fase 2 respondida pelo desenvolvedor: `1A, 2A, 3A, 4A, 5A; 5bA, 6B, 7A, 8A, 9A, 10B`.
  - 2026-11-13 — Plano gerado (Fase 3 + 4 + 5). Aguardando revisão/aprovação.
  - 2026-11-13 — Aprovação registrada: “Pode executar”. Plan ID `add-register-snapshot-flow` atribuído após verificação de unicidade (planos, histórico, branches e commits).

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Cada item é atômico, verificável e rastreável ao passo da Seção 4.

### Step 1: Preparação e contrato do controller

- [x] `TODO-01` Criar `src/api/controllers/snapshots.controller.types.ts` com `IRegisterSnapshotPayload`, `IRegisterSnapshotResponse`, `ISnapshotWriter` e `ISnapshotsController`.
- [x] `TODO-02` Criar `src/api/controllers/snapshots.controller.ts` com a classe `SnapshotsController` recebendo `ISnapshotWriter` no construtor.
- [x] `TODO-03` Implementar em `create(req)` o parsing do JSON com `ApiError(400, "Payload inválido", { field: "body" })` para corpo inválido.
- [x] `TODO-04` Implementar `validatePayload` cobrindo `ventureId`, `type`, `value` (inteiro > 0), `referenceDate` e `notes` (≤ 280), cada um com `details.field` próprio.
- [x] `TODO-05` Implementar `toSnapshotInput` mapeando `value` → `currentTotalValue` (MONTHLY_RECORD) ou `movementValue` (CONTRIBUTION/WITHDRAWAL).
- [x] `TODO-06` Retornar `201` com `{ snapshot }` serializado por `Response.json` e propagar `ApiError` do service via `handle()`.
- [x] `TODO-07` Criar `src/api/controllers/index.ts` exportando o controller e seus tipos.

### Step 2: Ajuste de comportamento no service

- [x] `TODO-08` Em `snapshots.service.ts`, calcular `resolveMovement` uma única vez e reusar em `totalContributed`.
- [x] `TODO-09` Alterar o fallback de `resolveCurrentTotalValue` para `(previous?.currentTotalValue ?? venture.initialValue) + movement`.
- [x] `TODO-10` Confirmar que `MONTHLY_RECORD` e envios com `currentTotalValue` explícito permanecem inalterados.

### Step 3: Rota e assets

- [x] `TODO-11` Instanciar `SnapshotsController({ save: (data) => snapshotsService.save(data) })` em `index.ts`.
- [x] `TODO-12` Registrar `"/api/snapshots": withRequestLog("json", (req) => snapshotsController.create(req))` antes do catch-all `/*`.
- [x] `TODO-13` Adicionar `bootstrap.bundle.min.js` e os scripts `modal.js`/`toast.js` em `staticAssetRoutes`.
- [x] `TODO-14` Incluir `registerSnapshotModal` e `toast` no array `viewStyles` de `src/utils/staticAssets.ts`.

### Step 4: Componente de toast

- [x] `TODO-15` Criar `src/views/components/toast/index.ts` com `toastView` (`IViewConfig`).
- [x] `TODO-16` Criar `src/views/components/toast/view.eta` com o container `#toastStack` (`aria-live="polite"`) e o `<script defer src="/views/components/toast/toast.js">`.
- [x] `TODO-17` Criar `src/views/components/toast/styles.css` com posição fixa inferior direita e variantes `--success`/`--danger` usando `--app-success`/`--app-danger`.
- [x] `TODO-18` Criar `src/views/components/toast/toast.js` (IIFE + guarda em `dataset`) expondo `window.AppToast.show({ variant, message })` com auto-dismiss de 4s e empilhamento.

### Step 5: Componente do modal

- [x] `TODO-19` Criar `src/views/components/registerSnapshotModal/index.ts` com `registerSnapshotModal` (`IViewConfig`).
- [x] `TODO-20` Criar `view.eta` com `modal fade` + `<form>` contendo título dinâmico, `select` de tipo, `input number` de valor, `input date` de data de aplicação e `textarea` de nota.
- [x] `TODO-21` Adicionar os botões `Cancelar` (`data-bs-dismiss`), `Registrar` (`data-action="register"`) e `Registrar e próximo` (`data-action="register-next"`), ambos `type="submit"`.
- [x] `TODO-22` Criar `styles.css` do modal ajustando campos ao tema (`--app-primary`, `--app-secondary`) sem sobrescrever o Bootstrap global.
- [x] `TODO-23` Criar `modal.js` com abertura a partir de `[data-register-venture]`, preenchimento de título/`ventureId` e reset de defaults (tipo `MONTHLY_RECORD`, data de hoje).
- [x] `TODO-24` Implementar em `modal.js` o POST `fetch("/api/snapshots")` com `value` em centavos, botões desabilitados durante a requisição e `AppToast` para sucesso/erro.
- [x] `TODO-25` Implementar a ação `register` (fechar + `location.reload()`) e `register-next` (próximo por `tr[data-venture-id]`, último fecha e recarrega).
- [x] `TODO-26` Incluir os `<script defer>` do bundle Bootstrap, do toast e do modal no `view.eta`, na ordem correta.

### Step 6: Integração na tabela e na página

- [x] `TODO-27` Renomear `Guardar` → `Registrar` em `tesouroDiretoTable/view.eta` e adicionar `data-register-venture`, `data-venture-id` e `data-venture-name` no botão.
- [x] `TODO-28` Adicionar `data-venture-id` na `<tr>` principal de cada investimento para a navegação de "próximo".
- [x] `TODO-29` Incluir `toast` e `registerSnapshotModal` em `src/views/tesouroDireto/view.eta` (toast antes do modal).
- [x] `TODO-30` Exportar os novos componentes em `src/views/components/index.ts`.
- [x] `TODO-31` Adicionar `registerSnapshotModal.style` e `toast.style` ao `extraStyles` de `ViewsController.index`.

### Step 7: Testes e validação

- [x] `TODO-32` Criar `snapshots.controller.test.ts` com os 13 casos da Seção 5, usando stub de `ISnapshotWriter` que registra chamadas.
- [x] `TODO-33` Adicionar os 5 casos de lacuna em `snapshots.test.ts` (movimento no montante, data inválida, valor negativo, `notes`).
- [x] `TODO-34` Rodar `bun test src/api/controllers/snapshots.controller.test.ts` e registrar contagens.
- [x] `TODO-35` Rodar `bun test src/api/services/snapshots/snapshots.test.ts` e registrar contagens.
- [x] `TODO-36` Rodar o smoke test do `POST /api/snapshots` (201/400/404/422) com o servidor local.

### Step 8: Documentação e memória

- [x] `TODO-37` Registrar `MEM-2026-033` em `.agents/memory/` e adicionar a linha no `INDEX.md`.
- [x] `TODO-38` Atualizar `.agents/PROJECT.md` com `src/api/controllers/`.
- [x] `TODO-39` Criar `.agents/plans/add-register-snapshot-flow-execution.md` com o registro da Fase 5.

### Final Verification

- [x] `TODO-40` Rodar `bun test` (suíte completa) e registrar pass/fail.
- [x] `TODO-41` Rodar `bunx tsc --noEmit` e registrar 0 erros.
- [x] `TODO-42` Revisar a árvore de arquivos contra este plano e reportar alterações e pendências.
