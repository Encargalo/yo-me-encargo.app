import { formatBs, formatRef, formatSignedBs } from "./formatAmount";

describe("formatBs", () => {
  it("no muestra decimales para un entero, con separador de miles", () => {
    expect(formatBs(3200)).toBe("3.200Bs");
    expect(formatBs(600)).toBe("600Bs");
  });

  it("muestra decimales (coma) para un valor no entero", () => {
    expect(formatBs(1280.5)).toBe("1.280,5Bs");
    expect(formatBs(165723.32)).toBe("165.723,32Bs");
  });

  it("formatea cero", () => {
    expect(formatBs(0)).toBe("0Bs");
  });

  it("limita el ruido de punto flotante a 2 decimales", () => {
    expect(formatBs(0.1 + 0.2)).toBe("0,3Bs");
  });
});

describe("formatSignedBs", () => {
  it("antepone + a un valor positivo", () => {
    expect(formatSignedBs(1280)).toBe("+1.280Bs");
  });

  it("antepone − tipográfico a un valor negativo y usa el valor absoluto", () => {
    expect(formatSignedBs(-1280.5)).toBe("−1.280,5Bs");
  });

  it("no antepone signo a cero", () => {
    expect(formatSignedBs(0)).toBe("0Bs");
  });
});

describe("formatRef", () => {
  it("incluye prefijo 'Ref.' y símbolo '$', con punto de miles", () => {
    expect(formatRef(80)).toBe("Ref. 80$");
    expect(formatRef(1000)).toBe("Ref. 1.000$");
  });

  it("conserva los decimales (no redondea a entero)", () => {
    expect(formatRef(14.7)).toBe("Ref. 14.7$");
  });

  it("formatea cero", () => {
    expect(formatRef(0)).toBe("Ref. 0$");
  });
});
