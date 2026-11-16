# Instruções para Agentes de IA

## 1. Visão Geral do Projeto

- **Nome/Objetivo**: Finances Dashboard — painel de acompanhamento de finanças pessoais e carteira de investimentos. Monitora ativos de renda fixa e renda variável, registra snapshots mensais (aportes, resgates e apuração de rendimento) e consolida um resumo geral da carteira.
- **Stack de Tecnologias**: TypeScript (estrito), runtime Bun, SQLite (`bun:sqlite`) com Drizzle ORM, ETA Template Engine, Git
- **Arquitetura**: Aplicação web server-side (SSR) executada com `Bun.serve`, organizada em camadas:
  - `index.ts` — ponto de entrada (servidor Bun + templates ETA)
  - `contracts/` — contratos de domínio (tipos e interfaces)
  - `database/` — camada de persistência com Drizzle: `models/`, `migrations/`, `seeds/`
  - `src/api/` — camada HTTP em camadas: `guards/`, `middlewares/`, `controllers/`, `services/`
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
- **Path Alias (prioridade)**: sempre dar prioridade a imports via alias do TypeScript (`@/...`) em vez de caminhos relativos — ex.: `@/database`, `@/src/repositories`, `@/contracts`. Usar caminho relativo apenas quando não houver alias aplicável.
- **Tratamento de Erros**: Não suprimir erros. Usar classes de erro específicas de domínio que herdam de `AppError` (ex.: `ApiError` para respostas JSON de API e `ViewError` para renderização de páginas SSR).
- **Restrição de Comentários**: Não utilizar de comentários dentro do código se não for requerido pelo desenvolvedor.
- **Separação de utilitários (controllers e services)**: arquivos de controller e de service devem permanecer enxutos. Funções auxiliares e validadores ficam em um arquivo `<modulo>.utils.ts` no mesmo diretório do controller/service; **mappers** (conversão entre camadas/modelos) ficam em `<modulo>.mappers.ts` e **funções que retornam `ApiError`** (fábricas de erro) ficam em `<modulo>.errors.ts`, ambos no mesmo diretório. Nenhum desses tipos de função pode ser declarado no arquivo do controller/service.
- **Relatório de Atividade (resumo)**: Ao finalizar uma tarefa, reportar de forma resumida e objetiva — apenas o essencial (arquivos alterados, validações executadas e pontos de atenção) — sem narrar passo a passo, evitando inchar o relatório e dificultar a revisão do desenvolvedor.

## 3. Comandos Úteis (Validação & Build)

- **Instalar dependências**: `bun install`
- **Adicionar dependência**: `bun add <pacote>`
- **Executar o projeto**: `bun run index.ts`
- **Executar testes**: `bun test`
- **Gerar migrações (Drizzle)**: `bunx drizzle-kit generate`
- **Aplicar migrações (Drizzle)**: `bunx drizzle-kit migrate`
- **Sincronizar schema (Drizzle)**: `bunx drizzle-kit push`
- **Backup do banco (checkpoint + VACUUM INTO)**: `bun database/backup.ts [destino]`
- **Abrir o Drizzle Studio**: `bunx drizzle-kit studio`

## 4. Limites & Segurança

- **NÃO modificar**: `.env`, `.nvmrc`, `bun.lock`, `package.json`, `opencode.json`
- **Modificações não feitas pelo agente**: Nunca alterar, reverter ou sobrescrever mudanças que não foram feitas pelo próprio agente (ex.: WIP do desenvolvedor). Se necessário, apenas sinalizar a existência no relatório.
- **Segredos**: Nunca hardcodar chaves de API, credenciais ou tokens em arquivos-fonte.
- **Bibliotecas de terceiros**: Perguntar ou verificar antes de adicionar novos pacotes ao `package.json`.
- **Permissão de atualização (arquivos do agente)**: não é necessário pedir permissão ao desenvolvedor para atualizar `.agents/PROJECT.md`, `.agents/ARCHITECTURE.md` e `.agents/AGENTS.md` — esses arquivos existem a serviço somente do agente. As demais regras desta seção continuam valendo (ex.: não reverter ou sobrescrever mudanças alheias).
- **Lista consolidada**: os limites desta seção e as demais proibições do projeto estão reunidos em `.agents/RESTRICTIONS.md` — consultar antes de agir.

