# Memória — Camada de Banco de Dados

Este documento é a referência persistente de memória do domínio de banco de dados (`database/`) do projeto Finances Dashboard.
ID nova: siga a sequência global do `INDEX.md` (formato `MEM-<AAAA>-<NNN>`).

---

## Índice de Consulta

| #   | ID           | Memória                                                        | Tipo      | Status | Atualizada em |
| --- | ------------ | -------------------------------------------------------------- | --------- | ------ | ------------- |
| 1   | MEM-2026-010 | Client SQLite/Drizzle com PRAGMAs ACID (`database/client.ts`)  | Fato      | Ativa  | 2026-09-24    |
| 2   | MEM-2026-011 | API do drizzle-orm 1.x: usar `drizzle({ client })`             | Fato      | Ativa  | 2026-09-24    |
| 3   | MEM-2026-012 | Schema `ventures` single-table (Opção A)                       | Decisão   | Ativa  | 2026-09-24    |
| 4   | MEM-2026-013 | Schema `venture_snapshots` (filha, FK RESTRICT)                | Interface | Ativa  | 2026-09-24    |
| 5   | MEM-2026-014 | Convenções de modelagem (UUID, centavos, ISO8601, soft-delete) | Regra     | Ativa  | 2026-09-24    |
| 6   | MEM-2026-015 | Enums nas colunas derivados dos contratos                      | Regra     | Ativa  | 2026-09-24    |
| 7   | MEM-2026-016 | Migrações: config, formato e comandos                          | Processo  | Ativa  | 2026-09-24    |
| 8   | MEM-2026-017 | Agregados não persistidos (summary/tracking calculados)        | Decisão   | Ativa  | 2026-09-24    |
| 9   | MEM-2026-018 | Bridge de banco para `src/` (`src/configs/database`)           | Fato      | Ativa  | 2026-09-25    |

---

## MEM-2026-010 — Client SQLite/Drizzle com PRAGMAs ACID (`database/client.ts`) {#mem-2026-010}

- **Tipo**: Fato
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `database`, `sqlite`, `drizzle`, `client`, `acid`
- **Fonte**: `database/client.ts`

### Descrição

Existe um único client de banco: uma conexão `bun:sqlite` com PRAGMAs ACID, embrulhada pelo Drizzle e exportada como `db`.

### Detalhes

- Caminho do banco: `process.env.DATABASE_URL || "my-finances.db"`.
- PRAGMAs aplicadas na conexão:
  - `journal_mode = WAL` (concorrência leitura/escrita);
  - `foreign_keys = ON` (sem isso o `ON DELETE RESTRICT` do schema não é enforçado);
  - `busy_timeout = 5000` (evita `database is locked`).
- Export: `export const db = drizzle({ client: sqlite })` — ver `#mem-2026-011`.
- Instância é singleton de módulo (criada no import), reexportada por `database/index.ts` junto de `database/models`.

### Referências

- `database/client.ts`, `database/index.ts`
- `#mem-2026-011`, `#mem-2026-016`

---

## MEM-2026-011 — API do drizzle-orm 1.x: usar `drizzle({ client })` {#mem-2026-011}

- **Tipo**: Fato
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `database`, `drizzle`, `api`, `gotcha`
- **Fonte**: `database/client.ts`

### Descrição

Na versão instalada (`drizzle-orm@1.0.0-rc`), o client precisa ser passado como objeto `{ client }`. Passar a instância direto resulta em um banco in-memory silencioso.

### Detalhes

- **Errado**: `drizzle(sqlite)` — o objeto é desestruturado como config (`{ connection, client }`) e o Drizzle instancia `new Database(undefined)`, ou seja, um banco **`:memory:`** vazio.
- **Correto**: `drizzle({ client: sqlite })` (alternativas da mesma API: `drizzle("./arquivo.db")` ou `drizzle({ connection })`).
- Sintoma do erro: `SQLITE_ERROR: no such table` mesmo com a migração aplicada.
- Não reabrir/alterar sem testar em runtime.

### Referências

- `database/client.ts`
- `#mem-2026-010`

---

## MEM-2026-012 — Schema `ventures` single-table (Opção A) {#mem-2026-012}

- **Tipo**: Decisão
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `database`, `schema`, `ventures`, `single-table`
- **Fonte**: `database/models/ventures.ts`

### Descrição

As três variações de ativo (`IVenture`, `IFixedIncomeVenture`, `IVariableIncomeVenture`) convivem em uma única tabela `ventures`, com as colunas de especialização nullable (Opção A do plano).

### Detalhes

