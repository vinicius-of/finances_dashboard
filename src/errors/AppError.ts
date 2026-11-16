import type { Eta } from "eta";

export abstract class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }

  abstract handle(eta: Eta): Response | Promise<Response>;
}
