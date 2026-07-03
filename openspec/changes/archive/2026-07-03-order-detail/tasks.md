## 1. Modelo de dominio — productos del pedido

- [x] 1.1 Agregar `OrderItem`, `OrderItemFlavor`, `OrderItemAddition` a `features/orders/types/order.types.ts` (`id`, `name`, `image?`, `amount`, `flavors?`, `additions?`) y `items?: OrderItem[]` a `ActiveOrder`
- [x] 1.2 Mapear `order.items` en `mapRawOrder.ts` (fallback a `[]` si el mensaje no los trae, ej. la oferta `new_order`)
- [x] 1.3 Tests en `mapRawOrder.test.ts`: mensaje con `items[]` completos (incluyendo `flavors`/`additions`), y mensaje sin `items` (oferta) → `items: []`

## 2. Servicio REST — confirmar entrega

- [x] 2.1 Crear `features/orders/services/orders.service.ts` con `confirmDelivery(id: string, code: string): Promise<void>` usando la instancia de `lib/axios.ts`, `async/await`, tipado con genérico
- [x] 2.2 Relanzar el error como `AxiosError` (sin capturarlo silenciosamente) para que el hook orquestador lea `error.response?.status`
- [x] 2.3 Tests `orders.service.test.ts`: happy path (200) y al menos un caso de error (400) verificando que se propaga como `AxiosError`

## 3. Constante de longitud del código de entrega

- [x] 3.1 Definir `DELIVERY_CODE_LENGTH` en un único lugar (`order.types.ts`, junto a la definición de `OrderItem`)
- [x] 3.2 Usar esa constante en la validación de "código completo" y en cualquier texto/UI que mencione la cantidad de casillas — cero literales repetidos
- [x] 3.3 Actualizar el valor de `6` a `4` cuando el backend hizo el cambio en staging durante este change (único edit necesario gracias a 3.1) — completado el 2026-07-03

## 4. Fix de contrato WS — respuesta real de `accept_order`

- [x] 4.1 Agregar el tipo `order_accepted` a `OrderWsMessage` (`order.types.ts`) — mismo shape que `order_update` (`order`/`shop`/`customer` hermanos)
- [x] 4.2 Manejar `order_accepted` en el `switch` de `handleMessage` (`ordersRiderWsService.ts`), igual que `order_update`/`new_order`
- [x] 4.3 Ampliar la firma de `routeToOffers` para aceptar `"order_accepted"` como tercer `type` posible
- [x] 4.4 Test en `ordersRiderWsService.test.ts`: `order_accepted` (respuesta directa a `accept_order`) retira la oferta de la cola

## 5. Fix de UX — label de oferta sin decidir

- [x] 5.1 Agregar parámetro `hasRider` a `getStatusLabel` (`orderStatus.ts`), devuelve "Esperando rider" cuando el bucket es "pending" y no hay `riderId`
- [x] 5.2 Actualizar el call site en `ActiveOrderCard.tsx` para pasar `!!order.riderId`
- [x] 5.3 Test en `orderStatus.test.ts` para la distinción `hasRider`

## 6. Hook orquestador `useOrderDetail`

- [x] 6.1 Crear `features/orders/hooks/useOrderDetail.ts`: recibe `id`, busca la orden en `useOrdersStore.activeOrders`, deriva `stage: "not-found" | "taken" | "offer" | "pending-pickup" | "on-the-way" | "completed"` de `riderId`/`status`/`pickupCode` y de la bandera local de completado
- [x] 6.2 `accept()`: llama `acceptOrder(id)` (reusar de `ordersRiderWsService.ts`, sin tocar su transporte) y expone `accepting` mientras se espera la confirmación (`order_update` u `order_accepted`)
- [x] 6.3 `confirmDelivery()`: llama `orders.service.ts`, mapea el `AxiosError.response.status` (400/404/409/422) a un mensaje inline propio, limpia el código en 400, expone `confirming`/`deliveryError`
- [x] 6.4 Al recibir éxito de `confirmDelivery`, fija `completedSummary` con una copia de la orden en ese instante (cliente, distancia vía `useRiderLocation`+`haversineKm`, comisión) — independiente de que la orden salga de `activeOrders` al ser terminal
- [x] 6.5 Detecta "tomada por otro rider" cuando la orden visible tiene `riderId` distinto al propio mientras el stage era `"offer"` (`hadRiderIdOnMount` capturado al montar + `acceptedLocally`) — stage `"taken"` explícito
- [x] 6.6 Tests `useOrderDetail.test.ts`: derivación de cada `stage` a partir de distintas formas de `ActiveOrder`, `accept()` invoca el transporte, `confirmDelivery` mapea cada código de error a su mensaje, `completedSummary` sobrevive a que la orden desaparezca del store

