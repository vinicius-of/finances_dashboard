# Implementation Plan: Repositórios de Acesso a Dados (`src/repositories`)

- **Plan ID**: `add-data-repositories-layer`
- **Status**: Done
- **Date**: 2026-09-24

## 1. Requirements & Objectives

- **Goal**: Criar a camada de repositórios em `src/repositories/`, um módulo por model do banco (`ventures` e `ventureSnapshots`), expondo os métodos básicos padronizados: `get`, `getAll`, `post`, `batchInsert`, `patch`, `softDelete` e `restore`.
- **Scope (in)**:
  - Bridge de banco em `src/configs/database/index.ts` (reexporta os modelos + tipos inferidos `Select*`/`Insert*`) — revisão de escopo aprovada em 2026-09-24 durante a execução;
  - `src/repositories/ventures.ts` e `src/repositories/ventureSnapshots.ts` (objetos de módulo);
  - `src/repositories/index.ts` (barrel);
  - Métodos: `get`, `getAll`, `post`, `batchInsert`, `patch`, `softDelete`, `restore`;
  - Filtro padrão `deleted_at IS NULL` em todas as leituras (memória `MEM-2026-014`);
  - Atualização de `.agents/PROJECT.md` e `.agents/ARCHITECTURE.md` (nova camada + bridge);
  - Memória: atualizar `MEM-2026-018` (caminho do bridge) e registrar o contrato dos repositórios.
