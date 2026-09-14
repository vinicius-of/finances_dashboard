# PROJECT.md — Visão Geral do Projeto

## Sobre o Projeto

**Finances Dashboard** é um painel de acompanhamento de finanças pessoais e carteira de investimentos. Monitora ativos de renda fixa e renda variável, registra snapshots mensais (aportes, resgates e apuração de rendimento) e consolida um resumo geral da carteira.

- **Linguagem**: TypeScript (estrito)
- **Runtime**: Bun
- **Renderização**: páginas SSR via ETA Template Engine
- **Banco de dados**: SQLite (`bun:sqlite`) com Drizzle ORM
- **Serviços**: exposição via Docker (`Dockerfile`)

Este documento descreve os **diretórios do projeto e suas responsabilidades**. (Arquivos isolados da raiz e `node_modules` estão fora do escopo desta documentação.)

---

## Estrutura de Diretórios

```
├── contracts/     # Contratos de domínio (tipos e interfaces) — fonte de verdade
├── database/      # Camada de persistência: modelos, migrations e seeds (Drizzle)
├── src/           # Código-fonte da aplicação
│   ├── api/       #   Camada HTTP: guards, middlewares, routes e services
│   ├── configs/   #   Configurações da aplicação
│   ├── errors/    #   Hierarquia de erros de domínio
│   ├── utils/     #   Funções utilitárias
│   └── views/     #   Templates ETA (renderização SSR)
└── static/        # Configurações estáticas (favicon, headers, caminhos raiz)
```

---

## `contracts/` — Contratos de Domínio

Representa os **objetos reais** do domínio como tipos e interfaces TypeScript puros.

| Arquivo               | Conteúdo                                                                          |
| --------------------- | --------------------------------------------------------------------------------- |
| `enums.ts`            | Tipos de domínio: `VentureCategory`, `VentureType`, `IndexerType`, `SnapshotType` |
| `ventures.ts`         | Interface base `IVenture` (ativo financeiro genérico)                             |
| `fixedVentures.ts`    | `IFixedIncomeVenture` (renda fixa, estende `IVenture`)                            |
| `variableVentures.ts` | `IVariableIncomeVenture` (renda variável, estende `IVenture`)                     |
| `ventureSnaphots.ts`  | `IVentureSnapshot` (histórico temporal e movimentações)                           |
| `ventureTracking.ts`  | `IVentureTracking` (ativo + snapshots + métricas consolidadas)                    |
| `portfolioSummary.ts` | `IPortfolioSummary` (resumo agregado da carteira)                                 |
| `CONTRACTS_MEMORY.md` | Compilado de referência de todos os contratos                                     |

**Regras**:

- As interfaces devem permanecer **isoladas de implementação** e **sem importações externas ao diretório**.
- Este diretório é a **fonte de verdade** da representação dos objetos reais — qualquer alteração aqui exige que todas as implementações reflitam a mudança.

---

## `database/` — Camada de Persistência

Contém toda a estrutura de dados persistidos, modelada com **Drizzle ORM** sobre `bun:sqlite`.

| Item          | Responsabilidade                                                  |
| ------------- | ----------------------------------------------------------------- |
| `models/`     | Definição dos schemas/tabelas do banco (Drizzle)                  |
| `migrations/` | Migrações geradas e versionadas do schema                         |
| `seeds/`      | Scripts de população inicial do banco (dados de teste/referência) |
| `index.ts`    | Ponto de exportação da camada de banco (re-exporta `models/`)     |

---

## `src/` — Código-Fonte da Aplicação

Contém todo o código executável do projeto, organizado em subdiretórios por responsabilidade.

### `src/api/` — Camada HTTP

Estrutura em camadas para tratamento de requisições HTTP:

| Subdiretório   | Responsabilidade                                                         |
| -------------- | ------------------------------------------------------------------------ |
| `guards/`      | Proteção/validação de acesso a rotas ou recursos                         |
| `middlewares/` | Processamento intermediário de requisições (autenticação, logging, etc.) |
| `routes/`      | Definição das rotas e seus handlers                                      |
| `services/`    | Regras de negócio e orquestração de dados                                |

> Obs.: atualmente é um scaffold (diretórios vazios) aguardando implementação.

### `src/configs/` — Configurações

Configurações gerais da aplicação (atualmente vazio; destinado a centralizar inicializações de ambiente).

### `src/errors/` — Hierarquia de Erros

Tratamento de erros baseado em classes de domínio:

- `AppError` — classe abstrata base (recebe `statusCode` e `message`, exige `handle()`).
- `ApiError` — erros para respostas **JSON** de API (`Response.json`).
- `ViewError` — erros para renderização de **páginas SSR** via ETA.

### `src/utils/` — Utilitários

Funções auxiliares reutilizáveis:

- `formatDate.ts` — formatação de datas.
- `formatMoneyToBRL.ts` — formatação de valores monetários em Real (BRL).
- `formatMoneyToUSD.ts` — formatação de valores monetários em Dólar (USD).

### `src/views/` — Templates ETA

Templates das páginas renderizadas no servidor (SSR):

| Arquivo         | Finalidade                      |
| --------------- | ------------------------------- |
| `index.eta`     | Página inicial                  |
| `error.403.eta` | Página de erro — acesso negado  |
| `error.404.eta` | Página de erro — não encontrado |
| `error.500.eta` | Página de erro — falha interna  |

---

## `static/` — Configurações Estáticas

Arquivos e utilitários concretos que servem como base para o funcionamento da aplicação **sem exigir importações que precisem de mudanças**:

| Arquivo      | Responsabilidade                                                  |
| ------------ | ----------------------------------------------------------------- |
| `root.ts`    | Constantes de caminhos raiz (`PROJECT_ROOT`, `ENV_PATH`)          |
| `favicon.ts` | `FavIconConfigs` — localização e servimento do favicon            |
| `headers.ts` | Headers padrão de respostas (`PageHeadersInit`, `ApiHeadersInit`) |
| `index.ts`   | Re-exportação dos módulos acima                                   |
