import type { IPageViewConfig } from "@/src/views/types";

export const tesouroDireto = {
  key: "tesouro-direto",
  label: "Tesouro Direto",
  href: "/tesouro-direto",
  icon: "bi-bank",
  template: "tesouroDireto/view",
  style: "/views/tesouroDireto/styles.css",
  stylePath: "src/views/tesouroDireto/styles.css",
} as const satisfies IPageViewConfig;
