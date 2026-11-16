import { describe, expect, it } from "bun:test";
import { VentureType } from "@/contracts";
import type { IVentureTracking } from "@/contracts";
import type { Venture } from "@/src/api/services/ventures/ventures.types";
import { PortfolioService } from "./portfolio.service";

const makeVenture = (id: string, type: Venture["type"]): Venture => {
  const base = {
    id,
    name: id,
    initialValue: 1_000,
    boughtAt: new Date("2026-01-01"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  if (type === VentureType.STOCK || type === VentureType.FII) {
    return {
      ...base,
      category: "VARIABLE",
      type,
      quantity: 1,
      unitPrice: 1_000,
      totalPrice: 1_000,
    };
  }

  return {
    ...base,
    category: "FIXED",
    type,
    indexer: "SELIC",
    rate: 0.1,
    source: "Teste",
  };
};

const makeTracking = (venture: Venture): IVentureTracking => ({
  venture,
  snapshots: [],
  latestValue: 0,
  totalProfitabilityPercentage: 0,
});

const createVenturesReader = (ventures: Venture[]) => {
  const reader = {
    calls: 0,
    getAll: (): Venture[] => {
      reader.calls += 1;
      return ventures;
    },
  };

  return reader;
};

const createSnapshotsReader = (ventures: Venture[]) => {
  const trackings = new Map(
    ventures.map((venture) => [venture.id, makeTracking(venture)]),
  );
  const requested: string[] = [];

  return {
    requested,
    tracking: (ventureId: string): IVentureTracking => {
      requested.push(ventureId);
      const tracking = trackings.get(ventureId);

      if (!tracking) {
        throw new Error(`Tracking inexistente para ${ventureId}`);
      }

      return tracking;
    },
  };
};

const createService = (ventures: Venture[]) => {
  const venturesReader = createVenturesReader(ventures);
  const snapshotsReader = createSnapshotsReader(ventures);
  const service = new PortfolioService({
    venturesService: venturesReader,
    snapshotsService: snapshotsReader,
  });

  return { service, venturesReader, snapshotsReader };
};

describe("PortfolioService.listTracking", () => {
  it("filtra os ventures pelo tipo informado", () => {
    const treasuryA = makeVenture("treasury-a", VentureType.TREASURY);
    const stock = makeVenture("stock", VentureType.STOCK);
    const treasuryB = makeVenture("treasury-b", VentureType.TREASURY);
    const { service, snapshotsReader } = createService([
      treasuryA,
      stock,
      treasuryB,
    ]);

    const result = service.listTracking({ type: VentureType.TREASURY });

    expect(result.map((tracking) => tracking.venture.id)).toEqual([
      "treasury-a",
      "treasury-b",
    ]);
    expect(snapshotsReader.requested).toEqual(["treasury-a", "treasury-b"]);
  });

  it("não consulta tracking dos ventures filtrados", () => {
    const treasury = makeVenture("treasury", VentureType.TREASURY);
    const stock = makeVenture("stock", VentureType.STOCK);
    const { service, snapshotsReader } = createService([treasury, stock]);

    service.listTracking({ type: VentureType.TREASURY });

    expect(snapshotsReader.requested).not.toContain("stock");
  });

  it("retorna todos os trackings quando o tipo não é informado", () => {
    const ventures = [
      makeVenture("treasury", VentureType.TREASURY),
      makeVenture("stock", VentureType.STOCK),
      makeVenture("cdb", VentureType.CDB),
    ];
    const { service, snapshotsReader } = createService(ventures);

    const result = service.listTracking({});

    expect(result).toHaveLength(3);
    expect(snapshotsReader.requested).toEqual(["treasury", "stock", "cdb"]);
  });

  it("preserva a ordem retornada por getAll", () => {
    const first = makeVenture("b", VentureType.TREASURY);
    const second = makeVenture("a", VentureType.TREASURY);
    const { service } = createService([first, second]);

    const result = service.listTracking({ type: VentureType.TREASURY });

    expect(result.map((tracking) => tracking.venture.id)).toEqual(["b", "a"]);
  });

  it("retorna vazio quando não há ventures do tipo", () => {
    const { service, snapshotsReader } = createService([
      makeVenture("stock", VentureType.STOCK),
    ]);

    const result = service.listTracking({ type: VentureType.TREASURY });

    expect(result).toEqual([]);
    expect(snapshotsReader.requested).toEqual([]);
  });
});

describe("PortfolioService.execute", () => {
  it("despacha para listTracking", () => {
    const treasury = makeVenture("treasury", VentureType.TREASURY);
    const stock = makeVenture("stock", VentureType.STOCK);
    const { service } = createService([treasury, stock]);

    const result = service.execute({ type: VentureType.TREASURY });

    expect(result.map((tracking) => tracking.venture.id)).toEqual([
      "treasury",
    ]);
  });
});
