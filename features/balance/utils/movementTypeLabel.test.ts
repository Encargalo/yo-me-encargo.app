import { getMovementTypeLabel } from "./movementTypeLabel";

describe("getMovementTypeLabel", () => {
  it("mapea ride_bank a Carrera", () => {
    expect(getMovementTypeLabel("ride_bank")).toBe("Carrera");
  });

  it("humaniza un tipo desconocido (snake_case → frase)", () => {
    expect(getMovementTypeLabel("platform_fee")).toBe("Platform fee");
  });

  it("no altera un tipo ya legible", () => {
    expect(getMovementTypeLabel("Bono especial")).toBe("Bono especial");
  });
});
