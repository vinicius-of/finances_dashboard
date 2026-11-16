---
name: generate-docs
description: Gera ou atualiza comentários JSDoc somente no arquivo selecionado ou informado pelo desenvolvedor. Exige um caminho relativo explícito quando nenhum arquivo for passado, atua em um único arquivo por execução e nunca altera a lógica.
---

# Gerar JSDoc (generate-docs)

Use esta skill quando o desenvolvedor pedir para documentar um arquivo com JSDoc (ex.: "gere o JSDoc deste arquivo", "documente `src/api/services/...`").

## 1. Exigir o alvo antes de qualquer ação

A skill atua em **um único arquivo por execução**.

- Aceite o alvo por caminho relativo à raiz do projeto (ex.: `src/api/services/ventures/ventures.service.ts`) ou por arquivo anexado/selecionado de forma explícita pelo desenvolvedor.
- Se **nenhum arquivo ou caminho** tiver sido informado, **pare imediatamente** e pergunte:
  > Qual arquivo devo documentar? Informe o caminho relativo à raiz (ex.: `src/api/services/ventures/ventures.service.ts`).
- Não procure o alvo por conta própria, não deduza pelo contexto da conversa, não aplique a skill no projeto inteiro e não crie um arquivo novo.
- Se receber **mais de um caminho**, peça que o desenvolvedor escolha um (ou confirme que a execução deve ser feita separadamente para cada arquivo).
- Se o caminho não existir, informe e peça a correção. Não execute nada até ter um alvo válido.

## 2. Ler e inventariar o arquivo

1. Leia o arquivo **inteiro**.
2. Liste as declarações que receberão JSDoc:
   - funções, classes, métodos e constantes exportadas;
   - interfaces, tipos e enums exportados;
   - membros públicos de classes;
   - funções internas apenas quando o comportamento não for evidente pelo nome.
3. Consulte `.agents/memory/` e `contracts/` se o significado de um campo ou regra não estiver claro no próprio código. Em caso de dúvida real, pergunte ao desenvolvedor — não invente regras.

## 3. O que escrever

- **JSDoc somente**, no formato `/** ... */`, em português (PT-BR), seguindo o estilo do código existente.
- Priorize a **API pública**. Em símbolos internos, documente apenas o que não é autoexplicativo.
- Explique **intenção, contrato e efeitos**, não repita o nome do símbolo nem parafraseie a assinatura.
- Use as tags conforme o caso: `@param`, `@returns`, `@throws`, `@example`, `@deprecated`, `@see`.
- Documente campos de interface/tipo quando o nome sozinho não expressar unidade, formato, obrigatoriedade ou regra de negócio (ex.: valores em centavos, datas em `YYYY-MM-DD`).
- Em métodos que lançam `ApiError`, documente os status relevantes (`400`, `404`, `422`) em `@throws`.
- Preserve JSDoc existente: complete ou corrija, sem duplicar blocos nem apagar informação válida.
- Não adicione comentários de linha (`//`) nem comentários de bloco que não sejam JSDoc.

## 4. Aplicar as alterações

- Edite **somente o arquivo alvo**; não altere outros arquivos, imports, assinaturas, lógica, ordem ou formatação do código.
- Se o alvo for um arquivo de teste (`*.test.ts`), confirme antes: os testes podem estar congelados pelo workflow de execução.
- Não documente símbolos que não existem, não invente parâmetros e não altere tipos.

## 5. Validar

- Rode `bunx tsc --noEmit` (JSDoc não deve introduzir erro de tipo).
- Se houver testes relacionados ao arquivo, rode `bun test <caminho-do-teste>`.
- Revise o diff para confirmar que apenas comentários JSDoc foram adicionados/alterados.

## 6. Relatório final

Reporte de forma resumida:

- arquivo documentado;
- quantidade e nomes dos símbolos que receberam JSDoc;
- validações executadas e resultado;
- dúvidas ou símbolos deixados sem documentação (com o motivo).
