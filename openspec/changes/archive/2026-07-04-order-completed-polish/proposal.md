## Why

La pantalla de "Pedido completado" (`OrderCompletedSummary`, mostrada al confirmar la entrega con 200) hoy aparece de golpe, sin transición, con un ícono genérico (`CheckCircle` de lucide) en vez de una animación de éxito, poca separación entre las filas de cliente/distancia/comisión, y un botón "Volver a Inicio" centrado en medio de la pantalla en vez de anclado a un footer. El rider no tiene ninguna señal visual de contexto (número de orden, restaurante) al llegar a esta pantalla.

## What Changes

- Se reemplaza el swap instantáneo de `stage === "completed"` por una animación de entrada con `react-native-reanimated` (fade + slide sutil) al montar `OrderCompletedSummary`, para que la transición se sienta tan cuidada como la navegación a Detalle de Orden desde Inicio.
- Se reemplaza el ícono `CheckCircle` + círculo de fondo por la animación Lottie `assets/animations/Success.json` (ya trae su propio check animado y círculo de fondo verde) — se instala `lottie-react-native` para esto.
- `CompletedSummary` (`useOrderDetail.ts`) gana dos campos nuevos: `orderNumber` y `shopName`, capturados en el momento de `confirmDelivery` (igual que `customerName`/`distanceKm`), para no depender de que la orden siga viva en el store una vez llega a estado terminal.
- Debajo del título "Pedido completado" se agrega, de forma sutil, el número de orden y el nombre del restaurante.
- Se aumenta la separación interna de la tarjeta cliente/distancia/comisión (de 8px a ~18px entre filas).
- El botón "Volver a Inicio" se mueve a un footer anclado abajo (`border-t`, fondo blanco, padding respetando el área segura), igual que el footer real de la pantalla de Detalle, en vez de quedar centrado en medio de la columna.

## Capabilities

### New Capabilities
(ninguna)

### Modified Capabilities
- `order-detail`: el requisito "Pantalla de pedido completado" gana comportamiento de animación de entrada, ícono Lottie, datos adicionales de contexto (número de orden, restaurante) y layout de footer para el botón de volver.

## Impact

- **Código modificado**: `features/orders/components/OrderCompletedSummary.tsx` (animación de entrada, Lottie, subtítulo, layout de footer, espaciado), `features/orders/hooks/useOrderDetail.ts` (`CompletedSummary` con `orderNumber`/`shopName`), `features/orders/components/OrderCompletedSummary.test.tsx` y su snapshot.
- **Dependencia nueva**: `lottie-react-native` (se instala en este change).
- **Dependencia ya instalada, primer uso real**: `react-native-reanimated` (~4.1.1) + `react-native-worklets` — el plugin de Babel ya lo configura `babel-preset-expo` en SDK 54, sin tocar `babel.config.js`.
- **Asset ya presente**: `assets/animations/Success.json` (Lottie), sin retintar sus colores.
- **Sin cambios de ruta**: la pantalla sigue siendo un swap de estado dentro de `app/(app)/orders/[id].tsx`, no una navegación nueva.
