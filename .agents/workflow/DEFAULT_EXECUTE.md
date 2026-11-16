# DEFAULT_EXECUTE — Workflow Padrão de Desenvolvimento

> Workflow padrão de execução do projeto (substitui o item 4 da seção 5 do `AGENTS.md`).
> **Precedência**: este workflow **complementa e obedece** ao `.agents/AGENTS.md`. Em qualquer conflito, as regras do `AGENTS.md` prevalecem — reporte o conflito em vez de contrariá-lo.

## 1. Quando usar

Toda task que altere código: features, correções de bug, refatorações e ajustes de comportamento.

Para tasks puramente documentais (ex.: atualizar `AGENTS.md`/`PROJECT.md`, memória ou planos), as Fases 2 e 3 são declaradas **não aplicáveis** com justificativa, mantendo-se a Fase 1 (análise) e a Fase 5 (registro).

## 2. Princípios e gates

- **Os testes são o contrato**: o desenvolvedor aprova o que significa "pronto" (os testes) e por que o problema acontece (as causas) **antes** de qualquer alteração em código de produção.
- **Gates rígidos**: cada uma das Fases 1, 2 e 3 termina em parada obrigatória — execute **uma** fase, reporte, **encerre o turno e aguarde**. Nunca encadeie duas dessas fases no mesmo turno, mesmo que o próximo passo pareça óbvio.
- As Fases 4 e 5 são a conclusão da Fase 3 e podem ocorrer no mesmo turno em que a Fase 3 ficar verde.
- **As instruções do desenvolvedor prevalecem** sobre o plano do agente. Contrapontos e adendos devem ser respeitados e seguidos.
- Comece cada mensagem com a fase atual, ex.: `**Fase 1 — Análise e mapeamento** (aguardando confirmação)`.
- Idioma: PT-BR. Relatório final resumido (AGENTS.md §2).

## 3. Regras gerais (todas as fases)

- Obedecer ao `AGENTS.md`: padrões de código (§2), comandos (§3), limites (§4) e procedimentos 1–3, 5 e 6 da §5.
- Imports via alias `@/...` sempre que aplicável (AGENTS.md §2).
- Não adicionar dependências.
- Rodar apenas os testes do escopo por caminho: `bun test <arquivo...>`; suíte completa: `bun test`; verificação de tipos: `bunx tsc --noEmit`.
- Mostrar a saída real dos comandos (contagens e mensagens de falha) — nunca parafrasear um resultado não visto.
- Não inventar contratos, regras, códigos de erro ou valores esperados: consultar `contracts/`, `.agents/memory/` e perguntar ao desenvolvedor.
- Convenção de testes: `<arquivo>.test.ts` ao lado do arquivo testado, salvo se o desenvolvedor indicar outra.
- Padrões proibidos em testes: `try/catch` engolindo erro sem `expect.assertions`; asserções tautológicas; mockar a própria unidade sob teste para retornar o esperado; `skip`/`todo`/`only`; timers falsos para forçar resultado; afrouxar asserção (valor exato → `toBeDefined`); apagar teste que falha; envolver a expectativa para que nunca falhe.
- Registrar as respostas do desenvolvedor **literalmente**, conforme chegarem, para citá-las na Fase 5.

## 4. Fase 1 — Análise e mapeamento

1. **Analisar requisito e contexto** (AGENTS.md §5.1–5.2): consultar `.agents/memory/INDEX.md` e as memórias do domínio; cruzar com `ARCHITECTURE.md` e `PROJECT.md`; delimitar a área afetada (arquivos e caminho do código). Se o contexto for vago demais, fazer perguntas objetivas em vez de adivinhar.
2. **Localizar testes relacionados** (`*.test.ts`/`*.spec.ts`), identificando quais exercitam o caminho afetado.
3. **Rodar apenas esses testes** e capturar o resultado.
4. **Reportar e parar**:
   - área afetada (arquivos + caminho do código);
   - cada teste relacionado e os casos relevantes, com ok/falha;
   - se os testes existentes cobrem ou não o cenário;
   - **se não houver cobertura**: propor os casos de teste (nomes `describe`/`it`, Arrange/Act/Assert e asserções concretas) em código na resposta — **sem gravar no disco**.
   - Encerrar o turno e aguardar confirmação.

> A elaboração e a apresentação dos casos seguem a skill `create-unit-tests` (elaborar → apresentar → aguardar retorno → implementar).

## 5. Fase 2 — Testes e causas

Só inicia após a resposta da Fase 1; aplicar as correções do desenvolvedor.

