import type { IVentureSnapshot, IVentureTracking } from "@/contracts";
import type { SelectVentureSnapshot } from "@/src/configs/database";
import type { IService } from "@/src/api/services/services.types";
import { toDate, toDateOnly } from "@/src/api/services/mappers";
import { toVenture } from "@/src/api/services/ventures/ventures.mappers";
import type { IVenturesReader } from "@/src/api/services/ventures/ventures.types";
import { ApiError } from "@/src/errors/ApiError";
import type {
  IVentureSnapshotsRepository,
  SnapshotInput,
  SnapshotPatch,
  SnapshotsServiceDependencies,
  SnapshotsServiceInput,
  SnapshotsServiceOutput,
  UpdateSnapshotInput,
} from "./snapshots.types";
import {
  compareRows,
  resolveCurrentTotalValue,
  resolveMovement,
  validateNonNegative,
  validateReferenceDate,
} from "./snapshots.utils";
import { snapshotNotFound, ventureNotFound } from "./snapshots.errors";
import { toSnapshot } from "./snapshots.mappers";

export class SnapshotsService implements IService<
  SnapshotsServiceInput,
  SnapshotsServiceOutput
> {
  private readonly venturesReader: IVenturesReader;
  private readonly repository: IVentureSnapshotsRepository;

  constructor({
    venturesReader,
    snapshotsRepository,
  }: SnapshotsServiceDependencies) {
    this.venturesReader = venturesReader;
    this.repository = snapshotsRepository;
  }

  execute(input: SnapshotsServiceInput): SnapshotsServiceOutput {
    switch (input.action) {
      case "save":
        return this.save(input.data);
      case "update":
        return this.update(input.id, input.data);
      case "softDelete":
        return this.softDelete(input.id);
      case "get":
        return this.get(input.id);
      case "getAll":
        return this.getAll();
      case "tracking":
        return this.tracking(input.ventureId);
    }
  }

  save(data: SnapshotInput): IVentureSnapshot {
    const venture = this.venturesReader.get(data.ventureId);

    if (!venture) {
      throw ventureNotFound(data.ventureId);
    }

    validateReferenceDate(data.referenceDate);
    validateNonNegative("currentTotalValue", data.currentTotalValue);
    validateNonNegative("currentUnitPrice", data.currentUnitPrice);
    validateNonNegative("currentQuantityHeld", data.currentQuantityHeld);

    const previous = this.latestRow(data.ventureId);
    const movement = resolveMovement(data);
    const baseContributed = previous?.totalContributed ?? venture.initialValue;
    const totalContributed = baseContributed + movement;

    if (totalContributed < 0) {
      throw new ApiError(422, "Resgate excede o total aportado", {
        field: "movementValue",
        rule: "max_contributed",
      });
    }

    const fallbackValue =
      (previous?.currentTotalValue ?? venture.initialValue) + movement;
    const currentTotalValue = resolveCurrentTotalValue(data, fallbackValue);
    const grossProfit = currentTotalValue - totalContributed;
    const profitPercentage =
      totalContributed > 0 ? (grossProfit / totalContributed) * 100 : 0;

    const row = this.repository.post({
      ventureId: data.ventureId,
      referenceDate: toDateOnly(data.referenceDate),
      currentUnitPrice: data.currentUnitPrice ?? null,
      currentQuantityHeld: data.currentQuantityHeld ?? null,
      currentTotalValue,
      totalContributed,
      grossProfit,
      profitPercentage,
      type: data.type,
      movementValue: data.movementValue ?? null,
      notes: data.notes ?? null,
    });

    return toSnapshot(row);
  }

  update(id: string, data: UpdateSnapshotInput): IVentureSnapshot {
    const existing = this.repository.get(id);

    if (!existing) {
      throw snapshotNotFound(id);
    }

    const raw = data as unknown as Record<string, unknown>;

    if ("type" in raw || "movementValue" in raw) {
      throw new ApiError(400, "type e movementValue não podem ser alterados", {
        fields: ["type", "movementValue"],
      });
    }

    const referenceDate = data.referenceDate ?? toDate(existing.referenceDate);

    validateReferenceDate(referenceDate);
    validateNonNegative("currentUnitPrice", data.currentUnitPrice);
    validateNonNegative("currentQuantityHeld", data.currentQuantityHeld);
    validateNonNegative("currentTotalValue", data.currentTotalValue);

    const currentUnitPrice =
      data.currentUnitPrice ?? existing.currentUnitPrice ?? null;
    const currentQuantityHeld =
      data.currentQuantityHeld ?? existing.currentQuantityHeld ?? null;
    const derived =
      data.currentUnitPrice !== undefined &&
      data.currentQuantityHeld !== undefined
        ? Math.round(data.currentUnitPrice * data.currentQuantityHeld)
        : undefined;
    const currentTotalValue =
      data.currentTotalValue ?? derived ?? existing.currentTotalValue;
    const grossProfit = currentTotalValue - existing.totalContributed;
    const profitPercentage =
      existing.totalContributed > 0
        ? (grossProfit / existing.totalContributed) * 100
        : 0;

    const patch: SnapshotPatch = {
      referenceDate: toDateOnly(referenceDate),
      currentUnitPrice,
      currentQuantityHeld,
      currentTotalValue,
      grossProfit,
      profitPercentage,
    };

    if (data.notes !== undefined) {
      patch.notes = data.notes;
    }

    const row = this.repository.patch(id, patch);

    if (!row) {
      throw snapshotNotFound(id);
    }

    return toSnapshot(row);
  }

  get(id: string): IVentureSnapshot {
    const row = this.repository.get(id);

    if (!row) {
      throw snapshotNotFound(id);
    }

    return toSnapshot(row);
  }

  getAll(): IVentureSnapshot[] {
    return this.repository.getAll().map(toSnapshot);
  }

  softDelete(id: string): IVentureSnapshot {
    const row = this.repository.softDelete(id);

    if (!row) {
      throw snapshotNotFound(id);
    }

    return toSnapshot(row);
  }

  tracking(ventureId: string): IVentureTracking {
    const venture = this.venturesReader.get(ventureId);

    if (!venture) {
      throw ventureNotFound(ventureId);
    }

    const rows = this.repository
      .getAll()
      .filter((row) => row.ventureId === ventureId)
      .sort(compareRows);
    const latest = rows.at(-1);

    return {
      venture: toVenture(venture),
      snapshots: rows.map(toSnapshot),
      latestValue: latest?.currentTotalValue ?? 0,
      totalProfitabilityPercentage: latest?.profitPercentage ?? 0,
    };
  }

  private latestRow(ventureId: string): SelectVentureSnapshot | undefined {
    return this.repository
      .getAll()
      .filter((row) => row.ventureId === ventureId)
      .sort(compareRows)
      .at(-1);
  }
}
