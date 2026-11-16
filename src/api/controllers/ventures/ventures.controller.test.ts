import { describe, expect, it } from "bun:test";
import type { IFixedIncomeVenture } from "@/contracts";
import type { ICreateVentureInput } from "@/src/api/services/ventures/ventures.types";
import { ApiError } from "@/src/errors/ApiError";
import { VenturesController } from "./ventures.controller";
import type {
  ICreateVentureResponse,
  IVentureWriter,
} from "./ventures.controller.types";

interface IErrorBody {
  error: boolean;
  statusCode: number;
  message: string;
  details?: Record<string, unknown>;
}

type ResponseBody = Partial<ICreateVentureResponse> & Partial<IErrorBody>;

const makeVenture = (
  overrides: Partial<IFixedIncomeVenture> = {},
): IFixedIncomeVenture => ({
  id: "venture-1",
  name: "Tesouro Selic",
  internalCode: undefined,
  category: "FIXED",
  type: "TREASURY",
  initialValue: 10000,
  boughtAt: new Date("2026-01-01T00:00:00.000Z"),
  expiresIn: new Date("2030-01-01T00:00:00.000Z"),
  indexer: "SELIC",
  rate: 10,
  source: "Tesouro Direto",
  createdAt: new Date("2026-01-01T12:00:00.000Z"),
  updatedAt: new Date("2026-01-01T12:00:00.000Z"),
  ...overrides,
});

const createWriter = () => {
  const calls: ICreateVentureInput[] = [];
  const writer: IVentureWriter = {
    create: (data) => {
      calls.push(data);

      return makeVenture({
        name: data.name,
        internalCode: data.internalCode,
        type: data.type,
        initialValue: data.initialValue ?? 0,
        boughtAt: data.boughtAt,
        expiresIn: data.expiresIn,
        indexer: data.indexer ?? "SELIC",
        rate: data.rate ?? 0,
        source: data.source ?? "",
      });
    },
  };

  return { writer, calls };
};

const fixedPayload = (overrides: Record<string, unknown> = {}) => ({
  name: "Tesouro Selic",
  type: "TREASURY",
  boughtAt: "2026-01-01",
  expiresIn: "2030-01-01",
  initialValue: 10000,
  indexer: "SELIC",
  rate: 10,
  source: "Tesouro Direto",
  ...overrides,
});

const variablePayload = (overrides: Record<string, unknown> = {}) => ({
  name: "PETR4",
  internalCode: "PETR4",
  type: "STOCK",
  boughtAt: "2026-01-01",
  quantity: 10,
  unitPrice: 500,
  ...overrides,
});

