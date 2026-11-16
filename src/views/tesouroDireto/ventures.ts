import type {
  IFixedIncomeVenture,
  IndexerType,
  IVentureTracking,
  VentureType,
} from "@/contracts";

export const EMPTY_VALUE = "—";

export const VENTURE_TYPE_LABELS: Record<VentureType, string> = {
  TREASURY: "Tesouro Direto",
  CDB: "CDB",
  LCI: "LCI",
  LCA: "LCA",
  CRA: "CRA",
  STOCK: "Ações",
  FII: "FII",
};

export const INDEXER_TYPE_LABELS: Record<IndexerType, string> = {
  CDI: "CDI",
  IPCA: "IPCA",
  SELIC: "Selic",
  PRE: "Prefixado",
  FIXED: "Fixo",
};

export const isFixedIncomeVenture = (
  venture: IVentureTracking["venture"],
): venture is IFixedIncomeVenture => venture.category === "FIXED";
