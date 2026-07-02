import { Stack } from "expo-router";

// Shell autenticado: el grupo (tabs) trae la tab bar global; orders/[id] se
// empuja por encima como pantalla full-screen SIN tab bar (wireframe 04).
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="orders/[id]" />
    </Stack>
  );
}
