# Implementation Plan: Botão e modal de novo investimento (controller POST + service)

- **Plan ID**: `add-create-venture-modal-flow`
- **Status**: Done
- **Date**: 2026-11-16

## 1. Requirements & Objectives

- **Goal**: permitir a criação de um novo investimento/venture pela interface gráfica, por meio de um botão outlined no verde de sucesso posicionado abaixo da toolbar do Tesouro Direto, que abre um modal com todos os campos do domínio e persiste via `POST /api/ventures`.
- **Scope**:
  - Botão outlined `btn-outline-success` com ícone `bi bi-plus-lg` antes do texto, abaixo da toolbar de `/tesouro-direto` (Q1=A).
  - Modal Bootstrap com título dinâmico por página (Q3=B) e tipos filtrados por página (Q2=B). Nesta iteração apenas `/tesouro-direto` é conectado, portanto o select oferece somente `TREASURY` e o título é "Novo investimento Tesouro Direto".
  - Campos comuns (`name`, `internalCode`, `type`, `boughtAt`, `expiresIn`) e campos condicionais:
    - `FIXED`: `initialValue`, `indexer`, `rate` (%), `source`; `expiresIn` obrigatório na UI (Q8=A).
    - `VARIABLE`: `quantity`, `unitPrice`; backend deriva `totalPrice` e `initialValue` (Q7=A).
  - `category` derivada do `type` (`STOCK`/`FII` → `VARIABLE`; demais → `FIXED`), sem select de categoria (Q2=B).
  - Novo controller `POST /api/ventures` (Q4=A) com parsing/validação de payload e resposta `201 { venture }`.
  - Extensão de `VenturesService.create` para normalização, derivação de totais e mapeamento de `internalCode` duplicado para `409` (Q10=A, Q11=A).
  - UI em reais convertida para centavos inteiros no payload; `rate` em percentual decimal (Q6=A).
  - Pós-criação: toast `success`, fecha o modal e recarrega a página preservando filtros/ordenação (Q9=A).
  - Testes unitários apenas de controller e service (Q13).
- **Out of Scope**:
  - Conectar o botão/modal em `/rendas-fixas` e `/acoes` nesta iteração (Q1=A). O componente será preparado por página, mas sem trigger nessas rotas.
  - Criação de snapshot inicial junto com o venture.
  - Edição/exclusão de ventures, importação/exportação, paginação, autenticação/guards e i18n.
  - Testes de views/SSR, de `modal.js` e de scripts de UI (Q13).
  - Alterações em `package.json`, `bun.lock`, `.env`, `.nvmrc`, `opencode.json` e em `contracts/` (os contratos existentes já cobrem todos os campos).
  - Novo tipo de resposta paginada, listagem pública `GET /api/ventures` ou endpoint de consulta de `internalCode`.

