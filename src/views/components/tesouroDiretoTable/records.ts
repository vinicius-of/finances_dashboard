import type { IVentureSnapshot } from "@/contracts";
import type {
  ITesouroDiretoRecordRow,
  ProfitabilityTrend,
} from "@/src/views/types";
import { formatDate } from "@/src/utils/formatDate";
import { formatMoneyToBRL } from "@/src/utils/formatMoneyToBRL";

const compareSnapshotsAsc = (
  a: IVentureSnapshot,
  b: IVentureSnapshot,
): number => {
  const byReferenceDate = a.referenceDate.getTime() - b.referenceDate.getTime();

  return byReferenceDate !== 0
    ? byReferenceDate
    : a.createdAt.getTime() - b.createdAt.getTime();
};

const toDifferenceLabel = (difference: number): string => {
  if (difference > 0) {
    return `+ ${formatMoneyToBRL(difference)}`;
  }

  if (difference < 0) {
    return `- ${formatMoneyToBRL(Math.abs(difference))}`;
  }

  return formatMoneyToBRL(0);
};

const toDifferenceTrend = (difference: number): ProfitabilityTrend => {
  if (difference > 0) {
    return "up";
  }

  return difference < 0 ? "down" : "neutral";
};

export const toTesouroDiretoRecordRows = (
  snapshots: IVentureSnapshot[],
  initialValue: number,
): ITesouroDiretoRecordRow[] => {
  let previousValue = initialValue;

  const chronological = [...snapshots]
    .sort(compareSnapshotsAsc)
    .map((snapshot) => {
      const difference = snapshot.currentTotalValue - previousValue;

      const row: ITesouroDiretoRecordRow = {
        id: snapshot.id,
        ventureId: snapshot.ventureId,
        type: snapshot.type,
        value: snapshot.currentTotalValue,
        referenceDate: snapshot.referenceDate.toISOString().slice(0, 10),
        dateLabel: formatDate(snapshot.referenceDate),
        differenceLabel: toDifferenceLabel(difference),
        differenceTrend: toDifferenceTrend(difference),
        previousValueLabel: formatMoneyToBRL(previousValue),
        currentValueLabel: formatMoneyToBRL(snapshot.currentTotalValue),
        notes: snapshot.notes,
      };

      previousValue = snapshot.currentTotalValue;

      return row;
    });

  return chronological.reverse();
};
