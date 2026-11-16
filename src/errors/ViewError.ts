import { Eta } from "eta";
import { PageHeadersInit } from "@/static";
import { AppError } from "./AppError";

export class ViewError extends AppError {
  constructor(
    statusCode: number,
    message: string,
    public template: string = `errorViews/error.${statusCode}.eta`,
  ) {
    super(statusCode, message);
  }

  handle(eta: Eta) {
    try {
      const html = eta.render(this.template, {
        title: `Erro ${this.statusCode}`,
        message: this.message,
      });

      return new Response(html, {
        status: this.statusCode,
        headers: PageHeadersInit,
      });
    } catch {
      // Fallback caso o template dê erro de renderização
      return new Response(
        `<h1>Erro ${this.statusCode}</h1><p>${this.message}</p>`,
        {
          status: this.statusCode,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }
  }
}
