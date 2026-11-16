import type { IndexerType, VentureType } from "@/contracts";
import type {
  ICreateVentureInput,
  Venture,
} from "@/src/api/services/ventures/ventures.types";

export interface ICreateVenturePayload {
  name: string;
  internalCode?: string;
  type: VentureType;
  boughtAt: string;
  expiresIn?: string;
  initialValue?: number;
  indexer?: IndexerType;
  rate?: number;
  source?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface IParsedVenturePayload {
  name: string;
  internalCode?: string;
  type: VentureType;
  boughtAt: Date;
  expiresIn?: Date;
  initialValue?: number;
  indexer?: IndexerType;
  rate?: number;
  source?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface ICreateVentureResponse {
  venture: Venture;
}

export interface IVentureWriter {
  create(data: ICreateVentureInput): Venture;
}

export interface IVenturesController {
  create(req: Request): Promise<Response>;
}
