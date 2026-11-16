import { IndexerType } from "@/contracts";
import type { IVentureTracking } from "@/contracts";
import {
  INDEXER_TYPE_LABELS,
  isFixedIncomeVenture,
} from "@/src/views/tesouroDireto/ventures";

export type SortDirection = "asc" | "desc";
export type ToolbarSort = "expires" | "amount";

export interface ITesouroDiretoToolbarState {
  search: string;
  indexer?: IndexerType;
  sort: ToolbarSort;
  dir: SortDirection;
}

export interface IToolbarOption {
  value: string;
  label: string;
}

export interface IToolbarLinks {
  amountHref: string;
  expiresHref: string;
  clearHref: string;
}

export interface ITesouroDiretoToolbarView {
  state: ITesouroDiretoToolbarState;
  indexerOptions: IToolbarOption[];
  links: IToolbarLinks;
  hasActiveFilters: boolean;
}

const DEFAULT_SORT: ToolbarSort = "expires";

const DEFAULT_DIRECTION: Record<ToolbarSort, SortDirection> = {
  expires: "asc",
  amount: "desc",
};

const isSortDirection = (value: string | null): value is SortDirection =>
  value === "asc" || value === "desc";

const isToolbarSort = (value: string | null): value is ToolbarSort =>
  value === "expires" || value === "amount";

const isIndexerType = (value: string | null): value is IndexerType =>
  value !== null && Object.values(IndexerType).includes(value as IndexerType);

export const parseToolbarState = (
  params: URLSearchParams,
): ITesouroDiretoToolbarState => {
  const rawSort = params.get("sort");
  const sort = isToolbarSort(rawSort) ? rawSort : DEFAULT_SORT;
  const rawDir = params.get("dir");
  const rawIndexer = params.get("indexer");

  return {
    search: (params.get("search") ?? "").trim(),
    indexer: isIndexerType(rawIndexer) ? rawIndexer : undefined,
    sort,
    dir: isSortDirection(rawDir) ? rawDir : DEFAULT_DIRECTION[sort],
  };
};

const normalizeSearch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

export const filterTrackings = (
  trackings: IVentureTracking[],
  state: ITesouroDiretoToolbarState,
): IVentureTracking[] => {
  const search = normalizeSearch(state.search);

  return trackings.filter((tracking) => {
    const { venture } = tracking;

    if (search && !normalizeSearch(venture.name).includes(search)) {
      return false;
    }

    if (state.indexer) {
      if (!isFixedIncomeVenture(venture) || venture.indexer !== state.indexer) {
        return false;
      }
    }

    return true;
  });
};

export const sortTrackings = (
  trackings: IVentureTracking[],
  state: ITesouroDiretoToolbarState,
): IVentureTracking[] => {
  const compare = (a: IVentureTracking, b: IVentureTracking): number => {
    const aExpires = a.venture.expiresIn;
    const bExpires = b.venture.expiresIn;

    if (aExpires && !bExpires) {
      return -1;
    }

    if (!aExpires && bExpires) {
      return 1;
    }

    const expiresDiff =
      aExpires && bExpires ? aExpires.getTime() - bExpires.getTime() : 0;
    const amountDiff = a.latestValue - b.latestValue;

    if (state.sort === "expires") {
      if (expiresDiff !== 0) {
        return state.dir === "asc" ? expiresDiff : -expiresDiff;
      }

      return amountDiff === 0 ? 0 : -amountDiff;
    }

    if (amountDiff !== 0) {
      return state.dir === "desc" ? -amountDiff : amountDiff;
    }

    return expiresDiff;
  };

  return [...trackings].sort(compare);
};

export const applyToolbarState = (
  trackings: IVentureTracking[],
  state: ITesouroDiretoToolbarState,
): IVentureTracking[] =>
  sortTrackings(filterTrackings(trackings, state), state);

const sortOptions = (options: IToolbarOption[]): IToolbarOption[] =>
  options.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

export const buildIndexerOptions = (
  trackings: IVentureTracking[],
): IToolbarOption[] => {
  const indexerValues = [
    ...new Set(
      trackings.flatMap((tracking) =>
        isFixedIncomeVenture(tracking.venture)
          ? [tracking.venture.indexer]
          : [],
      ),
    ),
  ];

  return sortOptions(
    indexerValues.map((value) => ({
      value,
      label: INDEXER_TYPE_LABELS[value],
    })),
  );
};

const toHref = (
  pathname: string,
  state: ITesouroDiretoToolbarState,
): string => {
  const params = new URLSearchParams();

  if (state.search) {
    params.set("search", state.search);
  }

  if (state.indexer) {
    params.set("indexer", state.indexer);
  }

  if (state.sort !== DEFAULT_SORT) {
    params.set("sort", state.sort);
  }

  if (state.dir !== DEFAULT_DIRECTION[state.sort]) {
    params.set("dir", state.dir);
  }

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
};

const toggleDirection = (direction: SortDirection): SortDirection =>
  direction === "asc" ? "desc" : "asc";

export const buildToolbarLinks = (
  pathname: string,
  state: ITesouroDiretoToolbarState,
): IToolbarLinks => {
  const amountState: ITesouroDiretoToolbarState =
    state.sort === "amount"
      ? { ...state, dir: toggleDirection(state.dir) }
      : { ...state, sort: "amount", dir: DEFAULT_DIRECTION.amount };

  const expiresState: ITesouroDiretoToolbarState =
    state.sort === "expires"
      ? { ...state, dir: toggleDirection(state.dir) }
      : { ...state, sort: "expires", dir: DEFAULT_DIRECTION.expires };

  return {
    amountHref: toHref(pathname, amountState),
    expiresHref: toHref(pathname, expiresState),
    clearHref: pathname,
  };
};

export const hasActiveFilters = (state: ITesouroDiretoToolbarState): boolean =>
  state.search !== "" ||
  state.indexer !== undefined ||
  state.sort !== DEFAULT_SORT ||
  state.dir !== DEFAULT_DIRECTION[state.sort];

export const toToolbarView = (
  trackings: IVentureTracking[],
  state: ITesouroDiretoToolbarState,
  pathname: string,
): ITesouroDiretoToolbarView => ({
  state,
  indexerOptions: buildIndexerOptions(trackings),
  links: buildToolbarLinks(pathname, state),
  hasActiveFilters: hasActiveFilters(state),
});
