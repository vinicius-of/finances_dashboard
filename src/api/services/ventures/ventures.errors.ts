import { ApiError } from "@/src/errors/ApiError";

export const notFound = (id: string): ApiError =>
  new ApiError(404, "Venture não encontrada", { id });

export const invalid = (
  message: string,
  field: string,
  rule: string,
): ApiError => new ApiError(422, message, { field, rule });

export const duplicatedInternalCode = (): ApiError =>
  new ApiError(409, "internalCode já cadastrado", {
    field: "internalCode",
    rule: "unique",
  });
