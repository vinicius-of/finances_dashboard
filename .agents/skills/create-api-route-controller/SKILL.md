---
name: create-api-route-controller
description: Gera ou refatora APIs RESTful utilizando a API nativa Bun.serve de forma modularizada (Controllers e Routes).
---

# Instruções para Geração de APIs RESTful no Bun

Sempre que solicitar a criação de endpoints, rotas ou estruturas de API REST em Bun, utilize a estrutura modularizada abaixo. **Nunca** coloque rotas, lógica de controladores e inicialização do servidor no mesmo arquivo.

## Estrutura Padrão do Projeto

```text
src/
├── api/controllers/
│   └── [recurso].controller.ts
├── api/routes/
│   └── [recurso].routes.ts
└── index.ts
```

## Gerando controller template

Arquivo: [recurso].controller.ts

A camada de controller é responsável por processar requisições, interagir com os dados e retornar objetos Response.

```typescript
// Helper padronizado para respostas JSON
const json = (data: unknown, status = 200) => Response.json(data, { status });

export const ResourceController = {
  // GET /api/[recurso]
  async getAll(req: Request) {
    // Lógica para buscar todos
    return json([]);
  },

  // GET /api/[recurso]/:id
  async getById(req: Request & { params: { id: string } }) {
    const { id } = req.params;
    // Lógica para buscar por ID
    return json({ id });
  },

  // POST /api/[recurso]
  async create(req: Request) {
    try {
      const body = await req.json();
      // Validação básica e persistência
      return json(body, 201);
    } catch {
      return json({ error: "Payload inválido" }, 400);
    }
  },

  // DELETE /api/[recurso]/:id
  async delete(req: Request & { params: { id: string } }) {
    const { id } = req.params;
    // Lógica para deletar
    return json({ message: `Recurso ${id} removido` });
  }
};
```

## Gerando Routes Template

Define apenas o mapeamento entre os caminhos da URL + método HTTP e as funções do controller.

```typescript
import { ResourceController } from "../controllers/[recurso].controller";

export const resourceRoutes = {
  "/api/[recurso]": {
    GET: ResourceController.getAll,
    POST: ResourceController.create,
  },
  "/api/[recurso]/:id": {
    GET: ResourceController.getById,
    DELETE: ResourceController.delete,
  },
};
```

## Modificando Server Template

Centraliza os grupos de rotas e inicia o servidor com Bun.serve.

```typescript
import { resourceRoutes } from "./routes/[recurso].routes";

const PORT = Number(Bun.env.PORT) || 3000;

const server = Bun.serve({
  port: PORT,
  routes: {
    ...resourceRoutes,
    // Adicionar outros arquivos de rotas aqui usando o operador spread
  },
  fetch() {
    return Response.json({ error: "Rota não encontrada" }, { status: 404 });
  },
});

console.log(`🚀 Servidor rodando em http://localhost:${server.port}`);
```
