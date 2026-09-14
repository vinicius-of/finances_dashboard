import type { IVenture } from "./ventures";

export interface IVariableIncomeVenture extends IVenture {
    category: "VARIABLE";
    quantity: number; // Quantidade de cotas/ações compradas inicialmente
    unitPrice: number; // Preço médio unitário na compra
    totalPrice: number;
}
