# Execução — Renderizar a tabela do Tesouro Direto com dados reais

- **Data:** 2026-11-12 · **Branch:** `main` · **Registro:** `render-tesouro-table-from-database-execution`
- **Resultado:** concluído

## Task

Substituir o mock `PREVIEW_TRACKING` por dados do SQLite na página `/tesouro-direto`, via `PortfolioService` injetado no `ViewsController`; testes apenas do serviço, com mocks/fakes. Critério de pronto: serviço testado, página renderizando 2027/2031 reais, toolbar funcionando, `tsc` e suíte verdes.

## Fase 1 — Análise

- **Área afetada:** novo `src/api/services/portfolio/`, `src/api/services/index.ts`, `src/views/views.controller.ts`, `index.ts`, `src/views/views.test.ts` (remoção).
- **Testes relacionados:** `src/views/views.test.ts` (22 casos) e suíte com 91 testes.
- **Lacuna de cobertura:** nenhum teste para leitura composta de ventures + tracking; controller dependia de mock.
- **Proposta:** 6 casos de `PortfolioService` com fakes; remoção dos testes de view (decisão do desenvolvedor).

**Resposta do desenvolvedor:**

> Pode executar

## Fase 2 — Testes e causas

- **Testes escritos:** `portfolio.test.ts` com fakes de `getAll`/`tracking` (contadores), cobrindo filtro por tipo, ausência de tipo, ordem, vazio e `execute`.
- **Execução:** não houve fase vermelha separada — testes e implementação foram adicionados no mesmo ciclo, após aprovação do plano (o desenvolvedor dispensou o gate ao autorizar “Pode executar”).
- **Causas/racional:** o mock existia porque o controller não tinha acesso a dados; a ausência de um serviço de leitura composta era a lacuna estrutural.

**Resposta do desenvolvedor:**

> Pode seguir com a atividade

## Fase 3 — Implementação

- **Arquivos criados/alterados:**
  - `src/api/services/portfolio/portfolio.types.ts` — `IPortfolioVenturesReader`, `IPortfolioSnapshotsReader`, `IPortfolioTrackingReader`, input/output/dependências.
  - `src/api/services/portfolio/portfolio.service.ts` — `PortfolioService` (`listTracking`/`execute`).
  - `src/api/services/portfolio/portfolio.test.ts` — 6 casos com fakes.
  - `src/api/services/index.ts` — export dos tipos/serviço.
  - `src/views/views.controller.ts` — recebe `IPortfolioTrackingReader`; busca `TREASURY`; mock removido.
  - `index.ts` — instancia `VenturesService`, `SnapshotsService` e `PortfolioService` e injeta no controller.
  - `src/views/views.test.ts` — **removido** (decisão do desenvolvedor).
- **Testes do escopo:** `bun test src/api/services/portfolio/portfolio.test.ts` → **6 pass / 0 fail**.
- **Regressão:** `bun test` → **75 pass / 0 fail** (167 assertions); `bunx tsc --noEmit` → **0 erros**.
- **Smoke:** `/tesouro-direto` → `Tesouro Selic 2027` (R$ 23.411,57 / +132,95%) e `Tesouro Selic 2031` (R$ 7.612,65 / +363,60%); `?search=2031` → 1 linha; `?indexer=SELIC` → 2 linhas; `?search=inexistente` → “Nenhum investimento encontrado.”.

## Fase 4 — Relatório

- `filtra os ventures pelo tipo informado` → apenas TREASURY chegam ao tracking.
- `não consulta tracking dos ventures filtrados` → evita trabalho e efeitos colaterais.
- `retorna todos os trackings quando o tipo não é informado` → uso genérico (futuras páginas).
- `preserva a ordem retornada por getAll` → a ordenação da toolbar continua no controller.
- `retorna vazio quando não há ventures do tipo` → estado vazio da página.
- `despacha para listTracking` → contrato `IService`.

## Pendências

- **N+1**: `PortfolioService` chama `tracking()` por venture (uma leitura de snapshots cada). Aceitável para 18 ventures; otimizar quando a base crescer.
- **Cobertura de view removida**: sem `views.test.ts`, não há mais testes de navegação, 404, assets, controller nem do mapper `toTesouroDiretoTableRow`.
- **`.env` × imports**: `index.ts` chama `loadEnvFile` no corpo, mas o `database/client.ts` é avaliado antes pelos imports estáticos; com `DATABASE_URL` preenchido no `.env`, o client continuaria no default `my-finances.db`. Hoje não impacta (valor vazio). Corrigir movendo o `loadEnvFile` para um módulo importado primeiro.
- Rendas Fixas e Ações continuam sem dados (o `PortfolioService` já aceita `type`).
