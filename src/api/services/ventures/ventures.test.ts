import { describe, expect, it } from "bun:test";
import type { SelectVenture } from "@/src/configs/database";
import { ApiError } from "@/src/errors/ApiError";
import type {
  IVenturesRepository,
  Venture,
  VentureInput,
} from "./ventures.types";
import { VenturesService } from "./ventures.service";

const now = "2026-10-23T12:00:00.000Z";

const makeRow = (overrides: Partial<SelectVenture> = {}): SelectVenture =>
  Object.assign(
    {
      id: "venture-1",
      name: "Tesouro Selic",
      internalCode: null,
      category: "FIXED",
      type: "TREASURY",
      initialValue: 10000,
      boughtAt: "2026-01-01",
      expiresIn: "2030-01-01",
      indexer: "SELIC",
      rate: 10,
      source: "Tesouro Direto",
      quantity: null,
      unitPrice: null,
      totalPrice: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } satisfies SelectVenture,
    overrides,
  );

const createRepository = (rows: SelectVenture[] = []) => {
  const state = [...rows];

  const repository: IVenturesRepository = {
    get: (id) => state.find((row) => row.id === id),
    getAll: () => [...state],
    post: (data) => {
      const row = makeRow({
        ...data,
        id: data.id ?? "generated-id",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      state.push(row);

      return row;
    },
    patch: (id, data) => {
      const index = state.findIndex((row) => row.id === id);
      const current = state[index];

      if (!current) {
        return undefined;
      }

      const updated: SelectVenture = Object.assign({ ...current }, data);
      state[index] = updated;

      return updated;
    },
    softDelete: (id) => {
      const index = state.findIndex((row) => row.id === id);
      const current = state[index];

      if (!current) {
        return undefined;
      }

      const updated = { ...current, deletedAt: now };
      state[index] = updated;

      return updated;
    },
  };

  return { repository, state };
};

const fixedInput = (overrides: Partial<VentureInput> = {}): VentureInput => ({
  name: "Tesouro Selic",
  category: "FIXED",
  type: "TREASURY",
  initialValue: 10000,
  boughtAt: new Date("2026-01-01T00:00:00.000Z"),
  expiresIn: new Date("2030-01-01T00:00:00.000Z"),
  indexer: "SELIC",
  rate: 10,
  source: "Tesouro Direto",
  ...overrides,
});

const variableInput = (
  overrides: Partial<VentureInput> = {},
): VentureInput => ({
  name: "PETR4",
  internalCode: "PETR4",
  category: "VARIABLE",
  type: "STOCK",
  initialValue: 5000,
  boughtAt: new Date("2026-01-01T00:00:00.000Z"),
  quantity: 10,
  unitPrice: 500,
  totalPrice: 5000,
  ...overrides,
});

const catchApiError = (fn: () => unknown): ApiError => {
  try {
    fn();
  } catch (error) {
    if (error instanceof ApiError) {
      return error;
    }

    throw error;
  }

  throw new Error("Esperava um ApiError");
};

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }

  throw new Error("Esperava um erro");
};

describe("VenturesService.validate", () => {
  it("aceita venture de renda fixa válida", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    expect(() => service.validate(fixedInput())).not.toThrow();
  });

  it("aceita venture de renda variável válida", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    expect(() => service.validate(variableInput())).not.toThrow();
  });

  it("rejeita initialValue negativo com 422", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });
    const error = catchApiError(() =>
      service.validate(fixedInput({ initialValue: -1 })),
    );

    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual({ field: "initialValue", rule: "min" });
  });

  it("rejeita boughtAt futuro com 422", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });
    const error = catchApiError(() =>
      service.validate(
        fixedInput({ boughtAt: new Date(Date.now() + 86_400_000) }),
      ),
    );

    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual({ field: "boughtAt", rule: "not_future" });
  });

  it("rejeita STOCK com expiresIn com 422", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });
    const error = catchApiError(() =>
      service.validate(
        fixedInput({
          type: "STOCK",
          expiresIn: new Date("2030-01-01T00:00:00.000Z"),
        }),
      ),
    );

    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual({ field: "expiresIn", rule: "incompatible" });
  });

  it.each(["indexer", "rate", "source"] as const)(
    "rejeita FIXED sem %s com 422",
    (field) => {
      const { repository } = createRepository();
      const service = new VenturesService({ venturesRepository: repository });
      const error = catchApiError(() =>
        service.validate(fixedInput({ [field]: undefined })),
      );

      expect(error.statusCode).toBe(422);
      expect(error.details).toEqual({ field, rule: "required" });
    },
  );

  it.each(["quantity", "unitPrice", "totalPrice"] as const)(
    "rejeita VARIABLE sem %s com 422",
    (field) => {
      const { repository } = createRepository();
      const service = new VenturesService({ venturesRepository: repository });
      const error = catchApiError(() =>
        service.validate(variableInput({ [field]: undefined })),
      );

      expect(error.statusCode).toBe(422);
      expect(error.details).toEqual({ field, rule: "required" });
    },
  );
});

