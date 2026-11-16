import type { ICreateVentureInput } from "@/src/api/services/ventures/ventures.types";
import type { IParsedVenturePayload } from "./ventures.controller.types";
import { isVariableType } from "./ventures.utils";

export const toCreateVentureInput = (
  payload: IParsedVenturePayload,
): ICreateVentureInput => {
  const common = {
    name: payload.name,
    internalCode: payload.internalCode,
    type: payload.type,
    boughtAt: payload.boughtAt,
    expiresIn: payload.expiresIn,
  };

  if (isVariableType(payload.type)) {
    return {
      ...common,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
    };
  }

  return {
    ...common,
    initialValue: payload.initialValue,
    indexer: payload.indexer,
    rate: payload.rate,
    source: payload.source,
  };
};
