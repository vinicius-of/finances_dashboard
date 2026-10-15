# Implementation Plan: Interface Genérica de Repositórios

- **Plan ID**: `add-generic-repository-interface`
- **Status**: Done
- **Date**: 2026-09-25

## 1. Requirements & Objectives

- **Goal**: Criar uma interface genérica que padronize a criação de novos repositories, garantindo em tempo de compilação que todo repositório implemente os métodos básicos (`get`, `getAll`, `post`, `batchInsert`, `patch`, `softDelete`, `restore`).
- **Scope (in)**:
  - `src/repositories/repository.ts` (novo) com a interface `Repository<TSelect, TInsert, TPatch>`;
  - Aplicação do contrato em `venturesRepository` e `ventureSnapshotsRepository` (via `satisfies`);
  - Exportação da interface no barrel `src/repositories/index.ts`;
  - Atualização de `.agents/PROJECT.md` (arquivo novo + regra de padronização);
  - Padronização do import do client: `db` de `ventures.ts` passa a vir de `@/database` (alias);
  - Atualização de memória: `MEM-2026-019` (contrato formalizado) e `MEM-2026-018` (bridge mudou).
- **Out of Scope**:
  - Factory/base genérica **com implementação** (segue descartada — `MEM-2026-020`);
  - Qualquer mudança de comportamento dos métodos (a task é apenas de tipagem);
  - Novas dependências;
  - Remover o export de `db` do bridge `src/configs/database/index.ts` (apenas questionar o desenvolvedor).

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/repositories/repository.ts` (Create)
  - `src/repositories/ventures.ts` (Modify — `satisfies`)
  - `src/repositories/ventureSnapshots.ts` (Modify — `satisfies`)
  - `src/repositories/index.ts` (Modify — exportar `./repository`)
  - `.agents/PROJECT.md` (Modify)
  - `.agents/memory/REPOSITORIES_MEMORY.md` (Modify — `MEM-2026-019`), `.agents/memory/DATABASE_MEMORY.md` (Modify — `MEM-2026-018`)
- **Dependencies Required**: nenhuma.
- **Contexto relevante**:
  - `MEM-2026-019` define o contrato dos repositórios (métodos e semântica); a interface apenas o formaliza em tipos.
  - `MEM-2026-020` descartou a **factory/base genérica de runtime**; uma interface de tipos não reabre essa decisão (não há genericismo sobre tabelas Drizzle nem casts).
  - O bridge `src/configs/database/index.ts` passou a exportar também `db` (`export const db = Database`), tornando `MEM-2026-018` desatualizada no ponto "não instanciar o client".
  - Revisão do desenvolvedor (2026-09-25): padronizar o client pelo alias `@/database` e **priorizar aliases do TypeScript** em geral (regra adicionada ao `AGENTS.md` §2). `ventureSnapshots.ts` já segue o padrão; `ventures.ts` será ajustado.
  - Baseline de typecheck: 2 erros pré-existentes em `index.ts` raiz (`eta`/`server` não usados).

## 3. Architectural Options & Decision

### Option A: Interface genérica de 3 parâmetros + `satisfies` (escolhida)

```ts
export interface Repository<TSelect, TInsert, TPatch> {
  get(id: string): TSelect | undefined;
  getAll(): TSelect[];
  post(data: TInsert): TSelect;
  batchInsert(data: TInsert[]): TSelect[];
  patch(id: string, data: TPatch): TSelect | undefined;
  softDelete(id: string): TSelect | undefined;
  restore(id: string): TSelect | undefined;
}
```

- **Pros**: contrato explícito e legível; desvios pegos no typecheck; mantém a implementação concreta por model (Opção A de `MEM-2026-020` preservada); sem genericismo sobre Drizzle.
- **Cons**: repete 3 parâmetros de tipo em cada repositório.

### Option B: Interface parametrizada pela tabela Drizzle (`Repository<typeof ventures>`)

- **Pros**: menos parâmetros no uso.
- **Cons**: exigiria constraints genéricas sobre a tabela (id/deletedAt) e risco de casts — exatamente a complexidade alertada em `MEM-2026-020`; acopla a interface ao Drizzle.

### Option C: Classe abstrata/factory genérica com implementação

- **Pros**: DRY de implementação.
- **Cons**: é a opção já descartada em `MEM-2026-020` (abstração prematura para 2 models).

> **Decision**: **Option A**. A interface formaliza o contrato já decidido (`MEM-2026-019`) sem reabrir a decisão de implementação de `MEM-2026-020`.
> Decisões menores: nome `Repository` (a regra de prefixo `I` vale para os contratos de domínio em `contracts/`); `TPatch` permanece explícito para não acoplar a interface aos nomes dos campos de auditoria; uso de `satisfies` para preservar os tipos concretos dos repositórios.

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Interface**: criar `src/repositories/repository.ts` com a interface `Repository<TSelect, TInsert, TPatch>`.
- [x] **Step 2 — Aplicação do contrato**: adicionar `satisfies Repository<...>` nos dois repositórios e exportar a interface no barrel.
- [x] **Step 3 — Documentação & memória**: atualizar `.agents/PROJECT.md`, `MEM-2026-019` e `MEM-2026-018`.
- [x] **Step 4 — Verificação**: typecheck (positivo e negativo) + sanity runtime dos exports.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bunx tsc --noEmit` (baseline: apenas os 2 erros pré-existentes em `index.ts` raiz);
  - verificação **negativa**: adicionar temporariamente um método com assinatura divergente em um repositório e confirmar que o `tsc` acusa o desvio (comprova que a interface padroniza de fato); reverter em seguida;
  - sanity runtime: script temporário importando `@/src/repositories` e conferindo os exports, removido ao final.
