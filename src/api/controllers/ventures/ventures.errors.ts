import { ApiError } from "@/src/errors/ApiError";

export const invalidField = (
  field: string,
  rule: string,
  message: string,
): ApiError => new ApiError(400, message, { field, rule });
