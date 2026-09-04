import { validatePassword, validatePhone } from "./validators";

describe("validatePhone", () => {
  it("returns a valid E.164 number for a valid local number", () => {
    const result = validatePhone("3001112233", "+57");

    expect(result).toEqual({
      valid: true,
      e164: "+573001112233",
      error: null,
    });
  });

  it("rejects an empty local number", () => {
    const result = validatePhone("", "+57");

    expect(result.valid).toBe(false);
    expect(result.e164).toBeNull();
    expect(result.error).toBe("Ingresa un número de teléfono válido");
  });

  it("rejects a local number that is too short", () => {
    const result = validatePhone("123", "+57");

    expect(result.valid).toBe(false);
    expect(result.e164).toBeNull();
  });
});

describe("validatePassword", () => {
  it("accepts a non-empty password", () => {
    const result = validatePassword("claveSegura123");

    expect(result).toEqual({ valid: true, error: null });
  });

  it("rejects an empty password", () => {
    const result = validatePassword("");

    expect(result).toEqual({
      valid: false,
      error: "Ingresa tu contraseña",
    });
  });
});
