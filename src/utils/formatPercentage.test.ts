import { describe, expect, it } from "bun:test";
import { formatPercentage } from "@/src/utils/formatPercentage";

describe("formatPercentage", () => {
  it("formata com sinal explícito exceto zero", () => {
    expect(formatPercentage(8.42)).toBe("+8,42%");
    expect(formatPercentage(-3.1)).toBe("-3,10%");
    expect(formatPercentage(0)).toBe("0,00%");
  });
});
