## Context

`app/(app)/orders/[id].tsx` era un placeholder (`useLocalSearchParams` + texto "Próximamente"). El WS `/orders/rider` puebla `useOrdersStore.activeOrders` con toda orden que llega, tenga o no `riderId` propio (comportamiento heredado de `order-offer-overlay`, aceptado ahí como riesgo interino) — por eso el rider puede llegar al Detalle desde una tarjeta de Inicio que en realidad todavía es una oferta sin decidir.

Ciclo de vida real de la orden (confirmado con el usuario, incluye partes que solo son visibles desde la app de cliente / panel de negocio):

```
Pending → InPreparation → Ready (opcional) → On The Way → Completed
        ↘ Rejected (local)
```

- `Pending`: el local decide aceptar/rechazar la orden. No visible para el rider.
- `InPreparation`: el local acepta y prepara. Se genera `pickup_code` automáticamente y se notifica a riders disponibles por WS — esto ya es el `new_order`/oferta existente (`order-offer-overlay`), sin cambios en este change.
- `Ready` (opcional): el local marca los productos empacados y listos.
- `On The Way`: se dispara cuando **el negocio** valida el `pickup_code` desde **su propio panel** (no es una acción del rider app). El código queda usado y se genera un `delivery_code` que solo conoce el cliente.
- `Completed`: el cliente confirma con el `delivery_code`, que el rider teclea en la app como OTP. Ahí el backend liquida los pagos (rider 80% de la tarifa de domicilio) — fuera del alcance de este change, solo se muestra el éxito.

Payload real de `order_update` tras aceptar (confirmado por el usuario), con `items[]`, `pickup_code`, `rider_id`, `rider_accepted_at`, y `shop`/`customer` con `name`/`phone`/`address`/lat/lng como hermanos de `order` en la raíz del mensaje (mismo shape que ya mapea `mapRawOrder.ts`).

**Confirmado con pruebas en staging durante la implementación** (no anticipado en la exploración inicial): el backend responde a `accept_order` con un mensaje de tipo `order_accepted`, no `order_update`. Mismo shape (`order`/`shop`/`customer` hermanos, ya con `pickup_code`, `rider_id` e `items`), pero un `type` distinto. Sin manejarlo explícitamente, la respuesta a la aceptación se ignoraba y el botón "Aceptar orden" quedaba colgado en "Aceptando…" — se detectó con logs de WS en vivo. `OrderWsMessage` y `handleMessage` en `ordersRiderWsService.ts` tratan `order_accepted` igual que `order_update`.

**Confirmado en staging**: el backend ya cambió el código de entrega de 6 a 4 dígitos durante la ventana de implementación de este change (no "próximamente" como se anticipaba en la exploración). `DELIVERY_CODE_LENGTH` se implementó con el valor real vigente en cada momento y terminó en `4`.

## Goals / Non-Goals

**Goals:**
- Reemplazar el placeholder por una sola pantalla que cubre toda la máquina de estados: oferta → aceptada (código + productos) → en camino (OTP) → completada.
- Reutilizar el transporte ya existente (`acceptOrder` por WS, `POST /orders/{id}/confirm-delivery` por REST), corrigiendo el manejo de la respuesta real de `acceptOrder` (`order_accepted`).
- Modelar `items[]` del pedido en el dominio compartido (`ActiveOrder`) para que la lista de productos sea real, no un placeholder visual.
- Aislar la longitud del código de entrega en una única constante — el backend la cambió de 6 a 4 dígitos durante este change, y la constante absorbió ese cambio sin tocar otros archivos.
- Distinguir visualmente, en el badge de estado, una oferta sin decidir (sin `riderId`) de una orden ya aceptada, aunque ambas caigan en el mismo bucket de color ("pending"/ámbar).

**Non-Goals:**
- No se construye transporte para "confirmar recogida": confirmado con el usuario que es una acción exclusiva del panel del negocio; el rider app solo reacciona al `order_update`/`order_accepted` resultante.
- No se reorganiza `useOrdersStore`/Home para separar ofertas de órdenes activas (sigue siendo la "doble fuente" aceptada en `order-offer-overlay`).
- No se construye pantalla de error/retry para `GET /orders/{id}` — no existe ese endpoint; el detalle depende exclusivamente de lo que ya haya en `useOrdersStore` vía WS.

## Decisions

### 1. Estado de la pantalla derivado, no una máquina de estados explícita separada
El componente no mantiene un enum de "pantalla actual": deriva qué bloque mostrar directamente de `order.status`, `order.riderId` y `order.pickupCode`, más un puñado de banderas locales (`accepting`, `acceptedLocally`, `otpCode`, `deliveryError`, `completedSummary`). El hook `useOrderDetail(id)` en `features/orders/hooks/` centraliza esta derivación y expone al componente presentacional un objeto ya resuelto (`{ order, stage, accept, confirmDelivery, ... }`), donde `stage` es `"not-found" | "taken" | "offer" | "pending-pickup" | "on-the-way" | "completed"`.
- **Por qué**: el estado real ya vive en `useOrdersStore` (vía WS); duplicarlo en una máquina de estados local arriesga desincronización. Derivar es más simple y ya sigue el patrón de `orderStatus.ts` (buckets derivados de `status`).
- **Alternativa descartada**: state machine explícita (XState o reducer con estados nombrados) — sobre-ingeniería para stages derivables de campos que ya existen.