> **Conflito registrado (Q1=A + Q2=B)**: com o botão apenas em `/tesouro-direto` e tipos filtrados por página, somente `TREASURY` é criável pela UI. Os ramos `FIXED` não-Tesouro e `VARIABLE` permanecem implementados, mapeados e testados no controller/service, porém sem trigger nesta iteração. Se a intenção for criar qualquer venture pela UI, a decisão Q1 deve mudar para "botão nas três páginas" — o plano já isola essa configuração para tornar a mudança pequena.

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/api/services/ventures/ventures.types.ts` — **Modify** (`ICreateVentureInput`; `VenturesServiceInput` da ação `create`).
  - `src/api/services/ventures/ventures.utils.ts` — **Create** (`resolveCategory`, `normalizeVentureInput`, `resolveVentureInput`, `isUniqueInternalCodeError`).
  - `src/api/services/ventures/ventures.errors.ts` — **Modify** (`duplicatedInternalCode`).
  - `src/api/services/ventures/validateVentures.ts` — **Modify** (aceitar `ICreateVentureInput`; exigir `initialValue` inteiro e não negativo para `FIXED`).
  - `src/api/services/ventures/ventures.service.ts` — **Modify** (`create`: normalizar → validar → resolver → persistir com tratamento de duplicidade).
  - `src/api/services/ventures/ventures.test.ts` — **Modify** (derivação de categoria/totais, normalização, `409`, `initialValue` inválido).
  - `src/api/controllers/ventures/ventures.controller.ts` — **Create**.
  - `src/api/controllers/ventures/ventures.controller.types.ts` — **Create**.
  - `src/api/controllers/ventures/ventures.utils.ts` — **Create** (`readJson`, `parseVenturePayload`).
  - `src/api/controllers/ventures/ventures.mappers.ts` — **Create** (`toCreateVentureInput`).
  - `src/api/controllers/ventures/ventures.errors.ts` — **Create** (`invalidField`).
  - `src/api/controllers/ventures/ventures.controller.test.ts` — **Create**.
  - `src/api/controllers/ventures/index.ts` — **Create** (barrel).
  - `src/api/controllers/index.ts` — **Modify** (exportar `./ventures`).
  - `index.ts` — **Modify** (instanciar `VenturesController` e registrar `POST /api/ventures`).
  - `src/views/components/newVentureModal/index.ts` — **Create** (config, tipos e opções por página).
  - `src/views/components/newVentureModal/view.eta` — **Create** (botão + modal).
  - `src/views/components/newVentureModal/styles.css` — **Create**.
  - `src/views/components/newVentureModal/modal.js` — **Create** (abrir/fechar, campos condicionais, POST, toast).
  - `src/views/components/index.ts` — **Modify** (barrel).
  - `src/views/tesouroDireto/view.eta` — **Modify** (incluir o componente após a toolbar e carregar o bundle Bootstrap uma única vez).
  - `src/views/components/registerSnapshotModal/view.eta` — **Modify** (remover o `<script>` do bundle Bootstrap, que passa a ser carregado pela página).
  - `src/views/views.controller.ts` — **Modify** (`ventureModal` no render + `extraStyles`).
  - `static/styles/theme.css` — **Modify** (`--bs-success` e `--bs-success-rgb` → `--app-success`).
  - `src/utils/staticAssets.ts` — **Modify** (CSS no `viewStyles` e rota do `modal.js`).
  - `.agents/memory/*.md` e `.agents/PROJECT.md` — **Modify** (memória da nova feature).

- **Fatos apurados no código**:
  - `VenturesService.create` já existe (`ventures.service.ts:46-50`) e apenas valida, mapeia com `toInsert` e persiste; não normaliza nem trata duplicidade.
  - `VentureInput` (`ventures.types.ts:12-26`) já contém todos os campos necessários: comuns, `FIXED` e `VARIABLE`.
  - `validateVentures` (`validateVentures.ts:6-84`) cobre datas, futuro, `STOCK` + `expiresIn`, obrigatoriedade de `indexer`/`rate`/`source` (FIXED) e `quantity`/`unitPrice`/`totalPrice` (VARIABLE), mas **não** exige `initialValue` nem valida inteiro.
  - O banco armazena dinheiro em centavos (`integer`) e `rate` como `real` (`database/models/ventures.ts:55-65`); há índice único parcial em `internal_code` quando `deleted_at IS NULL` (`ventures.ts:75-79`).
  - `toInsert` (`ventures.mappers.ts:23-41`) zera campos incompatíveis com a categoria; `toVenture` especializa o retorno por `FIXED`/`VARIABLE`.
  - O controller de snapshots é o padrão da camada: classe com port injetado, `readJson`/`parse*` em `*.utils.ts`, `to*Input` em `*.mappers.ts`, `invalidField` em `*.errors.ts`, `ApiError.handle()` para erros e `Response.json(body, { status: 201, headers: JsonHeadersInit })` (`snapshots.controller.ts:18-32`).
  - `src/api/controllers/index.ts` hoje exporta apenas `./snapshots`; `index.ts:33` instancia `SnapshotsController(snapshotsService)` e a rota fica em `index.ts:50-52`.
  - O modal de snapshot usa Bootstrap bundle servido por `staticAssetRoutes` (`staticAssets.ts:44-58`), guarda de idempotência por `dataset`, `form.reportValidity()`, toast e reload após 1200 ms (`modal.js:1-182`).
  - A página do Tesouro inclui toolbar, tabela, toast e modal de snapshot (`tesouroDireto/view.eta:7-12`); `/rendas-fixas` e `/acoes` são placeholders sem toolbar/tabela.
  - `theme.css` mapeia `--bs-primary/secondary/tertiary/dark`, mas **não** `--bs-success`; por isso `btn-outline-success` usaria o verde padrão do Bootstrap, não `--app-success: #4a8c3a`.
  - `ViewsController.index` monta `extraStyles` (`views.controller.ts:90-95`) e `render` repassa `rows`, `toolbar`, `emptyMessage` e `styles`.
  - O projeto não usa comentários no código sem solicitação e exige helpers em `<modulo>.utils.ts`, mappers em `<modulo>.mappers.ts` e fábricas de `ApiError` em `<modulo>.errors.ts` (`.agents/AGENTS.md` §2).
  - Linha de base em 2026-11-16: `bun test` → **106 pass / 0 fail**; `bunx tsc --noEmit` → **0 erros**.

- **Dependencies Required**: nenhuma. Bootstrap e Bootstrap Icons já estão instalados e servidos localmente; o bundle JS já é exposto como asset.

## 3. Architectural Options & Decision

### Option A: Controller fino + `VenturesService` estendido + modal Bootstrap

Controller valida/mapeia o payload (reais → centavos) e delega ao service; o service normaliza, deriva categoria e totais de renda variável, valida e traduz violação do índice único em `409`. A UI usa Bootstrap Modal e um componente novo com botão + modal + script, reaproveitando toast e o padrão de reload.

- **Pros**: mantém a regra de negócio no service (reusável e testável); controller fino e testável por port; zero dependências novas; Bootstrap já resolve foco/`Esc`/`backdrop`; componente isolado permite plugar o botão nas outras páginas depois; erro de duplicidade tem resposta semântica.
- **Cons**: exige normalização/derivação no service e tratamento específico de erro do SQLite; adiciona um componente e um script novos; o botão aparece apenas no Tesouro nesta iteração por decisão Q1=A.

### Option B: `CreateVentureService` dedicado + `<dialog>` nativo

Novo serviço exclusivo de criação e modal nativo, com cálculo de totais no client.

- **Pros**: separação por caso de uso; markup mais simples.
- **Cons**: duplica responsabilidades já cobertas por `VenturesService`; cálculo no client cria segunda fonte de verdade para `totalPrice`/`initialValue`; `<dialog>` não traz o padrão de acessibilidade/foco do Bootstrap já usado no projeto; contraria Q11=A.

### Option C: Criação inline (sem modal) no controller

Formulário sempre visível abaixo da toolbar, sem modal, com o controller expondo os campos crus.

- **Pros**: menos JavaScript; sem estado de modal.
- **Cons**: não atende ao requisito de modal; ocupa espaço permanente; pior UX para formulários longos e condicionais; contraria o critério 2 e Q9=A.

> **Decision**: **Option A**. Centraliza derivação e validação no `VenturesService`, mantém o controller alinhado ao padrão de `SnapshotsController`, usa o Bootstrap Modal já disponível e isola a configuração por página para viabilizar a expansão futura sem reescrever o componente.

### Decisões do desenvolvedor (Fase 2, literais)

1. **A** — botão apenas em `/tesouro-direto`, abaixo da toolbar.
2. **B** — tipos filtrados por página; `category` derivada do tipo.
3. **B** — título dinâmico por página.
4. **A** — rota `POST /api/ventures`.
5. **A** — campos comuns + condicionais por categoria, conforme a Seção 1.
6. **A** — UI em reais; payload em centavos inteiros; `rate` em % decimal.
7. **A** — backend deriva `totalPrice = quantity × unitPrice` e usa como `initialValue` na renda variável.
8. **A** — `expiresIn` obrigatório na UI para `FIXED` (opcional no contrato/service).
9. **A** — `201 { venture }` → fecha modal, toast `success` e reload preservando filtros/ordenação.
10. **A** — `internalCode` duplicado → `ApiError(409)`.
11. **A** — reutilizar/estender `VenturesService.create` e complementar `ventures.test.ts`.
12. **A** — mapear `--bs-success`/`--bs-success-rgb` no `theme.css` e usar `btn btn-outline-success`.
13. **Não** — nenhum teste além de controller e service.

### Contratos (pseudo-assinaturas)

```ts
// POST /api/ventures — Request body
interface ICreateVenturePayload {
  name: string;
  internalCode?: string;
  type: VentureType; // TREASURY | CDB | LCI | LCA | CRA | STOCK | FII
  boughtAt: string; // "YYYY-MM-DD"
  expiresIn?: string; // "YYYY-MM-DD"
  // FIXED
  initialValue?: number; // centavos, inteiro >= 0
  indexer?: IndexerType; // CDI | IPCA | SELIC | PRE | FIXED
  rate?: number; // percentual decimal
  source?: string;
  // VARIABLE (totalPrice/initialValue são derivados no backend)
  quantity?: number;
  unitPrice?: number; // centavos, inteiro > 0
}

// 201 Created
interface ICreateVentureResponse {
  venture: Venture; // datas serializadas em ISO
}

// Erros
// 400 — payload estrutural inválido: { field, rule }
// 409 — internalCode duplicado: { field: "internalCode", rule: "unique" }
// 422 — regra de domínio (ex.: STOCK com expiresIn, boughtAt futuro)
```

```ts
// src/api/services/ventures/ventures.types.ts
export interface ICreateVentureInput extends Omit<
  VentureInput,
  "category" | "initialValue" | "totalPrice"
> {
  category?: VentureCategory;
  initialValue?: number;
  totalPrice?: number;
}

// src/api/controllers/ventures/ventures.controller.types.ts
export interface IVentureWriter {
  create(data: ICreateVentureInput): Venture;
}

export interface IVenturesController {
  create(req: Request): Promise<Response>;
}
```

```ts
// src/api/services/ventures/ventures.utils.ts
export const resolveCategory = (type: VentureType): VentureCategory =>
  type === VentureType.STOCK || type === VentureType.FII
    ? VentureCategory.VARIABLE
    : VentureCategory.FIXED;

export const normalizeVentureInput = (
  input: ICreateVentureInput,
): ICreateVentureInput => {
  /* trim + categoria derivada */
};

