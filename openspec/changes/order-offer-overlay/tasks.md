## 1. Modelo de dominio y mapeo

- [x] 1.1 Agregar `riderId?: string` a `ActiveOrder` en `features/orders/types/order.types.ts`
- [x] 1.2 Mapear `rider_id` → `riderId` en `mapRawOrder` (tratar cadena vacía como no asignado) y añadir el campo a `RawOrder`
- [x] 1.3 Añadir/ajustar tests en `mapRawOrder.test.ts`: oferta sin `rider_id` (undefined) y orden con `rider_id` presente

## 2. Store de ofertas

- [x] 2.1 Crear `features/orders/store/useOffersStore.ts` con estado `queue`, `decidedIds`, `rejectStreak`, `suspendedUntil`
- [x] 2.2 Implementar `enqueue(order)` con dedupe (ignora si el id está en `decidedIds` o ya en `queue`; ignora si hay suspensión vigente)
- [x] 2.3 Implementar `resolveCurrent(reason)` que marca `queue[0].id` como decidido, lo saca de la cola y actualiza la racha según reason (`accept` resetea, `reject` +1, `expire`/`taken` no cambian)
- [x] 2.4 Implementar `dropFromQueue(id)` (retira una oferta —visible o encolada— tomada por otro, sin tocar la racha; unifica el caso visible, sin `registerTakenByOther` aparte)
- [x] 2.5 Implementar activación de suspensión al llegar `rejectStreak` a 10 (`suspendedUntil = now + 5min`) y `clearSuspension()` (levanta suspensión + resetea racha)
- [x] 2.6 Constante `OFFER_TIMEOUT_SECONDS = 15` y `REJECT_STREAK_LIMIT = 10`, `SUSPENSION_MS = 5 * 60 * 1000`
- [x] 2.7 Tests `useOffersStore.test.ts`: encolar+dedupe, avanzar de cola, racha→suspensión, accept resetea racha, expire/taken no suman, drop de encolada no visible

## 3. Transporte WS (aceptar/rechazar) y enrutado

- [x] 3.1 En `ordersRiderWsService.ts` agregar `acceptOrder(id)` y `rejectOrder(id)` (mensajes salientes `accept_order`/`reject_order`, patrón `setAvailability`)
- [x] 3.2 Enrutar `new_order`/`order_update` hacia la cola de ofertas vía `routeToOffers(order, type)` (función exportada, llamada desde `handleMessage` antes del `upsertOrder`; extraída así para poder testearla y para el chequeo de "orden ya mía" — ver 3.3): si `!order.riderId` y no está ya entre mis órdenes activas → `useOffersStore.enqueue(order)`
- [x] 3.3 En `routeToOffers`: con `riderId` no vacío → `useOffersStore.dropFromQueue(order.id)` (cierra si es la visible); si la orden ya está entre mis `activeOrders` con `riderId` propio (ya la acepté) aunque este mensaje venga sin `riderId` → `useOffersStore.markDecided(order.id)`, nunca se ofrece

## 4. Hook orquestador

- [x] 4.1 Crear `features/orders/hooks/useOrderOffers.ts`: expone `{ offer, secondsLeft, distanceKm, accept, reject }` leyendo `queue[0]`
- [x] 4.2 Countdown local (reinicia por `offer.id`); al llegar a 0 → `resolveCurrent("expire")`
- [x] 4.3 `accept()` → `acceptOrder(id)` + `resolveCurrent("accept")`; `reject()` → `rejectOrder(id)` + `resolveCurrent("reject")`
- [x] 4.4 Listener `AppState` → al pasar a `active`, si hay suspensión vigente `clearSuspension()`; limpiar listener en cleanup
- [x] 4.5 Calcular distancia rider→cliente con `useRiderLocation` + `haversine` (undefined si faltan coords)
- [x] 4.6 Tests `useOrderOffers.test.ts`: expira→resolveCurrent(expire), accept/reject invocan transporte y resuelven, AppState active levanta suspensión

## 5. UI del overlay

- [x] 5.1 Crear `features/orders/components/CountdownRing.tsx` (aro SVG regresivo, color `OrderStatusColors.pending`, número de segundos al centro)
- [x] 5.2 Crear `features/orders/components/OrderOfferModal.tsx`: `Modal` RN transparente, backdrop atenuado, card anclada abajo; sin cierre por gesto/back
- [x] 5.3 Contenido: eyebrow `RESTAURANTE` + nombre grande, dirección de entrega con pin B azul + distancia, comisión USD (`delivery_fee`) como número héroe (30px/700)
- [x] 5.4 Botones Rechazar (secundario, `flex:1`) / Aceptar (primario oscuro, `flex:1.3`) en el tercio inferior; deshabilitar durante el envío
- [x] 5.5 Snapshot test del modal presentacional con una oferta de ejemplo

## 6. Montaje global e integración

- [x] 6.1 Montar `OrderOfferModal` en `app/(app)/_layout.tsx` como hermano del `Stack` (vía contenedor `OrderOfferOverlay`; visible cuando hay `queue[0]` y sin suspensión)
- [x] 6.2 Verificar que el modal aparece sobre tabs y sobre `orders/[id]` (montado como hermano del `Stack` en el shell autenticado)
- [x] 6.3 `npx tsc --noEmit` y `npm run lint` en verde
- [ ] 6.4 Prueba manual con staging: llega ráfaga de ofertas, se muestran una a una, aceptar/rechazar/timeout, y una oferta tomada por otro rider cierra la visible (pendiente: requiere dispositivo + backend staging)
