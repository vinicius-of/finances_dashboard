import { Eta } from "eta";
import { loadEnvFile } from "node:process";
import path from "path";
import { ENV_PATH, FavIconConfigs } from "./static";

loadEnvFile(ENV_PATH);

const FavIcon = new FavIconConfigs();

const port = Bun.env.PORT || "3000";

const eta = new Eta({
  views: path.join(process.cwd(), "src/views"),
});

const server = Bun.serve({
  port,
  development: true,
  routes: {
    "/": new Response("OK"),
    "/favicon.ico": FavIcon.serveFile(),
  },
});
