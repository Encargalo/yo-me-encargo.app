import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { PasswordInput } from "@/components/PasswordInput";
import { PhoneInput } from "@/components/PhoneInput";
import { ROUTES } from "@/constants/routes";
import { useLoginForm } from "@/features/auth/hooks/useLoginForm";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export default function Login() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    localPhone,
    setLocalPhone,
    password,
    setPassword,
    errors,
    isPhoneValid,
    isSubmitting,
    apiError,
    onSubmit,
  } = useLoginForm();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(ROUTES.APP.HOME);
    }
  }, [isAuthenticated]);

  const fieldError422 = apiError?.code === 422 ? apiError.message : null;
  const generalError = apiError && apiError.code !== 422 ? apiError.message : null;

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="text-primary mb-10 text-center text-3xl font-heading-bold">YoMeEncargo</Text>

      <View className="gap-4">
        <PhoneInput
          value={localPhone}
          onChangeText={setLocalPhone}
          error={errors.phone ?? fieldError422}
        />
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          error={errors.password ?? fieldError422}
        />
      </View>

      {generalError ? (
        <Text className="font-body text-status-error mt-4 text-center text-sm">{generalError}</Text>
      ) : null}

      <View className="mt-8">
        <Button
          label="Iniciar sesión"
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={!isPhoneValid}
        />
      </View>
    </View>
  );
}
