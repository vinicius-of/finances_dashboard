import { describe, expect, it, spyOn } from "bun:test";
import type { IVentureSnapshot } from "@/contracts";
import type {
  SnapshotInput,
  UpdateSnapshotInput,
} from "@/src/api/services/snapshots/snapshots.types";
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

const updatePayload = (overrides: Record<string, unknown> = {}) => ({
  ventureId: "venture-1",
  snapshotId: "snapshot-1",
  value: 15000,
  referenceDate: "2026-11-18",
  notes: "ajuste",
  ...overrides,
});

const deletePayload = (overrides: Record<string, unknown> = {}) => ({
  ventureId: "venture-1",
  snapshotId: "snapshot-1",
  ...overrides,
});

const jsonBody = (body: unknown) =>
  typeof body === "string" ? body : JSON.stringify(body);

const patchRequest = (body: unknown) =>
  new Request("http://localhost/api/snapshots", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: jsonBody(body),
  });

const deleteRequest = (body?: unknown) =>
  new Request("http://localhost/api/snapshots", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: jsonBody(body) }),
  });

const createCommands = () => {
  const updates: {
    ventureId: string;
    id: string;
    data: UpdateSnapshotInput;
  }[] = [];
  const deletions: { ventureId: string; id: string }[] = [];

  const commands = {
    save: (data: SnapshotInput) =>
      makeSnapshot({
        ventureId: data.ventureId,
        type: data.type,
        referenceDate: data.referenceDate,
        currentTotalValue: data.currentTotalValue ?? 0,
      }),
    update: (ventureId: string, id: string, data: UpdateSnapshotInput) => {
      updates.push({ ventureId, id, data });

      return makeSnapshot({
        id,
        ventureId,
        ...(data.currentTotalValue === undefined
          ? {}
          : { currentTotalValue: data.currentTotalValue }),
      });
    },
    softDelete: (ventureId: string, id: string) => {
      deletions.push({ ventureId, id });

      return makeSnapshot({ id, ventureId });
    },
  };

  return { commands, updates, deletions };
};

