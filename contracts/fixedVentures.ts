import type { IndexerType } from "./enums";
import type { IVenture } from "./ventures";

export interface IFixedIncomeVenture extends IVenture {
    category: "FIXED";
    indexer: IndexerType;
    rate: number;
    source: string;
}
