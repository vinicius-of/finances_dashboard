# Índice de Memórias

Registro central das memórias do projeto. A sequência de IDs (`MEM-<AAAA>-<NNN>`) é controlada aqui.

| ID           | Arquivo                | Memória                                                        | Tipo      | Status | Criada em  |
| ------------ | ---------------------- | -------------------------------------------------------------- | --------- | ------ | ---------- |
| MEM-2026-001 | CONTRACTS_MEMORY.md    | Enums e tipos básicos do domínio                               | Contrato  | Ativa  | 2026-09-24 |
| MEM-2026-002 | CONTRACTS_MEMORY.md    | Contrato base de ativos (`IVenture`)                           | Interface | Ativa  | 2026-09-24 |
| MEM-2026-003 | CONTRACTS_MEMORY.md    | Renda fixa (`IFixedIncomeVenture`)                             | Interface | Ativa  | 2026-09-24 |
| MEM-2026-004 | CONTRACTS_MEMORY.md    | Renda variável (`IVariableIncomeVenture`)                      | Interface | Ativa  | 2026-09-24 |
| MEM-2026-005 | CONTRACTS_MEMORY.md    | Snapshots e histórico (`IVentureSnapshot`)                     | Interface | Ativa  | 2026-09-24 |
| MEM-2026-006 | CONTRACTS_MEMORY.md    | Rastreamento consolidado (`IVentureTracking`)                  | Interface | Ativa  | 2026-09-24 |
| MEM-2026-007 | CONTRACTS_MEMORY.md    | Sumário da carteira (`IPortfolioSummary`)                      | Interface | Ativa  | 2026-09-24 |
| MEM-2026-008 | CONTRACTS_MEMORY.md    | Enums como objeto `as const` (não `enum` do TS)                | Decisão   | Ativa  | 2026-09-24 |
| MEM-2026-009 | CONTRACTS_MEMORY.md    | Barrel `contracts/index.ts` e alias `@/contracts`              | Fato      | Ativa  | 2026-09-24 |
| MEM-2026-010 | DATABASE_MEMORY.md     | Client SQLite/Drizzle com PRAGMAs ACID (`database/client.ts`)  | Fato      | Ativa  | 2026-09-24 |
| MEM-2026-011 | DATABASE_MEMORY.md     | API do drizzle-orm 1.x: usar `drizzle({ client })`             | Fato      | Ativa  | 2026-09-24 |
| MEM-2026-012 | DATABASE_MEMORY.md     | Schema `ventures` single-table (Opção A)                       | Decisão   | Ativa  | 2026-09-24 |
| MEM-2026-013 | DATABASE_MEMORY.md     | Schema `venture_snapshots` (filha, FK RESTRICT)                | Interface | Ativa  | 2026-09-24 |
| MEM-2026-014 | DATABASE_MEMORY.md     | Convenções de modelagem (UUID, centavos, ISO8601, soft-delete) | Regra     | Ativa  | 2026-09-24 |
| MEM-2026-015 | DATABASE_MEMORY.md     | Enums nas colunas derivados dos contratos                      | Regra     | Ativa  | 2026-09-24 |
| MEM-2026-016 | DATABASE_MEMORY.md     | Migrações: config, formato e comandos                          | Processo  | Ativa  | 2026-09-24 |
| MEM-2026-017 | DATABASE_MEMORY.md     | Agregados não persistidos (summary/tracking calculados)        | Decisão   | Ativa  | 2026-09-24 |
| MEM-2026-018 | DATABASE_MEMORY.md     | Bridge de banco para `src/` (`src/configs/database`)           | Fato      | Ativa  | 2026-09-24 |
| MEM-2026-019 | REPOSITORIES_MEMORY.md | Contrato dos repositórios (`src/repositories`)                 | Contrato  | Ativa  | 2026-09-25 |
| MEM-2026-020 | REPOSITORIES_MEMORY.md | Repositórios: módulos explícitos por model (Opção A)           | Decisão   | Ativa  | 2026-09-25 |
| MEM-2026-021 | VIEWS_MEMORY.md        | Shell de views SSR com ETA                                     | Decisão   | Ativa  | 2026-10-19 |
| MEM-2026-022 | VIEWS_MEMORY.md        | Paleta e layout visual do shell                                | Regra     | Ativa  | 2026-10-19 |
| MEM-2026-023 | LOGGING_MEMORY.md      | Contrato de logging de startup/requisições                     | Contrato  | Ativa  | 2026-10-20 |
| MEM-2026-024 | VIEWS_MEMORY.md        | Contrato das configurações de view                             | Interface | Ativa  | 2026-10-23 |
| MEM-2026-025 | ERRORS_MEMORY.md       | `super()` isolado em classes de erro com parâmetros            | Regra     | Ativa  | 2026-10-23 |
| MEM-2026-026 | SERVICES_MEMORY.md     | Contrato da camada de serviços (`src/api/services`)            | Contrato  | Ativa  | 2026-10-23 |
| MEM-2026-027 | SERVICES_MEMORY.md     | Testes antes da implementação e reuso entre serviços           | Decisão   | Ativa  | 2026-10-23 |
| MEM-2026-028 | VIEWS_MEMORY.md        | Tabela de investimentos do Tesouro Direto                      | Interface | Ativa  | 2026-10-29 |
| MEM-2026-029 | VIEWS_MEMORY.md        | Toolbar e filtros da tabela do Tesouro Direto                  | Decisão   | Ativa  | 2026-11-08 |
| MEM-2026-030 | DATABASE_MEMORY.md     | Carga inicial de ventures e snapshots via migration de dados   | Fato      | Ativa  | 2026-11-11 |
| MEM-2026-031 | SERVICES_MEMORY.md     | `PortfolioService` e rendering do Tesouro com dados reais      | Decisão   | Ativa  | 2026-11-12 |
| MEM-2026-032 | VIEWS_MEMORY.md        | Expansão de registros (snapshots) na tabela                    | Interface | Ativa  | 2026-11-12 |
| MEM-2026-033 | SERVICES_MEMORY.md     | Controller HTTP `POST /api/snapshots` e aporte no montante     | Contrato  | Ativa  | 2026-11-13 |
| MEM-2026-034 | VIEWS_MEMORY.md        | Modal "Registrar" e componente de toast                        | Interface | Ativa  | 2026-11-13 |
| MEM-2026-035 | SERVICES_MEMORY.md     | Controller `POST /api/ventures` e criação normalizada          | Contrato  | Ativa  | 2026-11-16 |
| MEM-2026-036 | VIEWS_MEMORY.md        | Botão e modal "Novo investimento"                              | Interface | Ativa  | 2026-11-16 |
