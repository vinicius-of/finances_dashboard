# Execução — Botão e modal de novo investimento (controller POST + service)

- **Data:** 2026-11-16 · **Branch:** `main` · **Registro:** `add-create-venture-modal-flow-execution`
- **Resultado:** concluído

## Task

Criar um botão outlined verde abaixo da toolbar do Tesouro Direto que abre um modal com os campos de um venture e persiste via `POST /api/ventures`, com `VenturesService.create` normalizando o input e tratando duplicidade. Critério de pronto: botão e modal funcionais, controller/service implementados e testes unitários apenas dessas duas camadas.

## Fase 1 — Análise

- **Área afetada:** [`src/api/services/ventures/`](src/api/services/ventures/), [`src/api/controllers/`](src/api/controllers/), [`index.ts`](index.ts), [`src/views/components/newVentureModal/`](src/views/components/newVentureModal/), [`src/views/views.controller.ts`](src/views/views.controller.ts), [`src/views/tesouroDireto/view.eta`](src/views/tesouroDireto/view.eta), [`src/utils/staticAssets.ts`](src/utils/staticAssets.ts), [`static/styles/theme.css`](static/styles/theme.css).
- **Testes relacionados:** `ventures.test.ts` (21 pass), `snapshots.controller.test.ts` (linha de base de padrão de controller). Linha de base da suíte: **106 pass / 0 fail**; `bunx tsc --noEmit` sem erros.
- **Lacuna de cobertura:** `VenturesService.create` não normalizava campos, não derivava categoria/totais de renda variável e não tratava `internalCode` duplicado; não existia controller `POST /api/ventures` nem seus testes.
- **Proposta:** casos de derivação de categoria/totais, trim, `409`, `initialValue` inválido e repropagação de erro no service; casos de payload FIXED/VARIABLE, erros `400` por campo, `409`/`422` propagados e ausência de campos irrelevantes no controller.

**Resposta do desenvolvedor:**

> 1. A
> 2. B
> 3. B
> 4. A
> 5. A
> 6. A
> 7. A
> 8. A
> 9. A
> 10. A
> 11. A
> 12. A
> 13. Não
>
> Isso mesmo, dispónível somente para /tesouro-direto.
>
> Pode executar o plano.

## Fase 2 — Testes e causas

- **Testes escritos/alterados:**
  - [`src/api/services/ventures/ventures.test.ts`](src/api/services/ventures/ventures.test.ts) — novos casos em `VenturesService.create com payload de criação`: derivação de categoria, totais de VARIABLE, arredondamento, normalização, `internalCode` vazio, `409`, repropagação de erro, `initialValue` ausente/não inteiro, `name` vazio e VARIABLE sem `quantity`.
  - [`src/api/controllers/ventures/ventures.controller.test.ts`](src/api/controllers/ventures/ventures.controller.test.ts) — 23 casos de sucesso/erro do endpoint.
- **Execução:** service **33 pass / 0 fail** (72 asserções); controller **23 pass / 0 fail** (105 asserções). As falhas de comportamento foram cobertas antes da implementação final (o código anterior não derivava categoria/totais nem retornava `409`).
- **Causas:**
  - `ventures.service.ts:46` — `create` apenas validava e persistia, sem normalização nem `409`, permitindo `internalCode` duplicado virar erro genérico do banco.
  - `src/api/controllers/` — não havia módulo `ventures`, portanto o endpoint e o parsing condicional por categoria não existiam.
  - `VenturesService.validate` — não exigia `initialValue` e aceitava valores não inteiros; a validação de VARIABLE não conhecia a derivação de `totalPrice`.

## Fase 3 — Implementação

