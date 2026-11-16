# Execução — Templates de erro em diretório próprio

- **Data:** 2026-10-23 · **Branch:** `main` · **Registro:** `move-error-views-to-directory-execution`
- **Resultado:** concluído

## Task

Mover os templates `src/views/error.403.eta`, `src/views/error.404.eta` e `src/views/error.500.eta` para um diretório dedicado `src/views/errorViews`, mantendo os nomes dos arquivos. Critério de pronto: templates no novo diretório, documentação estrutural atualizada e suíte verde.

## Fase 1 — Análise

- **Área afetada:** os três templates de erro e a tabela de `src/views/` em [`PROJECT.md`](../PROJECT.md).
- **Testes relacionados:** `bun test` — **5 pass / 0 fail** (68 asserções).
- **Lacuna de cobertura:** nenhum teste cobria a localização/renderização dos templates de erro.
- **Proposta:** `git mv` dos três arquivos para `errorViews/` e atualização da documentação; teste de renderização opcional.

**Resposta do desenvolvedor:**

> Pode seguir sem testes e somente implementar

## Fase 2 — Testes e causas

Não executada: o desenvolvedor dispensou a criação de testes e autorizou apenas a implementação.

## Fase 3 — Implementação

- [`src/views/errorViews/error.403.eta`](../../src/views/errorViews/error.403.eta), [`src/views/errorViews/error.404.eta`](../../src/views/errorViews/error.404.eta), [`src/views/errorViews/error.500.eta`](../../src/views/errorViews/error.500.eta) — movidos para o novo diretório.
- [`PROJECT.md`](../PROJECT.md) — tabela de `src/views/` passou a listar `errorViews/` em vez dos três arquivos soltos.
- [`VIEWS_MEMORY.md`](../memory/VIEWS_MEMORY.md) — MEM-2026-021 atualizada com a localização dos templates de erro.
- Nenhum import/render precisou mudar: não há referências de código aos caminhos antigos.
- **Regressão:** `bun test` **5 pass / 0 fail** (68 asserções) · `bunx tsc --noEmit` **ok**.

## Fase 4 — Relatório

- Nenhum teste novo ou alterado (dispensado pelo desenvolvedor).
- Movimentação puramente estrutural; os testes existentes permaneceram verdes.

## Pendências

- [`src/errors/ViewError.ts`](../../src/errors/ViewError.ts) usa `template = "./404"`, caminho que já não correspondia a nenhum arquivo antes deste move. Problema pré-existente, mantido fora do escopo e apenas reportado.
