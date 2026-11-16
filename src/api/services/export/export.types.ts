import type {
  IPortfolioSummary,
  IVentureSnapshot,
  IVentureTracking,
} from "@/contracts";
import type { Venture } from "@/src/api/services/ventures/ventures.types";

export interface IExportVenturesReader {
  getAll(): Venture[];
}

export interface IExportSnapshotsReader {
  getAll(): IVentureSnapshot[];
  tracking(ventureId: string): IVentureTracking;
}

export interface ExportServiceDependencies {
  venturesService: IExportVenturesReader;
  snapshotsService: IExportSnapshotsReader;
}

export type ExportServiceInput = { action: "download" };
export type ExportServiceOutput = Response;

export interface ExportPayload {
  exportedAt: string;
  ventures: Venture[];
  snapshots: IVentureSnapshot[];
  tracking: IVentureTracking[];
  summary: IPortfolioSummary;
}
