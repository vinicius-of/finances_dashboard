---
name: create-unit-tests
description: Cria um módulo de testes unitários para o arquivo apontado pelo desenvolvedor. Elabora os casos de teste possíveis (com cobertura do arquivo), apresenta-os ao desenvolvedor e aguarda o retorno antes de implementar. Adendos e contrapontos do desenvolvedor devem ser respeitados; em caso de dúvida de contexto, gap técnico ou implementação, consultar o desenvolvedor.
---

# Criar Testes de Unidade (create-unit-tests)

Use esta skill sempre que o desenvolvedor pedir a criação de testes unitários para um arquivo ou módulo específico do projeto (ex.: repositório, serviço, utilitário). O objetivo é construir um módulo de testes com base no arquivo indicado, com os casos elaborados a partir do próprio código e validados pelo desenvolvedor antes da implementação.

## Fluxo de trabalho

### 1. Entender o alvo

- Ler integralmente o arquivo apontado pelo desenvolvedor.
- Identificar: exports públicos, funções/métodos, entradas e saídas, dependências e regras de negócio.
- Consultar `.agents/memory/INDEX.md` e as memórias de domínio relevantes (`*_MEMORY.md`) e os contratos em `contracts/` para contextualizar o comportamento esperado.
- Mapear o teste ao runtime/ferramenta do projeto (`bun test`, ver AGENTS.md seção 3).

### 2. Elaborar os casos de teste

- Listar os casos possíveis visando a **cobertura do arquivo**: comportamento esperado, fluxos de sucesso, falhas/exceções, edge cases, valores-limite e estados relevantes (ex.: soft-delete em repositórios, `undefined` para registro inexistente).
- Cada caso deve ter: nome descritivo e o que verifica (entrada → saída esperada).
- Se um comportamento não estiver especificado no código ou nos contratos, registre como **dúvida** — não invente regras.

### 3. Apresentar os casos e aguardar retorno

- Apresentar a lista de casos ao desenvolvedor para avaliação e **aguardar o retorno** antes de escrever qualquer teste.
- O desenvolvedor pode confirmar, acrescentar casos ou apresentar contrapontos.

### 4. Implementar os testes

- Após a confirmação (ou com os adendos aplicados), criar o módulo de testes cobrindo **todos** os casos acordados.
- Localização/nome do arquivo de teste: seguir a convenção do projeto; se não houver convenção clara, perguntar ao desenvolvedor.
- Executar `bun test` e reportar o resultado no relatório final.

### 5. Contrapontos e adendos

- Contrapontos do desenvolvedor devem ser **respeitados e seguidos**; ajustar os casos/implementação de acordo e reconfirmar quando necessário.

### 6. Dúvidas de contexto / gaps técnicos

- Qualquer dúvida sobre contexto, lacunas técnicas ou implementações deve ser levada ao desenvolvedor antes de prosseguir (zero suposições).

## Regras obrigatórias

- **Nunca** escrever código de teste antes de o desenvolvedor validar os casos elaborados.
- Não inventar comportamento, regras de negócio ou valores esperados — perguntar.
- Seguir os padrões do projeto (AGENTS.md seção 2): TypeScript estrito, nomenclatura, sem comentários desnecessários.
- Manter o relatório final resumido (AGENTS.md seção 2 — relatório de atividade).