- **Arquivos de produção alterados:**
  - [`src/api/services/ventures/ventures.utils.ts`](src/api/services/ventures/ventures.utils.ts) — `resolveCategory`, `normalizeVentureInput`, `resolveVentureInput`, `isUniqueInternalCodeError`.
  - [`src/api/services/ventures/ventures.types.ts`](src/api/services/ventures/ventures.types.ts) — `ICreateVentureInput`.
  - [`src/api/services/ventures/ventures.errors.ts`](src/api/services/ventures/ventures.errors.ts) — `duplicatedInternalCode`.
  - [`src/api/services/ventures/validateVentures.ts`](src/api/services/ventures/validateVentures.ts) — nome, `initialValue` e tipos numéricos.
  - [`src/api/services/ventures/ventures.service.ts`](src/api/services/ventures/ventures.service.ts) — `create` normaliza, resolve, valida e trata `409`.
  - [`src/api/controllers/ventures/`](src/api/controllers/ventures/) — controller, types, utils, mappers, errors, barrel e testes.
  - [`src/api/controllers/index.ts`](src/api/controllers/index.ts) — reexporta `ventures`.
  - [`index.ts`](index.ts) — instancia `VenturesController` e registra `POST /api/ventures`.
  - [`src/views/components/newVentureModal/`](src/views/components/newVentureModal/) — componente, template, CSS, script e config por página.
  - [`src/views/components/index.ts`](src/views/components/index.ts), [`src/views/tesouroDireto/view.eta`](src/views/tesouroDireto/view.eta), [`src/views/components/registerSnapshotModal/view.eta`](src/views/components/registerSnapshotModal/view.eta), [`src/views/views.controller.ts`](src/views/views.controller.ts), [`src/utils/staticAssets.ts`](src/utils/staticAssets.ts), [`static/styles/theme.css`](static/styles/theme.css).
- **Testes do escopo:** service **33 pass / 0 fail**; controller **23 pass / 0 fail**.
- **Regressão:** `bun test` **141 pass / 0 fail** (395 asserções) · `bunx tsc --noEmit` **ok**.

## Fase 4 — Relatório

- `deriva categoria VARIABLE a partir do tipo STOCK e calcula os totais` → garante `category`, `quantity`, `unitPrice`, `totalPrice` e `initialValue` corretos.
- `deriva categoria FIXED para um tipo de renda fixa` → garante `category`/`indexer` e campos variáveis nulos.
- `recalcula totalPrice e initialValue de renda variável ignorando os valores enviados` → garante que o backend é a fonte de verdade dos totais.
- `arredonda quantity fracionária ao calcular o total` → garante `Math.round(quantity × unitPrice)`.
- `normaliza name, internalCode e source` → garante trim dos textos.
- `converte internalCode vazio em null` → garante ausência de colisão indevida.
- `mapeia violação de unicidade de internalCode para 409` → garante `ApiError(409)` com `{ field, rule }`.
- `repropaga erro do repositório que não é de unicidade` → garante que erros genéricos não são mascarados.
- `rejeita renda fixa sem initialValue` / `rejeita initialValue não inteiro` / `rejeita name vazio` / `rejeita renda variável derivada sem quantity` → garantem as novas validações.
- `cria venture FIXED a partir do payload completo` / `cria venture VARIABLE sem os campos de renda fixa` → garantem mapeamento condicional e `201`.
- `ignora initialValue, totalPrice e campos de renda fixa enviados em VARIABLE` → garante que o client não sobrescreve os totais derivados.
- `aceita quantity fracionária em renda variável` / `trata expiresIn vazio como ausente` / `repassa internalCode opcional` → garantem parsing de borda.
- `deriva FIXED para CDB e envia os campos condicionais` → garante o seletor de tipos por página.
- Casos `retorna 400 quando ...` → garantem validação estrutural de `body`, `name`, `type`, `boughtAt`, `expiresIn`, campos obrigatórios de FIXED, `initialValue`, `rate`, `indexer`, `quantity`, `unitPrice` e `internalCode`.
- `propaga ApiError 409 do service` / `propaga ApiError 422 do service` → garantem o repasse de erros de domínio pelo controller.

## Pendências

- O smoke manual de criação via UI/`curl` não foi executado para não mutar o banco real; a renderização de `/tesouro-direto`, o título, o botão, os blocos condicionais, o CSS e o asset do `modal.js` foram verificados via servidor local. A criação e os erros estão cobertos pelos testes de controller/service.
- Conforme decisão do desenvolvedor, o botão/modal está disponível apenas em `/tesouro-direto`; o mapa `NEW_VENTURE_MODAL_CONFIG` já possui as entradas de `rendas-fixas` e `acoes` para uma expansão futura.