## 7. Componentes UI

- [x] 7.1 `features/orders/components/OrderPartyBlock.tsx`: bloque reutilizable para Restaurante/Cliente — badge circular con icono (`Store`/`ReceiptText`) teñido con `pinColor`, nombre, dirección, botón navegar (`expo-linking`, oculto sin coordenadas) y botón llamar (`tel:`, oculto sin teléfono); acepta `children?: ReactNode` para embeber contenido adicional
- [x] 7.2 `features/orders/components/PickupCodeCard.tsx`: caja con tinte derivado de `OrderStatusColors.pending`, eyebrow `CÓDIGO DE RECOGIDA`, dígitos grandes monoespaciados
- [x] 7.3 `features/orders/components/OrderItemsList.tsx`: lista colapsable de `items[]` (nombre, cantidad, sabores/adiciones) — renderizada como `children` dentro del `OrderPartyBlock` de rol `"customer"`, sin card/chrome propio (solo un divisor)
- [x] 7.4 `features/orders/components/DeliveryCodeInput.tsx`: OTP de `DELIVERY_CODE_LENGTH` casillas — `TextInput` real superpuesto en tamaño completo (`opacity: 0`) sobre casillas decorativas `pointerEvents="none"` (fix de foco confiable en Android), teclado numérico, botón "Confirmar entrega" deshabilitado hasta completar (color = color de estado de la orden, recibido por prop), mensaje de error inline por código
- [x] 7.5 `features/orders/components/OrderCompletedSummary.tsx`: check verde (`OrderStatusColors.completed`) + resumen (cliente, distancia, comisión) + acción para volver a Inicio
- [x] 7.6 Snapshot tests de los 5 componentes presentacionales nuevos

## 8. Pantalla — integración

- [x] 8.1 Reemplazar el placeholder de `app/(app)/orders/[id].tsx` por la pantalla real: usa `useOrderDetail(id)`, arma header (badge + título + número de pedido sutil) + bloques + footer contextual según `stage`
- [x] 8.2 Stage `"offer"`: footer con botón "Aceptar orden" → `accept()`, deshabilitado durante `accepting`
- [x] 8.3 Stage `"pending-pickup"`: agrega `PickupCodeCard` (solo mientras el stage es exactamente este, no solo si hay `pickupCode`) + `OrderItemsList` embebida en la card de Cliente; footer informativo sin botón
- [x] 8.4 Stage `"on-the-way"`: footer reemplazado por `DeliveryCodeInput`
- [x] 8.5 Stage `"completed"`: reemplaza toda la pantalla por `OrderCompletedSummary`
- [x] 8.6 Stage `"not-found"`/`"taken"` ("tomada por otro"): estado vacío sin bloquear la navegación de vuelta a Inicio
- [x] 8.7 Fix de teclado: `KeyboardAvoidingView` con `style` (no `className`, NativeWind lo rompía) para que el footer suba con el teclado, con el mismo patrón confirmado en `encargalo-mobile-v2/app/address/add-address.tsx`
- [x] 8.8 Nuevo hook `useIsKeyboardVisible.ts` (booleano, no altura exacta) para alternar el `paddingBottom` del footer entre 10px (teclado visible) y el padding de reposo; test `useIsKeyboardVisible.test.ts`

## 9. Verificación

- [x] 9.1 `npx tsc --noEmit` y `npm run lint` en verde
- [x] 9.2 Revertir/eliminar el logging de debug temporal agregado a `ordersRiderWsService.ts` durante el diagnóstico del bug de `order_accepted`
- [x] 9.3 Prueba manual final con staging: aceptar desde el Detalle, ver código de recogida y productos, esperar transición a En camino, confirmar entrega con los 4 códigos de error y con éxito — validado en vivo durante la implementación (logs de WS reales, fix de `order_accepted`, OTP con 4 dígitos confirmado)