- **Out of Scope**:
  - Serviços, controllers/rotas, guards e middlewares (camadas HTTP ficam para outra task);
  - Filtros e paginação em `getAll` (a v1 retorna todos os não deletados);
  - Mapeamento das linhas do banco para os contratos `IVenture`/`IVentureSnapshot` (fica na camada de serviço);
  - Alterações em `contracts/` e no schema/migrações do banco;
  - Recriar `src/database/index.ts` — o bridge passa a viver em `src/configs/database/`;
  - `delete()` físico — removido por decisão (existe apenas soft-delete).

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/configs/database/index.ts` (Create — bridge de modelos + tipos inferidos)
  - `src/repositories/ventures.ts` (Create)
  - `src/repositories/ventureSnapshots.ts` (Create)
  - `src/repositories/index.ts` (Create)
  - `.agents/PROJECT.md` (Modify — documentar `src/repositories/` e `src/configs/database/`)
  - `.agents/ARCHITECTURE.md` (Modify — estrutura de diretórios)
  - `.agents/memory/DATABASE_MEMORY.md` (Modify — `MEM-2026-018`), `.agents/memory/REPOSITORIES_MEMORY.md` (Create), `.agents/memory/INDEX.md` (Modify)
- **Dependencies Required**: nenhuma nova biblioteca. Usa `db` de `@/database` (memória `MEM-2026-010`) e `ventures`/`ventureSnapshots` + tipos `Select*`/`Insert*` de `@/src/configs/database`.
- **Contexto relevante**:
  - `src/database/index.ts` (memória `MEM-2026-018`) **não existe mais**; por decisão do desenvolvedor, o bridge foi recriado em `src/configs/database/index.ts`.
  - `PROJECT.md`/`ARCHITECTURE.md` não documentam `src/repositories/` (serão atualizados). Observação: `PROJECT.md` cita `src/api/routes/`, mas o diretório real é `src/api/controllers/` (fora do escopo).
  - `src/configs/` estava vazio e passa a abrigar `database/`.
  - Soft-delete é abstração **apenas de banco**; o Drizzle não filtra automaticamente (`MEM-2026-014`).
  - Campos de auditoria: `created_at`/`updated_at` têm defaults de aplicação; `updated_at` usa `$onUpdateFn` (bump automático em updates).

## 3. Architectural Options & Decision

### Option A: Dois módulos explícitos com objeto de módulo (escolhida)

- **Pros**: leitura direta; tipos exatos por modelo; cada arquivo evolui isolado; zero abstração prematura para 2 modelos.
- **Cons**: padrão dos métodos repetido entre os arquivos (mitigado mantendo ordem/assinaturas idênticas).

### Option B: Base genérica parametrizada por tabela (factory)

- **Pros**: DRY; novo modelo ganha repositório em poucas linhas.
- **Cons**: tipagem genérica do Drizzle (tabela + colunas de id/deletedAt) fica complexa, com risco de casts; perde clareza; abstração prematura.

### Option C: Classes com injeção de `db`

- **Pros**: testabilidade por injeção/mocks.
- **Cons**: cerimônia desnecessária — o projeto usa `db` singleton e as camadas previstas são funções.

> **Decision**: **Option A**, confirmada pelo desenvolvedor, com o bridge de modelos/tipos em `src/configs/database/index.ts`. Trade-offs das demais foram registrados e descartados.

### Contratos dos métodos (decisões do desenvolvedor)

| Método        | Assinatura                                           | Semântica                                                                                                      |
| ------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `get`         | `(id: string) => Select* \| undefined`               | Busca por id entre **não deletados**.                                                                          |
| `getAll`      | `() => Select*[]`                                    | Todos os **não deletados**, sem filtros/paginação.                                                             |
| `post`        | `(data: Insert*) => Select*`                         | Insere uma linha e retorna a linha criada.                                                                     |
| `batchInsert` | `(data: Insert*[]) => Select*[]`                     | Insere N linhas e retorna as criadas; array vazio → `[]`; erro de conflito (ex.: `internal_code`) **propaga**. |
| `patch`       | `(id: string, data: Patch*) => Select* \| undefined` | Atualiza **apenas registro ativo**; input não permite `id`, `createdAt`, `updatedAt` nem `deletedAt`.          |
| `softDelete`  | `(id: string) => Select* \| undefined`               | Marca `deleted_at` (idempotente: já deletado/inexistente → `undefined`) e retorna a linha.                     |
| `restore`     | `(id: string) => Select* \| undefined`               | **Novo**: seta `deleted_at = null` em registro deletado; já ativo/inexistente → `undefined`.                   |

- `Patch* = Partial<Omit<Insert*, "id" | "createdAt" | "updatedAt" | "deletedAt">>`.
- Registro inexistente (ou fora do filtro de soft-delete): retorna `undefined` — erros HTTP/SSR ficam em `services`/`controllers` (classes `ApiError`/`ViewError`).
- Retorno: linha crua do banco (`Select*`, datas em `string` ISO, com `deletedAt`).

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Preparação**: criar o bridge `src/configs/database/index.ts` e o barrel `src/repositories/index.ts`.
- [x] **Step 2 — Repositório de ventures**: criar `src/repositories/ventures.ts` com `PatchVenture` e os 7 métodos (`get`, `getAll`, `post`, `batchInsert`, `patch`, `softDelete`, `restore`) usando `db`, `ventures`, `SelectVenture`/`InsertVenture`.
- [x] **Step 3 — Repositório de snapshots**: criar `src/repositories/ventureSnapshots.ts` no mesmo formato (`PatchVentureSnapshot`, 7 métodos).
- [x] **Step 4 — Documentação & memória**: atualizar `.agents/PROJECT.md` e `.agents/ARCHITECTURE.md`; atualizar `MEM-2026-018` e registrar o contrato dos repositórios em `.agents/memory/` (skill `create-new-memory`, IDs na sequência global do `INDEX.md`).
- [x] **Step 5 — Verificação**: typecheck + smoke test em banco temporário + limpeza de artefatos.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bunx tsc --noEmit` (comparar com a linha de base: apenas 2 erros pré-existentes em `index.ts` raiz — `eta`/`server` não usados);
  - `DATABASE_URL=./tmp-repo-check.db bun run migrate` (aplicar migrações no banco temporário);
  - `DATABASE_URL=./tmp-repo-check.db bun run tmp-repositories-check.ts` (script temporário de smoke test, removido ao final).
- **Edge cases to verify**:
  - `get`/`patch`/`softDelete`/`restore` com id inexistente → `undefined`;
  - soft-deletado **não** aparece em `get`/`getAll` e **não** é alterável por `patch` (não ressuscita);
  - `softDelete` idempotente (2ª chamada → `undefined`) e `restore` em registro ativo → `undefined`;
  - `restore` limpa `deletedAt` e o registro volta a aparecer em `get`/`getAll`;
  - `batchInsert([])` → `[]`; `batchInsert` com `internal_code` duplicado → erro propagado;
  - `updatedAt` é atualizado automaticamente em `patch`, `softDelete` e `restore`;
  - `patch` não aceita `id`/`createdAt`/`updatedAt`/`deletedAt` (garantido pelo tipo `Patch*`);
  - `restore` que recoloque um `internal_code` já ocupado → erro do índice único parcial propagado.

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_: Fase 2 respondida pelo desenvolvedor em 2026-09-24 — defaults confirmados (camada, objeto de módulo, `undefined`, linha crua, `batchInsert` propaga erro, dois módulos explícitos) e ajustes: `getAll` sem filtros; `patch` restrito (sem `id`/`createdAt`/`deletedAt`); `softDelete` idempotente retornando a linha; **adição do método `restore`**. | **2026-09-24 (execução) — bloqueio**: `src/database/index.ts` (dependência dos TODOs de implementação, memória `MEM-2026-018`) não existe mais. | **Resolvido em 2026-09-24**: desenvolvedor optou pela Opção A com o bridge criado em `src/configs/database/index.ts`; escopo, TODOs e caminhos de import revisados neste documento. | **Execução concluída em 2026-09-25**: `bunx tsc --noEmit` sem erros novos; smoke test com **41/41 verificações ok** em banco temporário (todos os 7 métodos nos dois repositórios + edge cases da Seção 5, incluindo colisão do índice único parcial no `restore` e propagação de conflito no `batchInsert`); artefatos temporários removidos. Achado informativo: `patch(id, {})` lança `No values to set` (Drizzle) — comportamento não especificado no plano, reportado ao desenvolvedor.

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Each item must be atomic, verifiable and traceable to its source step in Section 4.

