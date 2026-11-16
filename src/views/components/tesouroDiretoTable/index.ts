import type { IVentureTracking } from "@/contracts";
import type {
  IViewConfig,
  ITesouroDiretoTableRow,
  ProfitabilityTrend,
} from "@/src/views/types";
import {
  EMPTY_VALUE,
  INDEXER_TYPE_LABELS,
  VENTURE_TYPE_LABELS,
  isFixedIncomeVenture,
} from "@/src/views/tesouroDireto/ventures";
import { formatDate } from "@/src/utils/formatDate";
import { formatMoneyToBRL } from "@/src/utils/formatMoneyToBRL";
import { formatPercentage } from "@/src/utils/formatPercentage";
import { toTesouroDiretoRecordRows } from "./records";

export const tesouroDiretoTable = {
  template: "components/tesouroDiretoTable/view",
  style: "/views/components/tesouroDiretoTable/styles.css",
  stylePath: "src/views/components/tesouroDiretoTable/styles.css",
} as const satisfies IViewConfig;

const toProfitabilityTrend = (value: number): ProfitabilityTrend => {
  if (value > 0) {
    return "up";
  }

  return value < 0 ? "down" : "neutral";
};

export const toTesouroDiretoTableRow = (
  tracking: IVentureTracking,
): ITesouroDiretoTableRow => {
  const { venture } = tracking;
  const hasSnapshot = tracking.snapshots.length > 0;

  return {
    id: venture.id,
    name: venture.name,
    internalCode: venture.internalCode,
    typeLabel: VENTURE_TYPE_LABELS[venture.type],
    indexerLabel: isFixedIncomeVenture(venture)
      ? INDEXER_TYPE_LABELS[venture.indexer]
      : EMPTY_VALUE,
    amountLabel: hasSnapshot
      ? formatMoneyToBRL(tracking.latestValue)
      : EMPTY_VALUE,
    profitabilityLabel: hasSnapshot
      ? formatPercentage(tracking.totalProfitabilityPercentage)
      : EMPTY_VALUE,
    profitabilityTrend: hasSnapshot
      ? toProfitabilityTrend(tracking.totalProfitabilityPercentage)
      : "neutral",
    expiresAtLabel: venture.expiresIn
      ? formatDate(venture.expiresIn)
      : EMPTY_VALUE,
    records: toTesouroDiretoRecordRows(
      tracking.snapshots,
      venture.initialValue,
    ),
  };
};
