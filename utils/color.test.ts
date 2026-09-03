import { withAlpha } from "./color";

describe("withAlpha", () => {
  it("convierte un hex de 6 dígitos en rgba con el alfa dado (happy path)", () => {
    expect(withAlpha("#2563eb", 0.5)).toBe("rgba(37, 99, 235, 0.5)");
    expect(withAlpha("2563eb", 1)).toBe("rgba(37, 99, 235, 1)");
  });

  it("acota el alfa al rango [0, 1]", () => {
    expect(withAlpha("#ffffff", 5)).toBe("rgba(255, 255, 255, 1)");
    expect(withAlpha("#ffffff", -2)).toBe("rgba(255, 255, 255, 0)");
  });

  it("devuelve el valor original si no es un hex de 6 dígitos (caso de error)", () => {
    expect(withAlpha("rgb(1,2,3)", 0.5)).toBe("rgb(1,2,3)");
    expect(withAlpha("#abc", 0.5)).toBe("#abc");
  });
});
