export const VentureCategory = {
  FIXED: "FIXED",
  VARIABLE: "VARIABLE",
} as const;
export type VentureCategory =
  (typeof VentureCategory)[keyof typeof VentureCategory];

export const VentureType = {
  TREASURY: "TREASURY",
  CDB: "CDB",
  LCI: "LCI",
  LCA: "LCA",
  STOCK: "STOCK",
  FII: "FII",
} as const;
export type VentureType = (typeof VentureType)[keyof typeof VentureType];

export const IndexerType = {
  CDI: "CDI",
  IPCA: "IPCA",
  SELIC: "SELIC",
  PRE: "PRE",
  FIXED: "FIXED",
} as const;
export type IndexerType = (typeof IndexerType)[keyof typeof IndexerType];

export const SnapshotType = {
  MONTHLY_RECORD: "MONTHLY_RECORD",
  CONTRIBUTION: "CONTRIBUTION",
  WITHDRAWAL: "WITHDRAWAL",
} as const;
export type SnapshotType = (typeof SnapshotType)[keyof typeof SnapshotType];
