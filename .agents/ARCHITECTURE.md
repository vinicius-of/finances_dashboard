# Arquitetura do Projeto

> Documento de referência da arquitetura do **Finances Dashboard**. Descreve a stack, a organização dos diretórios, os pontos de entrada e as regras estruturais que devem ser respeitadas em qualquer implementação.

---

## 1. Visão Geral

- Aplicação web simples que serve **páginas renderizadas no servidor (SSR)**, utilizando **ETA** como template engine.
- **TypeScript** como linguagem de programação principal.
- **Bun** runtime como ambiente de execução.
- Persistência de dados via **Drizzle ORM** sobre o banco **`bun:sqlite`** (definição, manipulação e consulta de dados).
- **Docker** para construção e exposição dos serviços — o `Dockerfile` prepara a imagem para ser construída.

## 2. Stack de Tecnologias

| Camada             | Tecnologia            |
| ------------------ | --------------------- |
| Linguagem          | TypeScript (estrito)  |
| Runtime            | Bun                   |
| Template engine    | ETA                   |
| ORM                | Drizzle ORM           |
| Banco de dados     | `bun:sqlite`          |
| Conteinerização    | Docker (`Dockerfile`) |
| Controle de versão | Git                   |

## 3. Estrutura de Diretórios

| Diretório/Arquivo           | Responsabilidade                                                                                  | Regras                                                                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `static/`                   | Arquivos, utilitários e scripts concretos.                                                        | Sem importações que exijam mudanças para funcionamento adequado.                                                                                                                                                                              |
| `static/styles/`            | Folhas de estilo globais servidas pela aplicação.                                                 | `theme.css` contém a paleta e as CSS variables do Bootstrap; estilos de layout/menu/views ficam em `src/views/*/styles.css`.                                                                                                                  |
| `static/files.ts`           | Resposta de arquivos com `fileResponse`.                                                          | Preserva `404`, `Last-Modified` e `304`; `Range` delegado ao Bun.                                                                                                                                                                             |
| `src/`                      | Todo o código-fonte do projeto: APIs, rotas, middlewares, views e regras de negócio.              | —                                                                                                                                                                                                                                             |
| `src/utils/logs.ts`         | Logger estruturado de startup e requisições.                                                      | Formato/cores centralizados; usado pelo `index.ts` e pelo helper de assets.                                                                                                                                                                   |
| `src/utils/staticAssets.ts` | Configuração das rotas de assets estáticos (tema, vendor, favicon e estilos e scripts das views). | Exporta `staticAssetRoutes` e `fileRoute`; usa `fileResponse` de `static/files.ts`.                                                                                                                                                           |
| `src/api/controllers/`      | Handlers de recursos sem visualização (API).                                                      | Não acessam o banco diretamente; a renderização SSR fica em `src/views/views.controller.ts` (`ViewsController`).                                                                                                                              |
| `src/api/services/`         | Serviços de domínio sem visualização (ventures, snapshots e export).                              | Classes com dependências injetadas implementando `IService`; tipos em `*.types.ts`; testes com fakes; sem acesso direto a HTTP.                                                                                                               |
| `src/views/`                | Templates ETA, estilos, configuração por view, componentes e controller SSR.                      | Cada view tem `view.eta`, `styles.css` e `index.ts`; componentes ficam em `components/` (menu e tabela do Tesouro Direto); `layout/view.eta` centraliza o shell; tipos de linha em `types.ts`; `views.controller.ts` expõe `ViewsController`. |
| `src/repositories/`         | Repositórios de acesso a dados (um módulo por model).                                             | Consomem o client via `database/` e modelos/tipos via `src/configs/database/`; leituras filtram soft-delete.                                                                                                                                  |
| `src/configs/database/`     | Bridge que expõe os models do banco e os tipos inferidos para `src/`.                             | Não instancia o client do banco (importa de `database/models`).                                                                                                                                                                               |
| `contracts/`                | Representações de objetos reais (interfaces).                                                     | **Fonte de verdade** para a representação desses objetos. Manter interfaces isoladas de implementação e **sem importações externas** ao diretório.                                                                                            |
| `database/`                 | Configurações, modelagem, seeds e migrations do banco.                                            | —                                                                                                                                                                                                                                             |
| `index.ts`                  | Arquivo de execução inicial (entry point).                                                        | Registra as rotas do `Bun.serve` com `withRequestLog` e espalha `staticAssetRoutes`; startup via `log.startup`.                                                                                                                               |
| `Dockerfile`                | Preparação da imagem Docker.                                                                      | —                                                                                                                                                                                                                                             |

## 4. Arquivos de Referência para Agentes

O projeto contém documentos e fluxos de uso direto e controlado por agentes de IA:

| Arquivo                       | Finalidade                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                   | Instruções de contexto, padrões de código, comandos e limites para agentes.                        |
| `RESTRICTIONS.md`             | Lista consolidada das restrições/proibições do agente (extraída do `AGENTS.md`).                   |
| `ARCHITECTURE.md`             | Este documento — arquitetura e organização estrutural do projeto.                                  |
| `PROJECT.md`                  | Visão geral do projeto/objetivos.                                                                  |
| `workflow/PLANNING.md`        | Fluxo de planejamento (análise, opções, plano e TODO list).                                        |
| `workflow/DEFAULT_EXECUTE.md` | Workflow padrão de desenvolvimento (fases com gates, testes como contrato e registro da execução). |

## 5. Arquivos de Configuração

| Arquivo               | Finalidade                                                            |
| --------------------- | --------------------------------------------------------------------- |
| `./opencode.json`     | Configuração do provedor "OpenCode Go".                               |
| `./package.json`      | Lista dos pacotes instalados no projeto e scripts.                    |
| `./drizzle.config.ts` | Configuração do Drizzle Kit (dialeto, schema e credenciais do banco). |

## 6. Compilado de Contratos (Memória)

Para consulta rápida de todos os contratos (tipos e interfaces) definidos no projeto, ver `contracts/CONTRACTS_MEMORY.md`.

## 7. Regras de Arquitetura (Source of Truth)

- O diretório `contracts/` é a **fonte de verdade** da representação dos objetos reais do domínio.
- Ao alterar qualquer contrato em `contracts/`, **todas as implementações devem refletir a mudança**.
- As interfaces em `contracts/` devem permanecer **isoladas de implementação** e **livres de importações externas** ao diretório, servindo de base para implementações concretas sem distorcer o fato verdadeiro que representam.
- O ponto de entrada da aplicação é sempre o arquivo `index.ts` na raiz do projeto.