describe("SnapshotsController.update", () => {
  it("atualiza currentTotalValue a partir de value e devolve 200", async () => {
    const { commands, updates } = createCommands();
    const controller = new SnapshotsController(commands);
    const response = await controller.update(patchRequest(updatePayload()));
    const body = (await response.json()) as ResponseBody;

    expect(response.status).toBe(200);
    expect(body.snapshot?.id).toBe("snapshot-1");
    expect(updates).toHaveLength(1);
    expect(updates[0]?.ventureId).toBe("venture-1");
    expect(updates[0]?.id).toBe("snapshot-1");
    expect(updates[0]?.data.currentTotalValue).toBe(15000);
    expect(updates[0]?.data.referenceDate?.toISOString()).toBe(
      "2026-11-18T00:00:00.000Z",
    );
    expect(updates[0]?.data.notes).toBe("ajuste");
  });

  it("envia notes vazio para limpar a nota do registro", async () => {
    const { commands, updates } = createCommands();
    const controller = new SnapshotsController(commands);

    await controller.update(patchRequest(updatePayload({ notes: "" })));

    expect(updates[0]?.data.notes).toBe("");
  });

  it("ignora type e movementValue enviados no corpo", async () => {
    const { commands, updates } = createCommands();
    const controller = new SnapshotsController(commands);

    await controller.update(
      patchRequest(updatePayload({ type: "WITHDRAWAL", movementValue: 9999 })),
    );

    expect("type" in (updates[0]?.data ?? {})).toBe(false);
    expect("movementValue" in (updates[0]?.data ?? {})).toBe(false);
  });

  it("retorna 400 quando ventureId ou snapshotId estão ausentes", async () => {
    const { commands } = createCommands();
    const controller = new SnapshotsController(commands);

    for (const overrides of [
      { ventureId: undefined },
      { ventureId: "  " },
      { snapshotId: undefined },
      { snapshotId: "  " },
    ]) {
      const response = await controller.update(
        patchRequest(updatePayload(overrides)),
      );
      const body = (await response.json()) as IErrorBody;

      expect(response.status).toBe(400);
      expect(["ventureId", "snapshotId"]).toContain(
        String(body.details?.field),
      );
    }
  });

  it("retorna 400 quando value não é um inteiro positivo", async () => {
    const { commands } = createCommands();
    const controller = new SnapshotsController(commands);

    for (const value of [undefined, 0, -5, 12.5, "1000"]) {
      const response = await controller.update(
        patchRequest(updatePayload({ value })),
      );
      const body = (await response.json()) as IErrorBody;

      expect(response.status).toBe(400);
      expect(body.details?.field).toBe("value");
    }
  });

  it("retorna 400 quando referenceDate está ausente ou inválida", async () => {
    const { commands } = createCommands();
    const controller = new SnapshotsController(commands);

    for (const referenceDate of [undefined, "", "2026-13-45", "18/11/2026"]) {
      const response = await controller.update(
        patchRequest(updatePayload({ referenceDate })),
      );
      const body = (await response.json()) as IErrorBody;

      expect(response.status).toBe(400);
      expect(body.details?.field).toBe("referenceDate");
    }
  });

  it("retorna 400 quando notes excede 280 caracteres", async () => {
    const { commands } = createCommands();
    const controller = new SnapshotsController(commands);
    const overflow = await controller.update(
      patchRequest(updatePayload({ notes: "a".repeat(281) })),
    );
    const overflowBody = (await overflow.json()) as IErrorBody;
    const limit = await controller.update(
      patchRequest(updatePayload({ notes: "a".repeat(280) })),
    );

    expect(overflow.status).toBe(400);
    expect(overflowBody.details?.field).toBe("notes");
    expect(limit.status).toBe(200);
  });

  it("retorna 400 quando o corpo não é JSON válido", async () => {
    const { commands } = createCommands();
    const controller = new SnapshotsController(commands);
    const response = await controller.update(patchRequest("{nao-json"));
    const body = (await response.json()) as IErrorBody;

    expect(response.status).toBe(400);
    expect(body.details?.field).toBe("body");
  });

  it("propaga 404 do service e registra log de manutenção", async () => {
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    try {
      const { commands } = createCommands();
      const controller = new SnapshotsController({
        ...commands,
        update: () => {
          throw new ApiError(404, "Snapshot não encontrado", {
            id: "snapshot-1",
          });
        },
      });
      const response = await controller.update(patchRequest(updatePayload()));
      const body = (await response.json()) as IErrorBody;
      const logged = errorSpy.mock.calls.flat().join(" ");

      expect(response.status).toBe(404);
      expect(body.message).toBe("Snapshot não encontrado");
      expect(errorSpy).toHaveBeenCalled();
      expect(logged).toContain("snapshot-1");
      expect(logged).toContain("404");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("registra log e repropaga erro inesperado", async () => {
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    try {
      const { commands } = createCommands();
      const controller = new SnapshotsController({
        ...commands,
        update: () => {
          throw new Error("boom");
        },
      });

      await expect(
        controller.update(patchRequest(updatePayload())),
      ).rejects.toThrow("boom");
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe("SnapshotsController.remove", () => {
  it("faz soft delete com ventureId e snapshotId e devolve 200", async () => {
    const { commands, deletions } = createCommands();
    const controller = new SnapshotsController(commands);
    const response = await controller.remove(deleteRequest(deletePayload()));
    const body = (await response.json()) as ResponseBody;

    expect(response.status).toBe(200);
    expect(body.snapshot?.id).toBe("snapshot-1");
    expect(deletions).toEqual([{ ventureId: "venture-1", id: "snapshot-1" }]);
  });

  it("retorna 400 quando ventureId ou snapshotId estão ausentes", async () => {
    const { commands, deletions } = createCommands();
    const controller = new SnapshotsController(commands);

    for (const overrides of [
      { ventureId: undefined },
      { ventureId: "  " },
      { snapshotId: undefined },
      { snapshotId: "  " },
    ]) {
      const response = await controller.remove(
        deleteRequest(deletePayload(overrides)),
      );
      const body = (await response.json()) as IErrorBody;

      expect(response.status).toBe(400);
      expect(["ventureId", "snapshotId"]).toContain(
        String(body.details?.field),
      );
    }

    expect(deletions).toHaveLength(0);
  });

  it("retorna 400 quando o corpo não é JSON válido", async () => {
    const { commands } = createCommands();
    const controller = new SnapshotsController(commands);
    const response = await controller.remove(deleteRequest("{nao-json"));
    const body = (await response.json()) as IErrorBody;

    expect(response.status).toBe(400);
    expect(body.details?.field).toBe("body");
  });

  it("propaga 404 do service e registra log de manutenção", async () => {
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    try {
      const { commands } = createCommands();
      const controller = new SnapshotsController({
        ...commands,
        softDelete: () => {
          throw new ApiError(404, "Snapshot não encontrado", {
            id: "snapshot-1",
          });
        },
      });
      const response = await controller.remove(deleteRequest(deletePayload()));
      const body = (await response.json()) as IErrorBody;
      const logged = errorSpy.mock.calls.flat().join(" ");

      expect(response.status).toBe(404);
      expect(body.message).toBe("Snapshot não encontrado");
      expect(logged).toContain("snapshot-1");
      expect(logged).toContain("404");
    } finally {
      errorSpy.mockRestore();
    }
  });
});
