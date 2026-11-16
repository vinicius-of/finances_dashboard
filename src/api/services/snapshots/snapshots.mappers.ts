import type { IVentureSnapshot } from "@/contracts";
import type { SelectVentureSnapshot } from "@/src/configs/database";
import { toDate } from "@/src/api/services/mappers";

export const toSnapshot = (row: SelectVentureSnapshot): IVentureSnapshot => ({
  id: row.id,
  ventureId: row.ventureId,
  referenceDate: toDate(row.referenceDate),
  currentUnitPrice: row.currentUnitPrice ?? undefined,
  currentQuantityHeld: row.currentQuantityHeld ?? undefined,
  currentTotalValue: row.currentTotalValue,
  totalContributed: row.totalContributed,
  grossProfit: row.grossProfit,
  profitPercentage: row.profitPercentage,
  type: row.type,
  movementValue: row.movementValue ?? undefined,
  notes: row.notes ?? undefined,
  createdAt: toDate(row.createdAt),
});
