# Implementation Plan: Renderizar a tabela do Tesouro Direto com dados reais do banco

- **Plan ID**: `render-tesouro-table-from-database`
- **Status**: Done
- **Date**: 2026-11-11

## 1. Requirements & Objectives

- **Goal**: Substituir o mock `PREVIEW_TRACKING` do `ViewsController` por dados reais do SQLite, via um novo `PortfolioService` injetado no controller, mantendo busca/filtro/ordenação da toolbar.
- **Scope (in)**:
  - Novo serviço de leitura `src/api/services/portfolio/` (`portfolio.types.ts`, `portfolio.service.ts`, `portfolio.test.ts`).
  - Filtro por `type = TREASURY` dentro do serviço.
  - Injeção do serviço no `ViewsController` (construtor) e wiring em `index.ts` (repositórios → serviços → controller).
  - Remoção de `PREVIEW_TRACKING`/`PREVIEW_ROWS` do controller.
  - Testes unitários **somente do serviço**, com mocks/fakes (sem banco).
  - Remoção de `src/views/views.test.ts` (decisão do desenvolvedor: não manter testes de view).
  - Atualização de documentação/memória.
- **Out of Scope**:
  - Rendas Fixas e Ações (o serviço já nasce parametrizável por tipo, mas as páginas não serão ligadas agora).
  - Alterações de schema, migrations de dados, repositórios (usar `getAll`/`tracking` existentes).
  - Filtros/ordenação novos na toolbar (comportamento permanece igual).
  - Testes de view, de controller ou E2E.
  - Otimização de N+1 (cada venture faz uma leitura de snapshots) — apenas documentada.
