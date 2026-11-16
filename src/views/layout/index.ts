import type { IViewConfig } from "@/src/views/types";

export const layoutView = {
  template: "layout/view",
  style: "/views/layout/styles.css",
  stylePath: "src/views/layout/styles.css",
} as const satisfies IViewConfig;
