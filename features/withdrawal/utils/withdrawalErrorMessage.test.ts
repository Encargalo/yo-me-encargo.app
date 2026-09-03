import { getWithdrawalErrorMessage } from "./withdrawalErrorMessage";

describe("getWithdrawalErrorMessage", () => {
  it("422 → saldo insuficiente", () => {
    expect(getWithdrawalErrorMessage(422)).toBe("Tu saldo es insuficiente para retirar.");
  });

  it("401 → sesión expirada", () => {
    expect(getWithdrawalErrorMessage(401)).toBe("Tu sesión expiró. Vuelve a iniciar sesión.");
  });

  it("503 → tasa BCV no disponible, invita a reintentar", () => {
    expect(getWithdrawalErrorMessage(503)).toBe(
      "No pudimos obtener la tasa del día. Intenta en unos minutos.",
    );
  });

  it("otro status o sin status → mensaje genérico", () => {
    expect(getWithdrawalErrorMessage(500)).toBe("No pudimos procesar tu retiro. Intenta de nuevo.");
    expect(getWithdrawalErrorMessage(undefined)).toBe(
      "No pudimos procesar tu retiro. Intenta de nuevo.",
    );
  });
});
