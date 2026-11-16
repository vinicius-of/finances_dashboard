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
├── contracts/            # Contratos de domínio (tipos e interfaces) — fonte de verdade
├── database/             # Camada de persistência: modelos, migrations e seeds (Drizzle)
├── src/                  # Código-fonte da aplicação
│   ├── api/              #   Camada HTTP: guards, middlewares, controllers e services
│   ├── configs/          #   Configurações da aplicação (inclui o bridge de banco em `configs/database/`)
│   ├── errors/           #   Hierarquia de erros de domínio
│   ├── repositories/     #   Repositórios de acesso a dados (um módulo por model)
│   ├── utils/            #   Funções utilitárias
│   └── views/            #   Templates ETA (renderização SSR)
└── static/               # Configurações estáticas (favicon, headers, caminhos raiz)
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

| Item          | Responsabilidade                                                                             |
| ------------- | -------------------------------------------------------------------------------------------- |
| `models/`     | Definição dos schemas/tabelas do banco (Drizzle)                                             |
| `migrations/` | Migrações geradas e versionadas do schema                                                    |
| `seeds/`      | Scripts de população inicial do banco (dados de teste/referência)                            |
| `backup.ts`   | Backup consistente do banco (checkpoint WAL + `VACUUM INTO`); destino opcional via argumento |
| `index.ts`    | Ponto de exportação da camada de banco (re-exporta `models/`)                                |

---

## `src/` — Código-Fonte da Aplicação

Contém todo o código executável do projeto, organizado em subdiretórios por responsabilidade.

### `src/api/` — Camada HTTP

Estrutura em camadas para tratamento de requisições HTTP:

| Subdiretório   | Responsabilidade                                                         |
| -------------- | ------------------------------------------------------------------------ |
| `guards/`      | Proteção/validação de acesso a rotas ou recursos                         |
| `middlewares/` | Processamento intermediário de requisições (autenticação, logging, etc.) |
| `controllers/` | Handlers de recursos sem visualização (API)                              |
| `services/`    | Serviços de domínio (ventures, snapshots e export)                       |

> Obs.: `controllers/` já possui `SnapshotsController` (`POST /api/snapshots`); `guards/` e `middlewares/` permanecem scaffold aguardando implementação. Os serviços de domínio vivem em `src/api/services/` e a renderização SSR fica em `src/views/views.controller.ts`.

### `src/api/services/` — Serviços de domínio

Serviços de orquestração para operações sem visualização, implementando `IService<TInput, TOutput>` (`execute`) e dependendo de _ports_ injetados no construtor.

