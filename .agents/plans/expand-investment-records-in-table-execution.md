# Execução — Expansão de registros (snapshots) na tabela

- **Data:** 2026-11-12 · **Branch:** `main` · **Registro:** `expand-investment-records-in-table-execution`
- **Resultado:** concluído

## Task

Adicionar uma primeira coluna com botão de seta que expande a lista de registros (snapshots) de cada investimento, exibindo data do registro, valor adicionado/removido e nota (máx. 3 linhas), com toggle cliente (`aria-expanded` + `hidden`) e testes do mapper.

## Fase 1 — Análise

- **Área afetada:** `src/views/types.ts`, `src/views/components/tesouroDiretoTable/{records.ts,records.test.ts,index.ts,view.eta,styles.css,records.js}`, `src/utils/staticAssets.ts`.
- **Testes relacionados:** nenhum (view tests removidos na task anterior).
- **Dados reais:** 7 snapshots TREASURY, todos `MONTHLY_RECORD`, `movement_value = NULL`; 1 nota.
- **Proposta:** mapper puro + 9 casos; sem testes de DOM.

**Resposta do desenvolvedor:**

> Pode executar

## Fase 2 — Testes e causas

- **Testes escritos:** `records.test.ts` — data `dd/mm/aaaa`, aporte (`+`), resgate (`-`), mensal/sem valor (`—`), nota presente/ausente, ordem desc com desempate por `createdAt`, lista vazia.
- **Execução:** sem fase vermelha separada; testes e implementação no mesmo ciclo após aprovação do plano (gate dispensado pelo desenvolvedor ao autorizar a execução).
- **Racional:** o mapper era o único ponto sem cobertura (a linha da tabela não expunha os snapshots).

## Fase 3 — Implementação

- **Arquivos criados/alterados:**
  - `src/views/types.ts` — `ITesouroDiretoRecordRow` e `records` em `ITesouroDiretoTableRow`.
  - `src/views/components/tesouroDiretoTable/records.ts` — `toTesouroDiretoRecordRows` (ordem desc, movimento com `Math.abs`, nota).
  - `src/views/components/tesouroDiretoTable/records.test.ts` — 9 casos.
  - `src/views/components/tesouroDiretoTable/index.ts` — inclui `records` no mapper da linha.
  - `src/views/components/tesouroDiretoTable/view.eta` — coluna de expansão, botão, linha de registros (`colspan="8"`), script.
  - `src/views/components/tesouroDiretoTable/styles.css` — botão/seta, rotação, lista flex, clamp de 3 linhas.
  - `src/views/components/tesouroDiretoTable/records.js` — toggle idempotente.
  - `src/utils/staticAssets.ts` — rota do `records.js`.
- **Testes do escopo:** `bun test src/views/components/tesouroDiretoTable/records.test.ts` → **9 pass / 0 fail**.
- **Regressão:** `bun test` → **85 pass / 0 fail** (177 assertions); `bunx tsc --noEmit` → **0 erros**.
- **Smoke:** 8 headers; 2 botões de expansão (habilitados); 2 linhas de registros (`hidden`); datas desc por investimento (`09/09/2026`, `09/07/2026`, `02/03/2026`, `08/01/2026` / `09/09/2026`, `09/07/2026`, `02/03/2026`); movimentos `—`; nota `revisar: valor fora da série histórica` com `title`; `?search=2031` mantém 1 linha + 1 linha de registros; `records.js` → 200 `text/javascript;charset=utf-8`.

## Fase 4 — Relatório

- `formata a data do registro em dd/mm/aaaa` → data do snapshot em UTC.
- `formata aporte com sinal positivo` / `formata resgate com sinal negativo` → movimento com sinal.
- `usa — para registro mensal, mesmo com movementValue` / `usa — quando não há movementValue` → movimento só conta em aporte/resgate.
- `preserva a nota do registro` / `mantém a nota indefinida quando ausente` → nota íntegra para o template.
- `ordena por data de referência decrescente` / `desempata datas iguais pelo createdAt mais recente` → mais recente primeiro.
- `retorna lista vazia quando não há registros` → botão `disabled` e “Nenhum registro.”.

## Pendências

- Como todos os snapshots atuais são `MONTHLY_RECORD`, a coluna “Valor adicionado/removido” mostra `—` até existirem aportes/resgates.
- Sem testes de DOM/JS: o toggle (`records.js`) foi validado apenas por smoke (asset 200 + markup), não por navegador automatizado.
- Sem testes de view/controller (decisão anterior); a cobertura do mapper de linha (`toTesouroDiretoTableRow`) continua ausente.
