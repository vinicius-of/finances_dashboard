import type { IVentureSnapshot, SnapshotType } from "@/contracts";
import type { SnapshotInput } from "@/src/api/services/snapshots/snapshots.types";

export interface IRegisterSnapshotPayload {
  ventureId: string;
  type: SnapshotType;
  value: number;
  referenceDate: string;
  notes?: string;
}

export interface IParsedSnapshotPayload {
  ventureId: string;
  type: SnapshotType;
  value: number;
  referenceDate: Date;
  notes?: string;
}

export interface IRegisterSnapshotResponse {
  snapshot: IVentureSnapshot;
}

export interface ISnapshotWriter {
  save(data: SnapshotInput): IVentureSnapshot;
}

export interface ISnapshotsController {
  create(req: Request): Promise<Response>;
}
