import { join } from "node:path";
import { cwd } from "process";

export class FavIconConfigs {
    protected readonly path: string = join(cwd(), "assets/favicon.ico");

    getPath(): string {
        return this.path;
    }

    serveFile(): Bun.BunFile {
        return Bun.file(this.path);
    }
}
