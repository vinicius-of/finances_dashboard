import { describe, expect, it } from "bun:test";
import { SnapshotType } from "@/contracts";
import type { IVentureSnapshot } from "@/contracts";
import { toTesouroDiretoRecordRows } from "./records";

const makeSnapshot = (
  overrides: Partial<IVentureSnapshot> = {},
): IVentureSnapshot => ({
  id: "snapshot",
  ventureId: "venture",
  referenceDate: new Date("2026-09-09"),
  currentTotalValue: 100_000,
  totalContributed: 100_000,
  grossProfit: 0,
  profitPercentage: 0,
  type: SnapshotType.MONTHLY_RECORD,
  createdAt: new Date("2026-09-09T12:00:00.000Z"),
  ...overrides,
});

describe("toTesouroDiretoRecordRows", () => {
  it("formata a data do registro em dd/mm/aaaa", () => {
    const rows = toTesouroDiretoRecordRows(
      [makeSnapshot({ referenceDate: new Date("2026-09-09") })],
      100_000,
    );

    expect(rows[0]?.dateLabel).toBe("09/09/2026");
  });

  it("exibe diferença positiva com sinal", () => {
    const rows = toTesouroDiretoRecordRows(
      [makeSnapshot({ currentTotalValue: 120_000 })],
      100_000,
    );

    expect(rows[0]?.differenceLabel).toBe("+ R$ 200,00");
    expect(rows[0]?.differenceTrend).toBe("up");
  });

  it("exibe diferença negativa com sinal", () => {
    const rows = toTesouroDiretoRecordRows(
      [makeSnapshot({ currentTotalValue: 90_000 })],
      100_000,
    );

    expect(rows[0]?.differenceLabel).toBe("- R$ 100,00");
    expect(rows[0]?.differenceTrend).toBe("down");
  });

  it("exibe zero sem sinal", () => {
    const rows = toTesouroDiretoRecordRows(
      [makeSnapshot({ currentTotalValue: 100_000 })],
      100_000,
    );

    expect(rows[0]?.differenceLabel).toBe("R$ 0,00");
    expect(rows[0]?.differenceTrend).toBe("neutral");
  });

  it("usa o initialValue como valor anterior no primeiro registro", () => {
    const rows = toTesouroDiretoRecordRows(
      [makeSnapshot({ currentTotalValue: 120_000 })],
      100_000,
    );

    expect(rows[0]?.previousValueLabel).toBe("R$ 1.000,00");
    expect(rows[0]?.currentValueLabel).toBe("R$ 1.200,00");
  });

  it("usa o snapshot anterior como valor anterior", () => {
    const first = makeSnapshot({
      referenceDate: new Date("2026-01-01"),
      currentTotalValue: 120_000,
    });
    const second = makeSnapshot({
      referenceDate: new Date("2026-02-01"),
      currentTotalValue: 150_000,
    });

    const rows = toTesouroDiretoRecordRows([first, second], 100_000);

    expect(rows[0]?.previousValueLabel).toBe("R$ 1.200,00");
    expect(rows[0]?.currentValueLabel).toBe("R$ 1.500,00");
    expect(rows[1]?.previousValueLabel).toBe("R$ 1.000,00");
    expect(rows[1]?.currentValueLabel).toBe("R$ 1.200,00");
  });

  it("calcula a diferença independentemente do tipo do registro", () => {
    const withdrawal = makeSnapshot({
      referenceDate: new Date("2026-01-01"),
      type: SnapshotType.WITHDRAWAL,
      movementValue: 10_000,
      currentTotalValue: 90_000,
    });
    const monthly = makeSnapshot({
      referenceDate: new Date("2026-02-01"),
      type: SnapshotType.MONTHLY_RECORD,
      currentTotalValue: 95_000,
    });
    const contribution = makeSnapshot({
      referenceDate: new Date("2026-03-01"),
      type: SnapshotType.CONTRIBUTION,
      movementValue: 20_000,
      currentTotalValue: 120_000,
    });

    const rows = toTesouroDiretoRecordRows(
      [withdrawal, monthly, contribution],
      100_000,
    );

    expect(rows[0]?.differenceLabel).toBe("+ R$ 250,00");
    expect(rows[0]?.differenceTrend).toBe("up");
    expect(rows[1]?.differenceLabel).toBe("+ R$ 50,00");
    expect(rows[1]?.differenceTrend).toBe("up");
    expect(rows[2]?.differenceLabel).toBe("- R$ 100,00");
    expect(rows[2]?.differenceTrend).toBe("down");
  });

  it("preserva a nota do registro", () => {
    const rows = toTesouroDiretoRecordRows(
      [makeSnapshot({ notes: "revisar: valor fora da série" })],
      100_000,
    );

    expect(rows[0]?.notes).toBe("revisar: valor fora da série");
  });

  it("mantém a nota indefinida quando ausente", () => {
    const rows = toTesouroDiretoRecordRows([makeSnapshot()], 100_000);

    expect(rows[0]?.notes).toBeUndefined();
  });

  it("ordena por data de referência decrescente", () => {
    const rows = toTesouroDiretoRecordRows(
      [
        makeSnapshot({ referenceDate: new Date("2026-01-08") }),
        makeSnapshot({ referenceDate: new Date("2026-07-09") }),
        makeSnapshot({ referenceDate: new Date("2026-09-09") }),
      ],
      100_000,
    );

    expect(rows.map((row) => row.dateLabel)).toEqual([
      "09/09/2026",
      "09/07/2026",
      "08/01/2026",
    ]);
  });

  it("desempata datas iguais pelo createdAt mais recente", () => {
    const older = makeSnapshot({
      referenceDate: new Date("2026-09-09"),
      createdAt: new Date("2026-09-09T10:00:00.000Z"),
      notes: "mais antigo",
    });
    const newer = makeSnapshot({
      referenceDate: new Date("2026-09-09"),
      createdAt: new Date("2026-09-09T12:00:00.000Z"),
      notes: "mais novo",
    });

    const rows = toTesouroDiretoRecordRows([older, newer], 100_000);

    expect(rows.map((row) => row.notes)).toEqual(["mais novo", "mais antigo"]);
  });

  it("retorna lista vazia quando não há registros", () => {
    expect(toTesouroDiretoRecordRows([], 100_000)).toEqual([]);
  });
});
