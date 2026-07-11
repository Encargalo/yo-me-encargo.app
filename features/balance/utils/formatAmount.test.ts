import { formatAmount, formatSignedAmount } from "./formatAmount";

describe("formatAmount", () => {
  it("no muestra decimales para un entero", () => {
    expect(formatAmount(2)).toBe("2$");
    expect(formatAmount(38)).toBe("38$");
  });

  it("muestra decimales para un valor no entero", () => {
    expect(formatAmount(0.54)).toBe("0.54$");
  });

  it("formatea cero como entero", () => {
    expect(formatAmount(0)).toBe("0$");
  });
});

describe("formatSignedAmount", () => {
  it("antepone + a un valor positivo", () => {
    expect(formatSignedAmount(8.5)).toBe("+8.5$");
  });

  it("antepone − tipográfico a un valor negativo", () => {
    expect(formatSignedAmount(-1.2)).toBe("−1.2$");
  });

  it("no antepone signo a cero", () => {
    expect(formatSignedAmount(0)).toBe("0$");
  });
});