| Arquivo/Diretório   | Responsabilidade                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services.types.ts` | Contrato geral `IService<TInput, TOutput>`.                                                                                                                                                           |
| `mappers.ts`        | Conversões `Date` ↔ string (`YYYY-MM-DD`/ISO) e centavos → reais.                                                                                                                                     |
| `ventures/`         | `VenturesService` (validação + CRUD), `validateVentures.ts`, `ventures.types.ts` e `ventures.test.ts`.                                                                                                |
| `snapshots/`        | `SnapshotsService` (`save`, `update`, `softDelete`, `get`, `getAll`, `tracking`), mappers (`snapshots.mappers.ts`), utilidades (`snapshots.utils.ts`), erros (`snapshots.errors.ts`), tipos e testes. |
| `export/`           | `ExportService` (download JSON com ventures/snapshots/tracking/summary), tipos e testes.                                                                                                              |
| `portfolio/`        | `PortfolioService` (`listTracking({ type })`), tipos e testes com fakes.                                                                                                                              |
| `index.ts`          | Barrel dos tipos e serviços.                                                                                                                                                                          |

**Regras**:

- Arquivos de controller e service permanecem enxutos: funções auxiliares e validadores em `<modulo>.utils.ts`, mappers de conversão entre camadas em `<modulo>.mappers.ts` e funções que retornam `ApiError` em `<modulo>.errors.ts` (todos no mesmo diretório).
- Interfaces de serviço em **centavos** e `Date`; a conversão para o banco ocorre na borda com os repositórios.
- Erros de negócio usam `ApiError` com `400` (entrada), `404` (inexistente) e `422` (regra).
- Testes usam fakes em memória dos _ports_, sem banco.
- O serviço `import/` permanece fora do escopo atual.

### `src/configs/` — Configurações

Configurações gerais da aplicação e inicializações de ambiente.

| Item                | Responsabilidade                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `database/index.ts` | Bridge de banco: re-exporta os modelos (`ventures`, `ventureSnapshots`) e os tipos inferidos (`SelectVenture`, `InsertVenture`, `SelectVentureSnapshot`, `InsertVentureSnapshot`) para uso dentro de `src/`, sem instanciar o client do banco. |

### `src/errors/` — Hierarquia de Erros

Tratamento de erros baseado em classes de domínio:

- `AppError` — classe abstrata base (recebe `statusCode` e `message`, exige `handle()`).
- `ApiError` — erros para respostas **JSON** de API (`Response.json`).
- `ViewError` — erros para renderização de **páginas SSR** via ETA.

### `src/repositories/` — Repositórios de Acesso a Dados

Camada única de acesso ao banco para o `src/`: um módulo por model, com os métodos básicos `get`, `getAll`, `post`, `batchInsert`, `patch`, `softDelete` e `restore`.

| Arquivo               | Responsabilidade                                                                       |
| --------------------- | -------------------------------------------------------------------------------------- |
| `repository.ts`       | Interface genérica `Repository<TSelect, TInsert, TPatch>` (contrato dos repositórios). |
| `ventures.ts`         | Repositório do model `ventures` (`venturesRepository`).                                |
| `ventureSnapshots.ts` | Repositório do model `venture_snapshots` (`ventureSnapshotsRepository`).               |
| `index.ts`            | Barrel da camada (re-exporta os repositórios).                                         |

**Regras**:

- Leituras ignoram registros soft-deletados (`deleted_at IS NULL`); a exclusão é sempre lógica (`softDelete`).
- Todo repositório implementa a interface genérica `Repository<TSelect, TInsert, TPatch>` (`repository.ts`) via `satisfies`, garantindo os 7 métodos básicos.
- `db` vem de `@/database`; modelos e tipos vêm de `src/configs/database` (bridge) — os repositórios não importam `database/models` diretamente.
- Registro inexistente ou soft-deletado retorna `undefined`; erros HTTP/SSR (`ApiError`/`ViewError`) ficam nas camadas de serviço/controller.

### `src/utils/` — Utilitários

Funções auxiliares reutilizáveis:

- `formatDate.ts` — formatação de datas.
- `formatMoneyToBRL.ts` — formatação de valores monetários em Real (BRL).
- `formatMoneyToUSD.ts` — formatação de valores monetários em Dólar (USD).
- `logs.ts` — logging estruturado de startup/requisições (`log`, `withRequestLog`).
- `staticAssets.ts` — configuração das rotas de assets estáticos (`staticAssetRoutes`).

### `src/views/` — Templates ETA, estilos e configuração por view

Cada view vive em seu próprio diretório com `view.eta`, `styles.css` e `index.ts` (configuração exportada diretamente pelo diretório):

| Diretório/Arquivo                  | Finalidade                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `layout/`                          | Shell compartilhado (`view.eta`, `styles.css`, `index.ts`)                                                                    |
| `components/menu/`                 | Menu lateral (`view.eta`, `styles.css`, `index.ts`)                                                                           |
| `components/tesouroDiretoTable/`   | Tabela de investimentos do Tesouro Direto (`view.eta`, `styles.css`, `index.ts` + mapper)                                     |
| `components/tesouroDiretoToolbar/` | Barra de filtros, ordenação e ações do Tesouro Direto (`view.eta`, `styles.css`, `index.ts`, `state.ts` + testes)             |
| `tesouroDireto/`                   | Página Tesouro Direto (`view.eta`, `styles.css`, `index.ts`)                                                                  |
| `rendasFixas/`                     | Página Rendas Fixas (`view.eta`, `styles.css`, `index.ts`)                                                                    |
| `acoes/`                           | Página Ações (`view.eta`, `styles.css`, `index.ts`)                                                                           |
| `types.ts`                         | Contratos de configuração das views (`IViewConfig`, `IPageViewConfig`, `NavItem`) e tipos de linha (`ITesouroDiretoTableRow`) |
| `index.ts`                         | Barrel das views/configurações                                                                                                |
| `views.controller.ts`              | Controller SSR (`ViewsController`, `NAV_ITEMS`, `NavKey`)                                                                     |
| `views.test.ts`                    | Testes do controller de views                                                                                                 |
| `errorViews/`                      | Templates de erro (`error.403.eta`, `error.404.eta`, `error.500.eta`)                                                         |

**Regras**:

- Cada diretório exporta sua configuração pelo `index.ts`: `template`, `style` e `stylePath`; as páginas também exportam `key`, `label`, `href` e `icon`.
- As páginas chamam `layout("/layout/view", { ..., styles: it.styles })`; o layout inclui `/components/menu/view` e carrega os `styles.css` no `<head>`.
- O menu usa `app-menu__link--active` e `aria-current="page"` no item correspondente; os estilos de layout, menu e view ficam em `src/views/*/styles.css`.
- Componentes de view seguem o mesmo padrão (`view.eta`, `styles.css`, `index.ts`) e seu CSS precisa ser registrado em `src/utils/staticAssets.ts` (array `viewStyles`).
- A tabela do Tesouro Direto consome `ITesouroDiretoTableRow` (strings de apresentação) via `toTesouroDiretoTableRow(IVentureTracking)`; o menu de ações usa `<details>`/`<summary>` e um script dedicado (`tesouroDiretoTable/menu.js`) que o fecha ao sair do foco, ao clicar fora e com `Esc`. A primeira coluna expande os registros (snapshots) via `records.js` (`aria-expanded` + `hidden`), exibindo data, diferença de saldo (`+ R$ …`, `- R$ …`, `R$ 0,00`), valores anterior → novo e nota com clamp de 3 linhas.
- `tesouroDireto/ventures.ts` centraliza `EMPTY_VALUE`, os rótulos de `VentureType`/`IndexerType` e o guard `isFixedIncomeVenture`, usados pela tabela e pela toolbar.
- A toolbar do Tesouro Direto aplica filtros e ordenação **no servidor** via query string (`search`, `indexer`, `sort`, `dir`), sem JavaScript; `state.ts` concentra parse, filtro, ordenação e links canônicos. Exportar/Importar são botões inertes.
- A página do Tesouro Direto renderiza dados reais: `ViewsController(eta, portfolio)` recebe um `IPortfolioTrackingReader` e consulta `listTracking({ type: TREASURY })`; o wiring (`index.ts`) liga repositórios → `VenturesService`/`SnapshotsService` → `PortfolioService`.

---

## `static/` — Configurações Estáticas

Arquivos e utilitários concretos que servem como base para o funcionamento da aplicação **sem exigir importações que precisem de mudanças**:

| Arquivo            | Responsabilidade                                                          |
| ------------------ | ------------------------------------------------------------------------- |
| `root.ts`          | Constantes de caminhos raiz (`PROJECT_ROOT`, `ENV_PATH`)                  |
| `favicon.ts`       | `FavIconConfigs` — localização e servimento do favicon                    |
| `headers.ts`       | Headers padrão de respostas (`PageHeadersInit`, `ApiHeadersInit`)         |
| `files.ts`         | `fileResponse` — resposta de arquivos com 404/`Last-Modified`/304         |
| `styles/theme.css` | Paleta do projeto e estilos do shell/menu/conteúdo (Bootstrap + CSS vars) |
| `index.ts`         | Re-exportação dos módulos acima                                           |

**Rotas do `index.ts`**: `/` (redirect para `/tesouro-direto`), `/tesouro-direto`, `/rendas-fixas`, `/acoes` (SSR), `/api/health` (JSON de exemplo) e assets estáticos.
