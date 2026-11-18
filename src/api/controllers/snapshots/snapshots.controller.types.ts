import type { IVentureSnapshot, SnapshotType } from "@/contracts";
import type {
  SnapshotInput,
  UpdateSnapshotInput,
} from "@/src/api/services/snapshots/snapshots.types";

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

export interface IUpdateSnapshotPayload {
  ventureId: string;
  snapshotId: string;
  value: number;
  referenceDate: string;
  notes?: string;
}

export interface IParsedSnapshotUpdatePayload {
  ventureId: string;
  snapshotId: string;
  value: number;
  referenceDate: Date;
  notes?: string;
}

export interface IDeleteSnapshotPayload {
  ventureId: string;
  snapshotId: string;
}

export interface IParsedSnapshotDeletePayload {
  ventureId: string;
  snapshotId: string;
}

export interface ISnapshotWriter {
  save(data: SnapshotInput): IVentureSnapshot;
  update?(
    ventureId: string,
    id: string,
    data: UpdateSnapshotInput,
  ): IVentureSnapshot;
  softDelete?(ventureId: string, id: string): IVentureSnapshot;
}

export interface ISnapshotsController {
  create(req: Request): Promise<Response>;
  update(req: Request): Promise<Response>;
  remove(req: Request): Promise<Response>;
}
