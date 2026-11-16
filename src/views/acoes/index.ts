import type { IPageViewConfig } from "@/src/views/types";

export const acoes = {
  key: "acoes",
  label: "Ações",
  href: "/acoes",
  icon: "bi-graph-up-arrow",
  template: "acoes/view",
  style: "/views/acoes/styles.css",
  stylePath: "src/views/acoes/styles.css",
} as const satisfies IPageViewConfig;
