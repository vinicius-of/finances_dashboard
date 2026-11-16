import { VentureCategory, VentureType } from "@/contracts";
import type { ICreateVentureInput, VentureInput } from "./ventures.types";

export const resolveCategory = (type: VentureType): VentureCategory =>
  type === VentureType.STOCK || type === VentureType.FII
    ? VentureCategory.VARIABLE
    : VentureCategory.FIXED;

const normalizeText = (value?: string): string | undefined => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

export const normalizeVentureInput = (
  input: ICreateVentureInput,
): ICreateVentureInput => ({
  ...input,
  name: input.name.trim(),
  internalCode: normalizeText(input.internalCode),
  source: normalizeText(input.source),
  category: resolveCategory(input.type),
});

export const resolveVentureInput = (
  input: ICreateVentureInput,
): VentureInput => {
  const category = input.category ?? resolveCategory(input.type);
  const isVariable = category === VentureCategory.VARIABLE;
  const quantity = input.quantity;
  const unitPrice = input.unitPrice;
  const canDerive =
    typeof quantity === "number" && typeof unitPrice === "number";
  const totalPrice =
    isVariable && canDerive
      ? Math.round(quantity * unitPrice)
      : input.totalPrice;
  const initialValue = isVariable
    ? (totalPrice ?? input.initialValue)
    : input.initialValue;

  return {
    ...input,
    category,
    initialValue: initialValue as number,
    totalPrice,
  };
};

export const isUniqueInternalCodeError = (error: unknown): boolean =>
  error instanceof Error &&
  /UNIQUE constraint failed: ventures\.internal_code/i.test(error.message);
