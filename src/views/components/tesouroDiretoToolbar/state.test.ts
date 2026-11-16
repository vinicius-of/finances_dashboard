import { describe, expect, it } from "bun:test";
import { SnapshotType } from "@/contracts";
import type {
  IFixedIncomeVenture,
  IndexerType,
  IVariableIncomeVenture,
  IVentureSnapshot,
  IVentureTracking,
  VentureType,
} from "@/contracts";
import {
  buildIndexerOptions,
  buildToolbarLinks,
  filterTrackings,
  hasActiveFilters,
  parseToolbarState,
  sortTrackings,
  toToolbarView,
} from "@/src/views/components/tesouroDiretoToolbar/state";
import type { ITesouroDiretoToolbarState } from "@/src/views/components/tesouroDiretoToolbar/state";

const baseVenture = {
  initialValue: 1_000,
  boughtAt: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01T12:00:00.000Z"),
  updatedAt: new Date("2026-01-01T12:00:00.000Z"),
};

const makeSnapshot = (ventureId: string): IVentureSnapshot => ({
  id: `${ventureId}-snapshot`,
  ventureId,
  referenceDate: new Date("2026-09-30"),
  currentTotalValue: 1_000,
  totalContributed: 1_000,
  grossProfit: 0,
  profitPercentage: 0,
  type: SnapshotType.MONTHLY_RECORD,
  createdAt: new Date("2026-09-30T12:00:00.000Z"),
});

const makeFixed = (options: {
  id: string;
  name: string;
  indexer: IndexerType;
  type?: VentureType;
  expiresIn?: Date;
  amount?: number;
}): IVentureTracking => {
  const venture: IFixedIncomeVenture = {
    ...baseVenture,
    id: options.id,
    name: options.name,
    category: "FIXED",
    type: options.type ?? "TREASURY",
    expiresIn: options.expiresIn,
    indexer: options.indexer,
    rate: 0.1,
    source: "Tesouro Direto",
  };

  return {
    venture,
    snapshots: [makeSnapshot(options.id)],
    latestValue: options.amount ?? 0,
    totalProfitabilityPercentage: 0,
  };
};

const makeVariable = (options: {
  id: string;
  name: string;
  type?: VentureType;
  amount?: number;
}): IVentureTracking => {
  const amount = options.amount ?? 0;
  const venture: IVariableIncomeVenture = {
    ...baseVenture,
    id: options.id,
    name: options.name,
    category: "VARIABLE",
    type: options.type ?? "STOCK",
    quantity: 1,
    unitPrice: amount,
    totalPrice: amount,
  };

  return {
    venture,
    snapshots: [makeSnapshot(options.id)],
    latestValue: amount,
    totalProfitabilityPercentage: 0,
  };
};

const defaultState: ITesouroDiretoToolbarState = {
  search: "",
  sort: "expires",
  dir: "asc",
};

const ids = (trackings: IVentureTracking[]): string[] =>
  trackings.map((tracking) => tracking.venture.id);

const early = makeFixed({
  id: "early",
  name: "Tesouro Prefixado 2027",
  indexer: "PRE",
  expiresIn: new Date("2027-01-01"),
  amount: 300,
});
const mid = makeFixed({
  id: "mid",
  name: "Tesouro Selic 2029",
  indexer: "SELIC",
  expiresIn: new Date("2029-03-01"),
  amount: 900,
});
const late = makeFixed({
  id: "late",
  name: "Tesouro IPCA+ 2035",
  indexer: "IPCA",
  expiresIn: new Date("2035-05-15"),
  amount: 600,
});
const noDate = makeFixed({
  id: "no-date",
  name: "Tesouro sem vencimento",
  indexer: "CDI",
  amount: 1_000,
});
const cdb = makeFixed({
  id: "cdb",
  name: "CDB Banco X",
  type: "CDB",
  indexer: "CDI",
  expiresIn: new Date("2028-06-01"),
  amount: 500,
});
const fii = makeVariable({
  id: "fii",
  name: "FII HGLG11",
  type: "FII",
  amount: 400,
});

