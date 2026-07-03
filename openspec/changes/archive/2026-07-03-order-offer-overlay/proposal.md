## Why

Hoy toda orden que llega por el WebSocket `/orders/rider` (tanto ofertas `new_order` como actualizaciones `order_update`) cae en la misma lista de "órdenes activas" del Home, sin que el rider decida si la toma. El wireframe 03 exige que una **oferta nueva** interrumpa cualquier pantalla con un overlay urgente donde el rider **acepta o rechaza** antes de que la orden pase a ser suya. Falta el concepto de "oferta pendiente de decisión" y todo su flujo (cola, temporizador, aceptar/rechazar, cierre cuando otro rider la toma).

## What Changes

- Nuevo concepto de dominio **oferta**: una orden `new_order` que aún no tiene `rider_id` asignado y espera decisión del rider. Se modela en un store propio (`useOffersStore`), **sin** tocar el store/lista actual del Home (esa reorganización es un change futuro).
- El WS enruta `new_order` hacia una **cola de ofertas** (además de su comportamiento actual). Detecta que una oferta encolada dejó de estar disponible cuando reaparece con `rider_id` no vacío (la tomó alguien) y la quita.
- **Overlay global (Modal de React Native)** montado en `app/(app)/_layout.tsx`, sobre tabs y detalle: interrumpe cualquier pantalla, muestra una oferta a la vez (FIFO), con temporizador circular regresivo de **15 s**, comisión destacada en **USD** (`delivery_fee`), y dos acciones grandes en la zona del pulgar: **Rechazar** / **Aceptar**. Sin gesto de swipe: solo cierra por botón o timeout.
- **Aceptar/Rechazar** se envían como mensajes salientes por el mismo WS (hipótesis aislada, patrón `setAvailability`): `accept_order` / `reject_order`.
- **Cierre automático** cuando: el temporizador llega a 0 (rechazo implícito) o la oferta visible es tomada por otro rider (`rider_id` llega distinto/no vacío). En ambos casos se muestra la siguiente en cola.
- **Dedupe obligatorio**: un set de ids ya decididos evita re-abrir ofertas cuando el backend re-manda la ráfaga al reconectar.
- **Fatiga de rechazos**: 10 rechazos **explícitos** consecutivos (solo el botón Rechazar; timeout y "la tomó otro" no cuentan) suspenden los overlays. La suspensión se levanta a los **5 min** o cuando el rider vuelve a poner la app en primer plano (`AppState → active`), lo que ocurra primero.
- Extensiones menores al modelo compartido: `ActiveOrder` gana `riderId?`; `mapRawOrder` mapea `rider_id`.

## Capabilities

### New Capabilities
- `order-offers`: recepción de ofertas por WS, cola FIFO con dedupe, overlay modal con temporizador y comisión, flujo aceptar/rechazar/timeout, cierre por asignación a otro rider, y suspensión por fatiga de rechazos.

### Modified Capabilities
<!-- Ninguna: `rider-orders-home` no cambia sus requisitos en este change; la priorización ofrecida/activa de su lista es un change futuro. -->

## Impact

- **Código nuevo**: `features/orders/store/useOffersStore.ts`, `features/orders/hooks/useOrderOffers.ts`, `features/orders/components/OrderOfferModal.tsx`, `features/orders/components/CountdownRing.tsx`, y funciones de servicio `acceptOrder`/`rejectOrder`.
- **Código modificado**: `features/orders/services/ordersRiderWsService.ts` (enrutar `new_order` a ofertas + detectar asignación), `features/orders/utils/mapRawOrder.ts` y `features/orders/types/order.types.ts` (`riderId`), `app/(app)/_layout.tsx` (montaje global del modal).
- **Dependencias**: sin instalaciones nuevas — `react-native-svg` (15.12) ya presente para el aro; se usa `Modal` de RN (no `@gorhom/bottom-sheet`).
- **Transporte backend**: hipótesis de mensajes WS salientes `accept_order`/`reject_order`; si resultan REST se cambian solo en el service.
- **No afecta**: la lista/estado actual del Home ni `rider-auth`; no se captura el id propio del rider (la detección usa presencia de `rider_id`).
