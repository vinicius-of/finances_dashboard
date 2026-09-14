import type { SnapshotType } from "./enums";

export interface IVentureSnapshot {
    id: string;
    ventureId: string; // ID de vínculo com o IVenture principal
    referenceDate: Date; // Data de referência da apuração (ex: 2026-08-31)

    // Valores atuais na data de referência
    currentUnitPrice?: number; // Preço unitário/cota na data (relevante p/ Ações)
    currentQuantityHeld?: number; // Quantidade mantida na data
    currentTotalValue: number; // Valor total bruto acumulado na data

    // Apuração de Rendimento / Balanço
    totalContributed: number; // Soma de todos os aportes até esta data
    grossProfit: number; // Lucro/Rendimento Bruto em valor (currentTotalValue - totalContributed)
    profitPercentage: number; // Rentabilidade percentual acumulada

    // Detalhes operacionais da data
    type: SnapshotType;
    movementValue?: number; // Valor se houve novo aporte ou resgate no mês
    notes?: string; // Anotações do usuário sobre o mês
    createdAt: Date;
}
