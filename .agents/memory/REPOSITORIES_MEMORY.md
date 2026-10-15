# Memória — Repositórios de Acesso a Dados

Este documento é a referência persistente de memória do domínio de repositórios (`src/repositories/`) do projeto Finances Dashboard.
ID nova: siga a sequência global do `INDEX.md` (formato `MEM-<AAAA>-<NNN>`).

---

## Índice de Consulta

| #   | ID           | Memória                                              | Tipo     | Status | Atualizada em |
| --- | ------------ | ---------------------------------------------------- | -------- | ------ | ------------- |
| 1   | MEM-2026-019 | Contrato dos repositórios (`src/repositories`)       | Contrato | Ativa  | 2026-09-25    |
| 2   | MEM-2026-020 | Repositórios: módulos explícitos por model (Opção A) | Decisão  | Ativa  | 2026-09-25    |

---

## MEM-2026-019 — Contrato dos repositórios (`src/repositories`) {#mem-2026-019}

- **Tipo**: Contrato
- **Status**: Ativa
- **Criada em**: 2026-09-25
- **Atualizada em**: 2026-09-25
- **Tags**: `src`, `repositories`, `data-access`, `soft-delete`
- **Fonte**: `src/repositories/repository.ts`, `src/repositories/ventures.ts`, `src/repositories/ventureSnapshots.ts`, `src/repositories/index.ts`

### Descrição

Cada model do banco tem um repositório (objeto de módulo) com os métodos básicos `get`, `getAll`, `post`, `batchInsert`, `patch`, `softDelete` e `restore`. O contrato é formalizado pela interface genérica `Repository<TSelect, TInsert, TPatch>` e aplicado em cada repositório via `satisfies`. Exports: `Repository`, `venturesRepository` e `ventureSnapshotsRepository` (barrel em `src/repositories/index.ts`).

### Detalhes

- `get(id)` / `getAll()`: leem **apenas** registros ativos (`deleted_at IS NULL`); `getAll` não tem filtros nem paginação na v1.
- `post(data)` / `batchInsert(data[])`: inserem e retornam as linhas criadas; `batchInsert([])` → `[]`; erro de conflito (ex.: `internal_code` duplicado) **propaga**.
- `patch(id, data)`: altera apenas registro ativo; input é `Patch* = Partial<Omit<Insert*, "id" | "createdAt" | "updatedAt" | "deletedAt">>`.
- `softDelete(id)`: marca `deletedAt` e retorna a linha (idempotente — já deletado/inexistente → `undefined`).
- `restore(id)`: zera `deletedAt` apenas se o registro estiver deletado; já ativo/inexistente → `undefined`.
- Registro inexistente ou fora do filtro de soft-delete → `undefined`; erros HTTP/SSR ficam em `services`/`controllers` (`ApiError`/`ViewError`).
- Retorno: linha crua do banco (`Select*` importado de `@/src/configs/database`; datas em `string` ISO, com `deletedAt`).
- `db` é importado de `@/database`; modelos e tipos, de `@/src/configs/database` (bridge).
- Cada repositório declara `satisfies Repository<Select*, Insert*, Patch*>`: a interface genérica (`src/repositories/repository.ts`, 3 parâmetros de tipo) garante os 7 métodos no typecheck — desvios falham na compilação (comprovado por verificação negativa).
- Interface de **tipos** apenas; não há factory/base genérica de runtime (decisão em `#mem-2026-020`).

### Referências

- `src/repositories/ventures.ts`, `src/repositories/ventureSnapshots.ts`, `src/repositories/index.ts`
- `#mem-2026-014`, `#mem-2026-015`, `#mem-2026-018`, `#mem-2026-020`

---

## MEM-2026-020 — Repositórios: módulos explícitos por model (Opção A) {#mem-2026-020}

- **Tipo**: Decisão
- **Status**: Ativa
- **Criada em**: 2026-09-25
- **Atualizada em**: 2026-09-25
- **Tags**: `src`, `repositories`, `arquitetura`
- **Fonte**: `.agents/plans/add-data-repositories-layer.md`

### Descrição

A camada de repositórios usa **dois módulos explícitos** (`ventures.ts` e `ventureSnapshots.ts`) com objeto de módulo, sem base genérica e sem classes.

### Detalhes

**Contexto**: decisão tomada na Fase 2 do plano `add-data-repositories-layer` e registrada na Opção A do plano.

**Opções descartadas** (não reabrir sem motivo forte):

- Factory/base genérica parametrizada por tabela: exigiria tipagem genérica complexa do Drizzle (colunas de id/deletedAt), com risco de casts; abstração prematura para 2 models.
- Classes com injeção de `db`: cerimônia desnecessária — o projeto usa `db` singleton e as camadas previstas são funções.

**Consequência**: o padrão dos métodos é repetido entre os arquivos; manter ordem e assinaturas idênticas entre eles para facilitar leitura e diffs.

**Atualização (2026-09-25)**: o descarte vale para a base/factory genérica de **runtime**. Uma **interface genérica de tipos** (`Repository<TSelect, TInsert, TPatch>`, `src/repositories/repository.ts`, ver `#mem-2026-019`) é aceita e padroniza a criação de novos repositórios.

### Referências

- `.agents/plans/add-data-repositories-layer.md`
- `#mem-2026-019`