1. **Criar/ajustar os testes** para descrever o comportamento correto (devem falhar hoje, pelo motivo certo).
2. **Rodar e ler as falhas**: cada teste deve falhar na asserção do comportamento, não em mock, seletor, provider ou typo. Teste que passa inesperadamente indica que o cenário não reproduz o problema — reportar em vez de forçar.
3. **Localizar os pontos críticos** no código de produção (`arquivo:linha`) e explicar o mecanismo: entrada/estado → comportamento atual → comportamento esperado → por que a diferença gera o problema. Separar causa raiz de sintoma; causas compartilhadas por várias falhas devem ser apontadas.
4. **Reportar e parar**: testes escritos (arquivo + código dos casos), saída da execução, causas com localização, mecanismo e evidência (qual teste/asserção), e opcionalmente o esboço da correção (sem aplicar).

**A partir da aprovação desta fase, os arquivos de teste ficam congelados**: não editar, renomear, pular ou apagar teste, asserção, mock ou fixture. Se um teste parecer errado, pare e explique ao desenvolvedor — a decisão é dele.

## 6. Fase 3 — Implementação

Só inicia após a resposta da Fase 2.

1. **Seguir a direção do desenvolvedor** (prevalece sobre a análise do agente).
2. **Alterar o código de produção** nos pontos aprovados e rodar os testes do escopo.
3. **Se algo ainda falhar**, reler a falha, revisar a direção e ajustar o código de produção — **nunca os testes congelados**. Se a falha indicar que a causa aprovada estava errada ou incompleta, pare e reporte em vez de improvisar uma nova causa.
4. **Com o escopo verde**, rodar a regressão: `bun test` (suíte completa) e `bunx tsc --noEmit`. Quebras fora do escopo causadas pela mudança são parte desta fase; problemas pré-existentes e não relacionados devem ser reportados, não corrigidos.

## 7. Fase 4 — Relatório

Um bloco por teste novo/alterado:

````markdown
### <n>. <nome do teste como escrito no it(...)>

- **Local**: `<arquivo>:<linha>` — `describe` › `it`
- **Status**: novo | alterado (o que mudou)
- **Descrição**: cenário reproduzido e comportamento correto exigido

**Código antes (bloco com defeito)**

```ts
<o código de produção, como estava>
```

**Correção aplicada**

```ts
<o mesmo bloco depois da correção>
```

**Critérios de aceite (validações concretas deste teste)**

- `<asserção como escrita>` → o que garante
````

Encerrar com:

- saída final dos testes do escopo e da regressão (contagens);
- arquivos de produção alterados não cobertos pelos blocos acima;
- pendências (falhas pré-existentes, suspeitas mantidas).

## 8. Fase 5 — Registro da execução

**Quando**: logo após a Fase 4, no mesmo turno. Também registrar quando a execução terminar antes (interrupção, task já resolvida em outro lugar, redirecionamento) — marcando as fases não executadas e o motivo.

**Onde**: `.agents/plans/<nome-unico>.md` (mesma regra de nome único e diretório dos planejamentos; em caso de colisão, usar sufixo `-2`, `-3`). Não commitar — o registro acompanha o commit/PR da task quando o desenvolvedor commitar.

**Como**: PT-BR; links relativos à raiz para cada arquivo; resumir o que cada fase fez; contagens reais dos comandos; respostas do desenvolvedor **literalmente** em blockquote, sob a fase correspondente; não colar respostas inteiras.

### Template do registro

```markdown
# Execução — <título da task>

- **Data:** <YYYY-MM-DD> · **Branch:** `<branch>` · **Registro:** `<nome-unico>`
- **Resultado:** concluído | interrompido na Fase <n> — <motivo em uma linha>

## Task

<2–4 linhas: objetivo, escopo e critério de pronto>

## Fase 1 — Análise

- **Área afetada:** <arquivos, com links>
- **Testes relacionados:** <arquivos e contagens ok/falha>
- **Lacuna de cobertura:** <o que não era coberto>
- **Proposta:** <casos propostos, por nome de `it(...)`>

**Resposta do desenvolvedor:**

> <resposta literal>

## Fase 2 — Testes e causas

- **Testes escritos/alterados:** <arquivos + nomes de `it(...)`>
- **Execução:** <contagens e por que cada teste falhou>
- **Causas:** <arquivo:linha — mecanismo, uma linha cada>

**Resposta do desenvolvedor:**

> <resposta literal>

## Fase 3 — Implementação

- **Arquivos de produção alterados:** <links + uma linha cada>
- **Testes do escopo:** <contagens finais>
- **Regressão:** `bun test` <contagens> · `bunx tsc --noEmit` <ok/falha>

## Fase 4 — Relatório

<uma linha por teste: nome do `it(...)` → o que garante, com link>

## Pendências

<o que foi reportado e mantido, decisões abertas, próximos passos — ou "Nenhuma">
```

Encerrar o turno com o link do arquivo de registro.
