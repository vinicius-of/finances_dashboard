import type { IVentureTracking, VentureType } from "@/contracts";
import type { Venture } from "@/src/api/services/ventures/ventures.types";

export interface IPortfolioVenturesReader {
  getAll(): Venture[];
}

export interface IPortfolioSnapshotsReader {
  tracking(ventureId: string): IVentureTracking;
}

export interface IPortfolioTrackingReader {
  listTracking(input: PortfolioServiceInput): IVentureTracking[];
}

export interface PortfolioServiceInput {
  type?: VentureType;
}

export type PortfolioServiceOutput = IVentureTracking[];

export interface PortfolioServiceDependencies {
  venturesService: IPortfolioVenturesReader;
  snapshotsService: IPortfolioSnapshotsReader;
}