export const resolveVentureInput = (
  input: ICreateVentureInput,
): VentureInput => {
  /* deriva totalPrice/initialValue de VARIABLE */
};

export const isUniqueInternalCodeError = (error: unknown): boolean => {
  /* Error com "UNIQUE constraint failed: ventures.internal_code" */
};
```

```ts
// src/views/components/newVentureModal/index.ts
export const NEW_VENTURE_MODAL_CONFIG = {
  "tesouro-direto": {
    title: "Novo investimento Tesouro Direto",
    types: [VentureType.TREASURY],
  },
  "rendas-fixas": {
    title: "Novo investimento Renda Fixa",
    types: [VentureType.CDB, VentureType.LCI, VentureType.LCA, VentureType.CRA],
  },
  acoes: {
    title: "Novo investimento Ações",
    types: [VentureType.STOCK, VentureType.FII],
  },
} as const;
```

## 4. Step-by-Step Execution Plan

- [x] **Step 1: Normalização e criação no `VenturesService`**
  - Criar `ventures.utils.ts` com `resolveCategory`, `normalizeVentureInput` (trim de `name`/`internalCode`/`source`, string vazia → `undefined`, categoria derivada do tipo), `resolveVentureInput` (VARIABLE: `totalPrice = Math.round(quantity * unitPrice)` e `initialValue = totalPrice`) e `isUniqueInternalCodeError`.
  - Adicionar `ICreateVentureInput` em `ventures.types.ts` e usá-lo na ação `create` de `VenturesServiceInput`.
  - Adicionar `duplicatedInternalCode` em `ventures.errors.ts` (`ApiError(409, "internalCode já cadastrado", { field: "internalCode", rule: "unique" })`).
  - Ajustar `validateVentures` para `ICreateVentureInput`: exigir `initialValue` inteiro e não negativo quando `FIXED`; manter as regras atuais de VARIABLE.
  - Alterar `VenturesService.create` para normalizar → validar → resolver → `repository.post` dentro de `try/catch`, convertendo apenas o erro de índice único de `internal_code` em `409` e repropagando os demais.
  - Complementar `ventures.test.ts` cobrindo derivação de categoria, totais de VARIABLE, trim, `409`, `initialValue` ausente/negativo/não inteiro e repropagação de erro genérico.

- [x] **Step 2: Controller `POST /api/ventures`**
  - Criar `src/api/controllers/ventures/ventures.controller.types.ts` com `ICreateVenturePayload`, `IParsedVenturePayload`, `ICreateVentureResponse`, `IVentureWriter` e `IVenturesController`.
  - Criar `ventures.errors.ts` com `invalidField(field, rule, message)`.
  - Criar `ventures.utils.ts` com `readJson` e `parseVenturePayload`: validar objeto, `name` não vazio, `type` do enum, `boughtAt`/`expiresIn` no formato `YYYY-MM-DD` convertidos para `Date` UTC; para FIXED validar `initialValue` inteiro `>= 0`, `indexer` do enum, `rate` finito `>= 0` e `source` não vazio; para VARIABLE validar `quantity` finito `> 0` e `unitPrice` inteiro `> 0`.
  - Criar `ventures.mappers.ts` com `toCreateVentureInput` (remove `category`/totais do payload de VARIABLE e repassa os campos condicionais corretos).
  - Criar `ventures.controller.ts` no padrão de `SnapshotsController`: `create(req)` → `parse` → `map` → `writer.create` → `201 { venture }` com `JsonHeadersInit`; `ApiError` via `handle()`.
  - Criar `index.ts` do módulo e exportá-lo em `src/api/controllers/index.ts`.
  - Criar `ventures.controller.test.ts` cobrindo sucesso FIXED, sucesso VARIABLE, derivação de categoria/totais, `content-type`, erros `400` por campo, `409`/`422` propagados e ausência de campos irrelevantes no input do writer.

- [x] **Step 3: Rota e assets**
  - Em `index.ts`, instanciar `new VenturesController(venturesService)` e registrar `"/api/ventures": { POST: withRequestLog("json", (req) => venturesController.create(req)) }`.
  - Em `src/utils/staticAssets.ts`, incluir `newVentureModal` em `viewStyles` e adicionar a rota `/views/components/newVentureModal/modal.js`.

- [x] **Step 4: Componente de UI (botão + modal)**
  - Em `static/styles/theme.css`, adicionar `--bs-success: var(--app-success)` e `--bs-success-rgb: 74, 140, 58`.
  - Criar `newVentureModal/index.ts` com a configuração `IViewConfig`, o mapa `NEW_VENTURE_MODAL_CONFIG` e `toNewVentureModalView(key)` retornando título + opções (`value`, `label`, `category`).
  - Criar `view.eta` com: linha do botão abaixo da toolbar (`btn btn-outline-success` + `bi bi-plus-lg` antes do texto) e modal `modal fade` com título dinâmico; campos comuns; blocos `data-category="FIXED"` (indexer, rate, source, expiresIn, initialValue) e `data-category="VARIABLE"` (quantity, unitPrice); botões Cancelar e Criar.
  - Criar `styles.css` para o espaçamento do botão e dos blocos condicionais, usando apenas tokens do tema.
  - Criar `modal.js` no padrão do `registerSnapshotModal`: guarda por `dataset`, reset com `boughtAt` de hoje, abertura via clique, alternância de blocos/`required`/`disabled` ao trocar o tipo, `reportValidity`, conversão de reais para centavos, `POST /api/ventures`, toast `success`/`danger` com a `message` do `ApiError`, fechamento e reload após 1200 ms.
  - Exportar o componente em `src/views/components/index.ts`.
  - Incluir o componente em `src/views/tesouroDireto/view.eta` logo após a toolbar e mover o `<script>` do bundle Bootstrap para a página (removendo-o de `registerSnapshotModal/view.eta`) para evitar carregamento duplicado.
  - Em `views.controller.ts`, passar `ventureModal: toNewVentureModalView("tesouro-direto")` em `index()` e incluir `newVentureModal.style` em `extraStyles`; repassar `ventureModal` no `render`.
  - Garantir que a modalidade `VARIABLE` (FII/STOCK) não exiba `expiresIn` e que `FIXED` exija `expiresIn` no client.

- [x] **Step 5: Testes, validação e documentação**
  - Executar os testes dos dois módulos e a suíte completa; corrigir qualquer regressão.
  - Executar `bunx tsc --noEmit`.
  - Fazer smoke manual: abrir `/tesouro-direto`, criar um `TREASURY`, validar toast/reload, tentar `internalCode` duplicado e confirmar toast de erro; opcionalmente validar `POST /api/ventures` com `curl` para FIXED e VARIABLE.
  - Registrar a memória da feature via skill `create-new-memory` e atualizar `INDEX.md` e `.agents/PROJECT.md` se necessário.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bun test src/api/services/ventures/ventures.test.ts`
  - `bun test src/api/controllers/ventures/ventures.controller.test.ts`
  - `bun test`
  - `bunx tsc --noEmit`
  - Smoke manual: `bun run index.ts` e navegar em `http://localhost:3000/tesouro-direto`.
