# Implementation Plan: Views básicas com layout Bootstrap e menu lateral (ETA)

- **Plan ID**: `add-bootstrap-views-layout`
- **Status**: Done
- **Date**: 2026-10-19

## 1. Requirements & Objectives

- **Goal**: Implementar as views SSR básicas do Finances Dashboard com ETA + Bootstrap: um `layout.eta` compartilhado, um componente de menu lateral recorrente e três páginas navegáveis (Tesouro Direto, Rendas Fixas e Ações), com a paleta de cores do projeto aplicada via CSS variables do Bootstrap.
- **Scope (in)**:
  - Instalação manual (pelo desenvolvedor) de `bootstrap` e `bootstrap-icons` — o agente **não** altera `package.json`/`bun.lock`.
  - `src/views/layout.eta`: shell HTML (`lang="pt-BR"`, meta, título, favicon, links de CSS) + inclusão do menu + `it.body`.
  - `src/views/components/menu.eta`: componente separado do menu lateral, com as 3 opções e destaque do item ativo.
  - `src/views/index.eta`: página principal (Tesouro Direto — ver reconciliação abaixo).
  - `src/views/rendasFixas.eta` e `src/views/acoes.eta`: páginas das outras duas opções.
  - `static/styles/theme.css`: paleta, layout do shell, sidebar, estados do menu e conteúdo.
  - `src/api/controllers/views.ts`: controller de views (`ViewsController`) com os metadados das páginas e renderização via ETA.
  - `index.ts`: rotas `/`, `/tesouro-direto`, `/rendas-fixas`, `/acoes` e servimento dos assets de CSS/fontes.
  - Testes de renderização do controller/templates.
  - Atualização de `.agents/PROJECT.md`, `.agents/ARCHITECTURE.md` e da memória do projeto.
- **Out of Scope**:
  - Regras de negócio, acesso a banco/repositórios, APIs JSON, autenticação/guards.
  - Responsividade, menu colapsável/hambúrguer e qualquer JavaScript do Bootstrap.
  - Internacionalização (i18n) dos textos.
  - Alteração dos templates `error.403.eta`, `error.404.eta`, `error.500.eta` e da hierarquia de erros.
  - Tema via compilação SCSS do Bootstrap (ver decisão na Seção 3).
  - Correção do import não utilizado `cors` em `index.ts` (problema pré-existente; será apenas reportado).

### Reconciliação `index.eta` × redirecionamento da raiz

Foi solicitado `index.eta` como view principal e, na clarificação, que `/` redirecione para `/tesouro-direto`. Para conciliar os dois requisitos sem template morto:

- `/` responde com redirecionamento para `/tesouro-direto`;
- `/tesouro-direto` renderiza a **view principal `index.eta`** (primeira opção do menu);
- `/rendas-fixas` renderiza `rendasFixas.eta`;
- `/acoes` renderiza `acoes.eta`.

Se o desenvolvedor preferir um nome explícito (`tesouroDireto.eta`) para a primeira página, o ajuste deve ser feito na revisão deste plano, antes da execução.

### Decisões confirmadas pelo desenvolvedor

| Tema                 | Decisão                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Texto/ícone do menu  | Branco `#FFFFFF` sobre a cor primária.                                                               |
| Item ativo           | Fundo secundário `#EBE3A7` + texto/ícone “preto” `#2E2910` (contraste).                              |
| Bootstrap/Icons      | Instalação local via `bun add bootstrap bootstrap-icons` (executada manualmente pelo desenvolvedor). |
| Estrutura            | `layout.eta` + partial `components/menu.eta` via `include()`.                                        |
| Rota raiz            | `/` redireciona para `/tesouro-direto`.                                                              |
| Rota/nome da opção 2 | `/rendas-fixas`, rótulo e título “Rendas Fixas”.                                                     |
| Ícones               | `bi-bank` (Tesouro Direto), `bi-file-earmark-text` (Rendas Fixas), `bi-graph-up-arrow` (Ações).      |
| Largura do menu      | `200px`, com `white-space: nowrap` para manter cada rótulo em uma única linha.                       |
| Rotas                | Controller de views em `src/api/controllers/views.ts`.                                               |

## 2. Codebase Audit & Context

