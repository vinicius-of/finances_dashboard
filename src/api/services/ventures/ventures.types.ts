import type {
  IFixedIncomeVenture,
  IndexerType,
  IVariableIncomeVenture,
  VentureCategory,
  VentureType,
} from "@/contracts";
import type { InsertVenture, SelectVenture } from "@/src/configs/database";

export type Venture = IFixedIncomeVenture | IVariableIncomeVenture;

export interface VentureInput {
  name: string;
  internalCode?: string;
  category: VentureCategory;
  type: VentureType;
  initialValue: number;
  boughtAt: Date;
  expiresIn?: Date;
  indexer?: IndexerType;
  rate?: number;
  source?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ICreateVentureInput extends Omit<
  VentureInput,
  "category" | "initialValue" | "totalPrice"
> {
  category?: VentureCategory;
  initialValue?: number;
  totalPrice?: number;
}

export type UpdateVentureInput = Partial<VentureInput>;

export type VenturePatch = Partial<
  Omit<InsertVenture, "id" | "createdAt" | "updatedAt" | "deletedAt">
>;

export interface IVenturesReader {
  get(id: string): SelectVenture | undefined;
  getAll(): SelectVenture[];
}

export interface IVenturesRepository extends IVenturesReader {
  post(data: InsertVenture): SelectVenture;
  patch(id: string, data: VenturePatch): SelectVenture | undefined;
  softDelete(id: string): SelectVenture | undefined;
}

export type VenturesServiceInput =
  | { action: "validate"; data: VentureInput }
  | { action: "create"; data: ICreateVentureInput }
  | { action: "update"; id: string; data: UpdateVentureInput }
  | { action: "get"; id: string }
  | { action: "getAll" }
  | { action: "softDelete"; id: string };

export type VenturesServiceOutput = void | Venture | Venture[];

export interface VenturesServiceDependencies {
  venturesRepository: IVenturesRepository;
}
