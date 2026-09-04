## Why

La pantalla de Detalle de Orden (`app/(app)/orders/[id].tsx`) era un placeholder. El rider no tenía forma de aceptar una oferta desde ahí, ver el código de recogida, revisar los productos del pedido, ni confirmar la entrega con el código del cliente — todo el ciclo posterior a la oferta (wireframes 04/05/05b) quedaba sin construir, y el change anterior (`order-offer-overlay`) lo dejó explícitamente fuera de su alcance.

## What Changes

- Se reemplazó el placeholder de `app/(app)/orders/[id].tsx` por la pantalla real de Orden Activa, que cubre en una sola ruta toda la máquina de estados desde oferta hasta entrega confirmada:
  - **Oferta sin `riderId`**: header (con badge de estado, título y número de pedido sutil), bloques Restaurante/Cliente (icono, nombre, dirección, navegar, llamar) y comisión. Footer con botón **"Aceptar orden"** que reutiliza `acceptOrder(id)` (WS, ya existente en `ordersRiderWsService.ts`).
  - **Mía, esperando recogida**: se agregan el bloque de **código de recogida** y la **lista de productos** del pedido (embebida dentro de la card de Cliente, no como card independiente). Footer pasivo (texto informativo, sin botón) — la transición a `On The Way` la dispara el negocio desde su propio panel, no una acción del rider.
  - **`On The Way`**: el footer se reemplaza por un campo OTP para el código de entrega del cliente y confirma vía `POST /orders/{id}/confirm-delivery`, con mensaje inline propio por cada código de error (400/404/409/422).
  - **Confirmación 200**: pantalla de "Pedido completado" con resumen (cliente, distancia calculada desde la ubicación del rider, comisión) antes de volver a Inicio.
  - **Tomada por otro / no encontrada**: estado vacío sin bloquear la navegación de vuelta.
- Nuevo modelo `OrderItem`/`OrderItemFlavor`/`OrderItemAddition` en `order.types.ts`, mapeado desde `items[]` del mensaje WS de aceptación.
- Nuevo servicio `features/orders/services/orders.service.ts` para `confirm-delivery` (axios, siguiendo convención del proyecto — nunca axios directo desde componente).
- La longitud del código de entrega se centraliza en la constante `DELIVERY_CODE_LENGTH` (`order.types.ts`). El backend cambió de 6 a 4 dígitos durante la implementación de este change (confirmado en staging el 2026-07-03); la constante ya refleja el valor real (`4`).
- **Fix de contrato WS descubierto en staging**: el backend responde a `accept_order` con un mensaje `order_accepted` (no `order_update`, que era el único tipo contemplado originalmente). Sin manejarlo, el botón "Aceptar orden" quedaba colgado en "Aceptando…" indefinidamente. `OrderWsMessage` y `handleMessage` en `ordersRiderWsService.ts` ahora tratan `order_accepted` igual que `order_update`/`new_order`.
- **Fix de UX descubierto en staging**: `getStatusLabel` en `orderStatus.ts` ahora recibe `hasRider` — una orden en el bucket "pending" sin `riderId` (oferta aún no decidida) muestra "Esperando rider" en vez de "Recogida pendiente", para no confundirla visualmente con una orden ya aceptada.

## Capabilities

### New Capabilities
- `order-detail`: pantalla única de Orden Activa — aceptar oferta, ver código de recogida y productos, confirmar entrega con OTP y ver la confirmación de pedido completado.

### Modified Capabilities
<!-- Ninguna: rider-orders-home ya declara la navegación al Detalle de Orden como requisito existente; este change no le cambia comportamiento. order-offers (aún sin archivar) no se modifica en su transporte: se reutiliza acceptOrder tal cual, solo se corrige el manejo de su respuesta WS. -->

## Impact

- **Código nuevo**: `features/orders/services/orders.service.ts`, `features/orders/hooks/useOrderDetail.ts`, `features/orders/hooks/useIsKeyboardVisible.ts`, componentes de `features/orders/components/` para bloques de restaurante/cliente (`OrderPartyBlock`), código de recogida (`PickupCodeCard`), lista de productos (`OrderItemsList`), OTP de entrega (`DeliveryCodeInput`) y pantalla de completado (`OrderCompletedSummary`).
- **Código modificado**: `app/(app)/orders/[id].tsx` (placeholder → pantalla real), `features/orders/types/order.types.ts` y `features/orders/utils/mapRawOrder.ts` (items del pedido), `features/orders/utils/orderStatus.ts` (label de oferta sin rider), `features/orders/components/ActiveOrderCard.tsx` (usa el nuevo label), `features/orders/services/ordersRiderWsService.ts` (maneja `order_accepted`).
- **Dependencias reutilizadas, sin instalar nada nuevo**: `expo-linking`, `lucide-react-native`, `react-native-safe-area-context` (ya instaladas); `useRiderLocation` y `haversine.ts` (ya existentes de un change previo) se reutilizan para calcular la distancia mostrada en el resumen de completado.
- **Transporte backend**: `acceptOrder` (WS, reutilizado; su respuesta real es `order_accepted`, corregido en este change) y `POST /orders/{id}/confirm-delivery` (REST, ya documentado). No se modela transporte para "confirmar recogida": es una acción exclusiva del panel del negocio, confirmada con el usuario.
- **Riesgo cerrado**: el código de confirmación de entrega pasó de 6 a 4 dígitos durante este change (no después, como se anticipaba originalmente). `DELIVERY_CODE_LENGTH` ya vive en un único punto (`order.types.ts`) y el valor real (4) está aplicado en todo el flujo — no queda cambio pendiente de este riesgo.
