import type { IViewConfig } from "@/src/views/types";

export * from "./state";

export const tesouroDiretoToolbar = {
  template: "components/tesouroDiretoToolbar/view",
  style: "/views/components/tesouroDiretoToolbar/styles.css",
  stylePath: "src/views/components/tesouroDiretoToolbar/styles.css",
} as const satisfies IViewConfig;
