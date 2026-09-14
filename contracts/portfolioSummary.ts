export interface IPortfolioSummary {
    totalInvested: number; // Soma do valor inicial/aportado de todos os ativos
    currentTotalBalance: number; // Soma do valor atual de todos os últimos snapshots
    totalGrossProfit: number; // Lucro bruto global
    overallProfitabilityPercentage: number;
    fixedIncomeTotal: number;
    variableIncomeTotal: number;
    lastUpdated: Date;
}
