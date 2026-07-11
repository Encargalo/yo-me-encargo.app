// POST /riders/withdrawal no manda un cuerpo estructurado en sus errores (a
// diferencia de confirm-delivery) — el mensaje se escribe acá, por código de
// status, y se revisita si el backend empieza a mandar uno real (ver
// design.md, Decisión 6).
export function getWithdrawalErrorMessage(status?: number): string {
  if (status === 422) {
    return "Tu saldo es insuficiente para retirar.";
  }
  if (status === 401) {
    return "Tu sesión expiró. Vuelve a iniciar sesión.";
  }
  return "No pudimos procesar tu retiro. Intenta de nuevo.";
}
