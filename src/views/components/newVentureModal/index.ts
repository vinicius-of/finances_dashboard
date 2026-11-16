import { IndexerType, VentureCategory, VentureType } from "@/contracts";
import type { IViewConfig } from "@/src/views/types";
import {
  INDEXER_TYPE_LABELS,
  VENTURE_TYPE_LABELS,
} from "@/src/views/tesouroDireto/ventures";

export const newVentureModal = {
  template: "components/newVentureModal/view",
  style: "/views/components/newVentureModal/styles.css",
  stylePath: "src/views/components/newVentureModal/styles.css",
} as const satisfies IViewConfig;

export interface INewVentureTypeOption {
  value: VentureType;
  label: string;
  category: VentureCategory;
}

export interface INewVentureIndexerOption {
  value: IndexerType;
  label: string;
}

export interface INewVentureModalView {
  title: string;
  types: INewVentureTypeOption[];
  indexers: INewVentureIndexerOption[];
}

const CATEGORY_BY_TYPE: Record<VentureType, VentureCategory> = {
  TREASURY: VentureCategory.FIXED,
  CDB: VentureCategory.FIXED,
  LCI: VentureCategory.FIXED,
  LCA: VentureCategory.FIXED,
  CRA: VentureCategory.FIXED,
  STOCK: VentureCategory.VARIABLE,
  FII: VentureCategory.VARIABLE,
};

export const NEW_VENTURE_MODAL_CONFIG = {
  "tesouro-direto": {
    title: "Novo investimento Tesouro Direto",
    types: [VentureType.TREASURY],
  },
  "rendas-fixas": {
    title: "Novo investimento Renda Fixa",
    types: [
      VentureType.CDB,
      VentureType.LCI,
      VentureType.LCA,
      VentureType.CRA,
    ],
  },
  acoes: {
    title: "Novo investimento Ações",
    types: [VentureType.STOCK, VentureType.FII],
  },
} as const satisfies Record<
  string,
  { title: string; types: readonly VentureType[] }
>;

export type NewVentureModalKey = keyof typeof NEW_VENTURE_MODAL_CONFIG;

export const toNewVentureModalView = (
  key: NewVentureModalKey,
): INewVentureModalView => {
  const config = NEW_VENTURE_MODAL_CONFIG[key];

  return {
    title: config.title,
    types: config.types.map((value) => ({
      value,
      label: VENTURE_TYPE_LABELS[value],
      category: CATEGORY_BY_TYPE[value],
    })),
    indexers: Object.entries(INDEXER_TYPE_LABELS).map(([value, label]) => ({
      value: value as IndexerType,
      label,
    })),
  };
};
