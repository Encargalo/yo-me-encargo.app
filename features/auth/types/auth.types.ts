export interface SignInRiderRequest {
  phone_number: string;
  password: string;
}

export type AuthErrorCode = 400 | 422 | 500 | "network";

export interface AuthApiError {
  code: AuthErrorCode;
  message: string;
}

export interface PhoneValidationResult {
  valid: boolean;
  e164: string | null;
  error: string | null;
}

export interface PasswordValidationResult {
  valid: boolean;
  error: string | null;
}
