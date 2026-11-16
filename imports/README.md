# Formato de importação em lote — ventures + snapshots

Cada carteira é importada por **dois arquivos CSV pareados**:

```
imports/
  tesouro-direto/
    ventures.csv    # ativos (IVenture / IFixedIncomeVenture / IVariableIncomeVenture)
    snapshots.csv   # histórico (IVentureSnapshot)
  rendas-fixas/
    ventures.csv
    snapshots.csv
  acoes/
    ventures.csv
    snapshots.csv
```

O vínculo entre os dois arquivos é o campo **`id_interno`** (lote) ↔ **`id_interno_venture`**.

## Convenções

| Item | Regra |
| ---- | ----- |
| Codificação | UTF-8 sem BOM, delimitador `,`, quebra de linha `LF` |
| Aspas | Usar aspas duplas quando o valor contiver `,`, `"` ou quebra de linha |
| Datas | ISO `YYYY-MM-DD` (sempre UTC, sem fuso) |
| Dinheiro | **Reais com ponto decimal e sem separador de milhar** (`10050.02`); o importador converte para centavos com `Math.round(valor * 100)` |
| Enums | Exatamente os valores de `contracts/enums.ts` (maiúsculas) |
| Vazio | Campo vazio ≠ `0`; campos opcionais devem ficar vazios |
| `id_interno` | `kebab-case` único no lote (ex.: `td-selic-2027`) |

## `ventures.csv`

| Coluna | Obrigatório | Descrição / mapeamento |
| ------ | ----------- | ---------------------- |
| `id_interno` | sim | Chave do lote (não é persistida hoje) |
| `nome` | sim | `venture.name` |
| `codigo_interno` | VARIABLE | `venture.internalCode` (ticker, ex.: `PETR4`) |
| `categoria` | sim | `FIXED` \| `VARIABLE` |
| `tipo` | sim | `TREASURY` \| `CDB` \| `LCI` \| `LCA` \| `STOCK` \| `FII` |
| `indexador` | FIXED | `CDI` \| `IPCA` \| `SELIC` \| `PRE` \| `FIXED` |
| `taxa` | FIXED | Gravada em `venture.rate` sem interpretação; seguir a convenção do produto (`1.05` = 105% CDI; `0.055` = 5,5% a.a.; `0.1105` = 11,05% a.a.) |
| `fonte` | FIXED | `venture.source` (ex.: `Tesouro Direto`, `Banco Exemplo`) |
| `valor_inicial` | sim | `venture.initialValue` em reais (FIXED: valor aplicado; VARIABLE: quantidade × preço) |
| `data_aplicacao` | sim | `venture.boughtAt`; não pode ser futura |
| `data_vencimento` | opcional | `venture.expiresIn`; **proibido** para `STOCK` |
| `quantidade` | VARIABLE | `venture.quantity` |
| `preco_unitario` | VARIABLE | `venture.unitPrice` em reais; `totalPrice = valor_inicial` |

Regras herdadas de `validateVentures`:

- `FIXED` exige `indexador`, `taxa` e `fonte`.
- `VARIABLE` exige `quantidade`, `preco_unitario` e `valor_inicial`; `indexador`/`taxa`/`fonte`/`data_vencimento` ficam vazios.
- `initialValue` não pode ser negativo.

## `snapshots.csv`

| Coluna | Obrigatório | Descrição / mapeamento |
| ------ | ----------- | ---------------------- |
| `id_interno_venture` | sim | Chave do venture no mesmo lote |
| `data_referencia` | sim | `snapshot.referenceDate` (ISO) |
| `valor_atual` | sim* | `snapshot.currentTotalValue` em reais |
| `quantidade` | opcional | `snapshot.currentQuantityHeld` (VARIABLE) |
| `preco_unitario` | opcional | `snapshot.currentUnitPrice` em reais (VARIABLE) |
| `tipo_movimento` | opcional | `MONTHLY_RECORD` (padrão) \| `CONTRIBUTION` \| `WITHDRAWAL` |
| `valor_movimento` | CONTRIBUTION/WITHDRAWAL | `snapshot.movementValue` em reais; deve ser > 0 |
| `notas` | opcional | `snapshot.notes` |

\* `valor_atual` pode ser omitido somente quando `quantidade` e `preco_unitario` forem informados; nesse caso o total é derivado pelo serviço.

Regras:

- **Uma linha por snapshot**, importadas em ordem cronológica por venture.
- `totalContributed`, `grossProfit` e `profitPercentage` são **derivados** pelo `SnapshotsService` — não enviar.
- `totalContributed` é calculado como `valor_inicial` + Σ`CONTRIBUTION` − Σ`WITHDRAWAL`. Sem movimentos, permanece igual ao `valor_inicial`.
- Em `CONTRIBUTION`/`WITHDRAWAL`, `valor_atual` deve ser o **saldo após** o movimento.
- Para aplicações variáveis, se `valor_atual` e `quantidade`/`preco_unitario` forem enviados, `valor_atual` prevalece.

Exemplo de movimento (aporte de R$ 1.500,00):

```csv
id_interno_venture,data_referencia,valor_atual,quantidade,preco_unitario,tipo_movimento,valor_movimento,notas
rf-cdb-2028,2026-08-31,7000.00,,,CONTRIBUTION,1500.00,aporte
```

## Ordem e idempotência

1. Validar enums, datas, números e campos obrigatórios; abortar o lote com **relatório de erros por linha**.
2. Criar/atualizar os ventures do `ventures.csv`.
3. Montar o mapa `id_interno → id` gerado pelo banco.
4. Importar os snapshots agrupados por venture em ordem de `data_referencia`.
5. Retornar contagem de criados/atualizados/ignorados e erros por linha.

Chaves de deduplicação:

- **No lote**: `id_interno`.
- **Entre lotes**: hoje não existe campo persistido para isso. Usar `codigo_interno` quando houver; caso contrário `nome + data_aplicacao` (frágil). Recomendação: adicionar `external_id`/`import_key` ao venture em uma migração futura.

## Campos do `.md` de origem que **não** entram no CSV

- **`Registro`** (ex.: `09/09/2026`): é a data do último snapshot — derive do histórico.
- **`Rendimento`** (0,19% / 0,09%): não é a rentabilidade acumulada (os valores líquidos indicam ganhos muito maiores); é um rendimento do período. A rentabilidade real é recalculada por `(valor_atual − total_aportado) / total_aportado`.

## Pontos de atenção do exemplo do Tesouro Direto

- `Tesouro Selic 2027` tem vencimento `2028-03-01` no arquivo original (mantido como está).
- O snapshot de `2026-07-09` do `Tesouro Selic 2031` (`17236.41`) destoa da série (~R$ 1,6 mil → R$ 7,6 mil). Foi importado com `notas = "revisar: valor fora da série histórica"`; confira antes de persistir.
- A `taxa` não existe no `.md`; os valores `0.1105` são **ilustrativos** — ajuste para a taxa contratada antes de importar.

## Limitações do modelo atual

- `SnapshotInput` não aceita `totalContributed`; o serviço o deriva do histórico. Importar um passado com aportes exige as linhas de `CONTRIBUTION`.
- Ainda não existe `PASSIVE_INCOME` em `SnapshotType` (feature de guardar passivo/ativo em planejamento).
- `id_interno` não é persistido; a importação idempotente depende da evolução do schema.
