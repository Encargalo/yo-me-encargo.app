import { haversineKm } from "./haversine";

describe("haversineKm", () => {
  it("da 0 para el mismo punto", () => {
    const p = { latitude: 10.48, longitude: -66.9 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it("calcula una distancia corta conocida (~1.5 km)", () => {
    // ~0.0134° de latitud ≈ 1.5 km
    const a = { latitude: 10.18, longitude: -66.82 };
    const b = { latitude: 10.1934, longitude: -66.82 };
    expect(haversineKm(a, b)).toBeCloseTo(1.49, 1);
  });

  it("es simétrica", () => {
    const a = { latitude: 10.18, longitude: -66.82 };
    const b = { latitude: 10.2, longitude: -66.8 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
});
