import { ApiError } from "@/src/errors/ApiError";

export const snapshotNotFound = (id: string): ApiError =>
  new ApiError(404, "Snapshot não encontrado", { id });

export const ventureNotFound = (id: string): ApiError =>
  new ApiError(404, "Venture não encontrada", { id });
