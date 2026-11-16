import { describe, expect, it } from "bun:test";
import type {
  SelectVenture,
  SelectVentureSnapshot,
} from "@/src/configs/database";
import { ApiError } from "@/src/errors/ApiError";
import type { IVenturesReader } from "@/src/api/services/ventures/ventures.types";
import type {
  IVentureSnapshotsRepository,
  SnapshotInput,
  UpdateSnapshotInput,
} from "./snapshots.types";
import { SnapshotsService } from "./snapshots.service";

const now = "2026-10-23T12:00:00.000Z";

const makeVentureRow = (
  overrides: Partial<SelectVenture> = {},
): SelectVenture =>
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

const makeSnapshotRow = (
  overrides: Partial<SelectVentureSnapshot> = {},
): SelectVentureSnapshot =>
  Object.assign(
    {
      id: "snapshot-1",
      ventureId: "venture-1",
      referenceDate: "2026-09-30",
      currentUnitPrice: null,
      currentQuantityHeld: null,
      currentTotalValue: 12000,
      totalContributed: 10000,
      grossProfit: 2000,
      profitPercentage: 20,
      type: "MONTHLY_RECORD",
      movementValue: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } satisfies SelectVentureSnapshot,
    overrides,
  );

const createRepository = (rows: SelectVentureSnapshot[] = []) => {
  const state = [...rows];

  const repository: IVentureSnapshotsRepository = {
    get: (id) => state.find((row) => row.id === id),
    getAll: () => [...state],
    post: (data) => {
      const row = makeSnapshotRow({
        ...data,
        id: data.id ?? "generated-snapshot",
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

      const updated: SelectVentureSnapshot = Object.assign(
        { ...current },
        data,
      );
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

const createVenturesReader = (
  row: SelectVenture | undefined,
): IVenturesReader => ({
  get: (id) => (row && row.id === id ? row : undefined),
  getAll: () => (row ? [row] : []),
});

const createService = (
  options: {
    venture?: SelectVenture;
    snapshots?: SelectVentureSnapshot[];
  } = {},
) => {
  const venture = "venture" in options ? options.venture : makeVentureRow();
  const { repository, state } = createRepository(options.snapshots ?? []);
  const service = new SnapshotsService({
    venturesReader: createVenturesReader(venture),
    snapshotsRepository: repository,
  });

  return { service, repository, state };
};

const monthlyInput = (
  overrides: Partial<SnapshotInput> = {},
): SnapshotInput => ({
  ventureId: "venture-1",
  referenceDate: new Date("2026-09-30T00:00:00.000Z"),
  type: "MONTHLY_RECORD",
  currentTotalValue: 12000,
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

describe("SnapshotsService.save", () => {
  it("parte do initialValue da venture no primeiro snapshot", () => {
    const { service, state } = createService();

    const result = service.save(monthlyInput());

    expect(result.totalContributed).toBe(10000);
    expect(result.grossProfit).toBe(2000);
    expect(result.profitPercentage).toBe(20);
    expect(state[0]?.referenceDate).toBe("2026-09-30");
  });

  it("soma o movementValue em CONTRIBUTION", () => {
    const { service } = createService();

    const result = service.save(
      monthlyInput({ type: "CONTRIBUTION", movementValue: 5000 }),
    );

    expect(result.totalContributed).toBe(15000);
    expect(result.grossProfit).toBe(-3000);
  });

  it("subtrai o movementValue em WITHDRAWAL", () => {
    const { service } = createService({
      snapshots: [makeSnapshotRow()],
    });

    const result = service.save({
      ventureId: "venture-1",
      referenceDate: new Date("2026-10-31T00:00:00.000Z"),
      type: "WITHDRAWAL",
      movementValue: 2000,
      currentTotalValue: 10000,
    });

    expect(result.totalContributed).toBe(8000);
    expect(result.grossProfit).toBe(2000);
  });

  it("exige movementValue positivo em CONTRIBUTION/WITHDRAWAL", () => {
    const { service } = createService();
    const missing = catchApiError(() =>
      service.save(monthlyInput({ type: "CONTRIBUTION" })),
    );
    const zero = catchApiError(() =>
      service.save(monthlyInput({ type: "WITHDRAWAL", movementValue: 0 })),
    );

    expect(missing.statusCode).toBe(422);
    expect(missing.details).toEqual({
      field: "movementValue",
      rule: "required",
    });
    expect(zero.statusCode).toBe(422);
  });

  it("rejeita resgate acima do total aportado", () => {
    const { service } = createService();
    const error = catchApiError(() =>
      service.save(monthlyInput({ type: "WITHDRAWAL", movementValue: 12000 })),
    );

    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual({
      field: "movementValue",
      rule: "max_contributed",
    });
  });

  it("retorna 404 quando a venture não existe", () => {
    const { service } = createService({ venture: undefined });
    const error = catchApiError(() => service.save(monthlyInput()));

    expect(error.statusCode).toBe(404);
  });

  it("deriva currentTotalValue de preço unitário x quantidade", () => {
    const { service } = createService();

    const result = service.save(
      monthlyInput({
        currentTotalValue: undefined,
        currentUnitPrice: 1000,
        currentQuantityHeld: 12,
      }),
    );

    expect(result.currentTotalValue).toBe(12000);
    expect(result.currentUnitPrice).toBe(1000);
    expect(result.currentQuantityHeld).toBe(12);
  });

  it("herda currentTotalValue do snapshot anterior", () => {
    const { service } = createService({
      snapshots: [makeSnapshotRow({ currentTotalValue: 13000 })],
    });

    const result = service.save(
      monthlyInput({
        referenceDate: new Date("2026-10-31T00:00:00.000Z"),
        currentTotalValue: undefined,
      }),
    );

    expect(result.currentTotalValue).toBe(13000);
  });

  it("usa initialValue como valor atual quando não há dados nem snapshot", () => {
    const { service } = createService();

    const result = service.save(monthlyInput({ currentTotalValue: undefined }));

    expect(result.currentTotalValue).toBe(10000);
  });

  it("zera a rentabilidade quando não há total aportado", () => {
    const { service } = createService({
      venture: makeVentureRow({ initialValue: 0 }),
    });

    const result = service.save(monthlyInput({ currentTotalValue: 0 }));

    expect(result.totalContributed).toBe(0);
    expect(result.grossProfit).toBe(0);
    expect(result.profitPercentage).toBe(0);
  });

  it("soma o movementValue ao montante anterior em CONTRIBUTION sem currentTotalValue", () => {
    const { service } = createService({
      snapshots: [makeSnapshotRow({ currentTotalValue: 13000 })],
    });

    const result = service.save(
      monthlyInput({
        referenceDate: new Date("2026-10-31T00:00:00.000Z"),
        type: "CONTRIBUTION",
        movementValue: 5000,
        currentTotalValue: undefined,
      }),
    );

    expect(result.totalContributed).toBe(15000);
    expect(result.currentTotalValue).toBe(18000);
    expect(result.grossProfit).toBe(3000);
  });

  it("subtrai o movementValue do montante anterior em WITHDRAWAL sem currentTotalValue", () => {
    const { service } = createService({
      snapshots: [makeSnapshotRow({ currentTotalValue: 13000 })],
    });

    const result = service.save(
      monthlyInput({
        referenceDate: new Date("2026-10-31T00:00:00.000Z"),
        type: "WITHDRAWAL",
        movementValue: 2000,
        currentTotalValue: undefined,
      }),
    );

    expect(result.totalContributed).toBe(8000);
    expect(result.currentTotalValue).toBe(11000);
    expect(result.grossProfit).toBe(3000);
  });

  it("rejeita referenceDate inválida com 400", () => {
    const { service } = createService();
    const error = catchApiError(() =>
      service.save(monthlyInput({ referenceDate: new Date("invalid") })),
    );

    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: "referenceDate", rule: "date" });
  });

  it("rejeita currentTotalValue negativo com 422", () => {
    const { service } = createService();
    const error = catchApiError(() =>
      service.save(monthlyInput({ currentTotalValue: -1 })),
    );

    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual({ field: "currentTotalValue", rule: "min" });
  });

  it("persiste a nota no snapshot criado", () => {
    const { service, state } = createService();

    const result = service.save(monthlyInput({ notes: "revisar série" }));

    expect(result.notes).toBe("revisar série");
    expect(state[0]?.notes).toBe("revisar série");
  });
});

describe("SnapshotsService CRUD e tracking", () => {
  it("atualiza recalculando os derivados", () => {
    const { service, state } = createService({
      snapshots: [makeSnapshotRow()],
    });

    const result = service.update("snapshot-1", { currentTotalValue: 15000 });

    expect(result.grossProfit).toBe(5000);
    expect(result.profitPercentage).toBe(50);
    expect(state[0]?.grossProfit).toBe(5000);
    expect(state[0]?.referenceDate).toBe("2026-09-30");
  });

  it("rejeita alteração de type/movementValue com 400", () => {
    const { service } = createService({ snapshots: [makeSnapshotRow()] });
    const error = catchApiError(() =>
      service.update("snapshot-1", {
        type: "WITHDRAWAL",
      } as unknown as UpdateSnapshotInput),
    );

    expect(error.statusCode).toBe(400);
  });

  it("retorna 404 ao atualizar snapshot inexistente", () => {
    const { service } = createService();
    const error = catchApiError(() =>
      service.update("missing", { currentTotalValue: 1 }),
    );

    expect(error.statusCode).toBe(404);
  });

  it("retorna 404 ao buscar snapshot inexistente", () => {
    const { service } = createService();
    const error = catchApiError(() => service.get("missing"));

    expect(error.statusCode).toBe(404);
  });

  it("faz softDelete de snapshot existente", () => {
    const { service, state } = createService({
      snapshots: [makeSnapshotRow()],
    });

    const result = service.softDelete("snapshot-1");

    expect(result.id).toBe("snapshot-1");
    expect(state[0]?.deletedAt).toBe(now);
  });

  it("retorna 404 ao fazer softDelete de snapshot inexistente", () => {
    const { service } = createService();
    const error = catchApiError(() => service.softDelete("missing"));

    expect(error.statusCode).toBe(404);
  });

  it("lista snapshots no formato de domínio", () => {
    const { service } = createService({
      snapshots: [makeSnapshotRow(), makeSnapshotRow({ id: "snapshot-2" })],
    });

    const result = service.getAll();

    expect(result).toHaveLength(2);
    expect(result[0]?.referenceDate).toBeInstanceOf(Date);
  });

  it("monta o tracking ordenado com os valores do último snapshot", () => {
    const { service } = createService({
      snapshots: [
        makeSnapshotRow({
          id: "snapshot-2",
          referenceDate: "2026-10-31",
          currentTotalValue: 15000,
          grossProfit: 5000,
          profitPercentage: 50,
          createdAt: "2026-10-31T12:00:00.000Z",
        }),
        makeSnapshotRow(),
      ],
    });

    const result = service.tracking("venture-1");

    expect(result.snapshots.map((snapshot) => snapshot.id)).toEqual([
      "snapshot-1",
      "snapshot-2",
    ]);
    expect(result.latestValue).toBe(15000);
    expect(result.totalProfitabilityPercentage).toBe(50);
    expect(result.venture.id).toBe("venture-1");
  });

  it("retorna 404 no tracking de venture inexistente", () => {
    const { service } = createService();
    const error = catchApiError(() => service.tracking("missing"));

    expect(error.statusCode).toBe(404);
  });

  it("despacha ações pelo execute", () => {
    const { service } = createService({ snapshots: [makeSnapshotRow()] });

    const result = service.execute({ action: "get", id: "snapshot-1" });

    expect(result).toMatchObject({ id: "snapshot-1" });
  });
});