- **Edge cases to verify**:
  - `boughtAt` futura → `422`; `boughtAt`/`expiresIn` com formato inválido → `400`; `STOCK`/`FII` com `expiresIn` → `422`.
  - FIXED sem `indexer`, `rate`, `source` ou `initialValue` → `400`/`422`; `rate` não numérica/negativa → `400`.
  - VARIABLE sem `quantity`/`unitPrice` → `400`; `quantity` fracionária aceita; `unitPrice` fracionário em centavos rejeitado.
  - `totalPrice`/`initialValue` de VARIABLE calculados pelo backend e não aceitos do client.
  - `internalCode` vazio/whitespace vira `undefined` (sem colisão); duplicado ativo → `409`; após soft delete, o mesmo código pode ser recriado.
  - `name`/`source` com espaços são normalizados.
  - Payload não JSON ou não objeto → `400` com `field: "body"`.
  - Modal: blocos ocultos não bloqueiam `reportValidity`; valores em reais convertidos corretamente; botão desabilitado durante o POST; toast mostra a `message` PT-BR do erro.
  - Página recarrega preservando `search`, `indexer`, `sort` e `dir`.

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - 2026-11-16 — Respostas da Fase 2: `1A, 2B, 3B, 4A, 5A, 6A, 7A, 8A, 9A, 10A, 11A, 12A, 13 Não`.
  - **Conflito a confirmar**: Q1=A (botão só no Tesouro) + Q2=B (tipos por página) limita a UI a `TREASURY`. Se o objetivo é criar renda fixa não-Tesouro e ações pela interface, alterar Q1 para "botão nas três páginas" (o componente e o mapa por página já suportam; o custo é incluir o trigger e o toast nas outras duas views).
  - Decisão pendente de confirmação antes da execução: manter a interpretação literal (apenas `TREASURY` criável) ou ampliar Q1 para as três páginas.
  - 2026-11-16 — Desenvolvedor confirmou a interpretação literal ("Isso mesmo, disponível somente para /tesouro-direto") e autorizou a execução do plano. Gates das Fases 1–2 do `DEFAULT_EXECUTE` dispensados pela autorização explícita; casos de teste e causas seguem o plano aprovado.

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Cada item é atômico, verificável e rastreável ao passo da Seção 4. Esta lista é a fonte única de progresso da execução.

