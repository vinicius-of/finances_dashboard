import { describe, expect, it } from "bun:test";
import { formatMoneyToBRL } from "@/src/utils/formatMoneyToBRL";

describe("formatMoneyToBRL", () => {
  it("formata centavos como moeda brasileira", () => {
    expect(formatMoneyToBRL(0)).toBe("R$ 0,00");
    expect(formatMoneyToBRL(1)).toBe("R$ 0,01");
    expect(formatMoneyToBRL(123456789)).toBe("R$ 1.234.567,89");
  });

  it("preserva o sinal em valores negativos", () => {
    expect(formatMoneyToBRL(-123456)).toBe("-R$ 1.234,56");
  });
});
