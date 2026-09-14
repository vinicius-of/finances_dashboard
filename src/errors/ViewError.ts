import { Eta } from "eta";
import { AppError } from "./AppError";

export class ViewError extends AppError {
  constructor(
    statusCode: number,
    message: string,
    public template: string = "./404",
  ) {
    super(statusCode, message);
  }

  handle(eta: Eta) {
    try {
      const html = eta.render(this.template, {
        title: /*TODO: Adicionar i18n de retorno */ "",
        message: this.message,
      });

      return new Response(html, {
        headers: /*TODO: Padronizar headers */ {},
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
