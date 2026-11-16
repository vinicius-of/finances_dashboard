import type { Eta } from "eta";
import { PageHeadersInit } from "@/static";
import { layoutView } from "@/src/views/layout";
import { VentureType } from "@/contracts";
import type { IPortfolioTrackingReader } from "@/src/api/services/portfolio/portfolio.types";
import { menuView } from "@/src/views/components/menu";
import {
  tesouroDiretoTable,
  toTesouroDiretoTableRow,
} from "@/src/views/components/tesouroDiretoTable";
import {
  applyToolbarState,
  hasActiveFilters,
  parseToolbarState,
  tesouroDiretoToolbar,
  toToolbarView,
} from "@/src/views/components/tesouroDiretoToolbar";
import { registerSnapshotModal } from "@/src/views/components/registerSnapshotModal";
import {
  newVentureModal,
  toNewVentureModalView,
} from "@/src/views/components/newVentureModal";
import type { INewVentureModalView } from "@/src/views/components/newVentureModal";
import { toastView } from "@/src/views/components/toast";
import type { ITesouroDiretoToolbarView } from "@/src/views/components/tesouroDiretoToolbar";
import { tesouroDireto } from "@/src/views/tesouroDireto";
import { rendasFixas } from "@/src/views/rendasFixas";
import { acoes } from "@/src/views/acoes";
import type {
  IPageViewConfig,
  ITesouroDiretoTableRow,
  NavItem,
} from "@/src/views/types";
import { ViewError } from "@/src/errors/ViewError";

export const NAV_ITEMS = [
  {
    key: tesouroDireto.key,
    label: tesouroDireto.label,
    href: tesouroDireto.href,
    icon: tesouroDireto.icon,
  },
  {
    key: rendasFixas.key,
    label: rendasFixas.label,
    href: rendasFixas.href,
    icon: rendasFixas.icon,
  },
  {
    key: acoes.key,
    label: acoes.label,
    href: acoes.href,
    icon: acoes.icon,
  },
] as const satisfies readonly NavItem[];

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

const PAGES: Record<NavKey, IPageViewConfig> = {
  "tesouro-direto": tesouroDireto,
  "rendas-fixas": rendasFixas,
  acoes,
};

interface IPageRenderOptions {
  rows?: ITesouroDiretoTableRow[];
  toolbar?: ITesouroDiretoToolbarView;
  ventureModal?: INewVentureModalView;
  emptyMessage?: string;
  extraStyles?: string[];
}

export class ViewsController {
  constructor(
    private readonly eta: Eta,
    private readonly portfolio: IPortfolioTrackingReader,
  ) {}

  index(req?: Request): Response {
    const page = PAGES["tesouro-direto"];
    const url = new URL(req?.url ?? "http://localhost/tesouro-direto");
    const state = parseToolbarState(url.searchParams);
    const trackings = this.portfolio.listTracking({
      type: VentureType.TREASURY,
    });
    const rows = applyToolbarState(trackings, state).map(
      toTesouroDiretoTableRow,
    );

    return this.render(page, {
      rows,
      toolbar: toToolbarView(trackings, state, page.href),
      ventureModal: toNewVentureModalView("tesouro-direto"),
      emptyMessage: hasActiveFilters(state)
        ? "Nenhum investimento encontrado."
        : "Nenhum investimento cadastrado.",
      extraStyles: [
        tesouroDiretoToolbar.style,
        tesouroDiretoTable.style,
        newVentureModal.style,
        registerSnapshotModal.style,
        toastView.style,
      ],
    });
  }

  rendasFixas(): Response {
    return this.render(PAGES["rendas-fixas"]);
  }

  acoes(): Response {
    return this.render(PAGES["acoes"]);
  }

  notFound(): Response {
    return new ViewError(404, "Página não encontrada").handle(this.eta);
  }

  private render(
    page: IPageViewConfig,
    options: IPageRenderOptions = {},
  ): Response {
    const html = this.eta.render(page.template, {
      title: page.label,
      icon: page.icon,
      active: page.key,
      items: NAV_ITEMS,
      rows: options.rows ?? [],
      toolbar: options.toolbar,
      ventureModal: options.ventureModal,
      emptyMessage: options.emptyMessage,
      styles: [
        layoutView.style,
        menuView.style,
        page.style,
        ...(options.extraStyles ?? []),
      ],
    });

    return new Response(html, { headers: PageHeadersInit });
  }
}
