import { describe, expect, it } from "bun:test";
import type { IVentureSnapshot } from "@/contracts";
import type { SnapshotInput } from "@/src/api/services/snapshots/snapshots.types";
import { ApiError } from "@/src/errors/ApiError";
import { SnapshotsController } from "./snapshots.controller";
import type {
  IRegisterSnapshotResponse,
  ISnapshotWriter,
} from "./snapshots.controller.types";

interface IErrorBody {
  error: boolean;
  statusCode: number;
  message: string;
  details?: Record<string, unknown>;
}

type ResponseBody = Partial<IRegisterSnapshotResponse> & Partial<IErrorBody>;

const makeSnapshot = (
  overrides: Partial<IVentureSnapshot> = {},
): IVentureSnapshot => ({
  id: "snapshot-1",
  ventureId: "venture-1",
  referenceDate: new Date("2026-11-13T00:00:00.000Z"),
  currentTotalValue: 12000,
  totalContributed: 10000,
  grossProfit: 2000,
  profitPercentage: 20,
  type: "MONTHLY_RECORD",
  createdAt: new Date("2026-11-13T12:00:00.000Z"),
  ...overrides,
});

const createWriter = () => {
  const calls: SnapshotInput[] = [];
  const writer: ISnapshotWriter = {
    save: (data) => {
      calls.push(data);

      return makeSnapshot({
        ventureId: data.ventureId,
        type: data.type,
        referenceDate: data.referenceDate,
        currentTotalValue: data.currentTotalValue ?? 0,
      });
    },
  };

  return { writer, calls };
};

const payload = (overrides: Record<string, unknown> = {}) => ({
  ventureId: "venture-1",
  type: "MONTHLY_RECORD",
  value: 12000,
  referenceDate: "2026-11-13",
  ...overrides,
});

const post = (body: unknown) =>
  new Request("http://localhost/api/snapshots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const createSnapshot = async (body: unknown) => {
  const { writer, calls } = createWriter();
  const controller = new SnapshotsController(writer);
  const response = await controller.create(post(body));
  const result = (await response.json()) as ResponseBody;

  return {
    status: response.status,
    body: result,
    headers: response.headers,
    calls,
  };
};

const createWithError = async (error: ApiError) => {
  const controller = new SnapshotsController({
    save: () => {
      throw error;
    },
  });
  const response = await controller.create(post(payload()));
  const body = (await response.json()) as IErrorBody;

  return { status: response.status, body, headers: response.headers };
};

describe("SnapshotsController.create", () => {
  it("cria snapshot MONTHLY_RECORD com currentTotalValue a partir de value", async () => {
    const { status, body, calls } = await createSnapshot(payload());

    expect(status).toBe(201);
    expect(body.snapshot?.id).toBe("snapshot-1");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.currentTotalValue).toBe(12000);
    expect(calls[0]?.movementValue).toBeUndefined();
    expect(calls[0]?.type).toBe("MONTHLY_RECORD");
  });

  it("responde com content-type application/json sem charset", async () => {
    const success = await createSnapshot(payload());
    const failure = await createSnapshot(payload({ type: undefined }));

    expect(success.headers.get("content-type")).toBe("application/json");
    expect(failure.headers.get("content-type")).toBe("application/json");
  });

  it("envia CONTRIBUTION como movementValue sem currentTotalValue", async () => {
    const { status, calls } = await createSnapshot(
      payload({ type: "CONTRIBUTION", value: 5000 }),
    );

    expect(status).toBe(201);
    expect(calls[0]?.movementValue).toBe(5000);
    expect("currentTotalValue" in (calls[0] ?? {})).toBe(false);
  });

  it("envia WITHDRAWAL como movementValue sem currentTotalValue", async () => {
    const { status, calls } = await createSnapshot(
      payload({ type: "WITHDRAWAL", value: 2000 }),
    );

    expect(status).toBe(201);
    expect(calls[0]?.movementValue).toBe(2000);
    expect("currentTotalValue" in (calls[0] ?? {})).toBe(false);
  });

  it("repassa notes quando presente e undefined quando ausente", async () => {
    const withNotes = await createSnapshot(payload({ notes: "revisar série" }));
    const withoutNotes = await createSnapshot(payload());

    expect(withNotes.calls[0]?.notes).toBe("revisar série");
    expect(withoutNotes.calls[0]?.notes).toBeUndefined();
  });

  it("converte referenceDate para Date em UTC", async () => {
    const { calls } = await createSnapshot(payload());

    expect(calls[0]?.referenceDate).toBeInstanceOf(Date);
    expect(calls[0]?.referenceDate.toISOString()).toBe(
      "2026-11-13T00:00:00.000Z",
    );
  });

  it("retorna 400 quando o corpo não é JSON válido", async () => {
    const { status, body } = await createSnapshot("{nao-json");

    expect(status).toBe(400);
    expect(body.error).toBe(true);
    expect(body.statusCode).toBe(400);
    expect(body.details?.field).toBe("body");
  });

  it("retorna 400 quando type está ausente ou inválido", async () => {
    const missing = await createSnapshot(payload({ type: undefined }));
    const invalid = await createSnapshot(payload({ type: "GUARDAR" }));

    expect(missing.status).toBe(400);
    expect(missing.body.details?.field).toBe("type");
    expect(invalid.status).toBe(400);
    expect(invalid.body.details?.field).toBe("type");
  });

  it("retorna 400 quando value não é um inteiro positivo", async () => {
    const values = [undefined, 0, -5, 12.5, "1000"];

    for (const value of values) {
      const { status, body } = await createSnapshot(payload({ value }));

      expect(status).toBe(400);
      expect(body.details?.field).toBe("value");
    }
  });

  it("retorna 400 quando ventureId está ausente", async () => {
    const missing = await createSnapshot(payload({ ventureId: undefined }));
    const empty = await createSnapshot(payload({ ventureId: "  " }));

    expect(missing.status).toBe(400);
    expect(missing.body.details?.field).toBe("ventureId");
    expect(empty.status).toBe(400);
    expect(empty.body.details?.field).toBe("ventureId");
  });

  it("retorna 400 quando referenceDate está ausente ou inválida", async () => {
    const dates = [undefined, "", "2026-13-45", "13/11/2026"];

    for (const referenceDate of dates) {
      const { status, body } = await createSnapshot(payload({ referenceDate }));

      expect(status).toBe(400);
      expect(body.details?.field).toBe("referenceDate");
    }
  });

  it("retorna 400 quando notes excede 280 caracteres", async () => {
    const overflow = await createSnapshot(payload({ notes: "a".repeat(281) }));
    const limit = await createSnapshot(payload({ notes: "a".repeat(280) }));

    expect(overflow.status).toBe(400);
    expect(overflow.body.details?.field).toBe("notes");
    expect(limit.status).toBe(201);
  });

  it("propaga ApiError 404 do service", async () => {
    const { status, body } = await createWithError(
      new ApiError(404, "Venture não encontrada", { id: "venture-1" }),
    );

    expect(status).toBe(404);
    expect(body.error).toBe(true);
    expect(body.message).toBe("Venture não encontrada");
    expect(body.details).toEqual({ id: "venture-1" });
  });

  it("propaga ApiError 422 do service", async () => {
    const { status, body } = await createWithError(
      new ApiError(422, "movementValue deve ser positivo", {
        field: "movementValue",
        rule: "required",
      }),
    );

    expect(status).toBe(422);
    expect(body.statusCode).toBe(422);
    expect(body.message).toBe("movementValue deve ser positivo");
    expect(body.details).toEqual({
      field: "movementValue",
      rule: "required",
    });
  });
});