- Colunas: `id`, `name`, `internal_code`, `category`, `type`, `initial_value`, `bought_at`, `expires_in`, `indexer`, `rate`, `source`, `quantity`, `unit_price`, `total_price`, `created_at`, `updated_at`, `deleted_at`.
- Contexto do trade-off: os contratos usam herança; SQLite favorece poucas tabelas; PK única, FK direta de snapshots e soft-delete em um só lugar. A validação semântica de especialização (ex.: `indexer` obrigatório só em renda fixa) fica na aplicação.
- Alternativa descartada (Opção B): tabela base + tabelas 1:1 de especialização — exigiria joins em toda consulta e FK dupla.
- `internal_code` tem **índice único parcial** (`WHERE deleted_at IS NULL`), permitindo reutilizar o código após soft-delete de um registro.

### Referências

- `database/models/ventures.ts`
- `#mem-2026-002`, `#mem-2026-014`, `#mem-2026-017`

---

## MEM-2026-013 — Schema `venture_snapshots` (filha, FK RESTRICT) {#mem-2026-013}

- **Tipo**: Interface
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `database`, `schema`, `snapshots`
- **Fonte**: `database/models/ventureSnapshots.ts`

### Descrição

Tabela `venture_snapshots`, filha de `ventures` (1:N), que materializa `IVentureSnapshot`.

### Detalhes

- Colunas: `id`, `venture_id`, `reference_date`, `current_unit_price`, `current_quantity_held`, `current_total_value`, `total_contributed`, `gross_profit`, `profit_percentage`, `type`, `movement_value`, `notes`, `created_at`, `updated_at`, `deleted_at`.
- `venture_id` é FK → `ventures.id` com `ON DELETE RESTRICT`: ativo com snapshots não pode ser excluído fisicamente.
- Índice composto **não-único** `(venture_id, reference_date)` — múltiplos eventos por mês são permitidos (ex.: `CONTRIBUTION` + `MONTHLY_RECORD`).

### Referências

- `database/models/ventureSnapshots.ts`
- `#mem-2026-005`, `#mem-2026-012`

---

## MEM-2026-014 — Convenções de modelagem (UUID, centavos, ISO8601, soft-delete) {#mem-2026-014}

- **Tipo**: Regra
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `database`, `convencoes`, `tipos`, `soft-delete`
- **Fonte**: `database/models/ventures.ts`, `database/models/ventureSnapshots.ts`

### Descrição

Convenções aplicadas a todas as tabelas do projeto — devem ser mantidas em novas tabelas/colunas.

### Detalhes

- `id`: TEXT com UUID gerado na aplicação (`$defaultFn(() => crypto.randomUUID())`), sem default SQL.
- Dinheiro: INTEGER em centavos (ex.: `1500` = R$ 15,00). Nunca `REAL` para valores monetários.
- Quantidades: REAL (cotas fracionárias).
- Datas de calendário: TEXT `YYYY-MM-DD` (`bought_at`, `expires_in`, `reference_date`).
- Timestamps de auditoria: TEXT ISO8601 UTC completo, com default na aplicação (`new Date().toISOString()`); `updated_at` também usa `$onUpdateFn`.
- **Soft-delete**: `deleted_at` TEXT nullable. O registro permanece na tabela e as consultas padrão precisam filtrar `deleted_at IS NULL` manualmente (o Drizzle não filtra sozinho). `deletedAt` é abstração **apenas de banco** — não existe nos contratos.
- Nomes: colunas em `snake_case`, propriedades TS em `camelCase` (via `$inferSelect`/`$inferInsert`).

### Referências

- `database/models/ventures.ts`, `database/models/ventureSnapshots.ts`
- `#mem-2026-012`, `#mem-2026-013`, `#mem-2026-017`

---

## MEM-2026-015 — Enums nas colunas derivados dos contratos {#mem-2026-015}

- **Tipo**: Regra
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `database`, `enums`, `contratos`
- **Fonte**: `database/models/ventures.ts`, `database/models/ventureSnapshots.ts`

### Descrição

Colunas de enum usam `text(nome, { enum: tuple })` e os tuples são derivados dos enums exportados por `@/contracts`, garantindo fonte única de verdade.

### Detalhes

- Padrão: `const snapshotTypes = [SnapshotType.MONTHLY_RECORD, SnapshotType.CONTRIBUTION, SnapshotType.WITHDRAWAL] as const satisfies readonly SnapshotType[];` (`ventures.ts` tem o mesmo para categoria, tipo e indexador).
- O `satisfies` quebra o typecheck se os contratos mudarem — é a garantia de sincronia entre domínio e banco.
- O `drizzle-kit` **não** gera `CHECK` de enum no SQLite nesse formato: o SQL da coluna é apenas `text NOT NULL`; a restrição é de tipo (aplicação).
- Representação dos enums (objeto `as const`): `#mem-2026-008`.

