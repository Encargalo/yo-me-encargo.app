import { lightenColor } from "./color";

describe("lightenColor", () => {
  it("mezcla hacia blanco con un ratio conocido", () => {
    // #f59e0b (245, 158, 11) con ratio 0.5 → mitad de camino a 255 en cada canal
    // r: 245 + (255-245)*0.5 = 250 (0xfa) | g: 158 + (255-158)*0.5 = 206.5 → 207 (0xcf) | b: 11 + (255-11)*0.5 = 133 (0x85)
    expect(lightenColor("#f59e0b", 0.5)).toBe("#facf85");
  });

  it("ratio 0 devuelve el color original", () => {
    expect(lightenColor("#f59e0b", 0)).toBe("#f59e0b");
  });

  it("ratio 1 devuelve blanco", () => {
    expect(lightenColor("#3b82f6", 1)).toBe("#ffffff");
  });

  it("clampea ratios fuera de [0,1]", () => {
    expect(lightenColor("#3b82f6", 2)).toBe("#ffffff");
    expect(lightenColor("#3b82f6", -1)).toBe("#3b82f6");
  });

  it("devuelve el input tal cual si no matchea el formato hex esperado", () => {
    expect(lightenColor("not-a-color", 0.5)).toBe("not-a-color");
  });
});