- **Decisões confirmadas pelo desenvolvedor**:
  | Tema                 | Decisão                                                                                                  |
  | -------------------- | -------------------------------------------------------------------------------------------------------- |
  | Onde mora a leitura  | **Opção A**: novo `PortfolioService` compondo `VenturesService.getAll()` + `SnapshotsService.tracking()` |
  | Injeção              | **Opção A**: `ViewsController.constructor(eta, trackingReader)`                                          |
  | Testes de view       | **Opção B**: remover `views.test.ts`; cobertura fica na camada de serviço                                |
  | Venture sem snapshot | Exibir com `—` (comportamento atual do mapper)                                                           |
  | Opções do indexador  | Derivadas do conjunto real do Tesouro                                                                    |

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/api/services/portfolio/portfolio.types.ts` (**Create** — readers, input e dependências).
  - `src/api/services/portfolio/portfolio.service.ts` (**Create** — `listTracking`/`execute`).
  - `src/api/services/portfolio/portfolio.test.ts` (**Create** — testes com mocks).
  - `src/api/services/index.ts` (**Modify** — exportar types/service do portfolio).
  - `src/views/views.controller.ts` (**Modify** — receber o reader, buscar TREASURY, remover mock).
  - `index.ts` (**Modify** — instanciar repositórios/serviços e injetar no controller).
  - `src/views/views.test.ts` (**Delete** — decisão do desenvolvedor).
  - `.agents/PROJECT.md`, `.agents/memory/SERVICES_MEMORY.md`, `.agents/memory/INDEX.md` (**Modify**).
  - `.agents/plans/render-tesouro-table-from-database.md` (este plano).
- **Dependencies Required**: **nenhuma nova**.
- **Contexto relevante**:
  - Banco `my-finances.db` com 18 ventures; **2 TREASURY** (`imp-td-selic-2027`, `imp-td-selic-2031`) e 7 snapshots (migration `20261111204436_import-initial-data`).
  - `VenturesService.getAll()` → `Venture[]`; `SnapshotsService.tracking(id)` → `IVentureTracking` (último snapshot, `latestValue`, `totalProfitabilityPercentage`) e lança `ApiError` 404 se o venture não existir.
  - `SnapshotsService` recebe `venturesReader` (interface `IVenturesReader`, compatível com `venturesRepository`).
  - Repositórios exportam instâncias `venturesRepository` e `ventureSnapshotsRepository` (síncronos, `bun:sqlite`).
  - `ViewsController` é síncrono; `index.ts` o cria como `new ViewsController(eta)`.
  - `applyToolbarState`, `toToolbarView`, `toTesouroDiretoTableRow` e `emptyMessage` já existem e continuam no controller.
  - `src/views/views.test.ts` cobre navegação, 404, assets, tabela, toolbar e o mapper; será removido (decisão B), portanto **o mapper deixa de ter teste dedicado**.
  - AGENTS §2: sem comentários; imports por alias `@/...`; interfaces com prefixo `I`.

## 3. Architectural Options & Decision

### Opção A: `PortfolioService` dedicado (escolhida)

```ts
class PortfolioService {
  constructor({ venturesService, snapshotsService }) {}
  listTracking({ type }: { type?: VentureType }) {
    return this.venturesService
      .getAll()
      .filter((venture) => !type || venture.type === type)
      .map((venture) => this.snapshotsService.tracking(venture.id));
  }
}
```

- **Pros**: camada correta (serviço orquestra, view apresenta); filtro testável isoladamente com mocks; reutilizável em Rendas Fixas e Ações; não altera serviços existentes.
- **Cons**: mais um serviço; cada venture dispara uma leitura de snapshots (N+1 aceitável no volume atual).

### Opção B: `trackingAll(type?)` no `SnapshotsService`

- **Pros**: menos arquivos; reaproveita fakes existentes.
- **Cons**: mistura filtro de página no serviço de snapshots; cresce com conceitos de UI.

### Opção C: composição direta no `ViewsController`

- **Pros**: menos código.
- **Cons**: orquestração de domínio na view; nada testável na camada de serviço — contraria o pedido de testes com mocks.

> **Decision**: **Opção A**.

### Injeção no controller

`ViewsController` recebe uma interface de leitura (`IPortfolioTrackingReader`) em vez do serviço concreto, permitindo fake nos testes (se houver) e evitando acoplamento:

```ts
interface IPortfolioTrackingReader {
  listTracking(input: { type?: VentureType }): IVentureTracking[];
}
```

`index.ts` injeta o `PortfolioService` real. O controller importa apenas **tipos** desse módulo (sem carregar banco em testes).

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Serviço de portfólio**:
  - Criar `portfolio.types.ts` com `IPortfolioVenturesReader`, `IPortfolioSnapshotsReader`, `IPortfolioTrackingReader`, `PortfolioServiceInput`, `PortfolioServiceOutput` e `PortfolioServiceDependencies`.
  - Criar `portfolio.service.ts` implementando `IService<PortfolioServiceInput, PortfolioServiceOutput>`, com `execute` delegando a `listTracking`.
  - `listTracking({ type })`: `getAll()` → filtra por `type` (quando informado) → `tracking(id)` → preserva a ordem de `getAll`.

- [x] **Step 2 — Testes do serviço**:
  - Fakes: `createVenturesReader(ventures)` (com contador) e `createTrackingReader(map)` (com registro de ids chamados).
  - Casos: filtra por tipo; sem tipo retorna todos; preserva ordem; não chama `tracking` dos filtrados; vazio quando não há ventures do tipo; `execute` despacha para `listTracking`.
  - Sem banco, sem mocks de módulo — apenas fakes injetados.

- [x] **Step 3 — Integração com a view**:
  - `views.controller.ts`: remover `PREVIEW_TRACKING`; adicionar `PortfolioService`/reader no construtor; em `index(req?)` buscar `listTracking({ type: VentureType.TREASURY })` e manter parse da query, `applyToolbarState`, `toToolbarView`, `toTesouroDiretoTableRow` e `emptyMessage`.
  - `index.ts`: instanciar `VenturesService`, `SnapshotsService` e `PortfolioService` com os repositórios e passar ao `ViewsController`.
  - Garantir que `rendasFixas()`/`acoes()` não mudem.

- [x] **Step 4 — Limpeza e verificação**:
  - Excluir `src/views/views.test.ts` (decisão B) e confirmar que nada mais o importa.
  - Atualizar `.agents/PROJECT.md` (novo diretório `src/api/services/portfolio/`) e registrar `MEM-2026-031` em `SERVICES_MEMORY.md` + `INDEX.md`.
  - Rodar testes escopo, suíte completa, `tsc` e smoke com o banco real.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bun test src/api/services/portfolio/portfolio.test.ts`
  - `bun test`
  - `bunx tsc --noEmit`
  - Smoke (server): `/tesouro-direto`, `?search=2031`, `?indexer=SELIC`, `?sort=amount`, `?search=inexistente`.
- **Edge cases to verify**:
  - Somente TREASURY: as 13 ações, 3 LCIs/CRA ficam fora.
  - Ordem padrão por expiração: `Tesouro Selic 2027` → `Tesouro Selic 2031`.
  - Valores reais: Selic 2027 → `R$ 23.411,57` / `+132,95%`; Selic 2031 → `R$ 7.612,65` / `+363,60%`.
  - Opções do indexador contêm apenas `Selic` (dados reais).
  - Busca `2031` retorna 1 linha; `inexistente` retorna estado vazio filtrado + “Limpar filtros”.
  - `?indexer=SELIC` mantém as 2 linhas; `?indexer=IPCA` retorna vazio.
  - Venture sem snapshot (não há no banco atual, mas coberto pelo mapper) exibiria `—`.
  - Banco vazio não quebra (`[]` → mensagem “Nenhum investimento cadastrado.”).
  - `bun test` cai de 91 para ~68 testes (remoção de `views.test.ts`), sem falhas.
  - `tsc` sem erros após a mudança de construtor.
  - Nenhum import de `@/database` a partir de `src/views/**` (evita abrir o banco em testes de view futuros).

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - 2026-11-11 — Clarificações: (1) Opção A (`PortfolioService`); (2) injeção no controller (A); (3) remover `views.test.ts` (B); (4) ventures sem snapshot com `—` (A); (5) opções do indexador a partir dos dados reais.
  - 2026-11-11 — Dúvida sobre o ponto 1 esclarecida e desenvolvedor confirmou a Opção A.
  - 2026-11-11 — Aprovação registrada: “Pode executar”. Plan ID `render-tesouro-table-from-database` atribuído após verificação de unicidade.
  - 2026-11-12 — Execução: `PortfolioService` + testes (6 casos), injeção no controller, wiring em `index.ts`, remoção de `PREVIEW_TRACKING` e de `src/views/views.test.ts`. Escopo `6 pass`; suíte `75 pass / 0 fail`; `tsc` 0 erros; smoke com dados reais: 2027 (R$ 23.411,57 / +132,95%) e 2031 (R$ 7.612,65 / +363,60%), busca `2031` → 1 linha, `indexer=SELIC` → 2, `search=inexistente` → vazio filtrado.

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Each item must be atomic, verifiable and traceable to its source step in Section 4. This list is the single source of truth for execution progress: update it in the same iteration as any plan change.

