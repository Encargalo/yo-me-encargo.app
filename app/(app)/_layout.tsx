import { Stack } from "expo-router";
import { Fragment } from "react";

import { OrderOfferOverlay } from "@/features/orders/components/OrderOfferOverlay";

// Shell autenticado: el grupo (tabs) trae la tab bar global; orders/[id] se
// empuja por encima como pantalla full-screen SIN tab bar (wireframe 04).
// OrderOfferOverlay se monta como hermano del Stack para interrumpir cualquier
// pantalla (tabs o detalle) con el overlay de nueva orden (wireframe 03).
export default function AppLayout() {
  return (
    <Fragment>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="withdrawal" />
      </Stack>
      <OrderOfferOverlay />
    </Fragment>
  );
}