- **Affected Files / Modules**:
  - `index.ts` (Modify — instanciar o controller e registrar rotas/assets; hoje só serve `/` com `"OK"` e o favicon).
  - `src/api/controllers/views.ts` (Create — controller de views).
  - `src/api/controllers/views.test.ts` (Create — testes de renderização).
  - `src/views/layout.eta` (Create — shell compartilhado).
  - `src/views/components/menu.eta` (Create — componente do menu).
  - `src/views/index.eta` (Modify — atualmente vazio; passa a ser a página Tesouro Direto).
  - `src/views/rendasFixas.eta` (Create).
  - `src/views/acoes.eta` (Create).
  - `static/styles/theme.css` (Create — paleta + layout/menu).
  - `.agents/PROJECT.md`, `.agents/ARCHITECTURE.md`, `.agents/memory/` (Modify/Create — documentação e memória).
  - `package.json`, `bun.lock` (Modify **exclusivamente pelo desenvolvedor** ao rodar a instalação).
- **Dependencies Required**:
  - `bootstrap` (CSS; exige Bootstrap ≥ 5.3 para customização por CSS variables).
  - `bootstrap-icons` (CSS + fontes `.woff2`/`.woff`).
  - Comando a ser executado manualmente pelo desenvolvedor:
    ```bash
    bun add bootstrap bootstrap-icons
    ```
- **Contexto relevante**:
  - `eta@4.6.0` já está instalado; `index.ts` já configura `views: src/views` e o pacote resolve `include`/`layout` com extensão `.eta` automática e caminhos relativos ao diretório de views.
  - `src/views/index.eta` está vazio; os templates de erro usam `<%= it.title %>` e `<%= it.message %>`.
  - `static/headers.ts` já exporta `PageHeadersInit` (`text/html; charset=utf-8`) e `static/index.ts` faz o barrel — o controller deve reutilizar esse header.
  - `src/api/controllers/` está vazio (scaffold), sem padrão prévio de controller; o projeto usa classes `PascalCase` e objetos de módulo.
  - `tsconfig.json`: `strict`, `noUnusedLocals`, alias `@/*`.
  - Linha de base do typecheck (`bunx tsc --noEmit` em 2026-10-19): **2 erros pré-existentes** em `index.ts` — `cors` e `eta` não utilizados. A implementação passa a usar `eta`; o erro de `cors` permanece e será apenas reportado.
  - Não há testes no projeto; `bun test` está disponível pelo runtime.
  - `assets/favicon.ico` e `static/favicon.ts` já existem e permanecem inalterados.

## 3. Architectural Options & Decision

### Opção A: `layout()` do ETA + partial de menu + controller de views (escolhida)

- **Pros**: head/menu definidos uma única vez; páginas contêm apenas título/ícone; partial do menu é reutilizado; controller isola a renderização e é testável; segue a separação `views` × `api/controllers`.
- **Cons**: exige passar os dados de navegação (`items`, `active`) para o layout/partial; uma camada extra em relação a renderizar direto no `index.ts`.

### Opção B: Cada página inclui o menu e repete o `<head>`

- **Pros**: templates independentes; menos dados trafegando.
- **Cons**: duplicação de `<head>`, links de CSS e marcação do menu; risco de divergência entre páginas; manutenção pior.

### Opção C: Renderizar tudo diretamente no `index.ts`

- **Pros**: menor quantidade de arquivos.
- **Cons**: fere a responsabilidade de `src/api/controllers/`; difficulta testes unitários; mistura roteamento e montagem de resposta.

> **Decision**: **Opção A**. `layout.eta` chama `layout("./layout", { title, icon, active, items })` no topo de cada página; o layout imprime `it.body` e inclui `components/menu` com `include("components/menu", { items, active })`.

### Decisão sobre o tema Bootstrap

- Usar **CSS variables** (`--bs-primary`, `--bs-secondary`, `--bs-tertiary`, `--bs-dark` e os respectivos `*-rgb`) em `:root`, além de variáveis próprias `--app-*` para as classes customizadas.
- **Não** compilar SCSS nesta etapa: exigiria dependência/build extra e não é necessário para o escopo. Consequência documentada: componentes Bootstrap que usam valores compilados em Sass (ex.: `.btn-primary`) **não** serão re-tematizados automaticamente; nesta v1 não são usados.

### Decisão sobre servimento dos assets

- Servir os arquivos instalados diretamente de `node_modules` via rotas `Bun.file` no `Bun.serve`:
  - `/vendor/bootstrap/bootstrap.min.css` → `node_modules/bootstrap/dist/css/bootstrap.min.css`;
  - `/vendor/bootstrap-icons/bootstrap-icons.min.css` → `node_modules/bootstrap-icons/font/bootstrap-icons.min.css`;
  - `/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2` e `.woff` → `node_modules/bootstrap-icons/font/fonts/…` (o CSS referencia `./fonts/…`).
