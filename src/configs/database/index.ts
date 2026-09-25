import { ventureSnapshots, ventures } from "@/database/models";
import { db as Database } from "@/database";

export { ventureSnapshots, ventures };

export type SelectVenture = typeof ventures.$inferSelect;
export type InsertVenture = typeof ventures.$inferInsert;

export type SelectVentureSnapshot = typeof ventureSnapshots.$inferSelect;
export type InsertVentureSnapshot = typeof ventureSnapshots.$inferInsert;

export const db = Database;
