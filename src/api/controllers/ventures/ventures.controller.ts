import { JsonHeadersInit } from "@/static";
import { ApiError } from "@/src/errors/ApiError";
import type {
  ICreateVentureResponse,
  IVentureWriter,
  IVenturesController,
} from "./ventures.controller.types";
import { toCreateVentureInput } from "./ventures.mappers";
import { parseVenturePayload, readJson } from "./ventures.utils";

export class VenturesController implements IVenturesController {
  private readonly writer: IVentureWriter;

  constructor(writer: IVentureWriter) {
    this.writer = writer;
  }

  async create(req: Request): Promise<Response> {
    try {
      const payload = parseVenturePayload(await readJson(req));
      const venture = this.writer.create(toCreateVentureInput(payload));
      const body: ICreateVentureResponse = { venture };

      return Response.json(body, { status: 201, headers: JsonHeadersInit });
    } catch (error) {
      if (error instanceof ApiError) {
        return error.handle();
      }

      throw error;
    }
  }
}
