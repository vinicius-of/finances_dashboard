import path from "node:path";

export const PROJECT_ROOT: string = process.cwd();
export const ENV_PATH: string = path.join(PROJECT_ROOT, ".env");
