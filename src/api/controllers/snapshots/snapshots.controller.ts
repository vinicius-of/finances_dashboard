import { JsonHeadersInit } from "@/static";
import type { ISnapshotCommands } from "@/src/api/services/snapshots/snapshots.types";
import { ApiError } from "@/src/errors/ApiError";
import { log } from "@/src/utils/logs";
import type {
  IRegisterSnapshotResponse,
  ISnapshotWriter,
  ISnapshotsController,
} from "./snapshots.controller.types";
import { toSnapshotInput, toUpdateSnapshotInput } from "./snapshots.mappers";
import {
  parseSnapshotDeletePayload,
  parseSnapshotPayload,
  parseSnapshotUpdatePayload,
  readJson,
} from "./snapshots.utils";

export class SnapshotsController implements ISnapshotsController {
  private readonly commands: ISnapshotWriter;

  constructor(commands: ISnapshotWriter) {
    this.commands = commands;
  }

  async create(req: Request): Promise<Response> {
    try {
      const payload = parseSnapshotPayload(await readJson(req));
      const snapshot = this.commands.save(toSnapshotInput(payload));
      const body: IRegisterSnapshotResponse = { snapshot };

      return Response.json(body, { status: 201, headers: JsonHeadersInit });
    } catch (error) {
      if (error instanceof ApiError) {
        return error.handle();
      }

      throw error;
    }
  }

  async update(req: Request): Promise<Response> {
    return this.respond("PATCH", async () => {
      const payload = parseSnapshotUpdatePayload(await readJson(req));
      const snapshot = this.writableCommands().update(
        payload.ventureId,
        payload.snapshotId,
        toUpdateSnapshotInput(payload),
      );

      return Response.json(
        { snapshot },
        { status: 200, headers: JsonHeadersInit },
      );
    });
  }

  async remove(req: Request): Promise<Response> {
    return this.respond("DELETE", async () => {
      const payload = parseSnapshotDeletePayload(await readJson(req));
      const snapshot = this.writableCommands().softDelete(
        payload.ventureId,
        payload.snapshotId,
      );

      return Response.json(
        { snapshot },
        { status: 200, headers: JsonHeadersInit },
      );
    });
  }

  private writableCommands(): ISnapshotCommands {
    if (!this.commands.update || !this.commands.softDelete) {
      throw new ApiError(500, "Comandos de escrita indisponíveis");
    }

    return this.commands as ISnapshotCommands;
  }

  private async respond(
    method: "PATCH" | "DELETE",
    handler: () => Promise<Response>,
  ): Promise<Response> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof ApiError) {
        log.error(`Falha em ${method} /api/snapshots`, {
          method,
          status: error.statusCode,
          message: error.message,
          details: error.details,
        });

        return error.handle();
      }

      log.error(`Erro inesperado em ${method} /api/snapshots`, {
        method,
        message: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
