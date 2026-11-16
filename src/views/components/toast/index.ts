import type { IViewConfig } from "@/src/views/types";

export const toastView = {
  template: "components/toast/view",
  style: "/views/components/toast/styles.css",
  stylePath: "src/views/components/toast/styles.css",
} as const satisfies IViewConfig;
