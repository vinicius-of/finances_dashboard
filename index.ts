import { Eta } from "eta";
import { loadEnvFile } from "node:process";
import path from "path";
import { ENV_PATH } from "@/static";
import { ViewsController } from "@/src/views";
import { venturesRepository } from "@/src/repositories/ventures";
import { ventureSnapshotsRepository } from "@/src/repositories/ventureSnapshots";
import { VenturesService } from "@/src/api/services/ventures/ventures.service";
import { SnapshotsService } from "@/src/api/services/snapshots/snapshots.service";
import { PortfolioService } from "@/src/api/services/portfolio/portfolio.service";
import { SnapshotsController } from "@/src/api/controllers/snapshots";
import { VenturesController } from "@/src/api/controllers/ventures";
import { log, withRequestLog } from "@/src/utils/logs";
import { staticAssetRoutes } from "@/src/utils/staticAssets";

loadEnvFile(ENV_PATH);

const port = Bun.env.PORT || "3000";

const eta = new Eta({
  views: path.join(process.cwd(), "src/views"),
});

const venturesService = new VenturesService({ venturesRepository });
const snapshotsService = new SnapshotsService({
  venturesReader: venturesRepository,
  snapshotsRepository: ventureSnapshotsRepository,
});
const portfolioService = new PortfolioService({
  venturesService,
  snapshotsService,
});
const viewsController = new ViewsController(eta, portfolioService);
const snapshotsController = new SnapshotsController(snapshotsService);
const venturesController = new VenturesController(venturesService);

const server = Bun.serve({
  port,
  development: true,
  routes: {
    "/": withRequestLog("redirect", () => Response.redirect("/tesouro-direto")),
    "/tesouro-direto": withRequestLog("render", (req) =>
      viewsController.index(req),
    ),
    "/rendas-fixas": withRequestLog("render", () =>
      viewsController.rendasFixas(),
    ),
    "/acoes": withRequestLog("render", () => viewsController.acoes()),
    "/api/health": withRequestLog("json", () =>
      Response.json({ status: "ok" }),
    ),
    "/api/snapshots": {
      POST: withRequestLog("json", (req) => snapshotsController.create(req)),
      PATCH: withRequestLog("json", (req) => snapshotsController.update(req)),
      DELETE: withRequestLog("json", (req) => snapshotsController.remove(req)),
    },
    "/api/ventures": {
      POST: withRequestLog("json", (req) => venturesController.create(req)),
    },
    ...staticAssetRoutes,
    "/*": withRequestLog("render", () => viewsController.notFound()),
  },
});

log.startup(server.url.toString());
