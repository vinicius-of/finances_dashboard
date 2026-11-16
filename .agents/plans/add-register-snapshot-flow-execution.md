# Execução — Fluxo "Registrar" (modal + controller POST + toast)

- **Data:** 2026-11-13 · **Branch:** `main` · **Registro:** `add-register-snapshot-flow-execution`
- **Resultado:** concluído

## Task

Implementar o fluxo "Registrar": modal para criar snapshots de um investimento, novo controller POST da API, toast de feedback e três ações (Cancelar / Registrar / Registrar e próximo). Pronto = controller e service cobertos por testes, rota validada por smoke test e UI integrada à tabela do Tesouro Direto.

## Fase 1 — Análise

- **Área afetada:** [`src/api/controllers/`](src/api/controllers) (inexistente), [`src/api/services/snapshots/snapshots.service.ts`](src/api/services/snapshots/snapshots.service.ts), [`index.ts`](index.ts), [`src/utils/staticAssets.ts`](src/utils/staticAssets.ts), [`src/views/components/tesouroDiretoTable/view.eta`](src/views/components/tesouroDiretoTable/view.eta), [`src/views/tesouroDireto/view.eta`](src/views/tesouroDireto/view.eta), [`src/views/views.controller.ts`](src/views/views.controller.ts).
- **Testes relacionados:** `src/api/services/snapshots/snapshots.test.ts` (21 casos, todos ok); nenhum teste de controller/view existe.
- **Lacuna de cobertura:** `save` com movimento e `currentTotalValue` omitido, data inválida, valor negativo, persistência de `notes`; ausência total de cobertura HTTP.
- **Proposta:** 13 casos para o controller e 5 para o service, aprovados via plano (`Seção 5`).

**Resposta do desenvolvedor:**

> 1A, 2A, 3A, 4A, 5A; 5bA, 6B, 7A, 8A, 9A, 10B
>
> Pode executar

## Fase 2 — Testes e causas

- **Testes escritos/alterados:**
  - [`src/api/controllers/snapshots.controller.test.ts`](src/api/controllers/snapshots.controller.test.ts) — 13 casos (`describe("SnapshotsController.create")`).
  - [`src/api/services/snapshots/snapshots.test.ts`](src/api/services/snapshots/snapshots.test.ts) — 5 casos novos em `describe("SnapshotsService.save")`.
- **Execução (vermelho):** `bun test src/api/services/snapshots/snapshots.test.ts src/api/controllers/snapshots.controller.test.ts` → **23 pass / 3 fail / 1 error**.
  - `Cannot find module './snapshots.controller'` (controller ainda não existia).
  - `soma o movementValue ao montante anterior em CONTRIBUTION sem currentTotalValue` → esperado `18000`, recebido `13000`.
  - `subtrai o movementValue do montante anterior em WITHDRAWAL sem currentTotalValue` → esperado `11000`, recebido `13000`.
  - Os outros 3 casos novos (data inválida, valor negativo, `notes`) já passavam — comportamento pré-existente, mantidos como proteção.
- **Causas:**
  - `snapshots.service.ts:171` — `resolveCurrentTotalValue` recebia apenas o montante anterior, sem aplicar o movimento; aporte/resgate não alteravam o montante.
  - `src/api/controllers/` inexistente — sem ponto de entrada HTTP para o `SnapshotInput`.

## Fase 3 — Implementação

- **Arquivos de produção alterados/criados:**
  - [`src/api/controllers/snapshots.controller.ts`](src/api/controllers/snapshots.controller.ts) — parsing/validação do payload, mapeamento por tipo e resposta `201`.
  - [`src/api/controllers/snapshots.controller.types.ts`](src/api/controllers/snapshots.controller.types.ts) — `ISnapshotWriter`, `ISnapshotsController`, payload/response.
  - [`src/api/controllers/index.ts`](src/api/controllers/index.ts) — barrel.
  - [`src/api/services/snapshots/snapshots.service.ts`](src/api/services/snapshots/snapshots.service.ts) — movimento aplicado ao montante no fallback.
  - [`index.ts`](index.ts) — `SnapshotsController` + rota `POST /api/snapshots`.
  - [`src/utils/staticAssets.ts`](src/utils/staticAssets.ts) — bundle do Bootstrap, `modal.js`, `toast.js` e CSS dos dois componentes.
  - [`src/views/components/registerSnapshotModal/`](src/views/components/registerSnapshotModal) — `index.ts`, `view.eta`, `styles.css`, `modal.js`.
  - [`src/views/components/toast/`](src/views/components/toast) — `index.ts`, `view.eta`, `styles.css`, `toast.js`.
  - [`src/views/components/tesouroDiretoTable/view.eta`](src/views/components/tesouroDiretoTable/view.eta) — `Guardar` → `Registrar` e `data-*` do investimento.
  - [`src/views/tesouroDireto/view.eta`](src/views/tesouroDireto/view.eta), [`src/views/components/index.ts`](src/views/components/index.ts), [`src/views/views.controller.ts`](src/views/views.controller.ts) — includes, barrel e `extraStyles`.
