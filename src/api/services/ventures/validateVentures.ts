import { VentureCategory, VentureType } from "@/contracts";
import { ApiError } from "@/src/errors/ApiError";
import { invalid } from "./ventures.errors";
import type { ICreateVentureInput } from "./ventures.types";
import { resolveCategory } from "./ventures.utils";

export const validateVentures = (data: ICreateVentureInput): void => {
  const category = data.category ?? resolveCategory(data.type);

  if (typeof data.name !== "string" || data.name.trim() === "") {
    throw invalid("name é obrigatório", "name", "required");
  }

  if (Number.isNaN(data.boughtAt.getTime())) {
    throw new ApiError(400, "boughtAt inválida", {
      field: "boughtAt",
      rule: "date",
    });
  }

  if (data.expiresIn && Number.isNaN(data.expiresIn.getTime())) {
    throw new ApiError(400, "expiresIn inválida", {
      field: "expiresIn",
      rule: "date",
    });
  }

  if (data.boughtAt.getTime() > Date.now()) {
    throw invalid(
      "boughtAt não pode estar no futuro",
      "boughtAt",
      "not_future",
    );
  }

  if (data.type === VentureType.STOCK && data.expiresIn !== undefined) {
    throw invalid("STOCK não pode ter expiresIn", "expiresIn", "incompatible");
  }

  if (category === VentureCategory.FIXED) {
    if (data.initialValue === undefined) {
      throw invalid(
        "initialValue é obrigatório para renda fixa",
        "initialValue",
        "required",
      );
    }

    if (!Number.isInteger(data.initialValue) || data.initialValue < 0) {
      throw invalid(
        "initialValue não pode ser negativo",
        "initialValue",
        "min",
      );
    }

    if (data.indexer === undefined) {
      throw invalid(
        "indexer é obrigatório para renda fixa",
        "indexer",
        "required",
      );
    }

    if (data.rate === undefined) {
      throw invalid("rate é obrigatório para renda fixa", "rate", "required");
    }

    if (data.source === undefined) {
      throw invalid(
        "source é obrigatório para renda fixa",
        "source",
        "required",
      );
    }
  }

  if (category === VentureCategory.VARIABLE) {
    if (data.quantity === undefined) {
      throw invalid(
        "quantity é obrigatório para renda variável",
        "quantity",
        "required",
      );
    }

    if (
      typeof data.quantity !== "number" ||
      !Number.isFinite(data.quantity) ||
      data.quantity <= 0
    ) {
      throw invalid("quantity deve ser um número positivo", "quantity", "min");
    }

    if (data.unitPrice === undefined) {
      throw invalid(
        "unitPrice é obrigatório para renda variável",
        "unitPrice",
        "required",
      );
    }

    if (!Number.isInteger(data.unitPrice) || data.unitPrice <= 0) {
      throw invalid(
        "unitPrice deve ser um inteiro positivo",
        "unitPrice",
        "min",
      );
    }

    if (data.totalPrice === undefined) {
      throw invalid(
        "totalPrice é obrigatório para renda variável",
        "totalPrice",
        "required",
      );
    }
  }
};
