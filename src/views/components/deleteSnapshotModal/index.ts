import type { IViewConfig } from "@/src/views/types";

export const deleteSnapshotModal = {
  template: "components/deleteSnapshotModal/view",
  style: "/views/components/deleteSnapshotModal/styles.css",
  stylePath: "src/views/components/deleteSnapshotModal/styles.css",
} as const satisfies IViewConfig;
