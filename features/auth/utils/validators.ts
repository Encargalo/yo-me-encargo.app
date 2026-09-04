import type { PasswordValidationResult, PhoneValidationResult } from "../types/auth.types";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function validatePhone(
  localNumber: string,
  countryCode: string = "+57",
): PhoneValidationResult {
  const digits = localNumber.replace(/\D/g, "");

  if (!digits) {
    return {
      valid: false,
      e164: null,
      error: "Ingresa un número de teléfono válido",
    };
  }

  const e164 = `${countryCode}${digits}`;

  if (!E164_REGEX.test(e164)) {
    return {
      valid: false,
      e164: null,
      error: "Ingresa un número de teléfono válido",
    };
  }

  return { valid: true, e164, error: null };
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { valid: false, error: "Ingresa tu contraseña" };
  }

  return { valid: true, error: null };
}