### Step 1: Serviço de portfólio

- [x] `TODO-01` Criar `src/api/services/portfolio/portfolio.types.ts` com `IPortfolioVenturesReader` e `IPortfolioSnapshotsReader`.
- [x] `TODO-02` Adicionar `IPortfolioTrackingReader`, `PortfolioServiceInput`, `PortfolioServiceOutput` e `PortfolioServiceDependencies` no mesmo arquivo de tipos.
- [x] `TODO-03` Criar `src/api/services/portfolio/portfolio.service.ts` com `PortfolioService implements IService`.
- [x] `TODO-04` Implementar `listTracking({ type })` filtrando por tipo e mapeando `tracking(venture.id)`.
- [x] `TODO-05` Implementar `execute(input)` delegando para `listTracking`.
- [x] `TODO-06` Exportar types/service em `src/api/services/index.ts`.

### Step 2: Testes do serviço

- [x] `TODO-07` Criar `portfolio.test.ts` com `createVenturesReader` e `createTrackingReader` (fakes com contadores).
- [x] `TODO-08` Cobrir “filtra pelo tipo informado” (só TREASURY, sem chamar tracking dos demais).
- [x] `TODO-09` Cobrir “sem tipo retorna todos os trackings”.
- [x] `TODO-10` Cobrir “preserva a ordem de `getAll`”.
- [x] `TODO-11` Cobrir “retorna vazio quando não há ventures do tipo”.
- [x] `TODO-12` Cobrir “`execute` despacha para `listTracking`”.
- [x] `TODO-13` Rodar `bun test src/api/services/portfolio/portfolio.test.ts` e registrar o resultado.

### Step 3: Integração com a view

- [x] `TODO-14` Adicionar o reader de tracking ao construtor do `ViewsController`.
- [x] `TODO-15` Remover `PREVIEW_TRACKING`/`PREVIEW_ROWS` de `views.controller.ts`.
- [x] `TODO-16` Em `index(req?)`, buscar `listTracking({ type: VentureType.TREASURY })` e manter `applyToolbarState`, `toToolbarView` e `emptyMessage`.
- [x] `TODO-17` Importar `VentureType` de `@/contracts` no controller e usar apenas `import type` do portfólio.
- [x] `TODO-18` Em `index.ts`, instanciar `VenturesService` com `venturesRepository`.
- [x] `TODO-19` Em `index.ts`, instanciar `SnapshotsService` com `venturesRepository` e `ventureSnapshotsRepository`.
- [x] `TODO-20` Em `index.ts`, instanciar `PortfolioService` e passá-lo ao `ViewsController`.

### Step 4: Limpeza, documentação e verificação

- [x] `TODO-21` Excluir `src/views/views.test.ts` e confirmar que não há imports remanescentes.
- [x] `TODO-22` Atualizar `.agents/PROJECT.md` com `src/api/services/portfolio/`.
- [x] `TODO-23` Criar `MEM-2026-031` em `.agents/memory/SERVICES_MEMORY.md` e a linha no `INDEX.md`.
- [x] `TODO-24` Criar o registro de execução em `.agents/plans/render-tesouro-table-from-database-execution.md`.

### Final Verification

- [x] `TODO-25` Rodar `bun test` e registrar as contagens (esperado ~68 pass).
- [x] `TODO-26` Rodar `bunx tsc --noEmit` e confirmar 0 erros.
- [x] `TODO-27` Smoke: `/tesouro-direto` com as 2 linhas reais e ordem 2027 → 2031.
- [x] `TODO-28` Smoke: `?search=2031` (1 linha), `?indexer=SELIC` (2), `?search=inexistente` (vazio filtrado).
- [x] `TODO-29` Confirmar que `/rendas-fixas` e `/acoes` seguem renderizando sem tabela.
