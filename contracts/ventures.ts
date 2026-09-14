import type { VentureCategory, VentureType } from "./enums";

export interface IVenture {
    id: string;
    name: string;
    internalCode?: string; // "PETR4", "BBDC4
    category: VentureCategory;
    type: VentureType;
    initialValue: number;
    boughtAt: Date;
    expiresIn?: Date;
    createdAt: Date;
    updatedAt: Date;
}
