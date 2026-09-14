# Instruções para Agentes de IA

## 1. Visão Geral do Projeto

- **Nome/Objetivo**: Finances Dashboard — painel de acompanhamento de finanças pessoais e carteira de investimentos. Monitora ativos de renda fixa e renda variável, registra snapshots mensais (aportes, resgates e apuração de rendimento) e consolida um resumo geral da carteira.
- **Stack de Tecnologias**: TypeScript (estrito), runtime Bun, SQLite (`bun:sqlite`) com Drizzle ORM, ETA Template Engine, Git
- **Arquitetura**: Aplicação web server-side (SSR) executada com `Bun.serve`, organizada em camadas:
  - `index.ts` — ponto de entrada (servidor Bun + templates ETA)
  - `contracts/` — contratos de domínio (tipos e interfaces)
  - `database/` — camada de persistência com Drizzle: `models/`, `migrations/`, `seeds/`
  - `src/api/` — camada HTTP em camadas: `guards/`, `middlewares/`, `routes/`, `services/`
  - `src/errors/` — hierarquia de erros de domínio (`AppError` → `ApiError`, `ViewError`)
  - `src/views/` — templates ETA para renderização SSR
  - `src/utils/` — funções utilitárias (formatação de datas e moedas)
  - `static/` — configurações estáticas (favicon, caminhos raiz, headers)

## 2. Padrões de Código & Qualidade

- **Linguagem**: Usar TypeScript estrito (`strict: true`).
- **Convenções de Nomenclatura**:
  - `camelCase` para variáveis, funções, métodos e propriedades.
  - `PascalCase` para classes, tipos e enums.
  - Interfaces de contrato com prefixo `I` (ex.: `IVenture`, `IVentureSnapshot`).
- **Formatação**: Sempre formatar o código usando as configurações padrão do repositório.
- **Tratamento de Erros**: Não suprimir erros. Usar classes de erro específicas de domínio que herdam de `AppError` (ex.: `ApiError` para respostas JSON de API e `ViewError` para renderização de páginas SSR).

## 3. Comandos Úteis (Validação & Build)

- **Instalar dependências**: `bun install`
- **Adicionar dependência**: `bun add <pacote>`
- **Executar o projeto**: `bun run index.ts`
- **Executar testes**: `bun test`
- **Gerar migrações (Drizzle)**: `bunx drizzle-kit generate`
- **Aplicar migrações (Drizzle)**: `bunx drizzle-kit migrate`
- **Sincronizar schema (Drizzle)**: `bunx drizzle-kit push`
- **Abrir o Drizzle Studio**: `bunx drizzle-kit studio`

## 4. Limites & Segurança

- **NÃO modificar**: `.env`, `.nvmrc`, `bun.lock`, `package.json`, `opencode.json`
- **Segredos**: Nunca hardcodar chaves de API, credenciais ou tokens em arquivos-fonte.
- **Bibliotecas de terceiros**: Perguntar ou verificar antes de adicionar novos pacotes ao `package.json`.
