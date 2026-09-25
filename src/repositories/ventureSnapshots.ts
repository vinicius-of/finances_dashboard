import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/database";
import { ventureSnapshots } from "@/src/configs/database";
import type {
  InsertVentureSnapshot,
  SelectVentureSnapshot,
} from "@/src/configs/database";

export type PatchVentureSnapshot = Partial<
  Omit<InsertVentureSnapshot, "id" | "createdAt" | "updatedAt" | "deletedAt">
>;

export const ventureSnapshotsRepository = {
  get(id: string): SelectVentureSnapshot | undefined {
    return db
      .select()
      .from(ventureSnapshots)
      .where(
        and(eq(ventureSnapshots.id, id), isNull(ventureSnapshots.deletedAt)),
      )
      .get();
  },

  getAll(): SelectVentureSnapshot[] {
    return db
      .select()
      .from(ventureSnapshots)
      .where(isNull(ventureSnapshots.deletedAt))
      .all();
  },

  post(data: InsertVentureSnapshot): SelectVentureSnapshot {
    return db.insert(ventureSnapshots).values(data).returning().get();
  },

  batchInsert(data: InsertVentureSnapshot[]): SelectVentureSnapshot[] {
    if (data.length === 0) {
      return [];
    }

    return db.insert(ventureSnapshots).values(data).returning().all();
  },

  patch(
    id: string,
    data: PatchVentureSnapshot,
  ): SelectVentureSnapshot | undefined {
    return db
      .update(ventureSnapshots)
      .set(data)
      .where(
        and(eq(ventureSnapshots.id, id), isNull(ventureSnapshots.deletedAt)),
      )
      .returning()
      .get();
  },

  softDelete(id: string): SelectVentureSnapshot | undefined {
    return db
      .update(ventureSnapshots)
      .set({ deletedAt: new Date().toISOString() })
      .where(
        and(eq(ventureSnapshots.id, id), isNull(ventureSnapshots.deletedAt)),
      )
      .returning()
      .get();
  },

  restore(id: string): SelectVentureSnapshot | undefined {
    return db
      .update(ventureSnapshots)
      .set({ deletedAt: null })
      .where(
        and(eq(ventureSnapshots.id, id), isNotNull(ventureSnapshots.deletedAt)),
      )
      .returning()
      .get();
  },
};
