import type { IViewConfig } from "@/src/views/types";

export const menuView = {
  template: "components/menu/view",
  style: "/views/components/menu/styles.css",
  stylePath: "src/views/components/menu/styles.css",
} as const satisfies IViewConfig;