describe("VenturesService CRUD", () => {
  it("cria a venture convertendo datas para o formato do banco", () => {
    const { repository, state } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    const result = service.create(fixedInput());

    expect(state).toHaveLength(1);
    expect(state[0]?.boughtAt).toBe("2026-01-01");
    expect(state[0]?.expiresIn).toBe("2030-01-01");
    expect(state[0]?.initialValue).toBe(10000);
    expect(result.boughtAt).toBeInstanceOf(Date);
    expect(result.category).toBe("FIXED");
  });

  it("não persiste venture inválida", () => {
    const { repository, state } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });
    const error = catchApiError(() =>
      service.create(fixedInput({ initialValue: -1 })),
    );

    expect(error.statusCode).toBe(422);
    expect(state).toHaveLength(0);
  });

  it("atualiza mesclando o registro existente e validando o resultado", () => {
    const { repository, state } = createRepository([makeRow()]);
    const service = new VenturesService({ venturesRepository: repository });

    const result = service.update("venture-1", { name: "Novo nome" });

    expect(result.name).toBe("Novo nome");
    expect(state[0]?.name).toBe("Novo nome");
    expect(state[0]?.boughtAt).toBe("2026-01-01");
    expect(state[0]?.initialValue).toBe(10000);
  });

  it("retorna 404 ao atualizar venture inexistente", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });
    const error = catchApiError(() =>
      service.update("missing", { name: "Novo" }),
    );

    expect(error.statusCode).toBe(404);
  });

  it("retorna 404 ao buscar venture inexistente", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });
    const error = catchApiError(() => service.get("missing"));

    expect(error.statusCode).toBe(404);
  });

  it("busca venture existente no formato de domínio", () => {
    const { repository } = createRepository([makeRow()]);
    const service = new VenturesService({ venturesRepository: repository });

    const result = service.get("venture-1");

    expect(result.id).toBe("venture-1");
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("lista ventures especializando por categoria", () => {
    const { repository } = createRepository([
      makeRow(),
      makeRow({
        id: "venture-2",
        name: "PETR4",
        category: "VARIABLE",
        type: "STOCK",
        expiresIn: null,
        indexer: null,
        rate: null,
        source: null,
        quantity: 10,
        unitPrice: 500,
        totalPrice: 5000,
      }),
    ]);
    const service = new VenturesService({ venturesRepository: repository });

    const result = service.getAll();
    const variable = result.find((venture) => venture.id === "venture-2");

    expect(result).toHaveLength(2);
    expect(result[0]?.category).toBe("FIXED");
    expect(variable?.category).toBe("VARIABLE");
    expect(
      variable && "quantity" in variable ? variable.quantity : undefined,
    ).toBe(10);
  });

  it("faz softDelete de venture existente", () => {
    const { repository, state } = createRepository([makeRow()]);
    const service = new VenturesService({ venturesRepository: repository });

    const result = service.softDelete("venture-1");

    expect(result.id).toBe("venture-1");
    expect(state[0]?.deletedAt).toBe(now);
  });

  it("retorna 404 ao fazer softDelete de venture inexistente", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });
    const error = catchApiError(() => service.softDelete("missing"));

    expect(error.statusCode).toBe(404);
  });

  it("despacha ações pelo execute", () => {
    const { repository } = createRepository([makeRow()]);
    const service = new VenturesService({ venturesRepository: repository });

    const result = service.execute({
      action: "get",
      id: "venture-1",
    }) as Venture;

    expect(result.id).toBe("venture-1");
  });
});

