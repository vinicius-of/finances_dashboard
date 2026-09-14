import type { IFixedIncomeVenture } from "./fixedVentures";
import type { IVariableIncomeVenture } from "./variableVentures";
import type { IVenture } from "./ventures";
import type { IVentureSnapshot } from "./ventureSnaphots";

export interface IVentureTracking {
    venture: IVenture | IFixedIncomeVenture | IVariableIncomeVenture;
    snapshots: IVentureSnapshot[];
    latestValue: number; // Valor atual do investimento baseado no último snapshot
    totalProfitabilityPercentage: number; // Rentabilidade acumulada total
}
