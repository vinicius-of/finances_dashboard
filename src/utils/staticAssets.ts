import path from "path";
import { FavIconConfigs, PROJECT_ROOT, fileResponse } from "@/static";
import { withRequestLog } from "@/src/utils/logs";
import { layoutView } from "@/src/views/layout";
import { menuView } from "@/src/views/components/menu";
import { tesouroDiretoTable } from "@/src/views/components/tesouroDiretoTable";
import { tesouroDiretoToolbar } from "@/src/views/components/tesouroDiretoToolbar";
import { newVentureModal } from "@/src/views/components/newVentureModal";
import { registerSnapshotModal } from "@/src/views/components/registerSnapshotModal";
import { toastView } from "@/src/views/components/toast";
import { tesouroDireto } from "@/src/views/tesouroDireto";
import { rendasFixas } from "@/src/views/rendasFixas";
import { acoes } from "@/src/views/acoes";

const favicon = new FavIconConfigs();

const viewStyles = [
  layoutView,
  menuView,
  tesouroDireto,
  rendasFixas,
  acoes,
  tesouroDiretoTable,
  tesouroDiretoToolbar,
  newVentureModal,
  registerSnapshotModal,
  toastView,
];

export const fileRoute = (filePath: string) =>
  withRequestLog("file", (req) => fileResponse(req, filePath));

export const staticAssetRoutes = {
  "/styles/theme.css": fileRoute(
    path.join(PROJECT_ROOT, "static/styles/theme.css"),
  ),
  "/views/components/tesouroDiretoTable/menu.js": fileRoute(
    path.join(PROJECT_ROOT, "src/views/components/tesouroDiretoTable/menu.js"),
  ),
  "/views/components/tesouroDiretoTable/records.js": fileRoute(
    path.join(
      PROJECT_ROOT,
      "src/views/components/tesouroDiretoTable/records.js",
    ),
  ),
  "/vendor/bootstrap/bootstrap.bundle.min.js": fileRoute(
    path.join(
      PROJECT_ROOT,
      "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
    ),
  ),
  "/views/components/toast/toast.js": fileRoute(
    path.join(PROJECT_ROOT, "src/views/components/toast/toast.js"),
  ),
  "/views/components/registerSnapshotModal/modal.js": fileRoute(
    path.join(
      PROJECT_ROOT,
      "src/views/components/registerSnapshotModal/modal.js",
    ),
  ),
  "/views/components/newVentureModal/modal.js": fileRoute(
    path.join(PROJECT_ROOT, "src/views/components/newVentureModal/modal.js"),
  ),
  ...Object.fromEntries(
    viewStyles.map((view) => [
      view.style,
      fileRoute(path.join(PROJECT_ROOT, view.stylePath)),
    ]),
  ),
  "/vendor/bootstrap/bootstrap.min.css": fileRoute(
    path.join(
      PROJECT_ROOT,
      "node_modules/bootstrap/dist/css/bootstrap.min.css",
    ),
  ),
  "/vendor/bootstrap-icons/bootstrap-icons.min.css": fileRoute(
    path.join(
      PROJECT_ROOT,
      "node_modules/bootstrap-icons/font/bootstrap-icons.min.css",
    ),
  ),
  "/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2": fileRoute(
    path.join(
      PROJECT_ROOT,
      "node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2",
    ),
  ),
  "/vendor/bootstrap-icons/fonts/bootstrap-icons.woff": fileRoute(
    path.join(
      PROJECT_ROOT,
      "node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff",
    ),
  ),
  "/favicon.ico": withRequestLog("file", (req) =>
    fileResponse(req, favicon.getPath()),
  ),
};
