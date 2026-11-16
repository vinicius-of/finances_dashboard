# RESTRICTIONS — Restrições do Agente

> Lista consolidada das restrições extraídas de `.agents/AGENTS.md`. O `AGENTS.md` continua sendo a fonte original: em caso de divergência, ele prevalece.
> **Caráter proibitivo**: o agente **não deve** agir, desenvolver ou modificar nada que contrarie os itens abaixo. Em caso de conflito, dúvida ou inviabilidade, reportar objetivamente ao desenvolvedor e aguardar decisão.
> Padrões de código e comandos permanecem no `AGENTS.md` (§2 e §3); este arquivo cobre os limites e as proibições.

## 1. Arquivos que o agente NÃO pode modificar

- `.env`
- `.nvmrc`
- `bun.lock`
- `package.json`
- `opencode.json`

**Exceção**: `.agents/PROJECT.md`, `.agents/ARCHITECTURE.md` e `.agents/AGENTS.md` podem ser atualizados sem pedir permissão (documentos a serviço exclusivo do agente). Ainda assim, é proibido reverter ou sobrescrever mudanças alheias neles.

## 2. Mudanças de terceiros

- Proibido alterar, reverter ou sobrescrever mudanças que **não foram feitas pelo próprio agente** (ex.: WIP do desenvolvedor).
- Se for necessário tocar em algo assim, apenas sinalizar a existência no relatório.

## 3. Segredos

- Proibido hardcodar chaves de API, credenciais ou tokens em arquivos-fonte.

## 4. Dependências de terceiros

- Proibido adicionar pacotes ao `package.json` sem antes perguntar ou verificar com o desenvolvedor.

## 5. Código e erros

- Proibido suprimir erros.
- Proibido usar comentários no código quando não requisitados pelo desenvolvedor.
- Proibido importar por caminho relativo quando existe alias aplicável (`@/...`).

## 6. Estrutura, contratos e decisões

- Proibido implementar solução que não respeite as responsabilidades dos diretórios e as regras estruturais de `.agents/ARCHITECTURE.md` e `.agents/PROJECT.md`.
- Proibido alterar contratos em `contracts/` sem propagar a mudança a todas as implementações; as interfaces devem permanecer isoladas de implementação e sem importações externas ao diretório.
- Proibido reabrir decisões já registradas em `.agents/memory/` sem motivo forte.

## 7. Conflito ou inviabilidade

- Proibido implementar quando houver conflito ou inviabilidade: reportar objetivamente o impedimento e aguardar decisão do desenvolvedor.

## 8. Execução

- Proibido executar uma task fora do workflow padrão `.agents/workflow/DEFAULT_EXECUTE.md`.