- **Testes do escopo:** `bun test src/api/services/snapshots/snapshots.test.ts src/api/controllers/snapshots.controller.test.ts` → **38 pass / 0 fail** (109 asserções).
- **Regressão:** `bun test` → **105 pass / 0 fail** (260 asserções) · `bunx tsc --noEmit` → **0 erros** (1 erro inicial de tipagem no teste foi corrigido: `details` tipado como `Record<string, unknown>`).
- **Smoke test (PORT=3999):** `GET /tesouro-direto` → `200` (2 `data-register-venture`, `registerSnapshotModal` e `toastStack` presentes); `bootstrap.bundle.min.js`, `modal.js`, `toast.js`, CSS dos dois componentes → `200`; `POST /api/snapshots` sem `type` → `400`; venture inexistente → `404`; resgate acima do aportado → `422`.
- **Smoke test 201 (cópia do DB em `/tmp`, apagada em seguida):** `MONTHLY_RECORD` 2.341.157 → `currentTotalValue` 2.341.157; `CONTRIBUTION` 500.000 → `currentTotalValue` 2.841.157 (`+500.000`) e `grossProfit` inalterado.

## Fase 4 — Relatório

- `cria snapshot MONTHLY_RECORD com currentTotalValue a partir de value` → `value` vira `currentTotalValue` e o status é `201`.
- `envia CONTRIBUTION como movementValue sem currentTotalValue` → aporte usa `movementValue` e não envia montante.
- `envia WITHDRAWAL como movementValue sem currentTotalValue` → resgate usa `movementValue` e não envia montante.
- `repassa notes quando presente e undefined quando ausente` → nota opcional chega ao service.
- `converte referenceDate para Date em UTC` → `2026-11-13` → `2026-11-13T00:00:00.000Z`.
- `retorna 400 quando o corpo não é JSON válido` → corpo inválido vira `ApiError` com `field: "body"`.
- `retorna 400 quando type está ausente ou inválido` → enum de `SnapshotType` validado.
- `retorna 400 quando value não é um inteiro positivo` → ausente, `0`, negativo, fracionário e string rejeitados.
- `retorna 400 quando ventureId está ausente` → vazio/espacos rejeitados.
- `retorna 400 quando referenceDate está ausente ou inválida` → formato e calendário validados.
- `retorna 400 quando notes excede 280 caracteres` → limite exato aceito, excedente rejeitado.
- `propaga ApiError 404 do service` → status, mensagem e `details` preservados.
- `propaga ApiError 422 do service` → status, mensagem e `details` preservados.
- `soma o movementValue ao montante anterior em CONTRIBUTION sem currentTotalValue` → montante `13000 → 18000`, lucro estável.
- `subtrai o movementValue do montante anterior em WITHDRAWAL sem currentTotalValue` → montante `13000 → 11000`, lucro estável.
- `rejeita referenceDate inválida com 400` / `rejeita currentTotalValue negativo com 422` / `persiste a nota no snapshot criado` → proteção de regras já existentes.

## Pendências

- Ajuste deliberado não previsto no plano: após `Registrar`, o reload ocorre 1,2 s depois do toast para que a notificação fique visível.
- `Valor` no modal é digitado em reais e convertido para centavos no client (`Math.round(valor * 100)`); a API rejeita valores fracionários.
- Ações `Sacar`, `Arquivar` e `Editar` seguem inertes (escopo).
- Memórias registradas: `MEM-2026-033` (SERVICES) e `MEM-2026-034` (VIEWS) — o plano previa apenas uma memória.
- Pós-execução: regra em `.agents/AGENTS.md` §2 — `<modulo>.utils.ts` (auxiliares/validadores), `<modulo>.mappers.ts` (conversões) e `<modulo>.errors.ts` (funções que retornam `ApiError`). Aplicada ao controller `snapshots` e aos services `snapshots`, `ventures` e `export`; `ventures.utils.ts` foi removido (só tinha `notFound`, agora em `ventures.errors.ts`). `bun test` → 105 pass / 0 fail; `bunx tsc --noEmit` → 0 erros.
