## Context

El WebSocket `/orders/rider` ya está conectado (change `home-orders-map`) y hoy enruta tanto `new_order` como `order_update` al mismo store `useOrdersStore`, poblando la lista de "órdenes activas" del Home. No existe el concepto de **oferta pendiente de decisión**: cualquier orden que llega se muestra como si ya fuera del rider.

Payload real observado en staging:
- Oferta (`new_order`): `status: "In Preparation"`, **sin** `rider_id`, `created_at: "0001-01-01T00:00:00Z"` (fecha cero), `delivery_fee` en USD (ej. `0.64`) y `delivery_fee_bs` en Bs (ej. `409.41`). No trae `distance_km`.
- Orden aceptada (`order_update`): trae `rider_id` + `rider_accepted_at`, `status: "On The Way"`.
- Al reconectar, el backend **re-emite** la ráfaga completa de `new_order`.

Restricciones del proyecto (CLAUDE.md): NativeWind v4, Zustand con selector, servicios aislados, sin `any`, colores de estado desde `constants/theme.ts`, tests happy-path + error por cada cambio. `react-native-svg` (15.12) ya está instalado; `@gorhom/bottom-sheet` NO se usa (el usuario pidió `Modal` de RN).

## Goals / Non-Goals

**Goals:**
- Modelar la oferta como estado separado de las órdenes activas, sin tocar `useOrdersStore` ni el Home.
- Overlay modal global que interrumpe cualquier pantalla, con cola FIFO, dedupe, temporizador de 15 s, aceptar/rechazar/timeout y cierre por asignación a otro rider.
- Suspensión por 10 rechazos explícitos consecutivos (5 min o hasta foreground).
- Aislar el transporte de accept/reject tras una hipótesis cambiable en un solo lugar.

**Non-Goals:**
- Reorganizar/priorizar la lista del Home entre ofertas y órdenes activas (change futuro).
- Capturar y persistir el `id` propio del rider (no se necesita: la detección usa presencia de `rider_id`).
- Construir la pantalla de Detalle de Orden (04) — sigue siendo placeholder.
- Confirmar el shape exacto REST/WS de accept/reject con el backend (se modela como hipótesis).

## Decisions

### 1. Store de ofertas separado (`useOffersStore`)
Un store Zustand nuevo, independiente de `useOrdersStore`. Estado: `queue: ActiveOrder[]`, `decidedIds: Set<string>` (o `Record<string, true>` por serialización simple), `rejectStreak: number`, `suspendedUntil: number | null`. Acciones: `enqueue`, `resolveCurrent(reason)`, `dropFromQueue(id)`, `registerReject`, `registerAccept`, `clearSuspension`.
- **Por qué separado**: evita romper el Home y deja limpia la futura reorganización (punto 6). Alternativa (marcar ofertas dentro de `useOrdersStore`) acoplaba dos responsabilidades y arriesgaba la lista actual.
- La oferta visible es `queue[0]`; no se guarda un "current" aparte para evitar estados desincronizados.

### 2. Detección de "tomada por otro" por presencia de `rider_id`, sin id propio
Cualquier mensaje (`new_order`/`order_update`) para un id encolado que traiga `rider_id` no vacío ⇒ la oferta ya fue decidida por alguien y se retira. Si el que aceptó fui yo (botón Aceptar), ya la retiré optimistamente, así que el update solo confirma.
- **Por qué**: el auth store no guarda el id del rider; introducirlo sería un cambio de alcance en `rider-auth`. La presencia de `rider_id` es señal suficiente para el propósito de la cola.
- Requiere: `ActiveOrder.riderId?` y mapear `rider_id` en `mapRawOrder`.

### 3. Enrutado en el WS service, no en un hook
`handleMessage` gana ~10 líneas: `new_order` → además de su comportamiento actual, `useOffersStore.enqueue(order)` si `!order.riderId`; y para `new_order`/`order_update` con `riderId`, `useOffersStore.dropFromQueue(order.id)`. El dedupe vive en `enqueue` (chequea `decidedIds` y duplicados en cola).
- **Por qué**: es el único punto que ya traduce el protocolo; mantener ahí el ruteo evita difundir conocimiento del shape crudo.

### 4. Overlay = `Modal` de RN montado en `app/(app)/_layout.tsx`
Un componente `OrderOfferModal` renderizado como hermano del `Stack`, `visible` cuando hay `queue[0]` y no hay suspensión activa. `transparent`, `animationType="fade"`, `onRequestBack` que NO cierra (Android back). Backdrop atenuado + card anclada abajo. Botones Rechazar (secundario) / Aceptar (primario) en el tercio inferior.
- **Por qué Modal y no bottom-sheet**: el usuario exige cierre solo por botón/timeout, sin swipe. `Modal` lo da sin dependencia nueva.

### 5. Temporizador local de 15 s con aro SVG
`CountdownRing` usa `react-native-svg` (`Circle` con `strokeDasharray`/`strokeDashoffset`) en ámbar (`OrderStatusColors.pending`). El conteo lo maneja `useOrderOffers` con un `setInterval`/`setTimeout` reiniciado por `queue[0].id`. Constante `OFFER_TIMEOUT_SECONDS = 15`.
- **Por qué local**: el usuario decidió los segundos del lado app; el backend sincroniza la disponibilidad real vía el mensaje de "tomada por otro".

### 6. Hook orquestador `useOrderOffers`
Monta el ciclo: lee `queue[0]`, corre el countdown, escucha `AppState` para levantar suspensión + resetear racha, y expone `{ offer, secondsLeft, accept, reject }` al modal. Se usa una sola vez, en el modal global.

### 7. Transporte accept/reject aislado en el service
`acceptOrder(id)` / `rejectOrder(id)` envían `{ type: "accept_order"|"reject_order", order_id }` por el socket (mismo patrón que `setAvailability`). Si el backend resulta ser REST, se cambia solo aquí.

## Risks / Trade-offs

- **Shape real de accept/reject desconocido** → aislado en dos funciones del service; cambiar de WS a REST no toca store/UI/tests de lógica.
- **Doble fuente: la oferta también sigue entrando a `useOrdersStore` (Home)** → interino y aceptado; la separación es el change futuro (punto 6). Rechazar el overlay no la quita del Home todavía.
- **Reloj local desincronizado del backend** → si acepto una oferta ya expirada del lado servidor, el backend la habrá reasignado y llegará el update con `rider_id` de otro; la UI ya cerró, sin efecto adverso.
- **Fecha cero `0001-01-01` en ofertas** → la cola es FIFO por llegada, no por `created_at`; el Home ordena por su propio contador, así que no afecta.
- **Timeout no envía reject al backend** → coherente con "solo el botón cuenta"; el backend expira la oferta por su cuenta. Si más adelante se requiere notificar, se añade en `useOrderOffers` sin tocar el store.
- **`AppState` en modal global** → un solo listener en `useOrderOffers`; se limpia en el cleanup del efecto para no duplicar.

## Open Questions

- ¿El backend confirma explícitamente el accept ganador (mensaje dedicado) o solo se infiere por el `order_update` con `rider_id`? Se asume lo segundo.
- ¿Debe el timeout notificar `reject_order` al backend? Se asume que no (el backend expira solo).
