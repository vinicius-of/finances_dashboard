# Memória — Logging

Este documento é a referência persistente de memória do domínio de logging do projeto.
ID nova: siga a sequência global do `INDEX.md` (formato `MEM-<AAAA>-<NNN>`).

---

## Índice de Consulta

| #   | ID           | Memória                                    | Tipo     | Status | Atualizada em |
| --- | ------------ | ------------------------------------------ | -------- | ------ | ------------- |
| 1   | MEM-2026-023 | Contrato de logging de startup/requisições | Contrato | Ativa  | 2026-10-20    |

## MEM-2026-023 — Contrato de logging de startup/requisições {#mem-2026-023}

- **Tipo**: Contrato
- **Status**: Ativa
- **Criada em**: 2026-10-20
- **Atualizada em**: 2026-10-20
- **Tags**: `logging`, `bun`, `request`, `startup`, `files`
- **Fonte**: `src/utils/logs.ts`, `static/files.ts`, `src/utils/staticAssets.ts`, `index.ts`

### Descrição

Define o formato, as cores e a classificação dos logs de startup e de requisições tratadas por `Bun.file`, `render`, `json` e `redirect`.

### Detalhes

- Formato: `[finances_dashboard] <YYYY-MM-DDTHH:mm:ss> <METHOD> <path> <SOURCE> <status> → <RESULT>`.
- Timestamp: horário local, ISO, sem offset e sem milissegundos.
- Path: `new URL(req.url).pathname`, sem query string.
- Origem: `BUN.FILE`, `RENDER`, `JSON`, `REDIRECT`.
- Resultado: `HTML`, `JSON`, `FILE`, `REDIRECT`, `ERROR`.
- Classificação: `status >= 400` → `ERROR`; `304` → `FILE`; `3xx` (exceto 304) → `REDIRECT`; demais pela origem.
- Cores: `BUN.FILE` ciano; `RENDER` verde; `JSON` amarelo; `REDIRECT` azul; methods GET azul, POST verde, PUT amarelo, PATCH magenta, DELETE vermelho, demais cinza; status 2xx verde, 3xx ciano, 4xx amarelo, 5xx vermelho; resultados `HTML` verde, `JSON` amarelo, `FILE` ciano, `REDIRECT` azul, `ERROR` vermelho.
- Startup: `[finances_dashboard] <ISO> SERVER STARTED <url>`.
- Erros: log com status `500`/`ERROR` em `stderr`, seguido de `throw`.
- `fileResponse`: `exists()` antes de servir; `404` quando ausente; `Last-Modified` via `file.lastModified`; `If-Modified-Since` → `304`; `Range` delegado ao Bun (cliente recebe `206`, mas o log registra `200`).
- Rotas de arquivos: centralizadas em `staticAssetRoutes` (`src/utils/staticAssets.ts`), usando `fileRoute`/`fileResponse`; incluem o tema global e os `/views/*/styles.css` das views.
- Rota de exemplo: `GET /api/health` retorna `Response.json({ status: "ok" })`.
- Limitação: erros ocorridos após o retorno do handler (streaming) não são capturados pelo wrapper.

### Referências

- `src/utils/logs.ts`
- `static/files.ts`
- `src/utils/staticAssets.ts`
- `index.ts`
- `.agents/plans/add-request-logging.md`
