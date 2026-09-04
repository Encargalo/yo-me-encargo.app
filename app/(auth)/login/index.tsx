import { ArrowLeft, Call } from "encargalo-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { ROUTES } from "@/constants/routes";
import { Colors } from "@/constants/theme";
import { RegisterConductorButton } from "@/features/auth/components/RegisterConductorButton";
import { RiderLoginHeader } from "@/features/auth/components/RiderLoginHeader";

export default function LoginRidersHub() {
  return (
    <RiderLoginHeader>
      <Button
        label="Continuar con tu teléfono"
        variant="green"
        leftIcon={<Call size={20} color={Colors.superficie} />}
        onPress={() => router.push(ROUTES.AUTH.LOGIN_PHONE)}
      />

      <View className="mt-[26px] flex-row items-center gap-[12px]">
        <View className="h-px flex-1 bg-borde" />
        <Text className="font-body text-[13px] text-texto-suave">¿Aún no tienes cuenta?</Text>
        <View className="h-px flex-1 bg-borde" />
      </View>

      <View className="mt-[17px]">
        <RegisterConductorButton onPress={() => router.push(ROUTES.AUTH.REGISTER_RIDER_SOON)} />
      </View>

      <View className="mt-auto">
        <View className="-mx-[17px] h-px bg-borde-suave" />
        <View className="mt-[17px]">
          <Button
            label="Cambiar a modo pasajero"
            variant="secondary"
            leftIcon={<ArrowLeft size={20} color={Colors.textoSuave} />}
            onPress={() => router.replace(ROUTES.AUTH.SELECT_MODE)}
          />
        </View>
      </View>
    </RiderLoginHeader>
  );
}
