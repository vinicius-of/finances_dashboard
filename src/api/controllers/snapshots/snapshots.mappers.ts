import { SnapshotType } from "@/contracts";
import type { SnapshotInput } from "@/src/api/services/snapshots/snapshots.types";
import type { IParsedSnapshotPayload } from "./snapshots.controller.types";

export const toSnapshotInput = (
  payload: IParsedSnapshotPayload,
): SnapshotInput => {
  const input = {
    ventureId: payload.ventureId,
    type: payload.type,
    referenceDate: payload.referenceDate,
    notes: payload.notes,
  };

  return payload.type === SnapshotType.MONTHLY_RECORD
    ? { ...input, currentTotalValue: payload.value }
    : { ...input, movementValue: payload.value };
};