- `static/styles/theme.css` → `/styles/theme.css`.
- **Pros**: um único comando de instalação, sem cópia/duplicação de arquivos. **Cons**: `node_modules` precisa existir no runtime (já é premissa do projeto).

## 4. Step-by-Step Execution Plan

- [x] **Step 1 — Dependências e tema**:
  - Executar manualmente `bun add bootstrap bootstrap-icons` (ação do desenvolvedor; o agente não altera `package.json`).
  - Criar `static/styles/theme.css` com a paleta, o shell de 100vh, a sidebar de 200px, os estados do menu e o padding do conteúdo (`200px 16px 16px`).
  - Confirmar os caminhos reais dos assets em `node_modules`.
- [x] **Step 2 — Templates ETA**:
  - Criar `src/views/layout.eta` (head, CSS, shell, include do menu, `it.body`).
  - Criar `src/views/components/menu.eta` (3 links, ícone + rótulo em linha única, destaque do ativo com `app-menu__link--active` e `aria-current="page"`).
  - Preencher `src/views/index.eta` (Tesouro Direto), criar `src/views/rendasFixas.eta` (Rendas Fixas) e `src/views/acoes.eta` (Ações), cada uma chamando `layout()` e imprimindo o `<h2>` com ícone + título.
- [x] **Step 3 — Controller e rotas**:
  - Criar `src/api/controllers/views.ts` com `NAV_ITEMS`, o mapa de páginas e `ViewsController(eta)` (`index`, `rendasFixas`, `acoes`), retornando `Response` com `PageHeadersInit`.
  - Atualizar `index.ts` para instanciar o controller e registrar as rotas de páginas, o redirect de `/` e os assets CSS/fontes, preservando `/favicon.ico`.
- [x] **Step 4 — Testes**:
  - Criar `src/api/controllers/views.test.ts` cobrindo título/ícone/h2, item ativo único, presença das 3 opções, links de CSS e status/content-type.
  - Rodar os testes do escopo.
- [x] **Step 5 — Documentação, memória e verificação**:
  - Atualizar `.agents/PROJECT.md` e `.agents/ARCHITECTURE.md`.
  - Registrar decisão/fato novo em `.agents/memory/` via skill `create-new-memory` (IDs na sequência do `INDEX.md`).
  - Rodar typecheck e smoke test do servidor; registrar o resultado.

## 5. Verification & Testing Strategy

- **Commands to run**:
  - `bun test src/api/controllers/views.test.ts`
  - `bunx tsc --noEmit` (comparar com a linha de base: 2 erros pré-existentes; esperado restar apenas `cors` em `index.ts`)
  - Smoke test do servidor (iniciar `bun run index.ts`, consultar e encerrar):
    - `GET /` → `302` com `Location: /tesouro-direto`;
    - `GET /tesouro-direto`, `/rendas-fixas`, `/acoes` → `200` e `text/html; charset=utf-8`;
    - `GET /styles/theme.css`, `/vendor/bootstrap/bootstrap.min.css`, `/vendor/bootstrap-icons/bootstrap-icons.min.css` → `200`;
    - `GET /vendor/bootstrap-icons/fonts/bootstrap-icons.woff2` → `200`.
- **Edge cases to verify**:
  - Exatamente **um** item com `app-menu__link--active` e `aria-current="page"` por página, no link correto.
  - As 3 opções aparecem em todas as páginas, na ordem Tesouro Direto → Rendas Fixas → Ações.
  - Rótulos não quebram linha (`white-space: nowrap`) dentro dos 200px; “Tesouro Direto” e “Rendas Fixas” cabem com ícone + padding.
  - Sidebar ocupa `100vh`; conteúdo começa com `padding-top: 200px` e laterais/base de `16px`.
  - Texto/ícone do menu em `#FFFFFF`; item ativo com fundo `#EBE3A7` e texto `#2E2910`; hover/focus usando `#EB7D00`.
  - Acentuação (“Ações”) preservada em UTF-8 no HTML e no header.
  - `/` não renderiza página; apenas redireciona.
  - Assets ausentes (instalação não executada) devem ser reportados como bloqueio, não contornados com CDN.

## 6. Developer Feedback & Revisions

