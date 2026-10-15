import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/database";
import { ventures } from "@/src/configs/database";
import type { InsertVenture, SelectVenture } from "@/src/configs/database";
import type { Repository } from "@/src/repositories/repository";

export type PatchVenture = Partial<
  Omit<InsertVenture, "id" | "createdAt" | "updatedAt" | "deletedAt">
>;

export const venturesRepository = {
  get(id: string): SelectVenture | undefined {
    return db
      .select()
      .from(ventures)
      .where(and(eq(ventures.id, id), isNull(ventures.deletedAt)))
      .get();
  },

  getAll(): SelectVenture[] {
    return db.select().from(ventures).where(isNull(ventures.deletedAt)).all();
  },

  post(data: InsertVenture): SelectVenture {
    return db.insert(ventures).values(data).returning().get();
  },

  batchInsert(data: InsertVenture[]): SelectVenture[] {
    if (data.length === 0) {
      return [];
    }

    return db.insert(ventures).values(data).returning().all();
  },

  patch(id: string, data: PatchVenture): SelectVenture | undefined {
    return db
      .update(ventures)
      .set(data)
      .where(and(eq(ventures.id, id), isNull(ventures.deletedAt)))
      .returning()
      .get();
  },

  softDelete(id: string): SelectVenture | undefined {
    return db
      .update(ventures)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(eq(ventures.id, id), isNull(ventures.deletedAt)))
      .returning()
      .get();
  },

  restore(id: string): SelectVenture | undefined {
    return db
      .update(ventures)
      .set({ deletedAt: null })
      .where(and(eq(ventures.id, id), isNotNull(ventures.deletedAt)))
      .returning()
      .get();
  },
} satisfies Repository<SelectVenture, InsertVenture, PatchVenture>;
