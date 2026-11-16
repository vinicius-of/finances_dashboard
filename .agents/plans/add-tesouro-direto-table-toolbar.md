# Implementation Plan: Barra de ferramentas, filtros e ações da tabela do Tesouro Direto

- **Plan ID**: `add-tesouro-direto-table-toolbar`
- **Status**: Done
- **Date**: 2026-10-29

## 1. Requirements & Objectives

- **Goal**: Criar o componente de barra de ferramentas da página Tesouro Direto com filtros (nome, tipo, indexador), ordenação por montante e expiração e ações de exportar/importar (visuais), manipulando a tabela via SSR com estado na query string.
- **Scope (in)**:
  - Componente próprio `src/views/components/tesouroDiretoToolbar/` (`index.ts`, `state.ts`, `view.eta`, `styles.css`).
  - Filtro por **nome** (string, substring, case-insensitive e sem acentos).
  - Filtro por **tipo** (`VentureType`) e **indexador** (`IndexerType`) com opções **dinâmicas** (somente valores presentes) + opção “Todos”.
  - Ordenação: **um critério primário por vez**, escolhido pelo controle — **expiração** (padrão crescente) ou **montante** (padrão decrescente) — com o outro critério como **desempate** (expiração asc, montante desc); itens **sem expiração sempre no fim**.
  - Dois controles de ordenação, cada um com os dois estados (asc/desc).
  - Ações **Exportar** e **Importar** apenas visuais (`type="button"`, sem handler, sem `<input type="file">`).
  - Botão **Limpar filtros** quando houver estado ativo.
  - Leitura da query string no `ViewsController.index(req?)` e repasse de `req` na rota `/tesouro-direto`.
  - Mensagem de vazio distinta quando o resultado vem de filtro.
  - Testes de unidade do estado da toolbar e de integração na renderização.
  - Registro em `.agents/PROJECT.md`, `.agents/memory/VIEWS_MEMORY.md` e `INDEX.md`.
- **Out of Scope**:
  - Serviços de exportação/importação (botões inertes), upload/download real, modais e formulários.
  - JavaScript cliente (nenhum `<script>` novo; o projeto segue SSR puro).
  - Paginação, filtro por rentabilidade, filtro por data livre e combinação de múltiplos tipos/indexadores.
  - Integração com `VenturesService`/`SnapshotsService` (a tabela continua com dados de preview).
  - Reuso da toolbar em Rendas Fixas e Ações.
  - Alteração de `package.json`, `bun.lock`, `.env`, `opencode.json` e mudanças WIP do desenvolvedor.

### Decisões confirmadas pelo desenvolvedor

| Tema                     | Decisão                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Interatividade           | **SSR via query string**, sem JavaScript.                                                                                       |
| Ordenação                | Dois modos **exclusivos**: Expiração (padrão, asc) ou Montante (desc); o outro critério desempata; sem expiração sempre no fim. |
| Opções de Tipo/Indexador | **Dinâmicas** (valores presentes) + “Todos”.                                                                                    |
| Componente               | **Específico**: `src/views/components/tesouroDiretoToolbar/`.                                                                   |
| Exportar/Importar        | **Botões inertes**.                                                                                                             |
| Vazio filtrado           | Mensagem distinta + botão **“Limpar filtros”**.                                                                                 |
| Query string             | Mudança para ler `req.url` aprovada.                                                                                            |

### Premissas declaradas (validar na aprovação)