const all = [early, mid, late, noDate, cdb, fii];

describe("parseToolbarState", () => {
  it("aplica os padrões quando a query está vazia", () => {
    expect(parseToolbarState(new URLSearchParams())).toEqual({
      search: "",
      indexer: undefined,
      sort: "expires",
      dir: "asc",
    });
  });

  it("lê filtros e ordenação válidos", () => {
    const state = parseToolbarState(
      new URLSearchParams("search=selic&indexer=SELIC&sort=amount&dir=asc"),
    );

    expect(state).toEqual({
      search: "selic",
      indexer: "SELIC",
      sort: "amount",
      dir: "asc",
    });
  });

  it("ignora valores inválidos", () => {
    const state = parseToolbarState(
      new URLSearchParams("indexer=BAR&sort=foo&dir=up"),
    );

    expect(state).toEqual({
      search: "",
      indexer: undefined,
      sort: "expires",
      dir: "asc",
    });
  });

  it("usa a direção padrão do critério quando dir não é informada", () => {
    const state = parseToolbarState(new URLSearchParams("sort=amount"));

    expect(state.sort).toBe("amount");
    expect(state.dir).toBe("desc");
  });

  it("remove espaços da busca", () => {
    const state = parseToolbarState(new URLSearchParams("search=%20selic%20"));

    expect(state.search).toBe("selic");
  });
});

describe("filterTrackings", () => {
  it("filtra por nome sem diferenciar maiúsculas e acentos", () => {
    const byLower = filterTrackings(all, { ...defaultState, search: "selic" });
    const byAccent = filterTrackings(all, { ...defaultState, search: "SÉLIC" });

    expect(ids(byLower)).toEqual(["mid"]);
    expect(ids(byAccent)).toEqual(["mid"]);
  });

  it("filtra por indexador e exclui ativos sem indexador", () => {
    expect(
      ids(filterTrackings(all, { ...defaultState, indexer: "IPCA" })),
    ).toEqual(["late"]);
    expect(
      ids(filterTrackings(all, { ...defaultState, indexer: "CDI" })),
    ).toEqual(["no-date", "cdb"]);
  });

  it("retorna vazio quando nenhum investimento corresponde", () => {
    expect(
      filterTrackings(all, { ...defaultState, search: "inexistente" }),
    ).toEqual([]);
  });
});

describe("sortTrackings", () => {
  it("ordena por expiração crescente por padrão", () => {
    const sorted = sortTrackings([late, noDate, mid, early], defaultState);

    expect(ids(sorted)).toEqual(["early", "mid", "late", "no-date"]);
  });

  it("ordena por expiração decrescente mantendo sem expiração no fim", () => {
    const sorted = sortTrackings([early, noDate, mid, late], {
      ...defaultState,
      dir: "desc",
    });

    expect(ids(sorted)).toEqual(["late", "mid", "early", "no-date"]);
  });

  it("usa o montante como desempate na expiração", () => {
    const sameDate = new Date("2030-01-01");
    const low = makeFixed({
      id: "low",
      name: "Low",
      indexer: "SELIC",
      expiresIn: sameDate,
      amount: 100,
    });
    const high = makeFixed({
      id: "high",
      name: "High",
      indexer: "SELIC",
      expiresIn: sameDate,
      amount: 300,
    });

    expect(ids(sortTrackings([low, high], defaultState))).toEqual([
      "high",
      "low",
    ]);
  });

  it("ordena pelo montante como critério primário", () => {
    const sorted = sortTrackings([early, mid, late, noDate], {
      ...defaultState,
      sort: "amount",
      dir: "desc",
    });

    expect(ids(sorted)).toEqual(["mid", "late", "early", "no-date"]);
  });

  it("desempata o montante pela expiração crescente", () => {
    const first = makeFixed({
      id: "first",
      name: "First",
      indexer: "SELIC",
      expiresIn: new Date("2035-01-01"),
      amount: 500,
    });
    const second = makeFixed({
      id: "second",
      name: "Second",
      indexer: "SELIC",
      expiresIn: new Date("2027-01-01"),
      amount: 500,
    });

    expect(
      ids(
        sortTrackings([first, second], {
          ...defaultState,
          sort: "amount",
          dir: "asc",
        }),
      ),
    ).toEqual(["second", "first"]);
  });

  it("mantém a ordem estável quando critério e desempate empatam", () => {
    const sameDate = new Date("2030-01-01");
    const a = makeFixed({
      id: "a",
      name: "A",
      indexer: "SELIC",
      expiresIn: sameDate,
      amount: 500,
    });
    const b = makeFixed({
      id: "b",
      name: "B",
      indexer: "SELIC",
      expiresIn: sameDate,
      amount: 500,
    });

    expect(ids(sortTrackings([a, b], defaultState))).toEqual(["a", "b"]);
    expect(ids(sortTrackings([b, a], defaultState))).toEqual(["b", "a"]);
  });
});

