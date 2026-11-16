import type {
  IPortfolioSummary,
  IVentureSnapshot,
  IVentureTracking,
} from "@/contracts";
import { centsToReais } from "@/src/api/services/mappers";
import type { Venture } from "@/src/api/services/ventures/ventures.types";

export const toExportVenture = (venture: Venture): Venture => {
  const common = {
    id: venture.id,
    name: venture.name,
    internalCode: venture.internalCode,
    initialValue: centsToReais(venture.initialValue),
    boughtAt: venture.boughtAt,
    expiresIn: venture.expiresIn,
    createdAt: venture.createdAt,
    updatedAt: venture.updatedAt,
  };

  if (venture.category === "FIXED") {
    return {
      ...common,
      category: "FIXED",
      type: venture.type,
      indexer: venture.indexer,
      rate: venture.rate,
      source: venture.source,
    };
  }

  return {
    ...common,
    category: "VARIABLE",
    type: venture.type,
    quantity: venture.quantity,
    unitPrice: centsToReais(venture.unitPrice),
    totalPrice: centsToReais(venture.totalPrice),
  };
};

export const toExportSnapshot = (
  snapshot: IVentureSnapshot,
): IVentureSnapshot => ({
  ...snapshot,
  ...(snapshot.currentUnitPrice !== undefined && {
    currentUnitPrice: centsToReais(snapshot.currentUnitPrice),
  }),
  ...(snapshot.movementValue !== undefined && {
    movementValue: centsToReais(snapshot.movementValue),
  }),
  currentTotalValue: centsToReais(snapshot.currentTotalValue),
  totalContributed: centsToReais(snapshot.totalContributed),
  grossProfit: centsToReais(snapshot.grossProfit),
});

export const toExportTracking = (
  tracking: IVentureTracking,
): IVentureTracking => ({
  venture: toExportVenture(tracking.venture as Venture),
  snapshots: tracking.snapshots.map(toExportSnapshot),
  latestValue: centsToReais(tracking.latestValue),
  totalProfitabilityPercentage: tracking.totalProfitabilityPercentage,
});

export const toExportSummary = (
  summary: IPortfolioSummary,
): IPortfolioSummary => ({
  ...summary,
  totalInvested: centsToReais(summary.totalInvested),
  currentTotalBalance: centsToReais(summary.currentTotalBalance),
  totalGrossProfit: centsToReais(summary.totalGrossProfit),
  fixedIncomeTotal: centsToReais(summary.fixedIncomeTotal),
  variableIncomeTotal: centsToReais(summary.variableIncomeTotal),
});