- **Edge cases to verify**:
  - Todo método do contrato existe nos dois repositórios com a assinatura correta;
  - `satisfies` preserva os tipos concretos (nenhuma regressão de tipo em `Select*`/`Insert*`/`Patch*`);
  - Nenhuma mudança de comportamento em runtime (task somente de tipos).

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_: **2026-09-25** — revisão do desenvolvedor sobre o `TODO-05`: usar o alias `@/database` para o client e dar prioridade a aliases do TypeScript; regra adicionada ao `AGENTS.md` §2. Escopo e TODO list atualizados: `TODO-05` deixou de ser apenas sinalização e passou a ser a padronização de `ventures.ts`. | **Execução concluída em 2026-09-25** (Plan ID `add-generic-repository-interface`): `tsc` sem erros novos (baseline: 2 pré-existentes em `index.ts` raiz); verificação negativa comprovou o enforcement (renomear `restore` → `TS2561 ... does not exist in type 'Repository<...>'`); sanidade runtime 9/9 cobrindo o ciclo completo dos dois repositórios via barrel; artefatos temporários removidos. O barrel `src/repositories/index.ts` passou a usar aliases (`@/src/repositories/...`), conforme a regra de §2 do `AGENTS.md`.

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Each item must be atomic, verifiable and traceable to its source step in Section 4.

### Step 1: Interface

- [x] `TODO-01` Criar `src/repositories/repository.ts` com a interface `Repository<TSelect, TInsert, TPatch>` contendo os 7 métodos.

### Step 2: Aplicação do contrato

- [x] `TODO-02` Adicionar `satisfies Repository<SelectVenture, InsertVenture, PatchVenture>` em `venturesRepository`.
- [x] `TODO-03` Adicionar `satisfies Repository<SelectVentureSnapshot, InsertVentureSnapshot, PatchVentureSnapshot>` em `ventureSnapshotsRepository`.
- [x] `TODO-04` Exportar a interface no barrel `src/repositories/index.ts` (via alias `@/src/repositories/repository`, alinhando as demais reexportações ao padrão de alias).
- [x] `TODO-05` Padronizar o import do client em `ventures.ts`: `db` passa a vir de `@/database` (alias), conforme a regra do `AGENTS.md` §2.

### Step 3: Documentação & memória

- [x] `TODO-06` Atualizar `.agents/PROJECT.md`: incluir `repository.ts` na tabela de `src/repositories/` e registrar a regra de padronização.
- [x] `TODO-07` Atualizar `MEM-2026-019` em `REPOSITORIES_MEMORY.md` (contrato agora formalizado pela interface `Repository`).
- [x] `TODO-08` Atualizar `MEM-2026-018` em `DATABASE_MEMORY.md` (o bridge passou a exportar `db`) e registrar a ressalva em `MEM-2026-020`.

### Step 4: Verificação

- [x] `TODO-09` Rodar `bunx tsc --noEmit` e confirmar que não há erros novos.
- [x] `TODO-10` Verificação negativa: método divergente acusa erro no `tsc`; reverter a alteração.
- [x] `TODO-11` Sanity runtime via barrel (ciclo completo dos dois repositórios), com script temporário removido ao final.

### Final Verification

- [x] `TODO-12` Revisar `.agents/PROJECT.md` e as memórias atualizadas contra a árvore real de `src/repositories/`.
