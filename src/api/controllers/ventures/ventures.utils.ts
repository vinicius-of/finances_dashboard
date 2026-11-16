import { IndexerType, VentureType } from "@/contracts";
import type { IParsedVenturePayload } from "./ventures.controller.types";
import { invalidField } from "./ventures.errors";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isVentureType = (value: unknown): value is VentureType =>
  typeof value === "string" &&
  Object.values(VentureType).includes(value as VentureType);

const isIndexerType = (value: unknown): value is IndexerType =>
  typeof value === "string" &&
  Object.values(IndexerType).includes(value as IndexerType);

export const isVariableType = (type: VentureType): boolean =>
  type === VentureType.STOCK || type === VentureType.FII;

export const readJson = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    throw invalidField("body", "json", "Payload inválido");
  }
};

const parseDate = (value: unknown, field: string): Date => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    throw invalidField(field, "format", `${field} inválida`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw invalidField(field, "date", `${field} inválida`);
  }

  return date;
};

const parseOptionalDate = (
  value: unknown,
  field: string,
): Date | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return parseDate(value, field);
};

const parseRequiredText = (
  value: unknown,
  field: string,
  message: string,
): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw invalidField(field, "required", message);
  }

  return value;
};

const parseOptionalText = (
  value: unknown,
  field: string,
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw invalidField(field, "string", `${field} inválido`);
  }

  return value;
};

const parseVentureType = (value: unknown): VentureType => {
  if (!isVentureType(value)) {
    throw invalidField("type", "enum", "type inválido");
  }

  return value;
};

const parseIndexer = (value: unknown): IndexerType => {
  if (!isIndexerType(value)) {
    throw invalidField("indexer", "enum", "indexer inválido");
  }

  return value;
};

const parseInteger = (
  value: unknown,
  field: string,
  message: string,
  allowZero: boolean,
): number => {
  const minimum = allowZero ? 0 : 1;

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum
  ) {
    throw invalidField(field, "min", message);
  }

  return value;
};

const parseRate = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw invalidField("rate", "min", "rate deve ser um número não negativo");
  }

  return value;
};

const parseQuantity = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw invalidField(
      "quantity",
      "min",
      "quantity deve ser um número positivo",
    );
  }

  return value;
};

export const parseVenturePayload = (raw: unknown): IParsedVenturePayload => {
  if (!isRecord(raw)) {
    throw invalidField("body", "object", "Payload inválido");
  }

  const {
    name,
    internalCode,
    type,
    boughtAt,
    expiresIn,
    initialValue,
    indexer,
    rate,
    source,
    quantity,
    unitPrice,
  } = raw;

  const ventureType = parseVentureType(type);
  const base = {
    name: parseRequiredText(name, "name", "name é obrigatório"),
    internalCode: parseOptionalText(internalCode, "internalCode"),
    type: ventureType,
    boughtAt: parseDate(boughtAt, "boughtAt"),
    expiresIn: parseOptionalDate(expiresIn, "expiresIn"),
  };

  if (isVariableType(ventureType)) {
    return {
      ...base,
      quantity: parseQuantity(quantity),
      unitPrice: parseInteger(
        unitPrice,
        "unitPrice",
        "unitPrice deve ser um inteiro positivo",
        false,
      ),
    };
  }

  return {
    ...base,
    initialValue: parseInteger(
      initialValue,
      "initialValue",
      "initialValue deve ser um inteiro não negativo",
      true,
    ),
    indexer: parseIndexer(indexer),
    rate: parseRate(rate),
    source: parseRequiredText(
      source,
      "source",
      "source é obrigatório para renda fixa",
    ),
  };
};
