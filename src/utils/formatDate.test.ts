import { describe, expect, it } from "bun:test";
import { formatDate } from "@/src/utils/formatDate";

describe("formatDate", () => {
  it("formata a data em dd/mm/aaaa usando UTC", () => {
    expect(formatDate(new Date("2029-03-01"))).toBe("01/03/2029");
    expect(formatDate(new Date(Date.UTC(2029, 11, 31)))).toBe("31/12/2029");
  });

  it("lança RangeError para data inválida", () => {
    expect(() => formatDate(new Date("data inválida"))).toThrow(RangeError);
  });
});
