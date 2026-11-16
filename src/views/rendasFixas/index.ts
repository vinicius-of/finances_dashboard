import type { IPageViewConfig } from "@/src/views/types";

export const rendasFixas = {
  key: "rendas-fixas",
  label: "Rendas Fixas",
  href: "/rendas-fixas",
  icon: "bi-file-earmark-text",
  template: "rendasFixas/view",
  style: "/views/rendasFixas/styles.css",
  stylePath: "src/views/rendasFixas/styles.css",
} as const satisfies IPageViewConfig;
