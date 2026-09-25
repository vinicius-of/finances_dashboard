---
name: save-and-compact
description: Compacta a conversa atual (via /compact do Zed) e arquiva o resumo gerado em `.agents/history/` com nome de arquivo único baseado em data e horário.
---

# Save & Compact — Arquiva o Resumo da Conversa

Use esta skill quando for desejável **compactar a conversa atual e preservar o resumo gerado** no histórico persistente do projeto (`.agents/history/`), por exemplo: antes de encerrar uma sessão longa, ao iniciar uma nova etapa de trabalho ou quando o contexto estiver crescendo demais.

## 1. Entendimento da skill

- O `/compact` é um **comando de interface do Zed** (slash command) e **não pode ser executado programaticamente pelo agente**.
- O papel do agente é: (1) instruir o usuário a executar `/compact`, (2) aguardar o resumo compactado, e (3) **salvar** o resultado em `.agents/history/` seguindo o padrão abaixo.

## 2. Fluxo de execução

1. **Avise o usuário** que a etapa de compactação é manual no editor:

   > Por favor, execute o comando `/compact` no Zed para gerar o resumo compactado da conversa e cole/confirme o resultado aqui.

2. **Aguarde** o usuário fornecer o conteúdo compactado. Não invente nem recrie o resumo por conta própria: o conteúdo salvo deve ser exatamente o gerado pelo `/compact`, apenas complementado com o cabeçalho de metadados abaixo.

3. **Gere o nome do arquivo** com data e horário locais (ISO 8601, fuso local):

   ```text
   .agents/history/compact-<YYYY-MM-DD-HH-MM>.md
   ```

   Exemplo: `.agents/history/compact-2026-09-15-14-30.md`

   - Se o arquivo já existir (mesma data e horário), incremente o minuto (ou use `-2`, `-3` como sufixo). Nome de arquivo sempre único — jamais sobrescreva um arquivo de histórico existente.

4. **Salve o arquivo** usando o template da Seção 3.

5. **Confirme ao usuário** o caminho completo do arquivo criado.

## 3. Template do arquivo salvo

```markdown
# Histórico Compactado — <YYYY-MM-DD HH:MM>

- **Fonte**: comando `/compact` (Zed)
- **Projeto**: Finances Dashboard
- **Data**: <YYYY-MM-DD>
- **Horário**: <HH:MM>

---

<conteúdo compactado fornecido pelo usuário — copiado integralmente, sem edições>
```

## 4. Regras

- **Fidelidade**: salve o conteúdo do `/compact` integralmente, sem resumir, reformular ou censurar o que o usuário forneceu.
- **Nunca sobrescrever**: arquivos de histórico são imutáveis; crie sempre um novo arquivo.
- **Cabeçalho obrigatório**: todo arquivo deve conter o bloco de metadados (Fonte, Projeto, Data, Horário) para fácil indexação e consulta.
- **Sem segredos**: se o resumo contiver credenciais ou dados sensíveis, sinalize ao usuário antes de salvar e registre apenas uma referência neutra.