- **Modos exclusivos**: clicar em um controle o torna o critério **primário** (montante → desc; expiração → asc); clicar no controle já ativo alterna apenas a direção.
- **Controle ativo**: o critério primário é destacado visualmente e via `aria-current`; o controle inativo indica a ação de ativá-lo.
- **Desempate**: direções fixas (expiração asc, montante desc), não alternáveis pelo usuário.
- O formulário de filtros terá um botão **“Filtrar”** (submit), já que não há JS para aplicar automaticamente.
- As opções dos selects são construídas a partir do conjunto **não filtrado** (permite trocar de filtro).
- Valores inválidos na query (`type`/`indexer` fora dos enums, `sort` diferente de `expires`/`amount`, `dir` diferente de `asc`/`desc`) são **ignorados** e voltam ao padrão.
- URLs canônicas: `sort` omitido quando `expires` (padrão) e `dir` omitido quando for o padrão do critério ativo (`expires` → `asc`, `amount` → `desc`).
- “Limpar filtros” aparece quando há busca, tipo, indexador ou direção diferente do padrão.
- Estado vazio: “Nenhum investimento encontrado.” com filtro/sort ativo; “Nenhum investimento cadastrado.” sem estado.

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `src/views/components/tesouroDiretoToolbar/index.ts` (**Create** — config `IViewConfig` + re-export de `state`).
  - `src/views/components/tesouroDiretoToolbar/state.ts` (**Create** — parse, filtro, ordenação, opções, links, view model).
  - `src/views/components/tesouroDiretoToolbar/view.eta` (**Create** — formulário GET + selects + toggles + ações).
  - `src/views/components/tesouroDiretoToolbar/styles.css` (**Create**).
  - `src/views/components/tesouroDiretoToolbar/state.test.ts` (**Create**).
  - `src/views/tesouroDireto/ventures.ts` (**Create** — `EMPTY_VALUE`, mapas de rótulos de tipo/indexador e guard `isFixedIncomeVenture`, compartilhados por tabela e toolbar).
  - `src/views/components/tesouroDiretoTable/index.ts` (**Modify** — passar a importar rótulos/guard do módulo compartilhado).
  - `src/views/components/tesouroDiretoTable/view.eta` (**Modify** — `emptyMessage` opcional com fallback).
  - `src/views/components/index.ts` (**Modify** — exportar toolbar).
  - `src/views/tesouroDireto/view.eta` (**Modify** — incluir toolbar acima da tabela e repassar `emptyMessage`).
  - `src/views/views.controller.ts` (**Modify** — `index(req?)`, parse da query, filtro/ordenação, view model da toolbar, `emptyMessage`, `extraStyles`).
  - `src/utils/staticAssets.ts` (**Modify** — registrar o CSS da toolbar).
  - `index.ts` (**Modify** — rota `/tesouro-direto` passa `req`).
  - `src/views/views.test.ts` (**Modify** — integração da toolbar e dos filtros).
  - `.agents/PROJECT.md`, `.agents/memory/VIEWS_MEMORY.md`, `.agents/memory/INDEX.md` (**Modify**).
  - `.agents/plans/add-tesouro-direto-table-toolbar.md` (este plano).
- **Dependencies Required**: **nenhuma nova** (`eta`, `bootstrap`, `bootstrap-icons` e `URLSearchParams` nativos).
- **Contexto relevante**:
  - `withRequestLog(source, handler)` entrega `req: Request` ao handler (`src/utils/logs.ts:133-153`); a rota `/tesouro-direto` hoje chama `viewsController.index()` sem argumento (`index.ts:24`).
  - `ViewsController.index()` é síncrono e `render()` aceita `{ rows, extraStyles }`; os testes atuais chamam `controller.index()` sem argumento.
  - `IVentureTracking` traz `venture.type`, `venture.expiresIn`, `latestValue` (centavos) e `totalProfitabilityPercentage` — base para filtrar/ordenar sem tocar na linha apresentacional.
  - `ITesouroDiretoTableRow` tem apenas strings formatadas; por isso filtro/ordenação acontecem sobre `IVentureTracking`, antes do mapper.
  - Rótulos de tipo/indexador e `EMPTY_VALUE` hoje são privados em `src/views/components/tesouroDiretoTable/index.ts` e precisam ser compartilhados com as opções da toolbar.
  - `VentureType`/`IndexerType` são objetos `as const` + união de literais; validação pode usar `Object.values(...).includes`.
  - Não há JavaScript cliente, rota de JS ou testes de DOM no projeto.
  - `ViewError.handle(eta)` é o padrão de erro SSR; nada muda aqui.
  - AGENTS.md §2: sem comentários no código; imports via alias `@/...`; testes ao lado do arquivo testado.

## 3. Architectural Options & Decision

### Opção A: Filtro e ordenação no servidor via query string (escolhida)

`GET /tesouro-direto?search=&type=&indexer=&sort=&dir=`. O controller lê `req.url`, filtra/ordena `IVentureTracking[]` e renderiza.

- **Pros**: sem JS novo; estado compartilhável/recarregável (URL); 100% testável com `bun:test`; mantém SSR e a linha da tabela apresentacional; nenhuma dependência.
- **Cons**: cada aplicação de filtro exige submit/recarga; requer botão “Filtrar”.

### Opção B: Filtro e ordenação no cliente (JavaScript)