### 2. `stage: "completed"` se sostiene con estado local, no con el store
Al llegar el `200` de `confirm-delivery`, la orden pasa a `Completed` (terminal) y `useOrdersStore.upsertOrder` la retira de `activeOrders` en el próximo `order_update`. Si la pantalla derivara `stage` solo del store, el resumen de éxito desaparecería apenas llegue ese mensaje (o instantáneamente, si el `200` del REST ya no encuentra la orden). Por eso, al recibir `200`, el hook fija `completedSummary` (copia local con `customerName`, `distanceKm`, `deliveryFee` calculados en ese instante) que no depende de que la orden siga en el store. La distancia se calcula reutilizando `useRiderLocation` + `haversineKm` (ya existentes de un change previo, no se agregó dependencia nueva).
- **Por qué**: la fuente de verdad del stage "completado, mostrando resumen" es la respuesta REST exitosa, no el store — son eventos distintos (confirmación propia vs. eco del WS).

### 3. Nuevo servicio `orders.service.ts` solo para `confirm-delivery`
`features/orders/services/orders.service.ts` expone `confirmDelivery(id, code): Promise<void>`, usando la instancia de `lib/axios.ts`, `async/await`, y relanzando el error tipado como `AxiosError` para que el hook mapee `response.status` a los 4 mensajes inline (400/404/409/422). `acceptOrder` NO se mueve aquí: sigue en `ordersRiderWsService.ts` porque es WS, no REST.
- **Por qué separar de `ordersRiderWsService.ts`**: ese archivo es explícitamente el transporte WS; mezclar una llamada REST ahí rompería la separación que motivó su nombre.

### 4. Constante `DELIVERY_CODE_LENGTH` centralizada
`DELIVERY_CODE_LENGTH` vive en un único lugar (`order.types.ts`, junto a `OrderItem`). El componente de OTP (`DeliveryCodeInput`), la validación de "código completo" para habilitar "Confirmar entrega", y el texto de casillas leen de esa constante — cero literales repetidos. El valor cambió de `6` a `4` a mitad de la implementación de este change (backend lo actualizó en staging); el único edit necesario fue esa línea.
- **Por qué**: exactamente el escenario anticipado — centralizar el valor hizo el cambio real de 6→4 trivial cuando ocurrió, en vez de "próximamente".

### 5. Footer del stage `"pending-pickup"` es informativo, sin acción
Confirmado con el usuario: el rider no confirma nada en este stage — el negocio valida el `pickup_code` en su propio panel, y eso dispara el `order_update`/`order_accepted` a `On The Way` que el WS ya empuja. El footer muestra un texto (ej. "Muestra este código en el negocio"), sin botón deshabilitado ni acción pendiente. El bloque `PickupCodeCard` solo se muestra mientras `stage === "pending-pickup"` (desaparece apenas la orden pasa a `On The Way`, aunque el WS siga mandando el campo).
- **Por qué no un botón deshabilitado**: un botón deshabilitado sugiere una acción futura del rider que no existe; el texto informativo es más honesto sobre quién actúa.

### 6. Bloques Restaurante/Cliente: icono coloreado en vez de pin con letra
Revisado con el usuario tras la primera implementación: en vez del pin en forma de gota (A/B) de `OrderOfferModal`/`OrdersMap`, cada bloque (`OrderPartyBlock`) usa un badge circular con icono — `Store` para Restaurante, `ReceiptText` para Cliente — teñido con `pinColor` (`OrderStatusColors.pending`/`.enroute`), misma paleta `Neutrals` y mismos tokens de tipografía mono para eyebrows. Navegar (`Navigation`) abre el mapa nativo con `expo-linking` (`Linking.openURL` con URL de Google Maps); llamar (`Phone`) abre `tel:<phone>`. Ambos botones se ocultan (no se deshabilitan) si falta el dato.
- **Por qué el cambio de pin a icono**: el pin con letra (A/B) tiene sentido en el mapa (`OrdersMap`) para distinguir marcadores en una superficie 2D, pero en una card de detalle un icono semántico (tienda / recibo) comunica el rol sin necesitar la referencia cruzada al mapa.

