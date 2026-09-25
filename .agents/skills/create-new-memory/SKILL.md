---
name: create-new-memory
description: Processa e armazena em `.agents/memory/` informações persistentes do projeto (interfaces, contratos, decisões, regras e fatos) com formatação padronizada, ID única e fácil indexação e consulta.
---

# Criar Nova Memory — Memória Persistente do Projeto

Use esta skill sempre que o usuário ou o agente julgar necessário **persistir** uma informação do projeto que deveria ser relembrada em sessões futuras: contratos e interfaces TypeScript, decisões de arquitetura, regras de negócio, fatos sobre o domínio e padrões adotados.

## 1. Critérios para julgar "necessário armazenar"

Uma informação merece virar memória quando atende a **pelo menos um** destes critérios:

- É um contrato, interface ou tipo que outros arquivos dependem (ex.: `IVenture`, `IPortfolioSummary`).
- É uma decisão que já foi tomada e não deve ser reaberta sem motivo (trade-off, escolha de biblioteca, padrão).
- É uma regra, convenção ou fato sobre o domínio/negócio que afeta futuras implementações.
- O usuário pediu explicitamente para guardar.

Evite duplicar: antes de criar, busque no `.agents/memory/` e no `INDEX.md` por termos-chave (grep) para verificar se a informação já existe.

## 2. Onde armazenar

- Todo arquivo de memória vive em `.agents/memory/`.
- Nome do arquivo: `<DOMINIO>_MEMORY.md` em **UPPER_SNAKE_CASE**, um arquivo por domínio (ex.: `CONTRACTS_MEMORY.md` para `src/contracts/`).
- Se o domínio não existir, crie um novo arquivo com o cabeçalho padrão (Seção 4).
- O registro central de IDs fica em `.agents/memory/INDEX.md`. Se não existir, **crie-o obrigatoriamente** ao armazenar a primeira memória.

## 3. ID única da memória

Toda entrada de memória recebe uma ID única, imutável e de fácil identificação pelo agente:

```text
MEM-<AAAA>-<NNN>
```

- `<AAAA>`: ano corrente (ex.: `2026`).
- `<NNN>`: sequência global de 3 dígitos, incrementada no `INDEX.md` (ex.: `001`, `002`...).
- Exemplos: `MEM-2026-001`, `MEM-2026-002`.

Regras:

1. **A sequência é global** (não por arquivo): leia a última ID registrada no `INDEX.md` e use a próxima. NUNCA adivinhe ou reuse uma ID já registrada.
2. Ao gerar a ID, registre-a no `INDEX.md` na mesma operação.
3. A ID é usada como âncora do heading (`### MEM-2026-001 — Título {#mem-2026-001}`) para permitir links diretos de outros documentos.
4. Se uma entrada for atualizada, **mantenha a ID** — apenas atualize o metadado `Atualizada em`. IDs nunca são reutilizadas, nem após exclusão.

## 4. Formato padrão

### 4.1 Cabeçalho do arquivo (novos arquivos de domínio)

```markdown
# Memória — <NOME DO DOMÍNIO>

Este documento é a referência persistente de memória do domínio <domínio> do projeto.
ID nova: siga a sequência global do `INDEX.md` (formato `MEM-<AAAA>-<NNN>`).

---

## Índice de Consulta

| #   | ID           | Memória           | Tipo     | Status | Atualizada em |
| --- | ------------ | ----------------- | -------- | ------ | ------------- |
| 1   | MEM-2026-001 | Título da memória | Contrato | Ativa  | 2026-09-15    |
```

### 4.2 Entrada de memória (template obrigatório)

```markdown
## MEM-2026-001 — Título human-readable da memória {#mem-2026-001}

- **Tipo**: [Contrato | Interface | Decisão | Regra | Fato | Processo]
- **Status**: [Ativa | Obsoleta | Deprecada]
- **Criada em**: 2026-09-15
- **Atualizada em**: 2026-09-15
- **Tags**: `tag1`, `tag2`, `tag3`
- **Fonte**: `src/contracts/ventures.ts`

### Descrição

O que é e por que existe (1–3 frases objetivas).

### Detalhes

- Para **Contratos/Interfaces**: liste campos, tipos e regras relevantes (ex.: `id: string`, `category: VentureCategory`), seguindo o estilo do `CONTRACTS_MEMORY.md`.
- Para **Decisões**: descreva o contexto, as opções consideradas e o motivo da escolha.
- Para **Regras/Fatos**: registre o enunciado literal e onde ele se aplica.

### Referências

- Links para código, planos ou outras memórias relacionadas (`#mem-<id>`).
```

### 4.3 Índice global (`INDEX.md`)

```markdown
# Índice de Memórias

Registro central das memórias do projeto. A sequência de IDs (`MEM-<AAAA>-<NNN>`) é controlada aqui.

| ID           | Arquivo             | Memória           | Tipo     | Status | Criada em  |
| ------------ | ------------------- | ----------------- | -------- | ------ | ---------- |
| MEM-2026-001 | contracts_memory.md | Título da memória | Contrato | Ativa  | 2026-09-15 |
```

## 5. Fluxo de criação

1. **Avaliar**: aplicar os critérios da Seção 1; verificar se já não existe (grep em `.agents/memory/`).
2. **Escolher domínio**: reutilizar arquivo existente ou criar novo (`<DOMINIO>_MEMORY.md`).
3. **Gerar ID única**: ler o `INDEX.md` (criar se ausente), calcular `MEM-<AAAA>-<NNN>` e registrar no índice.
4. **Escrever a entrada**: usar o template da Seção 4.2 no arquivo de domínio.
5. **Atualizar o índice do arquivo**: adicionar a linha na tabela "Índice de Consulta".
6. **Confirmar**: informar ao usuário a ID criada e o arquivo em que foi armazenada.

Ao **atualizar** uma memória existente: manter ID e `Criada em`, atualizar `Atualizada em`, e registrar a mudança no índice do arquivo. Ao **deprecar**: mudar `Status` para `Obsoleta`/`Deprecada` e manter o registro para rastreabilidade.

## 6. Regras de formatação

- Datas sempre em ISO 8601 (`YYYY-MM-DD`).
- Idioma preferencial: português (PT-BR), seguindo a documentação existente do projeto.
- Código/identificadores sempre entre backticks (ex.: `IVenture`).
- Nunca armazenar segredos, credenciais ou dados sensíveis do usuário.