## 5. Procedimentos Obrigatórios (toda task)

Toda task recebida deve seguir esta sequência **antes** de alterar qualquer código:

1. **Análise de requisitos pela memória**: consultar `.agents/memory/INDEX.md` e as memórias de domínio (`*_MEMORY.md`) relacionadas à task para recuperar contratos, decisões, regras e fatos já registrados.
2. **Verificação de viabilidade**: cruzar o requisito com `.agents/ARCHITECTURE.md` e `.agents/PROJECT.md`, confirmando que a solução proposta:
   - respeita as responsabilidades dos diretórios e as regras estruturais da arquitetura;
   - mantém `contracts/` como fonte de verdade (interfaces isoladas, sem importações externas ao diretório) e propaga qualquer alteração de contrato às implementações;
   - não conflita com decisões já registradas na memória — elas não devem ser reabertas sem motivo forte;
   - respeita os limites da seção 4.
3. **Conflito ou inviabilidade**: não implementar. Reportar objetivamente o conflito/impedimento e aguardar decisão do desenvolvedor.
4. **Workflow padrão**: com a viabilidade confirmada, executar **sempre** o workflow padrão do projeto (`.agents/workflow/DEFAULT_EXECUTE.md`).
5. **Execução e validação**: executar conforme as seções 2 e 3 e validar antes de reportar.
6. **Memória**: se a task introduzir contrato, decisão, regra ou fato novo relevante, registrá-lo em `.agents/memory/` via skill `create-new-memory` (IDs seguem a sequência global do `INDEX.md`).

## 6. Hierarquia dos Arquivos do Agente (`.agents/`)

Ordem de precedência para resolver **comportamentos ou direções conflitantes**. **Prioridade sempre para o arquivo de mais baixo nível** (menor número): em conflito, o nível inferior prevalece e a direção conflitante do nível superior deve ser descartada naquele ponto.

| Nível | Arquivo / Diretório             | Escopo                                                        |
| ----- | ------------------------------- | ------------------------------------------------------------- |
| 0     | `AGENTS.md`                     | Instruções mestras do agente (fonte de verdade)               |
| 1     | `RESTRICTIONS.md`               | Proibições, limites e segurança                               |
| 2     | `ARCHITECTURE.md`               | Arquitetura e regras estruturais do projeto                   |
| 3     | `PROJECT.md`                    | Visão geral dos diretórios e responsabilidades                |
| 4     | `workflow/` (todos os arquivos) | Fluxos de execução (ex.: `DEFAULT_EXECUTE.md`, `PLANNING.md`) |
| 5     | `plans/`                        | Planos e registros de execução                                |
| 6     | `memory/`                       | Memória persistente (contratos, decisões, regras, fatos)      |
| 7     | `skills/`                       | Skills (procedimentos por tipo de tarefa)                     |

**Regras de aplicação**:

- Em conflito entre níveis, o de **menor número vence**; o agente não deve seguir a direção conflitante do nível superior.
- Arquivos de níveis 4–7 são artefatos de execução/procedimento: detalham **como** executar, mas nunca sobrepõem os níveis 0–3 (ex.: uma skill ou um plano não pode autorizar o que o `RESTRICTIONS.md` proíbe nem contrariar as regras de `ARCHITECTURE.md`/`PROJECT.md`).
- Conflito envolvendo os níveis 0–3 deve ser reportado ao desenvolvedor em vez de resolvido silenciosamente (ver §5.3).
