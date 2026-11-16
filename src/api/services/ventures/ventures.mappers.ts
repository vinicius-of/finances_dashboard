import { VentureCategory } from "@/contracts";
import type { IndexerType } from "@/contracts";
import type { InsertVenture, SelectVenture } from "@/src/configs/database";
import { toDate, toDateOnly } from "@/src/api/services/mappers";
import type { Venture, VentureInput } from "./ventures.types";

export const toVentureInput = (row: SelectVenture): VentureInput => ({
  name: row.name,
  internalCode: row.internalCode ?? undefined,
  category: row.category,
  type: row.type,
  initialValue: row.initialValue,
  boughtAt: toDate(row.boughtAt),
  expiresIn: row.expiresIn ? toDate(row.expiresIn) : undefined,
  indexer: row.indexer ?? undefined,
  rate: row.rate ?? undefined,
  source: row.source ?? undefined,
  quantity: row.quantity ?? undefined,
  unitPrice: row.unitPrice ?? undefined,
  totalPrice: row.totalPrice ?? undefined,
});

export const toInsert = (input: VentureInput): InsertVenture => {
  const isFixed = input.category === VentureCategory.FIXED;

  return {
    name: input.name,
    internalCode: input.internalCode ?? null,
    category: input.category,
    type: input.type,
    initialValue: input.initialValue,
    boughtAt: toDateOnly(input.boughtAt),
    expiresIn: input.expiresIn ? toDateOnly(input.expiresIn) : null,
    indexer: isFixed ? (input.indexer ?? null) : null,
    rate: isFixed ? (input.rate ?? null) : null,
    source: isFixed ? (input.source ?? null) : null,
    quantity: isFixed ? null : (input.quantity ?? null),
    unitPrice: isFixed ? null : (input.unitPrice ?? null),
    totalPrice: isFixed ? null : (input.totalPrice ?? null),
  };
};

export const toVenture = (row: SelectVenture): Venture => {
  const common = {
    id: row.id,
    name: row.name,
    internalCode: row.internalCode ?? undefined,
    initialValue: row.initialValue,
    boughtAt: toDate(row.boughtAt),
    expiresIn: row.expiresIn ? toDate(row.expiresIn) : undefined,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };

  if (row.category === VentureCategory.FIXED) {
    return {
      ...common,
      category: "FIXED",
      type: row.type,
      indexer: row.indexer as IndexerType,
      rate: row.rate as number,
      source: row.source as string,
    };
  }

  return {
    ...common,
    category: "VARIABLE",
    type: row.type,
    quantity: row.quantity as number,
    unitPrice: row.unitPrice as number,
    totalPrice: row.totalPrice as number,
  };
};
