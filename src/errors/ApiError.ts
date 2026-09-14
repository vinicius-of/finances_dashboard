import { AppError } from "./AppError";

export class ApiError extends AppError {
  constructor(
    statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(statusCode, message);
  }

  handle(): Response {
    return Response.json(
      {
        error: true,
        statusCode: this.statusCode,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
      { status: this.statusCode },
    );
  }
}
