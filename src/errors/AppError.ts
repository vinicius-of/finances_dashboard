import type { Eta } from "eta";

export abstract class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    (super(message), (this.name = this.constructor.name));
  }

  abstract handle(eta: Eta): Response | Promise<Response>;
}