- [x] Plan approved by developer
- _Feedback log / Iteration notes_:
  - 2026-10-19 — Aprovação registrada: “Pode seguir com o desenvolvimento”. Plan ID `add-bootstrap-views-layout` atribuído após verificação de unicidade (planos, histórico, branches e commits).
  - 2026-10-19 — Clarificações respondidas: (1) branco no menu e `#2E2910` no item ativo; (2) instalação manual; (3) `layout.eta`; (4) `/` redireciona para `/tesouro-direto`; (5) `/rendas-fixas` com rótulo/título “Rendas Fixas”; (6) ícones confirmados; (7) sidebar alargada para caber em uma linha, com contraste; (8) controller de views.
  - Pendente de aprovação: reconciliação `index.eta` = página Tesouro Direto (Seção 1).
  - 2026-10-19 — Fase 2 executada: `src/api/controllers/views.test.ts` criado com 5 casos (`it(...)`); execução inicial `0 pass / 1 fail / 1 error` (`Cannot find module './views'`), falha esperada por ausência do controller/templates. Arquivo de teste congelado a partir da aprovação da Fase 2.
  - 2026-10-19 — Fase 3 executada: tema, layout, menu, páginas, controller e rotas implementados; `bun test src/api/controllers/views.test.ts` → **5 pass / 0 fail**; `bunx tsc --noEmit` → apenas o erro pré-existente de `cors` em `index.ts`; smoke test → `/` 302 para `/tesouro-direto`, 3 páginas 200 `text/html`, CSS/fonte 200. Ajuste adicional: `static/headers.ts` passou a tipar os headers como `Record<string, string>` para compatibilidade com `Response` (erro novo causado pelo uso do header no controller).
  - 2026-10-19 — Pós-execução: a pedido do desenvolvedor, removido o import não utilizado `cors` em `index.ts`; `bunx tsc --noEmit` → **0 erros** e `bun test` → **5 pass / 0 fail**.
  - 2026-10-20 — Refactor posterior: views separadas em diretórios próprios (`view.eta`, `styles.css`, `index.ts`); estilos de layout/menu/views movidos para `src/views`; `views.test.ts` atualizado para os novos caminhos. Registro: `refactor-views-by-directory-execution.md`.

## 7. TODO List (Execution Checklist)

> Mandatory (Phase 5). Each item must be atomic, verifiable and traceable to its source step in Section 4. This list is the single source of truth for execution progress: update it in the same iteration as any plan change.

### Step 1: Dependências e tema

- [x] `TODO-01` Desenvolvedor executa `bun add bootstrap bootstrap-icons`; confirmar as versões adicionadas em `package.json`/`bun.lock`. (Concluído: `bootstrap@5.3.8`, `bootstrap-icons@1.13.2`.)
- [x] `TODO-02` Confirmar a existência de `node_modules/bootstrap/dist/css/bootstrap.min.css`, `node_modules/bootstrap-icons/font/bootstrap-icons.min.css`, `node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2` e `.woff`. (Concluído: `bootstrap.min.css`, `bootstrap-icons.min.css` e `bootstrap-icons.woff2` confirmados.)
- [x] `TODO-03` Criar `static/styles/theme.css` com `--app-primary` `#2C5745`, `--app-secondary` `#EBE3A7`, `--app-tertiary` `#EB7D00`, `--app-black` `#2E2910`, `--app-white` `#FFFFFF` e os equivalentes `--bs-*`/`--bs-*-rgb`.
- [x] `TODO-04` Adicionar em `static/styles/theme.css` o shell (`display:flex; min-height:100vh`), sidebar (`width:200px; flex:0 0 200px; height:100vh; background:var(--app-primary)`), links do menu (`color:#FFF; white-space:nowrap`), estado ativo (fundo secundário + texto `#2E2910`), hover/focus com terciária e conteúdo (`padding:200px 16px 16px`).

### Step 2: Templates ETA

- [x] `TODO-05` Criar `src/views/layout.eta` com doctype, `lang="pt-BR"`, charset, viewport, `<title><%= it.title %></title>`, favicon, links para `/vendor/bootstrap/bootstrap.min.css`, `/vendor/bootstrap-icons/bootstrap-icons.min.css` e `/styles/theme.css`.
- [x] `TODO-06` Em `src/views/layout.eta`, montar o shell `<div class="app-shell">` com `<%~ include("components/menu", { items: it.items, active: it.active }) %>` e `<main class="app-content"><%~ it.body %></main>`.
- [x] `TODO-07` Criar `src/views/components/menu.eta` com `<nav class="app-sidebar" aria-label="Menu principal">`, iterando `it.items` para gerar `<a href="<%= item.href %>">` com `<i class="bi <%= item.icon %>">` e `<span class="app-menu__label"><%= item.label %></span>`.
- [x] `TODO-08` Em `components/menu.eta`, aplicar `app-menu__link--active` e `aria-current="page"` somente quando `item.key === it.active`.
- [x] `TODO-09` Preencher `src/views/index.eta` com `<% layout("./layout", { title: it.title, icon: it.icon, active: it.active, items: it.items }) %>` e `<h2>` contendo `<i class="bi <%= it.icon %>">` + `<%= it.title %>` (Tesouro Direto).
- [x] `TODO-10` Criar `src/views/rendasFixas.eta` com o mesmo formato de `index.eta`, recebendo `title: "Rendas Fixas"`, `icon: "bi-file-earmark-text"` e `active: "rendas-fixas"` do controller.
- [x] `TODO-11` Criar `src/views/acoes.eta` com o mesmo formato de `index.eta`, recebendo `title: "Ações"`, `icon: "bi-graph-up-arrow"` e `active: "acoes"` do controller.