- **Pros**: resposta instantânea; sem recarga.
- **Cons**: cria uma camada de JS inexistente (script, rota de asset, `data-*` nas linhas); não testável com a suíte atual; duplica estado da URL ou perde compartilhamento; contraria a decisão anterior de manter o layout sem JS.

### Opção C: Controles somente visuais (inertes)

- **Pros**: menor esforço.
- **Cons**: não atende “retornar somente o tipo requisitado” nem as ordenações; o pedido é explicitamente funcional (só export/import foi marcado como visual).

> **Decision**: **Opção A**.

### Controles de ordenação: links canônicos (escolhido) × botão com `toggle` + redirect × múltiplos formulários

- **Escolhido — links**: a toolbar recebe `amountHref`, `expiresHref` e `clearHref` prontos do controller; o clique navega para a URL canônica ativando o critério (ou alternando sua direção, se já ativo), preservando filtros e o outro critério. Sem JS, sem o bug de “recarregar e alternar de novo”.
- **Descartado — botão `toggle` no mesmo form**: exigiria redirect 303 para canonicalizar; sem redirect, F5 alternaria a ordem novamente.
- **Descartado — um `<form>` por toggle**: duplicaria inputs ocultos e pioraria legibilidade/testes.

> **Decision**: links estilizados como botões, com o critério ativo destacado (`aria-current`). O formulário GET cuida apenas de `search`, `type` e `indexer`, levando `sort`/`dir` como hidden somente quando fora do padrão.

### Lógica de estado em módulo dedicado (escolhida)

- **Escolhido**: `state.ts` com funções puras (`parseToolbarState`, `applyToolbarState`, `buildToolbarOptions`, `buildToolbarLinks`, `toToolbarView`) testadas em `state.test.ts`.
- **Descartado**: concentrar tudo no controller (difícil de testar e de evoluir) ou no template ETA (lógica no HTML).

> **Decision**: `state.ts`; `index.ts` apenas declara o `IViewConfig` e re-exporta o estado.

### Regras de filtro e ordenação

- **Busca**: `trim` → `normalize("NFD")` → remove `[\u0300-\u036f]` → `toLocaleLowerCase("pt-BR")`; compara por substring com `venture.name`.
- **Tipo**: igualdade com `venture.type`.
- **Indexador**: igualdade com `venture.indexer` apenas para `category === "FIXED"`; ativos variáveis são excluídos quando o filtro está ativo.
- **Ordenação**: (1) sem `expiresIn` sempre depois dos que têm, independentemente de critério/direção; (2) critério **`expires`**: compara timestamps na `dir` e desempata por `latestValue` desc; (3) critério **`amount`**: compara `latestValue` na `dir` e desempata por expiração asc; (4) empate total → `0` (ordem estável).
- **Opções**: `Set` dos valores presentes, mapeados para rótulo e ordenados por `localeCompare("pt-BR")`.

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Base compartilhada e tipos**:
  - Criar `src/views/tesouroDireto/ventures.ts` com `EMPTY_VALUE`, `VENTURE_TYPE_LABELS`, `INDEXER_TYPE_LABELS` e `isFixedIncomeVenture` (mover de `tesouroDiretoTable/index.ts`).
  - Definir em `state.ts` `SortDirection`, `ITesouroDiretoToolbarState`, `IToolbarOption`, `IToolbarLinks` e `ITesouroDiretoToolbarView`.

- [x] **Step 2 — Estado da toolbar (`state.ts`)**:
  - `parseToolbarState(params: URLSearchParams)` com defaults (`search: ""`, sem filtros, `sort: "expires"`, `dir: "asc"`) e validação por enums, `sort` (`expires` | `amount`) e `dir` (`asc` | `desc`).
  - `filterTrackings(trackings, state)`, `sortTrackings(trackings, state)` e `applyToolbarState` (filtro + ordenação).
  - `buildToolbarOptions(trackings)` (tipo e indexador, a partir do conjunto não filtrado).
  - `buildToolbarLinks(pathname, state)` (ativação do critério e toggle de `dir`, omitindo padrões, + `clearHref`).
  - `hasActiveFilters(state)` e `toToolbarView(trackings, state)`.

