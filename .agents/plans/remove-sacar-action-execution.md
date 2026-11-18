# Execução — Remoção da ação "Sacar" do menu da tabela

- **Data:** 2026-11-18 · **Branch:** `main` · **Registro:** `remove-sacar-action-execution`
- **Resultado:** concluído

## Task

Remover a opção "Sacar" do menu de ações da tabela do Tesouro Direto, já que o resgate é registrado pelo tipo "Resgate" (`WITHDRAWAL`) no modal "Registrar". Pronto = menu apenas com Registrar, Arquivar e Editar, sem regressão de testes e tipos.

## Fase 1 — Análise

- **Área afetada:** [`src/views/components/tesouroDiretoTable/view.eta`](src/views/components/tesouroDiretoTable/view.eta) (L53-58) — único ponto de produção que renderiza a ação; sem acoplamento em CSS (`venture-table__menu-item` é compartilhada) ou JS (`menu.js` só abre/fecha o `<details>`).
- **Premissa confirmada:** [`src/views/components/registerSnapshotModal/view.eta`](src/views/components/registerSnapshotModal/view.eta) (L17) já oferece `WITHDRAWAL` ("Resgate"); nenhum service/controller muda e `SnapshotType.WITHDRAWAL` permanece intacto.
- **Testes relacionados:** [`src/views/components/tesouroDiretoTable/records.test.ts`](src/views/components/tesouroDiretoTable/records.test.ts) e [`src/views/components/tesouroDiretoToolbar/state.test.ts`](src/views/components/tesouroDiretoToolbar/state.test.ts) → 33 pass / 0 fail; nenhum renderiza a view ou verifica o menu.
- **Lacuna de cobertura:** não há testes de SSR/view no projeto (nenhum `new Eta`/`eta.render` em `*.test.ts`), então a composição do menu não era coberta.
- **Proposta:** novo `src/views/components/tesouroDiretoTable/view.test.ts` com 2 casos — menu com exatamente 3 itens e sem "Sacar"; atributos `data-register-venture`/`data-venture-name` preservados.

**Resposta do desenvolvedor:**

> Mantenha só a mudança da view e atualizar a memória

## Fase 2 — Testes e causas

Não aplicável: o desenvolvedor optou por manter apenas a alteração de view, dispensando o teste de SSR proposto. Nenhum teste foi criado ou alterado.

## Fase 3 — Implementação

- [`src/views/components/tesouroDiretoTable/view.eta`](src/views/components/tesouroDiretoTable/view.eta) — removido o `<li>` com o botão "Sacar" (ícone `bi-cash-stack`); permanecem Registrar, Arquivar e Editar.
- [`.agents/memory/VIEWS_MEMORY.md`](.agents/memory/VIEWS_MEMORY.md) — `MEM-2026-028` atualizada (menu com Registrar/Arquivar/Editar, resgate via tipo "Resgate" do modal, `Atualizada em` 2026-11-18).
- **Testes do escopo:** `bun test src/views/components/tesouroDiretoTable/records.test.ts` → 12 pass / 0 fail.
- **Regressão:** `bun test` → 141 pass / 0 fail (11 arquivos) · `bunx tsc --noEmit` → ok.

## Fase 4 — Relatório

Nenhum teste novo ou alterado (Fase 2 não aplicável). Verificação executada: `grep -rn "Sacar" src` → 0 ocorrências.

## Pendências

Nenhuma. Alterações não commitadas — o registro acompanha o commit da task.
