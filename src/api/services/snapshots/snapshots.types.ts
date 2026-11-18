import type {
  IVentureSnapshot,
  IVentureTracking,
  SnapshotType,
} from "@/contracts";
import type {
  InsertVentureSnapshot,
  SelectVentureSnapshot,
} from "@/src/configs/database";
import type { IVenturesReader } from "@/src/api/services/ventures/ventures.types";

export interface SnapshotInput {
  ventureId: string;
  referenceDate: Date;
  type: SnapshotType;
  currentUnitPrice?: number;
  currentQuantityHeld?: number;
  currentTotalValue?: number;
  movementValue?: number;
  notes?: string;
}

export type UpdateSnapshotInput = Partial<
  Pick<
    SnapshotInput,
    | "referenceDate"
    | "currentUnitPrice"
    | "currentQuantityHeld"
    | "currentTotalValue"
    | "notes"
  >
>;

export type SnapshotPatch = Partial<
  Omit<InsertVentureSnapshot, "id" | "createdAt" | "updatedAt" | "deletedAt">
>;

export interface IVentureSnapshotsRepository {
  get(id: string): SelectVentureSnapshot | undefined;
  getAll(): SelectVentureSnapshot[];
  post(data: InsertVentureSnapshot): SelectVentureSnapshot;
  patch(id: string, data: SnapshotPatch): SelectVentureSnapshot | undefined;
  softDelete(id: string): SelectVentureSnapshot | undefined;
}

export type SnapshotsServiceInput =
  | { action: "save"; data: SnapshotInput }
  | {
      action: "update";
      ventureId: string;
      id: string;
      data: UpdateSnapshotInput;
    }
  | { action: "softDelete"; ventureId: string; id: string }
  | { action: "get"; id: string }
  | { action: "getAll" }
  | { action: "tracking"; ventureId: string };

export type SnapshotsServiceOutput =
  void | IVentureSnapshot | IVentureSnapshot[] | IVentureTracking;

export interface ISnapshotCommands {
  save(data: SnapshotInput): IVentureSnapshot;
  update(
    ventureId: string,
    id: string,
    data: UpdateSnapshotInput,
  ): IVentureSnapshot;
  softDelete(ventureId: string, id: string): IVentureSnapshot;
}

export interface SnapshotsServiceDependencies {
  venturesReader: IVenturesReader;
  snapshotsRepository: IVentureSnapshotsRepository;
}