### 7. `items[]` en el dominio compartido, mapeo defensivo, embebido en la card de Cliente
`OrderItem { id, name, image?, amount, flavors?: OrderItemFlavor[], additions?: OrderItemAddition[] }` y `OrderItemFlavor`/`OrderItemAddition { id, name, amount }` se agregaron a `order.types.ts`; `mapRawOrder.ts` mapea `order.items` con fallback a `[]` si el mensaje no los trae (ej. en la oferta `new_order`, que no incluye items todavía). `OrderItemsList` es una lista colapsable, y se renderiza como `children` dentro de `OrderPartyBlock` (rol `"customer"`) en vez de ser una card independiente — decisión posterior a la primera implementación, para que productos y datos del cliente vivan en la misma card visual. `OrderPartyBlock` acepta `children?: ReactNode` para esto; `OrderItemsList` perdió su chrome propio (ahora es un divisor `border-t`, no una card con borde propio).
- **Por qué en el dominio compartido y no local al Detalle**: mismo criterio que `pickupCode`/`riderId` — el mapeo del payload crudo vive en un único lugar (`mapRawOrder.ts`), nunca en un componente.
- **Por qué embebido y no card separada**: pedido explícito del usuario tras ver el layout inicial — visualmente productos y cliente son la misma "entrega", no dos bloques distintos.

### 8. Teclado: `KeyboardAvoidingView` con `style`, no `className`
El primer intento de mostrar el `DeliveryCodeInput` en el footer sin que el teclado lo tapara falló con NativeWind `className` sobre `KeyboardAvoidingView` — el padding no se recalculaba al mostrarse el teclado. Se descartó la hipótesis de que fuera un problema de `edgeToEdgeEnabled: true` (Android) al confirmar que `encargalo-mobile-v2/app/address/add-address.tsx` usa el mismo `KeyboardAvoidingView` con el mismo `edgeToEdgeEnabled: true` y funciona correctamente — la única diferencia real era `style` (RN plano) vs `className` (NativeWind). Se revirtió a `style` para el contenedor del footer y la pantalla completa.
Además, se agregó `useIsKeyboardVisible()` (hook nuevo, `features/orders/hooks/`) — expone solo un booleano (no el alto exacto del teclado, que `KeyboardAvoidingView` ya resuelve) — para alternar el `paddingBottom` del footer entre 10px (teclado visible, pegado a él) y el padding de reposo basado en `insets.bottom`.
- **Por qué no medir el alto exacto**: un hook anterior (`useKeyboardHeight`, descartado y eliminado) intentaba esto y era redundante una vez `KeyboardAvoidingView` funcionaba correctamente — solo se necesitaba un booleano para elegir entre dos paddings fijos.

### 9. OTP: input real superpuesto, invisible, sobre casillas decorativas
El primer approach (`TextInput` de tamaño cero, enfocado por `ref.current.focus()` desde un `Pressable`) era poco confiable en Android tras el primer toque. `DeliveryCodeInput` ahora posiciona un `TextInput` real de tamaño completo (`StyleSheet.absoluteFill`, `opacity: 0`) directamente sobre las casillas visuales, que pasan a ser `pointerEvents="none"` — el toque cae siempre sobre el input nativo.
- **Por qué**: patrón estándar para inputs tipo OTP en RN; evita depender de que `.focus()` imperativo funcione de forma consistente entre plataformas.

## Risks / Trade-offs

- **No hay `GET /orders/{id}`** → si el rider entra por deep link a un id que no está en `useOrdersStore` (ej. app recién abierta, WS aún no reenvió la ráfaga), el Detalle no tiene datos que mostrar. Se acepta el estado `"not-found"` en vez de bloquear; no se construye un endpoint que no existe.
- **Doble fuente Home/Ofertas (heredado)**: el Detalle puede mostrarse para una orden que otro rider acaba de tomar (llega una actualización con `rider_id` ajeno mientras el rider mira el Detalle). Se refleja como `stage: "taken"` — no se puede "Aceptar orden"; se muestra el estado correspondiente en vez de un error. La distinción "mía vs. de otro" usa `hadRiderIdOnMount` (capturado una sola vez al montar) + `acceptedLocally`, porque no hay forma de conocer el id del rider actual desde el cliente.
- **`completedSummary` con copia local puede desalinearse si el rider re-entra a la pantalla después de navegar fuera** → aceptado: el resumen de completado es de un solo uso (se muestra una vez, inmediatamente después del `200`); si el rider vuelve a entrar a esa ruta más tarde, la orden ya no está en el store (terminal) y se trata como `"not-found"`, no como completado.
- **Logging de debug del WS** (`DEBUG` en `ordersRiderWsService.ts`) se activó temporalmente durante este change para diagnosticar el bug de `order_accepted` en staging con logs en vivo; ya se revirtió a `false` antes de cerrar el change.

## Open Questions

Ninguna pendiente. Las dos incógnitas detectadas durante la exploración inicial (transporte de "confirmar recogida" y contrato de aceptar) quedaron resueltas: la primera no existe del lado rider, la segunda se corrigió al descubrir que la respuesta real es `order_accepted`, no `order_update`.