### Step 1: Preparação

- [x] `TODO-01` Criar `src/configs/database/index.ts` (importa de `@/database/models`; reexporta `ventures`/`ventureSnapshots`; exporta `SelectVenture`, `InsertVenture`, `SelectVentureSnapshot`, `InsertVentureSnapshot`).
- [x] `TODO-02` Criar `src/repositories/index.ts` reexportando `./ventures` e `./ventureSnapshots`.

### Step 2: Repositório de ventures

- [x] `TODO-03` Criar `src/repositories/ventures.ts` com imports (`db` de `@/database`; `ventures` e tipos de `@/src/configs/database`; `and`, `eq`, `isNull`, `isNotNull` de `drizzle-orm`) e o tipo `PatchVenture`.
- [x] `TODO-04` Implementar `get(id)` retornando a linha ativa (`id` + `deletedAt IS NULL`).
- [x] `TODO-05` Implementar `getAll()` retornando todas as linhas ativas.
- [x] `TODO-06` Implementar `post(data)` com `.insert().values(data).returning()`.
- [x] `TODO-07` Implementar `batchInsert(data)` com guarda para array vazio e `.returning()`.
- [x] `TODO-08` Implementar `patch(id, data)` restrito a registro ativo, com `.returning()`.
- [x] `TODO-09` Implementar `softDelete(id)` setando `deletedAt` apenas se `deletedAt IS NULL`, retornando a linha.
- [x] `TODO-10` Implementar `restore(id)` setando `deletedAt = null` apenas se `deletedAt IS NOT NULL`, retornando a linha.
- [x] `TODO-11` Exportar `venturesRepository` (objeto de módulo) com os 7 métodos.

### Step 3: Repositório de snapshots

- [x] `TODO-12` Criar `src/repositories/ventureSnapshots.ts` com `PatchVentureSnapshot` e os 7 métodos no mesmo formato do repositório de ventures.
- [x] `TODO-13` Exportar `ventureSnapshotsRepository` (objeto de módulo).

### Step 4: Documentação & memória

- [x] `TODO-14` Atualizar `.agents/PROJECT.md` documentando `src/repositories/` e `src/configs/database/`.
- [x] `TODO-15` Atualizar `.agents/ARCHITECTURE.md` incluindo a camada de repositórios e o bridge na estrutura de diretórios.
- [x] `TODO-16` Atualizar `MEM-2026-018` (novo caminho do bridge), criar `REPOSITORIES_MEMORY.md` com o contrato dos repositórios e atualizar `.agents/memory/INDEX.md`.

### Step 5: Verificação

- [x] `TODO-17` Rodar `bunx tsc --noEmit` e confirmar que não há erros novos em `src/repositories/` e `src/configs/database/`.
- [x] `TODO-18` Aplicar as migrações no banco temporário (`DATABASE_URL=./tmp-repo-check.db bun run migrate`).
- [x] `TODO-19` Rodar smoke test exercitando os 7 métodos nos dois repositórios e todos os edge cases da Seção 5.
- [x] `TODO-20` Confirmar bump automático de `updatedAt` em `patch`, `softDelete` e `restore`.
- [x] `TODO-21` Remover o script de smoke test e os arquivos `tmp-repo-check.db*`.

### Final Verification

- [x] `TODO-22` Rodar `bunx tsc --noEmit` e registrar o resultado final no relatório.
- [x] `TODO-23` Revisar a documentação atualizada (`PROJECT.md`, `ARCHITECTURE.md`) contra a árvore real de `src/repositories/` e `src/configs/database/`.