const post = (body: unknown) =>
  new Request("http://localhost/api/ventures", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const createVenture = async (body: unknown) => {
  const { writer, calls } = createWriter();
  const controller = new VenturesController(writer);
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
  const controller = new VenturesController({
    create: () => {
      throw error;
    },
  });
  const response = await controller.create(post(fixedPayload()));
  const body = (await response.json()) as IErrorBody;

  return { status: response.status, body, headers: response.headers };
};

describe("VenturesController.create", () => {
  it("cria venture FIXED a partir do payload completo", async () => {
    const { status, body, calls, headers } =
      await createVenture(fixedPayload());

    expect(status).toBe(201);
    expect(body.venture?.id).toBe("venture-1");
    expect(headers.get("content-type")).toBe("application/json");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.name).toBe("Tesouro Selic");
    expect(calls[0]?.type).toBe("TREASURY");
    expect(calls[0]?.initialValue).toBe(10000);
    expect(calls[0]?.indexer).toBe("SELIC");
    expect(calls[0]?.rate).toBe(10);
    expect(calls[0]?.source).toBe("Tesouro Direto");
    expect(calls[0]?.boughtAt).toBeInstanceOf(Date);
    expect(calls[0]?.boughtAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(calls[0]?.expiresIn?.toISOString()).toBe("2030-01-01T00:00:00.000Z");
  });

  it("cria venture VARIABLE sem os campos de renda fixa", async () => {
    const { status, calls } = await createVenture(variablePayload());

    expect(status).toBe(201);
    expect(calls[0]?.type).toBe("STOCK");
    expect(calls[0]?.quantity).toBe(10);
    expect(calls[0]?.unitPrice).toBe(500);
    expect(calls[0]?.initialValue).toBeUndefined();
    expect(calls[0]?.indexer).toBeUndefined();
    expect(calls[0]?.rate).toBeUndefined();
    expect(calls[0]?.source).toBeUndefined();
    expect(calls[0]?.totalPrice).toBeUndefined();
  });

  it("ignora initialValue, totalPrice e campos de renda fixa enviados em VARIABLE", async () => {
    const { calls } = await createVenture(
      variablePayload({
        initialValue: 1,
        totalPrice: 2,
        indexer: "CDI",
        rate: 5,
        source: "Banco X",
      }),
    );

    expect(calls[0]?.initialValue).toBeUndefined();
    expect(calls[0]?.totalPrice).toBeUndefined();
    expect(calls[0]?.indexer).toBeUndefined();
    expect(calls[0]?.rate).toBeUndefined();
    expect(calls[0]?.source).toBeUndefined();
  });

  it("aceita quantity fracionária em renda variável", async () => {
    const { status, calls } = await createVenture(
      variablePayload({ quantity: 2.5 }),
    );

    expect(status).toBe(201);
    expect(calls[0]?.quantity).toBe(2.5);
  });

  it("trata expiresIn vazio como ausente", async () => {
    const { calls } = await createVenture(fixedPayload({ expiresIn: "" }));

    expect(calls[0]?.expiresIn).toBeUndefined();
  });

  it("repassa internalCode opcional", async () => {
    const withCode = await createVenture(
      fixedPayload({ internalCode: " TD " }),
    );
    const withoutCode = await createVenture(fixedPayload());

    expect(withCode.calls[0]?.internalCode).toBe(" TD ");
    expect(withoutCode.calls[0]?.internalCode).toBeUndefined();
  });

  it("deriva FIXED para CDB e envia os campos condicionais", async () => {
    const { status, calls } = await createVenture(
      fixedPayload({ type: "CDB", indexer: "CDI", source: "Banco X" }),
    );

    expect(status).toBe(201);
    expect(calls[0]?.type).toBe("CDB");
    expect(calls[0]?.indexer).toBe("CDI");
    expect(calls[0]?.source).toBe("Banco X");
  });

  it("retorna 400 quando o corpo não é JSON válido", async () => {
    const { status, body } = await createVenture("{nao-json");

    expect(status).toBe(400);
    expect(body.error).toBe(true);
    expect(body.details?.field).toBe("body");
  });

  it("retorna 400 quando o corpo não é objeto", async () => {
    const { status, body } = await createVenture('"texto"');

    expect(status).toBe(400);
    expect(body.details?.field).toBe("body");
  });

  it("retorna 400 quando name está ausente ou vazio", async () => {
    const missing = await createVenture(fixedPayload({ name: undefined }));
    const empty = await createVenture(fixedPayload({ name: "   " }));

    expect(missing.status).toBe(400);
    expect(missing.body.details?.field).toBe("name");
    expect(empty.status).toBe(400);
    expect(empty.body.details?.field).toBe("name");
  });

  it("retorna 400 quando type está ausente ou inválido", async () => {
    const missing = await createVenture(fixedPayload({ type: undefined }));
    const invalid = await createVenture(fixedPayload({ type: "GUARDAR" }));

    expect(missing.status).toBe(400);
    expect(missing.body.details?.field).toBe("type");
    expect(invalid.status).toBe(400);
    expect(invalid.body.details?.field).toBe("type");
  });

  it("retorna 400 quando boughtAt está ausente ou inválida", async () => {
    const dates = [undefined, "", "2026-13-45", "01/01/2026"];

    for (const boughtAt of dates) {
      const { status, body } = await createVenture(fixedPayload({ boughtAt }));

      expect(status).toBe(400);
      expect(body.details?.field).toBe("boughtAt");
    }
  });

  it("retorna 400 quando expiresIn é inválida", async () => {
    const { status, body } = await createVenture(
      fixedPayload({ expiresIn: "2030-13-45" }),
    );

    expect(status).toBe(400);
    expect(body.details?.field).toBe("expiresIn");
  });

  it("retorna 400 quando FIXED não envia campo obrigatório", async () => {
    for (const field of ["initialValue", "indexer", "rate", "source"]) {
      const { status, body } = await createVenture(
        fixedPayload({ [field]: undefined }),
      );

      expect(status).toBe(400);
      expect(body.details?.field).toBe(field);
    }
  });

  it("retorna 400 quando initialValue não é inteiro não negativo", async () => {
    const values = [-1, 10.5, "100"];

    for (const initialValue of values) {
      const { status, body } = await createVenture(
        fixedPayload({ initialValue }),
      );

      expect(status).toBe(400);
      expect(body.details?.field).toBe("initialValue");
    }
  });

  it("retorna 400 quando rate não é número finito não negativo", async () => {
    const values = [-1, "10", null];

    for (const rate of values) {
      const { status, body } = await createVenture(fixedPayload({ rate }));

      expect(status).toBe(400);
      expect(body.details?.field).toBe("rate");
    }
  });

  it("retorna 400 quando indexer é inválido", async () => {
    const { status, body } = await createVenture(
      fixedPayload({ indexer: "TESOURO" }),
    );

    expect(status).toBe(400);
    expect(body.details?.field).toBe("indexer");
  });

  it("retorna 400 quando VARIABLE não envia quantity ou unitPrice", async () => {
    const missingQuantity = await createVenture(
      variablePayload({ quantity: undefined }),
    );
    const missingUnitPrice = await createVenture(
      variablePayload({ unitPrice: undefined }),
    );

    expect(missingQuantity.status).toBe(400);
    expect(missingQuantity.body.details?.field).toBe("quantity");
    expect(missingUnitPrice.status).toBe(400);
    expect(missingUnitPrice.body.details?.field).toBe("unitPrice");
  });

  it("retorna 400 quando quantity não é número positivo", async () => {
    const values = [0, -1, "10"];

    for (const quantity of values) {
      const { status, body } = await createVenture(
        variablePayload({ quantity }),
      );

      expect(status).toBe(400);
      expect(body.details?.field).toBe("quantity");
    }
  });

  it("retorna 400 quando unitPrice não é inteiro positivo", async () => {
    const values = [0, -5, 10.5];

    for (const unitPrice of values) {
      const { status, body } = await createVenture(
        variablePayload({ unitPrice }),
      );

      expect(status).toBe(400);
      expect(body.details?.field).toBe("unitPrice");
    }
  });

  it("retorna 400 quando internalCode não é texto", async () => {
    const { status, body } = await createVenture(
      fixedPayload({ internalCode: 123 }),
    );

    expect(status).toBe(400);
    expect(body.details?.field).toBe("internalCode");
  });

  it("propaga ApiError 409 do service", async () => {
    const { status, body } = await createWithError(
      new ApiError(409, "internalCode já cadastrado", {
        field: "internalCode",
        rule: "unique",
      }),
    );

    expect(status).toBe(409);
    expect(body.message).toBe("internalCode já cadastrado");
    expect(body.details).toEqual({ field: "internalCode", rule: "unique" });
  });

  it("propaga ApiError 422 do service", async () => {
    const { status, body } = await createWithError(
      new ApiError(422, "boughtAt não pode estar no futuro", {
        field: "boughtAt",
        rule: "not_future",
      }),
    );

    expect(status).toBe(422);
    expect(body.statusCode).toBe(422);
    expect(body.details).toEqual({ field: "boughtAt", rule: "not_future" });
  });
});