- [x] **Step 3 — Componente visual**:
  - `index.ts` com `tesouroDiretoToolbar` (`template: "components/tesouroDiretoToolbar/view"`, `style`/`stylePath`), `as const satisfies IViewConfig`.
  - `view.eta`: `<form method="get" action="/tesouro-direto" role="search">` com input `search`, selects `type`/`indexer` (“Todos…” + opções), hidden `sort`/`dir` quando fora do padrão, botão submit “Filtrar”; grupo de ordenação com dois links (critério ativo destacado, ícone da direção, `aria-current` e `aria-label` da próxima ação); “Limpar filtros” condicional; “Exportar”/“Importar” inertes.
  - `styles.css`: barra em flex com wrap, campos compactos, botões/links usando a paleta `--app-*`, ações alinhadas à direita, foco visível.
  - Exportar em `src/views/components/index.ts`; registrar o CSS em `viewStyles` (`src/utils/staticAssets.ts`).

- [x] **Step 4 — Página, controller e rota**:
  - `src/views/tesouroDireto/view.eta`: incluir a toolbar entre o título e a tabela e repassar `emptyMessage` à tabela.
  - `tesouroDiretoTable/view.eta`: `it.emptyMessage ?? "Nenhum investimento cadastrado."` no estado vazio.
  - `ViewsController.index(req?: Request)`: montar `URL` (`req?.url ?? "http://localhost/tesouro-direto"`), parsear, filtrar/ordenar `PREVIEW_TRACKING`, mapear `rows`, montar `toolbar`, definir `emptyMessage` e incluir `tesouroDiretoToolbar.style` em `extraStyles`.
  - `render()`: aceitar `toolbar` e `emptyMessage` nas opções e repassar ao template.
  - `index.ts`: `withRequestLog("render", (req) => viewsController.index(req))`.

- [x] **Step 5 — Testes**:
  - `state.test.ts`: parse (defaults, válidos, inválidos, trim), filtros (busca case/acento, tipo, indexador, variável), ordenação (`expires` asc/desc, `amount` desc/asc como critério primário, desempate com direção fixa, sem expiração no fim, empate estável), opções dinâmicas e links (ativar critério, alternar `dir`, preservar filtros, omitir padrões, limpar).
  - `views.test.ts`: ordem padrão (Prefixado → Selic → IPCA), busca aplicada, tipo válido sem resultados com mensagem “Nenhum investimento encontrado.” e “Limpar filtros”, tipo inválido ignorado, indexador aplicado, markup da toolbar (form/action, campos, “Todos os tipos”, “Todos os indexadores”, opções dinâmicas, “Filtrar”, Exportar/Importar inertes), valor da busca preservado no input e CSS da toolbar apenas na página do Tesouro.