### Referências

- `#mem-2026-008`, `#mem-2026-012`, `#mem-2026-013`

---

## MEM-2026-016 — Migrações: config, formato e comandos {#mem-2026-016}

- **Tipo**: Processo
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `database`, `migrations`, `drizzle-kit`, `comandos`
- **Fonte**: `drizzle.config.ts`, `database/migrations/`, `package.json`

### Descrição

Fluxo de migrações do projeto (geração, formato dos arquivos e comandos).

### Detalhes

- `drizzle.config.ts`: `dialect: "sqlite"`, `schema: "./database/models/index.ts"`, `out: "./database/migrations"`, `dbCredentials.url = process.env.DATABASE_URL || "my-finances.db"`.
- O `schema` aponta para o **arquivo barrel**; apontar para o diretório `./database/models` faz o drizzle-kit carregar o barrel e os arquivos individuais, gerando erro de tabela/coluna duplicada.
- Formato do drizzle-kit 1.x: uma pasta por migração em `database/migrations/<timestamp>_<nome>/` com `migration.sql` + `snapshot.json` (sem `meta/_journal.json`).
- Migração inicial aplicada: `20260915180206_talented_guardian` (cria `ventures`, `venture_snapshots`, os índices e a FK) + tabela de controle `__drizzle_migrations`.
- Comandos: `bun run migrate` (script `bunx drizzle-kit migrate`, aplica pendentes); para criar/sincronizar use `bunx drizzle-kit generate` / `bunx drizzle-kit push`.
- `drizzle.config.ts` não importa `dotenv` — o Bun carrega o `.env` automaticamente e `dotenv` não é dependência do projeto.

### Referências

- `drizzle.config.ts`, `database/migrations/`, `package.json`
- `#mem-2026-009`, `#mem-2026-010`

---

## MEM-2026-017 — Agregados não persistidos (summary/tracking calculados) {#mem-2026-017}

- **Tipo**: Decisão
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-24
- **Tags**: `database`, `agregados`, `escopo`
- **Fonte**: `contracts/portfolioSummary.ts`, `contracts/ventureTracking.ts`

### Descrição

`IPortfolioSummary` e `IVentureTracking` não são persistidos: são derivados e calculados sob demanda.

### Detalhes

- Motivo: dado derivado persistido exigiria sincronização e abriria risco de inconsistência, contrariando o requisito ACID (Opção C do plano, descartada).
- Consequência: não existem tabelas `portfolio_summary` nem `venture_tracking`; o resumo é montado na camada de serviço a partir de `ventures` + `venture_snapshots`.

### Referências

- `contracts/portfolioSummary.ts`, `contracts/ventureTracking.ts`
- `#mem-2026-006`, `#mem-2026-007`, `#mem-2026-013`

---

## MEM-2026-018 — Bridge de banco para `src/` (`src/configs/database`) {#mem-2026-018}

- **Tipo**: Fato
- **Status**: Ativa
- **Criada em**: 2026-09-24
- **Atualizada em**: 2026-09-25
- **Tags**: `src`, `database`, `configs`, `inferencia`, `tipos`
- **Fonte**: `src/configs/database/index.ts`

### Descrição

`src/configs/database/index.ts` é o ponto de acesso da camada de aplicação (`src/`) aos modelos do banco: reexporta os schemas e expõe os tipos inferidos deles. Substitui o antigo `src/database/index.ts`, removido em 2026-09-24 — por decisão do desenvolvedor o bridge vive em `src/configs/database/`.

### Detalhes

- Importa os schemas de `@/database/models`.
- Reexporta os schemas: `ventures` e `ventureSnapshots`.
- Expõe os tipos inferidos: `SelectVenture`/`InsertVenture` e `SelectVentureSnapshot`/`InsertVentureSnapshot` (derivados de `$inferSelect`/`$inferInsert`, ver `#mem-2026-014`).
- Uso dentro de `src/`: `import { ventures } from "@/src/configs/database"` e `import type { InsertVenture } from "@/src/configs/database"`.
- **Atualização (2026-09-25)**: o bridge passou a reexportar também o client (`export const db = Database`, importado de `@/database`) — o racional anterior de "não instanciar o client" não vale mais. O client é consumido de `@/database` (regra de alias no `AGENTS.md` §2).

### Referências

- `src/configs/database/index.ts`
- `#mem-2026-009`, `#mem-2026-010`, `#mem-2026-012`, `#mem-2026-013`, `#mem-2026-014`, `#mem-2026-019`
