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

| Diretório/Arquivo       | Responsabilidade                                                                     | Regras                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `static/`               | Arquivos, utilitários e scripts concretos.                                           | Sem importações que exijam mudanças para funcionamento adequado.                                                                                   |
| `src/`                  | Todo o código-fonte do projeto: APIs, rotas, middlewares, views e regras de negócio. | —                                                                                                                                                  |
| `src/repositories/`     | Repositórios de acesso a dados (um módulo por model).                                | Consomem o client via `database/` e modelos/tipos via `src/configs/database/`; leituras filtram soft-delete.                                       |
| `src/configs/database/` | Bridge que expõe os models do banco e os tipos inferidos para `src/`.                | Não instancia o client do banco (importa de `database/models`).                                                                                    |
| `contracts/`            | Representações de objetos reais (interfaces).                                        | **Fonte de verdade** para a representação desses objetos. Manter interfaces isoladas de implementação e **sem importações externas** ao diretório. |
| `database/`             | Configurações, modelagem, seeds e migrations do banco.                               | —                                                                                                                                                  |
| `index.ts`              | Arquivo de execução inicial (entry point).                                           | —                                                                                                                                                  |
| `Dockerfile`            | Preparação da imagem Docker.                                                         | —                                                                                                                                                  |

## 4. Arquivos de Referência para Agentes

O projeto contém 4 arquivos de uso direto e controlado por agentes de IA:

| Arquivo           | Finalidade                                                                  |
| ----------------- | --------------------------------------------------------------------------- |
| `AGENTS.md`       | Instruções de contexto, padrões de código, comandos e limites para agentes. |
| `ARCHITECTURE.md` | Este documento — arquitetura e organização estrutural do projeto.           |
| `WORKFLOW.md`     | Fluxos de trabalho esperados.                                               |
| `PROJECT.md`      | Visão geral do projeto/objetivos.                                           |

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
