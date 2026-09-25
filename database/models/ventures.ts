import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { IndexerType, VentureCategory, VentureType } from "@/contracts";

/**
 * Tabela única `ventures` — espelha a herança de contratos
 * `IVenture`, `IFixedIncomeVenture` e `IVariableIncomeVenture`
 * (Opção A do plano: colunas de especialização nullable).
 *
 * Valores monetários em INTEGER (centavos) e datas em TEXT ISO8601
 * (`YYYY-MM-DD` para datas de calendário; timestamp completo para auditoria).
 */

const ventureCategories = [
  VentureCategory.FIXED,
  VentureCategory.VARIABLE,
] as const satisfies readonly VentureCategory[];

const ventureTypes = [
  VentureType.TREASURY,
  VentureType.CDB,
  VentureType.LCI,
  VentureType.LCA,
  VentureType.STOCK,
  VentureType.FII,
] as const satisfies readonly VentureType[];

const indexerTypes = [
  IndexerType.CDI,
  IndexerType.IPCA,
  IndexerType.SELIC,
  IndexerType.PRE,
  IndexerType.FIXED,
] as const satisfies readonly IndexerType[];

export const ventures = sqliteTable(
  "ventures",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    internalCode: text("internal_code"),
    category: text("category", { enum: ventureCategories }).notNull(),
    type: text("type", {
      enum: ventureTypes,
    }).notNull(),
    initialValue: integer("initial_value").notNull(),
    boughtAt: text("bought_at").notNull(),
    expiresIn: text("expires_in"),
    indexer: text("indexer", {
      enum: indexerTypes,
    }),
    rate: real("rate"),
    source: text("source"),
    quantity: real("quantity"),
    unitPrice: integer("unit_price"),
    totalPrice: integer("total_price"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("ventures_internal_code_active_unique")
      .on(table.internalCode)
      .where(sql`${table.deletedAt!} IS NULL`),
  ],
);
