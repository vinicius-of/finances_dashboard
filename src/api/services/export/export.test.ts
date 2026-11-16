import { describe, expect, it } from "bun:test";
import type { IVentureSnapshot, IVentureTracking } from "@/contracts";
import type { Venture } from "@/src/api/services/ventures/ventures.types";
import type {
  ExportPayload,
  IExportSnapshotsReader,
  IExportVenturesReader,
} from "./export.types";
import { ExportService } from "./export.service";

const fixedVenture: Venture = {
  id: "venture-1",
  name: "Tesouro Selic",
  category: "FIXED",
  type: "TREASURY",
  initialValue: 10000,
  boughtAt: new Date("2026-01-01T00:00:00.000Z"),
  expiresIn: new Date("2030-01-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  indexer: "SELIC",
  rate: 10,
  source: "Tesouro Direto",
};

const variableVenture: Venture = {
  id: "venture-2",
  name: "PETR4",
  internalCode: "PETR4",
  category: "VARIABLE",
  type: "STOCK",
  initialValue: 5000,
  boughtAt: new Date("2026-02-01T00:00:00.000Z"),
  createdAt: new Date("2026-02-01T00:00:00.000Z"),
  updatedAt: new Date("2026-02-01T00:00:00.000Z"),
  quantity: 10,
  unitPrice: 500,
  totalPrice: 5000,
};

const fixedSnapshot: IVentureSnapshot = {
  id: "snapshot-1",
  ventureId: "venture-1",
  referenceDate: new Date("2026-09-30T00:00:00.000Z"),
  currentTotalValue: 12000,
  totalContributed: 10000,
  grossProfit: 2000,
  profitPercentage: 20,
  type: "MONTHLY_RECORD",
  movementValue: 5000,
  createdAt: new Date("2026-09-30T12:00:00.000Z"),
};

const variableSnapshot: IVentureSnapshot = {
  id: "snapshot-2",
  ventureId: "venture-2",
  referenceDate: new Date("2026-10-31T00:00:00.000Z"),
  currentUnitPrice: 400,
  currentQuantityHeld: 10,
  currentTotalValue: 4000,
  totalContributed: 5000,
  grossProfit: -1000,
  profitPercentage: -20,
  type: "MONTHLY_RECORD",
  createdAt: new Date("2026-10-31T12:00:00.000Z"),
};

const trackings: Record<string, IVentureTracking> = {
  "venture-1": {
    venture: fixedVenture,
    snapshots: [fixedSnapshot],
    latestValue: 12000,
    totalProfitabilityPercentage: 20,
  },
  "venture-2": {
    venture: variableVenture,
    snapshots: [variableSnapshot],
    latestValue: 4000,
    totalProfitabilityPercentage: -20,
  },
};

const createReaders = (
  ventures: Venture[],
  snapshots: IVentureSnapshot[],
  trackingMap: Record<string, IVentureTracking>,
) => {
  const calls: string[] = [];

  const venturesService: IExportVenturesReader = {
    getAll: () => ventures,
  };

  const snapshotsService: IExportSnapshotsReader = {
    getAll: () => snapshots,
    tracking: (ventureId) => {
      calls.push(ventureId);
      const tracking = trackingMap[ventureId];

      if (!tracking) {
        throw new Error(`Tracking ausente: ${ventureId}`);
      }

      return tracking;
    },
  };

  return { venturesService, snapshotsService, calls };
};

describe("ExportService", () => {
  it("retorna Response de download com todo o payload em reais", async () => {
    const readers = createReaders(
      [fixedVenture, variableVenture],
      [fixedSnapshot, variableSnapshot],
      trackings,
    );
    const service = new ExportService(readers);

    const response = service.execute({ action: "download" });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="finances-export-\d{4}-\d{2}-\d{2}\.json"$/,
    );

    const payload = (await response.json()) as ExportPayload;

    expect(typeof payload.exportedAt).toBe("string");
    expect(payload.ventures).toHaveLength(2);
    expect(payload.ventures[0]?.initialValue).toBe(100);
    expect(payload.ventures[1]?.initialValue).toBe(50);
    expect(
      payload.ventures[1] && "unitPrice" in payload.ventures[1]
        ? payload.ventures[1].unitPrice
        : undefined,
    ).toBe(5);
    expect(payload.snapshots[0]?.currentTotalValue).toBe(120);
    expect(payload.snapshots[0]?.totalContributed).toBe(100);
    expect(payload.snapshots[0]?.grossProfit).toBe(20);
    expect(payload.snapshots[0]?.movementValue).toBe(50);
    expect(payload.tracking[0]?.latestValue).toBe(120);
    expect(payload.summary.totalInvested).toBe(150);
    expect(payload.summary.currentTotalBalance).toBe(160);
    expect(payload.summary.totalGrossProfit).toBe(10);
    expect(payload.summary.fixedIncomeTotal).toBe(120);
    expect(payload.summary.variableIncomeTotal).toBe(40);
    expect(payload.summary.overallProfitabilityPercentage).toBeCloseTo(
      6.6667,
      3,
    );
    const lastUpdated = (payload.summary as unknown as { lastUpdated: string })
      .lastUpdated;
    expect(lastUpdated).toBe("2026-10-31T12:00:00.000Z");
    expect(readers.calls).toEqual(["venture-1", "venture-2"]);
  });

  it("retorna arrays vazios e resumo zerado sem dados", async () => {
    const readers = createReaders([], [], {});
    const service = new ExportService(readers);

    const payload = (await service
      .execute({ action: "download" })
      .json()) as ExportPayload;

    expect(payload.ventures).toEqual([]);
    expect(payload.snapshots).toEqual([]);
    expect(payload.tracking).toEqual([]);
    expect(payload.summary).toMatchObject({
      totalInvested: 0,
      currentTotalBalance: 0,
      totalGrossProfit: 0,
      overallProfitabilityPercentage: 0,
      fixedIncomeTotal: 0,
      variableIncomeTotal: 0,
    });
    expect(typeof payload.summary.lastUpdated).toBe("string");
    expect(readers.calls).toEqual([]);
  });
});