- [x] **Step 6 — Documentação, memória e verificação**:
  - Atualizar `.agents/PROJECT.md` (novo diretório/arquivo `tesouroDireto/ventures.ts` e toolbar) e registrar `MEM-2026-029` em `VIEWS_MEMORY.md` + `INDEX.md`.
  - Rodar `bun test` e `bunx tsc --noEmit`; smoke com query strings.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bun test src/views/components/tesouroDiretoToolbar/state.test.ts`
  - `bun test src/views/views.test.ts`
  - `bun test`
  - `bunx tsc --noEmit`
  - Smoke (instância ativa): `GET /tesouro-direto`, `/tesouro-direto?search=selic`, `?type=CDB`, `?indexer=IPCA`, `?sort=amount`, `?sort=amount&dir=asc`, `?sort=expires&dir=desc`.
- **Edge cases to verify**:
  - Query vazia → defaults (critério expiração asc; ordem Prefixado → Selic → IPCA).
  - `search` com espaços/acentos/maiúsculas (“ SÉLIC ”) encontra “Tesouro Selic 2029”.
  - `type=FOO`, `sort=foo` ou `dir=up` → ignorados; `type=CDB` (válido, sem dados) → 0 linhas com mensagem de busca.
  - `indexer=SELIC`/`IPCA`/`PRE` → 1 linha cada; ativos variáveis fora do resultado quando há indexador.
  - `sort=amount` (desc) → IPCA → Selic → Prefixado; `sort=amount&dir=asc` → ordem inversa; `sort=expires&dir=desc` → IPCA → Selic → Prefixado.
  - Sem expiração permanece no fim em todos os critérios e direções.
  - Desempate: expiração asc/valor desc conforme o critério; empate total estável.
  - Controle ativo destacado; clicar no inativo ativa o critério na direção padrão; clicar no ativo alterna `dir`.
  - Links de ordenação preservam busca/tipo/indexador e omitem `sort=expires`/`dir` padrão.
  - “Limpar filtros” só aparece com estado ativo e aponta para `/tesouro-direto`.
  - Formulário mantém critério/direção atuais via hidden apenas quando fora do padrão.
  - Busca renderizada com escape de HTML no `value`.
  - Toolbar e CSS carregados apenas em `/tesouro-direto`; Rendas Fixas e Ações inalteradas.
  - `controller.index()` sem argumento continua funcionando (testes existentes).

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - 2026-10-29 — Clarificações respondidas (Fase 2): (1) SSR via query string; (2) “Sem expiração fica sempre no fim; A expiração tem prioridade e o montante desempata, caso ambos sejam iguais, não importa a ordem.”; (3) opções dinâmicas; (4) componente específico; (5) botões inertes; (6) mensagem distinta + “Limpar filtros”; autorizada a leitura da query string.
  - 2026-10-29 — Revisão: desenvolvedor escolheu **(B)** — clicar em “Montante” o torna critério primário (desc) e a expiração (asc) desempata; clicar em “Expiração” faz o inverso. Parâmetros canônicos: `sort` + `dir`. Pendente de aprovação do plano revisado.
  - 2026-10-29 — Plano revisado aprovado: “Aprovado”. Plan ID `add-tesouro-direto-table-toolbar` atribuído após verificação de unicidade (planos, histórico, branches e commits).
  - 2026-11-08 — Fase 1 (execução): baseline `bun test src/views/views.test.ts` → 13 pass / 1 fail (headers desatualizados por alteração WIP do template: Montante → Expiração → Rentabilidade). Resposta do desenvolvedor: “!A primeira opção” (atualizar a asserção). Asserção corrigida.
  - 2026-11-08 — Fase 2: `state.test.ts` com 22 casos e 9 casos de integração em `views.test.ts`; execução `0 pass / 1 error` (módulo ausente) e `15 pass / 8 fail`. Corrigidas duas expectativas inconsistentes do próprio teste: `indexerOptions` sem `PRE`/Prefixado e `expiresHref` ao voltar ao padrão. Resposta do desenvolvedor: “Corrija os problemas do código”.
  - 2026-11-08 — Fase 3: implementados `tesouroDireto/ventures.ts`, toolbar (`state.ts`, `index.ts`, `view.eta`, `styles.css`), `index(req?)`, `emptyMessage`, registro de CSS e rota com `req`. Escopo `45 pass / 0 fail`; regressão `bun test` 93 pass / 0 fail; `bunx tsc --noEmit` 0 erros; smoke: padrão Prefixado → Selic → IPCA, `sort=amount` IPCA → Selic → Prefixado, `search=selic` 1 linha, `type=CDB` mensagem de busca, CSS 200.
  - 2026-11-08 — Registro de execução: `.agents/plans/add-tesouro-direto-table-toolbar-execution.md`.

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Each item must be atomic, verifiable and traceable to its source step in Section 4. This list is the single source of truth for execution progress: update it in the same iteration as any plan change.

### Step 1: Base compartilhada e tipos

- [x] `TODO-01` Criar `src/views/tesouroDireto/ventures.ts` com `EMPTY_VALUE`, `VENTURE_TYPE_LABELS`, `INDEXER_TYPE_LABELS` e `isFixedIncomeVenture`.
- [x] `TODO-02` Atualizar `src/views/components/tesouroDiretoTable/index.ts` para importar rótulos/guard de `@/src/views/tesouroDireto/ventures` e remover as definições locais.
- [x] `TODO-03` Declarar em `state.ts` `SortDirection`, `ITesouroDiretoToolbarState`, `IToolbarOption`, `IToolbarLinks` e `ITesouroDiretoToolbarView`.

### Step 2: Estado da toolbar

- [x] `TODO-04` Implementar `parseToolbarState` com defaults (`sort: "expires"`, `dir: "asc"`), filtros vazios e validação de enums, `sort` e `dir` em `state.ts`.
- [x] `TODO-05` Implementar `normalizeSearch` (trim, NFD, remoção de diacríticos, minúsculas) e `filterTrackings`.
- [x] `TODO-06` Implementar `sortTrackings` (critério primário `expires`/`amount`, sem expiração no fim, desempate com direção fixa, empate estável) e `applyToolbarState`.
- [x] `TODO-07` Implementar `buildToolbarOptions` a partir do conjunto não filtrado, com `Set` + `localeCompare("pt-BR")`.
- [x] `TODO-08` Implementar `buildToolbarLinks` (ativar critério/toggle de `dir`, omissão dos padrões, `clearHref`) e `hasActiveFilters`.
- [x] `TODO-09` Implementar `toToolbarView(trackings, state)` agregando estado, opções, links e flag de filtro ativo.

### Step 3: Componente visual

- [x] `TODO-10` Criar `src/views/components/tesouroDiretoToolbar/index.ts` com `tesouroDiretoToolbar` (`as const satisfies IViewConfig`) e re-export de `state`.
- [x] `TODO-11` Criar `view.eta` com `<form method="get" action="/tesouro-direto" role="search">`, input `search`, selects `type`/`indexer` e hidden condicionais.
- [x] `TODO-12` Adicionar em `view.eta` o botão submit “Filtrar” e os links de ordenação de montante/expiração com destaque do critério ativo, `aria-current` e `aria-label` da próxima ação.
- [x] `TODO-13` Adicionar em `view.eta` “Limpar filtros” condicional e os botões inertes “Exportar” (`bi-download`) e “Importar” (`bi-upload`).
- [x] `TODO-14` Criar `styles.css` da toolbar (flex/wrap, campos compactos, botões/links na paleta, foco visível, ações à direita).
- [x] `TODO-15` Exportar o componente em `src/views/components/index.ts`.
- [x] `TODO-16` Registrar `tesouroDiretoToolbar` em `viewStyles` de `src/utils/staticAssets.ts`.

### Step 4: Página, controller e rota

- [x] `TODO-17` Incluir a toolbar em `src/views/tesouroDireto/view.eta` entre o título e a tabela.
- [x] `TODO-18` Ajustar `src/views/components/tesouroDiretoTable/view.eta` para usar `it.emptyMessage ?? "Nenhum investimento cadastrado."`.
- [x] `TODO-19` Alterar `ViewsController.index(req?: Request)` para parsear a query, aplicar filtro/ordenação e montar `toolbar` + `emptyMessage`.
- [x] `TODO-20` Estender `IPageRenderOptions`/`render` com `toolbar` e `emptyMessage`, incluindo `tesouroDiretoToolbar.style` em `extraStyles`.
- [x] `TODO-21` Atualizar a rota `/tesouro-direto` em `index.ts` para passar `req` ao controller.

### Step 5: Testes

- [x] `TODO-22` Criar `state.test.ts` cobrindo `parseToolbarState` (defaults, válidos, inválidos, trim).
- [x] `TODO-23` Cobrir `filterTrackings` (busca case/acento, tipo, indexador, ativo variável).
- [x] `TODO-24` Cobrir `sortTrackings` (expiração asc/desc, montante desc/asc como critério primário, desempate, sem expiração no fim, empate estável).
- [x] `TODO-25` Cobrir `buildToolbarOptions`, `buildToolbarLinks` (ativar critério, alternar `dir`, omitir padrões) e `hasActiveFilters`.
- [x] `TODO-26` Adicionar em `views.test.ts` o teste da ordem padrão (Prefixado → Selic → IPCA).
- [x] `TODO-27` Adicionar em `views.test.ts` testes de busca, tipo válido sem resultados, tipo inválido ignorado, indexador e ordenação primária por montante.
- [x] `TODO-28` Adicionar em `views.test.ts` testes do markup da toolbar (form/action, campos, opções dinâmicas, links de ordenação, “Limpar filtros”, Exportar/Importar inertes, `search` preservado).
- [x] `TODO-29` Adicionar em `views.test.ts` teste do CSS da toolbar apenas na página do Tesouro.
- [x] `TODO-30` Rodar `bun test src/views/components/tesouroDiretoToolbar/state.test.ts` e `bun test src/views/views.test.ts`, registrando os resultados.

### Step 6: Documentação, memória e verificação

- [x] `TODO-31` Atualizar `.agents/PROJECT.md` com a toolbar e `src/views/tesouroDireto/ventures.ts`.
- [x] `TODO-32` Criar `MEM-2026-029` em `.agents/memory/VIEWS_MEMORY.md` e a linha correspondente no `INDEX.md`.
- [x] `TODO-33` Criar o registro de execução em `.agents/plans/add-tesouro-direto-table-toolbar-execution.md`.

### Final Verification

- [x] `TODO-34` Rodar `bun test` completo e registrar as contagens.
- [x] `TODO-35` Rodar `bunx tsc --noEmit` e confirmar 0 erros.
- [x] `TODO-36` Smoke com `/tesouro-direto`, `?search=selic`, `?type=CDB`, `?indexer=IPCA`, `?sort=amount`, `?sort=amount&dir=asc` e `?sort=expires&dir=desc`.