describe("buildIndexerOptions", () => {
  it("gera opções dinâmicas e ordenadas por rótulo", () => {
    expect(buildIndexerOptions(all)).toEqual([
      { value: "CDI", label: "CDI" },
      { value: "IPCA", label: "IPCA" },
      { value: "PRE", label: "Prefixado" },
      { value: "SELIC", label: "Selic" },
    ]);
  });

  it("não duplica valores e ignora ativos variáveis", () => {
    const indexerOptions = buildIndexerOptions([early, early, fii]);

    expect(indexerOptions.map((option) => option.value)).toEqual(["PRE"]);
  });
});

describe("buildToolbarLinks", () => {
  it("monta links canônicos a partir do estado padrão", () => {
    const links = buildToolbarLinks("/tesouro-direto", defaultState);

    expect(links.amountHref).toBe("/tesouro-direto?sort=amount");
    expect(links.expiresHref).toBe("/tesouro-direto?dir=desc");
    expect(links.clearHref).toBe("/tesouro-direto");
  });

  it("alterna a direção do critério ativo", () => {
    const amountState = {
      ...defaultState,
      sort: "amount" as const,
      dir: "desc" as const,
    };
    const expiresState = { ...defaultState, dir: "desc" as const };

    expect(buildToolbarLinks("/tesouro-direto", amountState).amountHref).toBe(
      "/tesouro-direto?sort=amount&dir=asc",
    );
    expect(buildToolbarLinks("/tesouro-direto", amountState).expiresHref).toBe(
      "/tesouro-direto",
    );
    expect(buildToolbarLinks("/tesouro-direto", expiresState).expiresHref).toBe(
      "/tesouro-direto",
    );
  });

  it("preserva os filtros ativos nos links", () => {
    const state = parseToolbarState(
      new URLSearchParams("search=selic&indexer=SELIC"),
    );
    const links = buildToolbarLinks("/tesouro-direto", state);

    expect(links.amountHref).toBe(
      "/tesouro-direto?search=selic&indexer=SELIC&sort=amount",
    );
    expect(links.clearHref).toBe("/tesouro-direto");
  });
});

describe("hasActiveFilters", () => {
  it("detecta busca, filtros e ordenação fora do padrão", () => {
    expect(hasActiveFilters(defaultState)).toBe(false);
    expect(hasActiveFilters({ ...defaultState, search: "selic" })).toBe(true);
    expect(hasActiveFilters({ ...defaultState, indexer: "SELIC" })).toBe(true);
    expect(
      hasActiveFilters({ ...defaultState, sort: "amount", dir: "desc" }),
    ).toBe(true);
    expect(hasActiveFilters({ ...defaultState, dir: "desc" })).toBe(true);
  });
});

describe("toToolbarView", () => {
  it("agrega estado, opções, links e flag de filtro ativo", () => {
    const view = toToolbarView(all, defaultState, "/tesouro-direto");

    expect(view.state).toEqual(defaultState);
    expect(view.indexerOptions).toHaveLength(4);
    expect(view.links.clearHref).toBe("/tesouro-direto");
    expect(view.hasActiveFilters).toBe(false);
  });
});
