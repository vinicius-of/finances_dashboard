import { SnapshotType } from "@/contracts";
import type {
  IParsedSnapshotDeletePayload,
  IParsedSnapshotPayload,
  IParsedSnapshotUpdatePayload,
} from "./snapshots.controller.types";
import { invalidField } from "./snapshots.errors";

const NOTES_MAX_LENGTH = 280;
const REFERENCE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isSnapshotType = (value: unknown): value is SnapshotType =>
  typeof value === "string" &&
  Object.values(SnapshotType).includes(value as SnapshotType);

export const readJson = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    throw invalidField("body", "json", "Payload inválido");
  }
};

const parseReferenceDate = (value: unknown): Date => {
  if (typeof value !== "string" || !REFERENCE_DATE_PATTERN.test(value)) {
    throw invalidField("referenceDate", "format", "referenceDate inválida");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw invalidField("referenceDate", "date", "referenceDate inválida");
  }

  return date;
};

const parseNotes = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string" || value.length > NOTES_MAX_LENGTH) {
    throw invalidField(
      "notes",
      "max_length",
      `notes deve ter no máximo ${NOTES_MAX_LENGTH} caracteres`,
    );
  }

  return value;
};

const parseRequiredId = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw invalidField(field, "required", `${field} é obrigatório`);
  }

  return value.trim();
};

export const parseSnapshotPayload = (raw: unknown): IParsedSnapshotPayload => {
  if (!isRecord(raw)) {
    throw invalidField("body", "object", "Payload inválido");
  }

  const { ventureId, type, value, referenceDate, notes } = raw;

  if (typeof ventureId !== "string" || ventureId.trim() === "") {
    throw invalidField("ventureId", "required", "ventureId é obrigatório");
  }

  if (!isSnapshotType(type)) {
    throw invalidField("type", "enum", "type inválido");
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw invalidField(
      "value",
      "integer_positive",
      "value deve ser um inteiro positivo",
    );
  }

  return {
    ventureId: ventureId.trim(),
    type,
    value,
    referenceDate: parseReferenceDate(referenceDate),
    notes: parseNotes(notes),
  };
};

export const parseSnapshotUpdatePayload = (
  raw: unknown,
): IParsedSnapshotUpdatePayload => {
  if (!isRecord(raw)) {
    throw invalidField("body", "object", "Payload inválido");
  }

  const { ventureId, snapshotId, value, referenceDate, notes } = raw;

  const parsedVentureId = parseRequiredId(ventureId, "ventureId");
  const parsedSnapshotId = parseRequiredId(snapshotId, "snapshotId");

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw invalidField(
      "value",
      "integer_positive",
      "value deve ser um inteiro positivo",
    );
  }

  return {
    ventureId: parsedVentureId,
    snapshotId: parsedSnapshotId,
    value,
    referenceDate: parseReferenceDate(referenceDate),
    notes: parseNotes(notes),
  };
};

export const parseSnapshotDeletePayload = (
  raw: unknown,
): IParsedSnapshotDeletePayload => {
  if (!isRecord(raw)) {
    throw invalidField("body", "object", "Payload inválido");
  }

  const { ventureId, snapshotId } = raw;

  return {
    ventureId: parseRequiredId(ventureId, "ventureId"),
    snapshotId: parseRequiredId(snapshotId, "snapshotId"),
  };
};