### Step 1: Normalização e criação no `VenturesService`

- [x] `TODO-01` Criar `src/api/services/ventures/ventures.utils.ts` com `resolveCategory`.
- [x] `TODO-02` Adicionar `normalizeVentureInput` ao `ventures.utils.ts` (trim e string vazia → `undefined`).
- [x] `TODO-03` Adicionar `resolveVentureInput` ao `ventures.utils.ts` (derivação de `totalPrice`/`initialValue` de VARIABLE).
- [x] `TODO-04` Adicionar `isUniqueInternalCodeError` ao `ventures.utils.ts`.
- [x] `TODO-05` Adicionar `ICreateVentureInput` em `ventures.types.ts` e usá-lo na ação `create` de `VenturesServiceInput`.
- [x] `TODO-06` Adicionar `duplicatedInternalCode` em `ventures.errors.ts`.
- [x] `TODO-07` Ajustar `validateVentures.ts` e `VenturesService.validate` para aceitar `ICreateVentureInput` e exigir `initialValue` inteiro `>= 0` em FIXED.
- [x] `TODO-08` Alterar `VenturesService.create` para normalizar, validar, resolver e persistir.
- [x] `TODO-09` Tratar o erro de índice único de `internal_code` como `ApiError(409)` em `VenturesService.create`.
- [x] `TODO-10` Adicionar em `ventures.test.ts` casos de derivação de categoria e de totais de VARIABLE.
- [x] `TODO-11` Adicionar em `ventures.test.ts` casos de trim/normalização, `409`, `initialValue` inválido e repropagação de erro genérico.

