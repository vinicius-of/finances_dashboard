# Execução — Tabela de investimentos do Tesouro Direto

- **Data:** 2026-10-29 · **Branch:** `main` · **Registro:** `add-tesouro-direto-investments-table-execution`
- **Resultado:** concluído

## Task

Criar o componente visual da tabela do Tesouro Direto (headers + uma linha por investimento, com menu de opções), usando `venture` + valores do último `snapshot`, formatadores em `src/utils/` e dados de preview. Sem integração real, sem ações funcionais. Critério de pronto: testes de renderização, do mapper e dos formatadores verdes, `tsc` limpo e página renderizando a tabela.

## Fase 1 — Análise

- **Área afetada:** `src/views/tesouroDireto/view.eta`, novo `src/views/components/tesouroDiretoTable/`, `src/views/types.ts`, `src/views/views.controller.ts`, `src/utils/staticAssets.ts`, `src/utils/formatMoneyToBRL.ts`, `src/utils/formatDate.ts`, novo `src/utils/formatPercentage.ts`, `src/views/views.test.ts`.
- **Testes relacionados:** `src/views/views.test.ts` → 6 pass / 0 fail (73 assertions). `bunx tsc --noEmit` → 0 erros.
- **Lacuna de cobertura:** nenhum teste de conteúdo da tabela, de `render` com dados por página, do mapper ou dos formatadores.
- **Proposta:** 15 casos (7 headers, linhas formatadas, menu, CSS por página, estado vazio, 4 do mapper, 3 conjuntos de formatadores).

**Resposta do desenvolvedor:**

> Pode seguir

## Fase 2 — Testes e causas

- **Testes escritos:** `src/utils/formatMoneyToBRL.test.ts`, `src/utils/formatDate.test.ts`, `src/utils/formatPercentage.test.ts`, `src/views/views.test.ts` (5 casos de tabela + 4 do mapper).
- **Execução:** `0 pass / 4 fail / 4 errors` — falhas de módulo/export, não de asserção.
- **Causas:**
  - `src/utils/formatMoneyToBRL.ts:1` e `src/utils/formatDate.ts:1` — arquivos com 0 bytes, sem export.
  - `src/utils/formatPercentage.ts` — inexistente.
  - `src/views/components/index.ts:1` — só re-exportava `./menu`; import estático abortava todo o `views.test.ts`.
  - Markup ausente em `src/views/tesouroDireto/view.eta:2-6`, `src/views/views.controller.ts:59-69`, `src/utils/staticAssets.ts:12` e `src/views/types.ts:1-13`.
- **Fato do ambiente:** fuso local UTC−3 — `new Date("2029-03-01").getDate()` retorna 28; formatação precisa usar UTC.

**Resposta do desenvolvedor:**

> Pode seguir

## Fase 3 — Implementação

- **Arquivos de produção alterados/criados:**
  - `src/utils/formatMoneyToBRL.ts` — centavos → BRL via `Intl`, NBSP normalizado.
  - `src/utils/formatDate.ts` — `dd/mm/aaaa` com componentes UTC; `RangeError` em data inválida.
  - `src/utils/formatPercentage.ts` — duas casas, `signDisplay: exceptZero`.
  - `src/views/types.ts` — `ITesouroDiretoTableRow` e `ProfitabilityTrend`.
  - `src/views/components/tesouroDiretoTable/index.ts` — config, mapas de rótulos e `toTesouroDiretoTableRow`.
  - `src/views/components/tesouroDiretoTable/view.eta` — tabela, estado vazio e menu `<details>`.
  - `src/views/components/tesouroDiretoTable/styles.css` — tabela, badge, cores de rentabilidade e menu.
  - `src/views/components/index.ts` — export do componente.
  - `src/views/tesouroDireto/view.eta` — include do componente.
  - `src/views/views.controller.ts` — `PREVIEW_TRACKING`/`PREVIEW_ROWS`, `render(page, { rows, extraStyles })`.
  - `src/utils/staticAssets.ts` — CSS do componente em `viewStyles`.
- **Testes do escopo:** `20 pass / 0 fail` (137 assertions).
- **Regressão:** `bun test` → 63 pass / 0 fail (248 assertions) · `bunx tsc --noEmit` → 0 erros.
- **Smoke:** instância de desenvolvimento já ativa na porta 3333 — `GET /tesouro-direto` 200 com 12 botões de opções, `GET /views/components/tesouroDiretoTable/styles.css` 200.

## Fase 4 — Relatório

- `renderiza os 7 headers na ordem definida` → garante ordem e rótulos das colunas.
- `renderiza uma linha por investimento com os valores formatados` → 3 linhas com tipo, indexador, montante, rentabilidade e expiração formatados.
- `exibe o menu de opções com as quatro ações em cada linha` → 12 botões (3×4) e `aria-label` por linha.
- `carrega o CSS do componente somente na página do Tesouro Direto` → isolamento de estilos entre páginas.
- `exibe estado vazio quando não há investimentos` → `colspan="7"` e mensagem.
- `formata os valores do último snapshot e os rótulos do venture` → bridge completa `IVentureTracking` → linha.
- `usa — para montante e rentabilidade quando não há snapshot` → fallback de dados ausentes.
- `usa — para expiração e indexador ausentes` → ativos variáveis e sem vencimento.
- `mantém a tendência neutra quando a rentabilidade é zero` → classe/estado neutro.
- `formatMoneyToBRL` (2 casos), `formatDate` (2 casos), `formatPercentage` (1 caso) → contratos dos formatadores.

## Pendências

- O menu `<details>` não fecha com clique fora nem `Esc` (limitação aceita nesta etapa visual; revisar quando as ações forem implementadas).
- Linhas e valores são **mock** (`PREVIEW_TRACKING` no controller); a integração com `SnapshotsService.tracking` fica para task própria.
- Componente é específico do Tesouro Direto; reuso em Rendas Fixas e Ações exigirá generalização.
