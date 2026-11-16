import { JsonHeadersInit } from "@/static";
import { AppError } from "./AppError";

export class ApiError extends AppError {
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(statusCode, message);
    this.details = details;
  }

  handle(): Response {
    return Response.json(
      {
        error: true,
        statusCode: this.statusCode,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
      { status: this.statusCode, headers: JsonHeadersInit },
    );
  }
}
