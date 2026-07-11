## 1. Dependencia

- [x] 1.1 Instalar `lottie-react-native` con npm (compatible con Expo SDK 54 — usar `npx expo install lottie-react-native` para la versión alineada).

## 2. Datos del resumen

- [x] 2.1 Agregar `orderNumber?: number` y `shopName?: string` a `CompletedSummary` (`features/orders/hooks/useOrderDetail.ts`).
- [x] 2.2 Capturar `orderNumber` (`order.number`) y `shopName` (`order.shop.name`) dentro de `confirmDelivery`, junto al resto del resumen, antes de que la orden pueda salir del store.

## 3. `OrderCompletedSummary` — animación e ícono

- [x] 3.1 Envolver el contenido en `Animated.View` (`react-native-reanimated`) con una animación de entrada tipo `entering={FadeIn...}` (+ slide sutil), reemplazando la aparición instantánea actual.
- [x] 3.2 Reemplazar el `View` con `backgroundColor` + `CheckCircle` (lucide) por `LottieView` (`lottie-react-native`) apuntando a `assets/animations/Success.json`, con `autoPlay` y `loop={false}`, sin `colorFilters` (colores del asset tal cual).
- [x] 3.3 Ajustar el tamaño del `LottieView` para que el check y el efecto de luz se vean claramente (mayor que los 64px del círculo anterior).

## 4. Contexto de la orden y espaciado

- [x] 4.1 Agregar debajo del título "Pedido completado" un texto sutil con el número de orden y el nombre del restaurante (ocultando el segmento correspondiente si el dato no está disponible, sin placeholder genérico).
- [x] 4.2 Aumentar la separación interna de la tarjeta cliente/distancia/comisión (de `gap-2` a `gap-[18px]`), sin tocar el padding del contenedor ni el tamaño de fuente.

## 5. Footer del botón "Volver a Inicio"

- [x] 5.1 Reestructurar `OrderCompletedSummary` en dos zonas: contenido centrado (ícono, título, subtítulo, tarjeta) y footer fijo abajo.
- [x] 5.2 Aplicar al footer el mismo patrón que `app/(app)/orders/[id].tsx` (`border-t border-hair bg-white px-4 pt-3`, `paddingBottom: Math.max(insets.bottom, 16) + 12` vía `useSafeAreaInsets`).

## 6. Tests

- [x] 6.1 Actualizar `OrderCompletedSummary.test.tsx` para cubrir: número de orden y restaurante mostrados cuando están presentes, y omitidos cuando faltan.
- [x] 6.2 Verificar si `jest-expo` requiere mock adicional para `react-native-reanimated` y/o `lottie-react-native`; agregarlo en `jest.setup.js` o en el test si el render falla sin él. (No hizo falta mock: jest-expo ya lo resuelve. Sí fue necesario envolver el render en `SafeAreaProvider` con `initialMetrics`, por el nuevo uso de `useSafeAreaInsets`.)
- [x] 6.3 Regenerar el snapshot de `OrderCompletedSummary.test.tsx.snap` tras los cambios de layout.
- [x] 6.4 Correr `npx tsc --noEmit` y `npm run lint`. (Ambos limpios; el único warning de lint es preexistente en `.expo/types/router.d.ts`, no relacionado a este change. También se actualizó `useOrderDetail.test.ts`, que ya esperaba el shape completo de `completedSummary`.)

## 7. Verificación manual

- [x] 7.1 Completar el flujo real (aceptar orden → OTP → confirmar) en el simulador/dispositivo y confirmar que la animación de entrada, el Lottie, el subtítulo y el footer se ven como se espera. (Verificado por el usuario.)
