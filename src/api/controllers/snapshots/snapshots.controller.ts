import { JsonHeadersInit } from "@/static";
import { ApiError } from "@/src/errors/ApiError";
import type {
  IRegisterSnapshotResponse,
  ISnapshotWriter,
  ISnapshotsController,
} from "./snapshots.controller.types";
import { toSnapshotInput } from "./snapshots.mappers";
import { parseSnapshotPayload, readJson } from "./snapshots.utils";

export class SnapshotsController implements ISnapshotsController {
  private readonly writer: ISnapshotWriter;

  constructor(writer: ISnapshotWriter) {
    this.writer = writer;
  }

  async create(req: Request): Promise<Response> {
    try {
      const payload = parseSnapshotPayload(await readJson(req));
      const snapshot = this.writer.save(toSnapshotInput(payload));
      const body: IRegisterSnapshotResponse = { snapshot };

      return Response.json(body, { status: 201, headers: JsonHeadersInit });
    } catch (error) {
      if (error instanceof ApiError) {
        return error.handle();
      }

      throw error;
    }
  }
}
