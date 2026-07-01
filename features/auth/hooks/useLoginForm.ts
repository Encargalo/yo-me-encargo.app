import { useEffect, useState } from "react";

import { useAuthStore } from "../store/useAuthStore";
import { validatePassword, validatePhone } from "../utils/validators";

const COUNTRY_CODE = "+57";

interface LoginFormErrors {
  phone: string | null;
  password: string | null;
}

export function useLoginForm() {
  const [localPhone, setLocalPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({
    phone: null,
    password: null,
  });

  const login = useAuthStore((s) => s.login);
  const isSubmitting = useAuthStore((s) => s.isLoading);
  const apiError = useAuthStore((s) => s.error);

  const isPhoneValid = validatePhone(localPhone, COUNTRY_CODE).valid;

  useEffect(() => {
    if (isPhoneValid) {
      setErrors((prev) => (prev.phone ? { ...prev, phone: null } : prev));
    }
  }, [isPhoneValid]);

  const onSubmit = async () => {
    const phoneResult = validatePhone(localPhone, COUNTRY_CODE);
    const passwordResult = validatePassword(password);

    if (!phoneResult.valid || !phoneResult.e164 || !passwordResult.valid) {
      setErrors({ phone: phoneResult.error, password: passwordResult.error });
      return;
    }

    setErrors({ phone: null, password: null });
    await login(phoneResult.e164, password);
  };

  return {
    countryCode: COUNTRY_CODE,
    localPhone,
    setLocalPhone,
    password,
    setPassword,
    errors,
    isPhoneValid,
    isSubmitting,
    apiError,
    onSubmit,
  };
}
