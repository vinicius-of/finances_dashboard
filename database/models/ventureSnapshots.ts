import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { SnapshotType } from "@/contracts";
import { ventures } from "./ventures";

const snapshotTypes = [
  SnapshotType.MONTHLY_RECORD,
  SnapshotType.CONTRIBUTION,
  SnapshotType.WITHDRAWAL,
] as const satisfies readonly SnapshotType[];

export const ventureSnapshots = sqliteTable(
  "venture_snapshots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ventureId: text("venture_id")
      .notNull()
      .references(() => ventures.id, { onDelete: "restrict" }),
    referenceDate: text("reference_date").notNull(),
    currentUnitPrice: integer("current_unit_price"),
    currentQuantityHeld: real("current_quantity_held"),
    currentTotalValue: integer("current_total_value").notNull(),
    totalContributed: integer("total_contributed").notNull(),
    grossProfit: integer("gross_profit").notNull(),
    profitPercentage: real("profit_percentage").notNull(),
    type: text("type", { enum: snapshotTypes }).notNull(),
    movementValue: integer("movement_value"),
    notes: text("notes"),
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
    index("venture_snapshots_venture_id_reference_date_idx").on(
      table.ventureId,
      table.referenceDate,
    ),
  ],
);
