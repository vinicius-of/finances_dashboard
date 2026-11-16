export interface IViewConfig {
  template: string;
  style: string;
  stylePath: string;
}

export interface IPageViewConfig extends IViewConfig {
  key: string;
  label: string;
  href: string;
  icon: string;
}

export type NavItem = Pick<IPageViewConfig, "key" | "label" | "href" | "icon">;

export type ProfitabilityTrend = "up" | "down" | "neutral";

export interface ITesouroDiretoRecordRow {
  dateLabel: string;
  differenceLabel: string;
  differenceTrend: ProfitabilityTrend;
  previousValueLabel: string;
  currentValueLabel: string;
  notes?: string;
}

export interface ITesouroDiretoTableRow {
  id: string;
  name: string;
  internalCode?: string;
  typeLabel: string;
  indexerLabel: string;
  amountLabel: string;
  profitabilityLabel: string;
  profitabilityTrend: ProfitabilityTrend;
  expiresAtLabel: string;
  records: ITesouroDiretoRecordRow[];
}