### Step 3: Controller e rotas

- [x] `TODO-12` Criar `src/api/controllers/views.ts` com `NAV_ITEMS` (3 itens com `key`, `label`, `href`, `icon`), o tipo `NavKey` e o mapa de páginas (`template`, `title`, `icon`, `active`).
- [x] `TODO-13` Implementar `ViewsController` recebendo `Eta` no construtor e os métodos `index()`, `rendasFixas()` e `acoes()`, todos retornando `new Response(eta.render(...), { headers: PageHeadersInit })`.
- [x] `TODO-14` Atualizar `index.ts` para instanciar `ViewsController` e registrar `"/": Response.redirect("/tesouro-direto")`, `"/tesouro-direto"`, `"/rendas-fixas"` e `"/acoes"`.
- [x] `TODO-15` Adicionar em `index.ts` as rotas `Bun.file` para `/styles/theme.css`, `/vendor/bootstrap/bootstrap.min.css`, `/vendor/bootstrap-icons/bootstrap-icons.min.css` e as duas fontes `.woff2`/`.woff`, mantendo `/favicon.ico`.

### Step 4: Testes

- [x] `TODO-16` Criar `src/api/controllers/views.test.ts` com um caso por página verificando status 200, `Content-Type: text/html; charset=utf-8`, `<title>` e o `<h2>` com ícone + título corretos. (Criado na Fase 2; falha inicial esperada por ausência de `./views`.)
- [x] `TODO-17` Adicionar testes de menu: as 3 opções e `href`s presentes em todas as páginas; exatamente um `app-menu__link--active` e um `aria-current="page"`, no item correto. (Criado na Fase 2.)
- [x] `TODO-18` Adicionar teste do shell: links de Bootstrap, Bootstrap Icons e `theme.css` presentes no HTML. (Criado na Fase 2.)
- [x] `TODO-19` Rodar `bun test src/api/controllers/views.test.ts` e registrar a contagem de testes aprovados. (Fase 3: **5 pass / 0 fail**, 62 asserções.)

### Step 5: Documentação, memória e verificação final

- [x] `TODO-20` Atualizar `.agents/PROJECT.md` (`src/views/` com `layout.eta`, `components/menu.eta`, `index.eta`, `rendasFixas.eta`, `acoes.eta`; `static/styles/`; controller de views).
- [x] `TODO-21` Atualizar `.agents/ARCHITECTURE.md` (estrutura de `src/views/components/`, `static/styles/` e `src/api/controllers/`).
- [x] `TODO-22` Registrar em `.agents/memory/` a decisão do shell de views (`layout.eta` + partial + controller) e o fato da paleta Bootstrap via CSS variables, via skill `create-new-memory`, atualizando `INDEX.md`.
- [x] `TODO-23` Rodar `bunx tsc --noEmit` e confirmar que o único erro restante é o pré-existente de `cors` em `index.ts`. (Confirmado: 1 erro, `index.ts:5`.)
- [x] `TODO-24` Executar o smoke test das rotas e assets (redirect, 3 páginas, CSS e fonte), registrando os códigos HTTP. (`/` 302; páginas 200; theme/bootstrap/icons/fonte 200.)
- [x] `TODO-25` Confirmar visualmente os requisitos de layout: sidebar 200px/100vh, rótulos em linha única, item ativo em secundária, conteúdo com topo 200px e laterais/base 16px. (Verificado por asserções de CSS/HTML e smoke test.)

### Final Verification

- [x] `TODO-26` Rodar a suíte de testes do escopo e registrar o resultado final. (`bun test` → 5 pass / 0 fail.)
- [x] `TODO-27` Revisar a árvore real de arquivos contra este plano e reportar arquivos alterados, validações e pendências. (Pendência do `cors` resolvida a pedido do desenvolvedor.)
