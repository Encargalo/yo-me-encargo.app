import { formatAmount, formatBs, formatRef, formatSignedBs } from "./formatAmount";

describe("formatAmount", () => {
  it("no muestra decimales para un entero", () => {
    expect(formatAmount(2, ",")).toBe("2");
    expect(formatAmount(38, ".")).toBe("38");
  });

  it("usa el separador decimal pedido", () => {
    expect(formatAmount(0.54, ",")).toBe("0,54");
    expect(formatAmount(0.54, ".")).toBe("0.54");
  });

  it("agrupa miles con punto", () => {
    expect(formatAmount(43505.03, ",")).toBe("43.505,03");
    expect(formatAmount(1000, ",")).toBe("1.000");
  });

  it("agrupa miles en valores negativos", () => {
    expect(formatAmount(-17489.82, ",")).toBe("-17.489,82");
  });

  it("acota el ruido de punto flotante a 2 decimales", () => {
    expect(formatAmount(0.1 + 0.2, ",")).toBe("0,3");
  });

  it("formatea cero como entero", () => {
    expect(formatAmount(0, ",")).toBe("0");
  });
});

describe("formatBs", () => {
  it("sufija Bs con separadores venezolanos", () => {
    expect(formatBs(43505.03)).toBe("43.505,03Bs");
  });

  it("entero sin decimales", () => {
    expect(formatBs(600)).toBe("600Bs");
  });
});

describe("formatRef", () => {
  it("prefija Ref. y sufija el símbolo de dólar", () => {
    expect(formatRef(54.5)).toBe("Ref. 54.5$");
  });
});

describe("formatSignedBs", () => {
  it("antepone + a un valor positivo", () => {
    expect(formatSignedBs(10334.89)).toBe("+10.334,89Bs");
  });

  it("antepone − tipográfico a un valor negativo, sin duplicar el signo", () => {
    expect(formatSignedBs(-17489.82)).toBe("−17.489,82Bs");
  });

  it("no antepone signo a cero", () => {
    expect(formatSignedBs(0)).toBe("0Bs");
  });
});
