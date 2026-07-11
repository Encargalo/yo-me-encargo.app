## Context

`OrderCompletedSummary` (`features/orders/components/OrderCompletedSummary.tsx`) se renderiza como una rama condicional dentro de `app/(app)/orders/[id].tsx` cuando `useOrderDetail` deriva `stage === "completed"` — no es una navegación, es un swap de subárbol de React dentro de la misma ruta. `CompletedSummary` (el resumen que recibe como prop) se calcula una sola vez, en `confirmDelivery` (`useOrderDetail.ts`), precisamente para no depender de que la orden siga viva en `useOrdersStore` — el store borra la orden de `activeOrders` en cuanto el WS reporta un estado terminal (`upsertOrder`, `useOrdersStore.ts:48-53`), lo cual puede pasar antes o durante el render de esta pantalla.

`react-native-reanimated` (~4.1.1) y `react-native-worklets` (0.5.1) ya están instalados pero sin ningún uso real en el código — este change es su primer consumidor. `babel-preset-expo` en SDK 54 configura el plugin de Reanimated/worklets automáticamente, así que no hace falta tocar `babel.config.js`.

`lottie-react-native` no está instalado. El asset `assets/animations/Success.json` ya existe (exportado de LottieFiles) y trae dos capas: un trazo blanco tipo check con trim-path animado, y una forma de fondo (polystar) rellena en verde `#1cc70e` con un efecto de light-sweep — es decir, el asset ya incluye su propio "círculo" de fondo, no es solo el ícono del check.

## Goals / Non-Goals

**Goals:**
- La transición hacia "Pedido completado" se siente intencional (anima al entrar) en vez de aparecer de golpe.
- El ícono de éxito pasa de `CheckCircle` (lucide, estático) a la animación Lottie del asset ya provisto.
- El rider ve de un vistazo, sin buscar, el número de orden y el restaurante al llegar a esta pantalla — refuerza que está viendo el resumen correcto.
- El botón "Volver a Inicio" queda anclado a un footer, consistente con el resto de la app (que ya usa footers fijos con `border-t` + padding de área segura en `[id].tsx`).

**Non-Goals:**
- No se cambia el routing: sigue siendo un swap de estado en la misma ruta, no una pantalla nueva (decisión explícita: evitar la complejidad de serializar el resumen como route params y de re-registrar rutas de expo-router para un caso que Reanimated resuelve sin tocar navegación).
- No se retinta el verde del Lottie al `OrderStatusColors.completed` oficial — se usa el asset tal cual viene (decisión explícita del usuario).
- No se toca el resto de la máquina de estados de `useOrderDetail` (`offer`/`pending-pickup`/`on-the-way`/`taken`/`not-found`).

## Decisions

### 1. Animación de entrada con Reanimated, no navegación nueva
`Animated.View` (de `react-native-reanimated`) con la prop `entering` (p. ej. `FadeIn.duration(350)` combinado con un `SlideInDown` corto) envolviendo el contenido de `OrderCompletedSummary`. Como el componente se monta recién cuando `stage` pasa a `"completed"` (no existía antes en el árbol), la animación de entrada de Reanimated se dispara sola al montar — no hace falta lógica adicional de "trigger".
- **Alternativa descartada**: navegar a una ruta nueva (`orders/[id]/completed`) para heredar la transición nativa del stack. Requiere convertir `orders/[id].tsx` en carpeta (`index.tsx` + `completed.tsx`), serializar `CompletedSummary` como route params (string-only) y decidir cómo/dónde disparar el `router.replace` (hoy `confirmDelivery` es un IIFE async dentro del hook, no un lugar donde hoy se navegue). Se descarta por alcance: el usuario prefirió explícitamente la opción de Reanimated para no tocar rutas.

### 2. `CompletedSummary` gana `orderNumber` y `shopName`, capturados en `confirmDelivery`
Mismo patrón que `customerName`/`distanceKm`/`deliveryFee` ya existente (`useOrderDetail.ts:108-112`): se leen de `order.number` y `order.shop.name` en el momento del 200, no en el render de `OrderCompletedSummary`, porque `order` puede volverse `undefined` (la orden sale del store) para cuando esta pantalla se pinta.
- **Alternativa descartada**: leer `order.number`/`order.shop.name` directamente en `OrderDetail` (el componente de ruta) al momento de renderizar la rama `completed`. Se descarta porque reintroduce la dependencia con el store que el diseño original evitó a propósito (mismo riesgo de carrera con el WS).

### 3. Lottie sin retintar, tamaño ~120×120
`LottieView` de `lottie-react-native`, `source={require(".../Success.json")}`, `autoPlay`, `loop={false}`, sin `colorFilters` (se deja el verde `#1cc70e` del asset). Tamaño sugerido ~120×120 (vs. los 64px del círculo + 36px del ícono actual) porque la composición del Lottie (1000×1000) incluye su propio padding interno considerable — a 64px el check y el light-sweep se verían demasiado pequeños para notarse. Reemplaza por completo el `View` con `backgroundColor` + `CheckCircle` actual (el Lottie ya trae su fondo).

### 4. Footer fijo, mismo patrón que `[id].tsx`
`OrderCompletedSummary` deja de ser una sola columna centrada (`flex-1 items-center justify-center`) y pasa a dos zonas: contenido centrado arriba/medio (ícono, título, subtítulo, tarjeta) y un footer (`border-t border-hair bg-white px-4 pt-3`, `paddingBottom: Math.max(insets.bottom, 16) + 12`) con el botón "Volver a Inicio" — mismo cálculo de padding que ya usa `[id].tsx` para su footer, vía `useSafeAreaInsets`.

### 5. Espaciado de la tarjeta: `gap-2` (8px) → `gap-[18px]`
Ajuste puntual de clase NativeWind (valor arbitrario soportado en v4), sin cambiar el padding del contenedor (`p-4`) ni el tamaño de fuente de las filas.

## Risks / Trade-offs

- **[Riesgo] Mocks de testing**: ni `react-native-reanimated` ni `lottie-react-native` tienen mock configurado hoy en `jest.setup.js` (ninguno se usaba antes). → Mitigación: al implementar, verificar si `jest-expo` ya resuelve `Animated.View`/`entering` sin mock adicional (Reanimated v4 sobre la nueva arquitectura suele funcionar en Jest sin mock explícito porque cae a la implementación de JS); si `LottieView` falla en render de test (dependencia nativa), mockear `lottie-react-native` en `jest.setup.js` o vía `jest.mock` en el test del componente, siguiendo el árbol de decisión de testing del proyecto (integration test sobre el componente, no snapshot ciego a la animación).
- **[Riesgo] Nombre de restaurante ausente**: igual que `customerName` hoy, `order.shop.name` puede venir vacío (el WS de aceptación no siempre trae nombre real, ver `ActiveOrderCard.tsx:26`). → Mitigación: el subtítulo oculta el segmento de restaurante si `shopName` es falsy, igual que ya hace el resto de la pantalla con sus fallbacks opcionales (no se fuerza un placeholder "Restaurante").

## Open Questions

- Duración/curva exacta de la animación de entrada (se deja a criterio de implementación dentro de un rango corto, 300–400ms, consistente con el resto de la app que no tiene transiciones largas).