### Step 2: Controller `POST /api/ventures`

- [x] `TODO-12` Criar `src/api/controllers/ventures/ventures.controller.types.ts` com payloads, resposta, `IVentureWriter` e `IVenturesController`.
- [x] `TODO-13` Criar `src/api/controllers/ventures/ventures.errors.ts` com `invalidField`.
- [x] `TODO-14` Criar `src/api/controllers/ventures/ventures.utils.ts` com `readJson` e `parseVenturePayload`.
- [x] `TODO-15` Validar em `parseVenturePayload` os campos comuns e as regras condicionais de FIXED e VARIABLE.
- [x] `TODO-16` Criar `src/api/controllers/ventures/ventures.mappers.ts` com `toCreateVentureInput`.
- [x] `TODO-17` Criar `src/api/controllers/ventures/ventures.controller.ts` no padrão de `SnapshotsController`.
- [x] `TODO-18` Criar `src/api/controllers/ventures/index.ts` e exportar o módulo em `src/api/controllers/index.ts`.
- [x] `TODO-19` Criar `ventures.controller.test.ts` para sucesso FIXED e VARIABLE, mapeamento e `content-type`.
- [x] `TODO-20` Criar casos de `400` por campo, `409`/`422` propagados e ausência de campos irrelevantes no `ventures.controller.test.ts`.

