import type { IViewConfig } from "@/src/views/types";

export const registerSnapshotModal = {
  template: "components/registerSnapshotModal/view",
  style: "/views/components/registerSnapshotModal/styles.css",
  stylePath: "src/views/components/registerSnapshotModal/styles.css",
} as const satisfies IViewConfig;