describe("VenturesService.create com payload de criação", () => {
  const boughtAt = new Date("2026-01-01T00:00:00.000Z");

  it("deriva categoria VARIABLE a partir do tipo STOCK e calcula os totais", () => {
    const { repository, state } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    const result = service.create({
      name: "PETR4",
      internalCode: "PETR4",
      type: "STOCK",
      boughtAt,
      quantity: 10,
      unitPrice: 500,
    });

    expect(state[0]?.category).toBe("VARIABLE");
    expect(state[0]?.quantity).toBe(10);
    expect(state[0]?.unitPrice).toBe(500);
    expect(state[0]?.totalPrice).toBe(5000);
    expect(state[0]?.initialValue).toBe(5000);
    expect(result.category).toBe("VARIABLE");
  });

  it("deriva categoria FIXED para um tipo de renda fixa", () => {
    const { repository, state } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    service.create({
      name: "CDB Banco X",
      type: "CDB",
      boughtAt,
      initialValue: 10000,
      indexer: "CDI",
      rate: 12,
      source: "Banco X",
    });

    expect(state[0]?.category).toBe("FIXED");
    expect(state[0]?.indexer).toBe("CDI");
    expect(state[0]?.quantity).toBeNull();
    expect(state[0]?.unitPrice).toBeNull();
  });

  it("recalcula totalPrice e initialValue de renda variável ignorando os valores enviados", () => {
    const { repository, state } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    service.create({
      name: "FII X",
      type: "FII",
      boughtAt,
      quantity: 3,
      unitPrice: 1234,
      totalPrice: 1,
      initialValue: 2,
    });

    expect(state[0]?.totalPrice).toBe(3702);
    expect(state[0]?.initialValue).toBe(3702);
  });

  it("arredonda quantity fracionária ao calcular o total", () => {
    const { repository, state } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    service.create({
      name: "FII X",
      type: "FII",
      boughtAt,
      quantity: 2.5,
      unitPrice: 101,
    });

    expect(state[0]?.totalPrice).toBe(253);
  });

  it("normaliza name, internalCode e source", () => {
    const { repository, state } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    service.create({
      name: "  Tesouro Selic  ",
      internalCode: "  TD-SELIC  ",
      type: "TREASURY",
      boughtAt,
      initialValue: 10000,
      indexer: "SELIC",
      rate: 10,
      source: "  Tesouro Direto  ",
    });

    expect(state[0]?.name).toBe("Tesouro Selic");
    expect(state[0]?.internalCode).toBe("TD-SELIC");
    expect(state[0]?.source).toBe("Tesouro Direto");
  });

  it("converte internalCode vazio em null", () => {
    const { repository, state } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    service.create({
      name: "Tesouro Selic",
      internalCode: "   ",
      type: "TREASURY",
      boughtAt,
      initialValue: 10000,
      indexer: "SELIC",
      rate: 10,
      source: "Tesouro Direto",
    });

    expect(state[0]?.internalCode).toBeNull();
  });

  it("mapeia violação de unicidade de internalCode para 409", () => {
    const { repository, state } = createRepository();
    const failingRepository: IVenturesRepository = {
      ...repository,
      post: () => {
        throw new Error("UNIQUE constraint failed: ventures.internal_code");
      },
    };
    const service = new VenturesService({
      venturesRepository: failingRepository,
    });

    const error = catchApiError(() =>
      service.create({
        name: "PETR4",
        internalCode: "PETR4",
        type: "STOCK",
        boughtAt,
        quantity: 1,
        unitPrice: 100,
      }),
    );

    expect(error.statusCode).toBe(409);
    expect(error.message).toBe("internalCode já cadastrado");
    expect(error.details).toEqual({ field: "internalCode", rule: "unique" });
    expect(state).toHaveLength(0);
  });

  it("repropaga erro do repositório que não é de unicidade", () => {
    const { repository } = createRepository();
    const failure = new Error("disk I/O error");
    const failingRepository: IVenturesRepository = {
      ...repository,
      post: () => {
        throw failure;
      },
    };
    const service = new VenturesService({
      venturesRepository: failingRepository,
    });

    const error = catchError(() =>
      service.create({
        name: "PETR4",
        internalCode: "PETR4",
        type: "STOCK",
        boughtAt,
        quantity: 1,
        unitPrice: 100,
      }),
    );

    expect(error).toBe(failure);
  });

  it("rejeita renda fixa sem initialValue", () => {
    const { repository, state } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    const error = catchApiError(() =>
      service.create({
        name: "Tesouro Selic",
        type: "TREASURY",
        boughtAt,
        indexer: "SELIC",
        rate: 10,
        source: "Tesouro Direto",
      }),
    );

    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual({ field: "initialValue", rule: "required" });
    expect(state).toHaveLength(0);
  });

  it("rejeita initialValue não inteiro", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    const error = catchApiError(() =>
      service.create({
        name: "Tesouro Selic",
        type: "TREASURY",
        boughtAt,
        initialValue: 10.5,
        indexer: "SELIC",
        rate: 10,
        source: "Tesouro Direto",
      }),
    );

    expect(error.details).toEqual({ field: "initialValue", rule: "min" });
  });

  it("rejeita name vazio", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    const error = catchApiError(() =>
      service.create({
        name: "   ",
        type: "TREASURY",
        boughtAt,
        initialValue: 10000,
        indexer: "SELIC",
        rate: 10,
        source: "Tesouro Direto",
      }),
    );

    expect(error.details).toEqual({ field: "name", rule: "required" });
  });

  it("rejeita renda variável derivada sem quantity", () => {
    const { repository } = createRepository();
    const service = new VenturesService({ venturesRepository: repository });

    const error = catchApiError(() =>
      service.create({
        name: "PETR4",
        type: "STOCK",
        boughtAt,
        unitPrice: 500,
      }),
    );

    expect(error.details).toEqual({ field: "quantity", rule: "required" });
  });
});