### Step 3: Rota e assets

- [x] `TODO-21` Instanciar `VenturesController` em `index.ts` e registrar `POST /api/ventures`.
- [x] `TODO-22` Incluir `newVentureModal` em `viewStyles` e a rota do `modal.js` em `src/utils/staticAssets.ts`.

### Step 4: Componente de UI (botão + modal)

- [x] `TODO-23` Adicionar `--bs-success` e `--bs-success-rgb` em `static/styles/theme.css`.
- [x] `TODO-24` Criar `newVentureModal/index.ts` com `IViewConfig`, `INewVentureModalView`, `NEW_VENTURE_MODAL_CONFIG` e `toNewVentureModalView`.
- [x] `TODO-25` Criar `newVentureModal/view.eta` com o botão outlined e o modal completo (campos comuns e blocos condicionais).
- [x] `TODO-26` Criar `newVentureModal/styles.css` para espaçamento e estados dos blocos condicionais.
- [x] `TODO-27` Criar `newVentureModal/modal.js` com abertura, reset, alternância de campos, conversão para centavos, POST, toast e reload.
- [x] `TODO-28` Exportar `newVentureModal` em `src/views/components/index.ts`.
- [x] `TODO-29` Incluir o componente após a toolbar em `src/views/tesouroDireto/view.eta`.
- [x] `TODO-30` Mover o bundle Bootstrap para `tesouroDireto/view.eta` e removê-lo de `registerSnapshotModal/view.eta`.
- [x] `TODO-31` Passar `ventureModal` e `newVentureModal.style` em `views.controller.ts` (`index` e `render`).

### Final Verification

- [x] `TODO-32` Executar `bun test src/api/services/ventures/ventures.test.ts` e registrar o resultado.
- [x] `TODO-33` Executar `bun test src/api/controllers/ventures/ventures.controller.test.ts` e registrar o resultado.
- [x] `TODO-34` Executar `bun test` e confirmar 0 falhas.
- [x] `TODO-35` Executar `bunx tsc --noEmit` e confirmar 0 erros.
- [x] `TODO-36` Verificar o smoke de renderização em `/tesouro-direto` (HTML, título, botão, asset e CSS); a criação via POST sem mutar o banco ficou coberta pelos testes de controller/service.
- [x] `TODO-37` Registrar a memória da feature (`MEM-2026-035`, `MEM-2026-036`) e atualizar `INDEX.md`; `.agents/PROJECT.md` não exigiu alteração.
