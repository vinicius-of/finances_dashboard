# Memória — Erros

Este documento é a referência persistente de memória do domínio de erros do projeto.
ID nova: siga a sequência global do `INDEX.md` (formato `MEM-<AAAA>-<NNN>`).

---

## Índice de Consulta

| #   | ID           | Memória                                             | Tipo  | Status | Atualizada em |
| --- | ------------ | --------------------------------------------------- | ----- | ------ | ------------- |
| 1   | MEM-2026-025 | `super()` isolado em classes de erro com parâmetros | Regra | Ativa  | 2026-10-23    |

## MEM-2026-025 — `super()` isolado em classes de erro com parâmetros {#mem-2026-025}

- **Tipo**: Regra
- **Status**: Ativa
- **Criada em**: 2026-10-23
- **Atualizada em**: 2026-10-23
- **Tags**: `errors`, `typescript`, `bun`, `classes`
- **Fonte**: `src/errors/AppError.ts`, `src/errors/ApiError.ts`, `src/errors/ViewError.ts`

### Descrição

Em classes derivadas de `Error` que usam parameter properties, o transpiler do Bun emite a atribuição dos parâmetros antes da chamada de `super()`. Por isso `super()` deve ser uma instrução isolada, nunca dentro de expressão de sequência (vírgula).

### Detalhes

- Sintoma: `ReferenceError: 'super()' must be called in derived constructor before accessing |this| or returning non-object`.
- Origem: `AppError` usava `(super(message), (this.name = this.constructor.name))` com `public statusCode` no construtor.
- Correção: `super(message)` isolado e, em seguida, atribuições explícitas de `this.statusCode` e `this.name`; em `ApiError`, `details` foi declarado como campo e atribuído após `super`.
- `ViewError` mantém a parameter property `template` porque `super(statusCode, message)` é uma instrução isolada.
- Verificado: parameter property com `super()` isolado funciona; o mesmo código com `super()` em sequência falha.

### Referências

- `src/errors/AppError.ts`
- `src/errors/ApiError.ts`
- `src/errors/ViewError.ts`
- `.agents/plans/fix-error-classes-constructor-execution.md`
