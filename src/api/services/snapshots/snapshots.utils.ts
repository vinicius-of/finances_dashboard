import { SnapshotType } from "@/contracts";
import type { SelectVentureSnapshot } from "@/src/configs/database";
import { ApiError } from "@/src/errors/ApiError";
import type { SnapshotInput } from "./snapshots.types";

export const validateReferenceDate = (date: Date): void => {
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "referenceDate inválida", {
      field: "referenceDate",
      rule: "date",
    });
  }
};

export const validateNonNegative = (
  field: string,
  value: number | undefined,
): void => {
  if (value !== undefined && value < 0) {
    throw new ApiError(422, `${field} não pode ser negativo`, {
      field,
      rule: "min",
    });
  }
};

export const resolveMovement = (data: SnapshotInput): number => {
  if (
    data.type !== SnapshotType.CONTRIBUTION &&
    data.type !== SnapshotType.WITHDRAWAL
  ) {
    return 0;
  }

  if (data.movementValue === undefined || data.movementValue <= 0) {
    throw new ApiError(422, "movementValue deve ser positivo", {
      field: "movementValue",
      rule: "required",
    });
  }

  return data.type === SnapshotType.CONTRIBUTION
    ? data.movementValue
    : -data.movementValue;
};

export const resolveCurrentTotalValue = (
  data: SnapshotInput,
  fallback: number,
): number => {
  if (data.currentTotalValue !== undefined) {
    return Math.round(data.currentTotalValue);
  }

  if (
    data.currentUnitPrice !== undefined &&
    data.currentQuantityHeld !== undefined
  ) {
    return Math.round(data.currentUnitPrice * data.currentQuantityHeld);
  }

  return fallback;
};

export const compareRows = (
  a: SelectVentureSnapshot,
  b: SelectVentureSnapshot,
): number => {
  const byReferenceDate = a.referenceDate.localeCompare(b.referenceDate);

  return byReferenceDate !== 0
    ? byReferenceDate
    : a.createdAt.localeCompare(b.createdAt);
};
