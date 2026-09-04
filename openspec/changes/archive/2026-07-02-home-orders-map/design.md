## Context

El login (change `login-rider`, ya archivado) dejó la app con sesión persistente y al rider aterrizando en `app/(app)/home.tsx`, hoy un placeholder "Próximamente". Inicio es la pantalla operativa: órdenes activas en tiempo real + mapa + control de disponibilidad (wireframe 02 / 02b).

Restricciones y hechos confirmados durante la exploración:
- **Canal de datos:** `GET /orders/rider` es un WebSocket real y documentado, exclusivo del rol rider (`docs/endpoints-yo-me-encargo.app.md`). No es REST ni polling.
- **App hermana como referencia:** `encargalo-mobile-v2` (app de clientes) resuelve el mismo problema con `features/orders/services/ordersWsService.ts` (WS singleton + reconexión + mapper defensivo `RawOrder → ActiveOrder`), `useActiveOrders.ts`, `ActiveOrderCard.tsx`, y usa `react-native-maps@1.20.1` + `expo-location@~19.0.8`. El geocoding va contra la REST de Google con `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (no como config nativa de `react-native-maps`).
- **Disponibilidad:** el toggle es un eje ortogonal a la conexión. Confirmado por el usuario: el switch indica si el rider está disponible para recibir nuevas órdenes; el WS NO se desconecta al ponerse "No disponible". No hay endpoint REST documentado para esto.
- **Colores de estado:** `constants/theme.ts` ya exporta `OrderStatusColors` y `tailwind.config.js` los define como `status.*`. Deben reutilizarse — nunca hardcodear otro hex.
- **`.env` actual:** solo tiene `EXPO_PUBLIC_API_URL`. Falta `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (el usuario dijo que ya la puso; verificar antes de probar el mapa).
- Detalle de Orden, Balance, Overlay de nueva orden y Perfil son changes posteriores — Inicio navega hacia rutas que por ahora son placeholders.

## Goals / Non-Goals

**Goals:**
- Pantalla de Inicio fiel al wireframe 02/02b, alimentada por el WebSocket real `GET /orders/rider`.
- Módulo `features/orders/` reutilizable que el Detalle de Orden y el Overlay podrán compartir.
- Mapa con marcadores rider/restaurante/cliente coloreados por estado, con skeleton de carga y estado vacío tranquilo.
- Toggle de disponibilidad desacoplado del transporte de red (fácil de re-cablear cuando se confirme el mecanismo real).
- Degradación con gracia si el rider niega el permiso de ubicación.

**Non-Goals:**
- Contenido real de Detalle/Entrega/Balance/Historial/Perfil/Overlay (solo se navega hacia rutas placeholder).
- Notificación por WhatsApp cuando el rider se desconecta con orden en curso — lo implementará el equipo después (backend + trabajo futuro de la app).
- Emisión de la posición del rider hacia el backend para el seguimiento del cliente (si el backend lo requiere, será su propio mensaje WS saliente en un change aparte).
- Aceptar/rechazar órdenes nuevas (eso es el Overlay 03, otro change).

## Decisions

### 1. Servicio WebSocket calcado del patrón de `encargalo-mobile-v2`
`features/orders/services/ordersRiderWsService.ts` replica el patrón probado de la app hermana: socket singleton con contador de suscriptores, `subscribeToRiderOrders()` que devuelve función de limpieza, reconexión con delay, y `resolveWsUrl()` que deriva `ws(s)://` de `EXPO_PUBLIC_API_URL` + path `/orders/rider`. Cookie de sesión viaja automáticamente (RN adjunta cookies al handshake del WS igual que en clientes).
- Alternativa descartada: reimplementar desde cero o usar una librería de WS — el patrón existente ya maneja reconexión y ciclo de vida correctamente.

### 2. Mapper defensivo `RawOrder → ActiveOrder`
Se normaliza en un único punto (como en la app hermana) para que store y UI solo conozcan `ActiveOrder`. **Shape real confirmado en runtime, actualizado** (mensajes `order_update` / `new_order` de `/orders/rider`) — `order`, `shop` y `customer` viajan como **hermanos** en la raíz del mensaje, no anidados dentro de `order`:
```json
{ "type": "new_order",   // también "order_update"
  "order": {
    "id", "shop_id", "customer_id", "batch_id", "number",
    "method_payment", "status", "delivery_fee", "delivery_fee_bs", "created_at" },
  "shop": {
    "id", "name", "phone", "logo", "address", "latitude", "longitude" },
  "customer": {
    "address", "latitude", "longitude" } }
```
- El status se normaliza con una tabla de alias a la forma canónica del backend.
- **`shop` y `customer` llegan como objetos propios**, hermanos de `order`, cada uno con sus coords. Esto reemplaza la hipótesis anterior (cliente a nivel raíz de `order`, sin datos de tienda) — se mantiene como *fallback* defensivo en el mapper por si algún mensaje aún llega con el shape viejo.
- **Ahora sí viene nombre, teléfono, logo y coords del restaurante** (`shop.name`, `shop.phone`, `shop.logo`, `shop.latitude/longitude`) → el marcador **A ya se puede dibujar** y la tarjeta puede titular con el nombre real en vez de `Pedido #<number>` (pendiente de cablear en UI si se quiere aprovechar; el mapper ya expone `shop.name`/`shop.logo`).
- El cliente (`customer`) por ahora solo trae `address`/`latitude`/`longitude` (sin `name`/`phone` en el payload observado); `mapParty` soporta ambos si el backend los agrega.
- `batch_id` se mapea a `ActiveOrder.batchId` (agrupa órdenes del mismo lote/viaje; aún sin uso en UI — insumo para un change futuro de agrupación).
- El código que llega es `pickup_code` (el que el rider muestra al recoger), no el de entrega; no aparece en el payload de ejemplo pero el mapper lo sigue soportando.
- Campos mapeados: `id`, `number`, `status`, `pickupCode`, `shop{name,phone,logo,address,lat,lng}`, `customer{address,lat,lng}`, `shopId`, `customerId`, `batchId`, `methodPayment`, `deliveryFee`, `deliveryFeeBs`, `createdAt`.
- **Riesgo abierto:** no está confirmado si un `order_update` de solo cambio de estado (ej. batch ya aceptado) sigue mandando `shop`/`customer` completos o los omite para ahorrar payload. Como `upsertOrder` **reemplaza** la orden completa (no hace merge parcial), si un update llegara sin esos hermanos se perderían nombre/coords ya conocidos. Mitigación actual: ninguna (no confirmado); si se observa en runtime, se resuelve mergeando con la orden previa en el store antes de aplicar el update, sin tocar UI.

### 3. Store Zustand `features/orders/store/useOrdersStore.ts`
Un store para el dominio orders: `activeOrders`, `isConnecting`, `isConnected`, `isAvailable`, y acciones `upsertOrder`, `removeOrder`/filtrado de terminales, `setConnected`, `setAvailability`, `reset`. Tipado completo con selectores, según convención del proyecto. La disponibilidad vive aquí (atributo de sesión operativa del rider), no en un store global aparte, para mantener el toggle y las órdenes coherentes en un solo lugar; el change de Perfil lo importará desde `features/orders`.

### 4. Toggle de disponibilidad aislado tras `setAvailability(available)`
El toggle llama a una función de servicio `setAvailability(available: boolean)` en `ordersRiderWsService.ts`. Hipótesis de transporte: mensaje WS saliente `{ "type": "set_availability", "available": <bool> }`. Si resulta ser un REST (`PATCH /riders/availability` u otro), se cambia solo dentro de esa función sin tocar store ni UI. El WS permanece abierto en ambos estados de disponibilidad (ver Requirement correspondiente).

### 5. Mapa: `react-native-maps` + `expo-location`
- Marcador del rider: `expo-location` (`requestForegroundPermissionsAsync` + `getCurrentPositionAsync`) en `useRiderLocation`; degrada con gracia si se niega el permiso (mapa con región de respaldo, sin marcador ●).
- Marcadores restaurante (A) / cliente (B): **pines de mapa dibujados con `react-native-svg`** (gota con la letra, +10px respecto al primer diseño → 36×48), color por `OrderStatusColors[estado]`. `tracksViewChanges` arranca en `true` (si no, los marcadores custom no rendean en Android) y se apaga tras 1.5s. La cámara hace `fitToCoordinates` para encuadrar rider + marcadores.
- `MapSkeleton` usa el **`Animated` nativo de RN** (no Reanimated, que no está en el babel del proyecto) para el pulse de carga — cumple la regla de CLAUDE.md de no usar spinners genéricos.
- **Config nativa (crítica):** el binario Android necesita la key en el manifest, no basta el `.env`. Se agregó `app.config.ts` con un plugin `withAndroidManifest` que inyecta `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` en `com.google.android.geo.API_KEY` (patrón de `encargalo-mobile-v2`). Requiere `expo prebuild` + rebuild nativo; reiniciar Metro no aplica el cambio. Plugin `expo-location` en `app.json`.
- Alternativa descartada: `react-native-maps` NO se instala "de antemano" — este es justamente el change de Inicio (mapa) que CLAUDE.md designa para instalarlo.

### 6. Layout de la pantalla
Header (toggle disponibilidad + acceso a balance) · Mapa ~48% (`flex-[48]`) · Lista scrolleable de tarjetas ~52% (`flex-[52]`), diseñado para uso con una mano (acciones/toque en tercio inferior). El mapa se bajó de 60% a 48% a pedido del usuario para dar más aire a la lista. Tarjeta = `ActiveOrderCard` (píldora de estado con `OrderStatusColors` + distancia, título `Pedido #N`, línea "Cliente · dirección").

### 6d. Criterio único de estilos: NativeWind (post-implementación)
CLAUDE.md define NativeWind v4 (clases Tailwind) como la librería de estilos del proyecto. La primera versión de `features/orders/` mezcló `StyleSheet` y `className` (se sentía enredado). Se unificó **todo el feature a NativeWind `className`**. `style` inline se reserva solo para: (a) valores dinámicos en runtime (color de estado de la orden), (b) componentes nativos/terceros que no reciben `className` (`MapView`, `Svg`, `Marker`), y (c) `insets` de safe-area. La paleta neutra se agregó a `tailwind.config.js` (`ink`, `body`, `muted`, `label`, `line`, `hair`, `card`, `block`, `canvas`) + `fontFamily.mono`, en sync con `Neutrals` de `constants/theme.ts` (que sigue existiendo para los usos JS: colores de íconos y stroke de SVG).

### 6b. Lenguaje visual del wireframe (post-implementación)
El brief de `docs/wireframes/` define un sistema visual concreto (papel cálido, tinta `#2a2a2a`, tokens neutros, labels mono en mayúsculas; color reservado a los 4 estados en su versión **saturada** de `constants/theme.ts`). Como el Login se hizo antes de ese brief (estilo naranja calcado de la app hermana), Home es la **primera** pantalla que establece este lenguaje. Se agregó la paleta `Neutrals` a `constants/theme.ts` para reutilizarla en pantallas futuras. Detalles aplicados: header con toggle custom (pista 42×24, verde `completed` al estar disponible) + subtexto mono + pastilla de balance; mapa como tarjeta redondeada con label mono `MAPA EN TIEMPO REAL`, marcador del rider oscuro (●) y pines tipo gota A/B coloreados por estado; tarjetas con píldora de estado + distancia (calculada con `haversineKm` rider→cliente) + línea "Cliente · dirección". No se cargó la fuente `Inter Tight` (branding pendiente por CLAUDE.md): se usan fuentes del sistema + `monospace` para los labels.

### 6c. Tab bar diferido (post-implementación)
El wireframe 02 muestra un tab bar inferior global (Inicio·Balance·Historial·Perfil). Decidido con el usuario: **no** se construye en este change — es navegación global que abarca 4 features (Historial y Perfil ni existen). Se difiere a un change de navegación dedicado. Home no renderiza tab bar por ahora.

### 7. Rutas hacia pantallas aún inexistentes
`constants/routes.ts` gana entradas placeholder para Detalle de Orden y Balance (aunque esas pantallas lleguen después), para no usar strings literales. La navegación se cablea ahora; el destino real se completa en sus changes.

### 8. Testing (patrón del change de login)
- **Unit**: mapper `RawOrder → ActiveOrder` y `normalizeStatus`; utilidad de orden/sort de órdenes activas.
- **Integration**: `useOrdersStore` — `upsertOrder` agrega/actualiza sin duplicar, orden terminal se retira, `setAvailability` cambia estado sin tocar conexión.
- Happy path + al menos un caso de error/borde cada uno.

## Risks / Trade-offs

- **[Riesgo] El shape real del mensaje de `/orders/rider` difiere del asumido** → Mitigación: todo el acoplamiento al shape vive en el mapper (Decisión 2); ajustar ahí sin tocar UI/store. Verificar con un mensaje real en implementación (log del socket).
- **[Riesgo] El mecanismo de `set_availability` no es un mensaje WS** → Mitigación: aislado tras `setAvailability()` (Decisión 4); un solo punto de cambio.
- **[Riesgo] Coordenadas de restaurante/cliente no vienen en el payload** → Mitigación: los marcadores A/B son condicionales; si faltan, el mapa muestra solo al rider y las tarjetas siguen funcionando. Queda como open question hasta ver el payload real.
- **[Riesgo] La cookie de sesión no se adjunta al handshake del WS en algún dispositivo** → Mitigación: el interceptor 401 global ya existe para REST; para el WS, un cierre con 401/403 degrada a estado desconectado. Verificar en dispositivo real.
- **[Trade-off] Instalar `react-native-maps` (dependencia nativa pesada)** → Aceptado: es el propósito de este change y ya está validado en la app hermana con las mismas versiones.

## Migration Plan

Feature nueva, sin datos que migrar. Se instala `react-native-maps` + `expo-location` y se agrega el plugin a `app.json` (requiere rebuild del dev client / prebuild). Rollback: revertir la rama `feat/home-orders-map`; el `home.tsx` vuelve al placeholder sin efectos en backend.

## Open Questions

1. ~~Shape exacto del mensaje de `GET /orders/rider`~~ — **RESUELTO** (ver Decisión 2). Tipos: `connected` / `order_update` / `new_order`.
2. **Mecanismo real de `set_availability`** (mensaje WS saliente vs endpoint REST) — aislado tras `setAvailability()`. Aún por confirmar.
3. ~~¿Vienen coordenadas de cliente?~~ — **RESUELTO**: sí, a nivel raíz del pedido → `customer` (entrega, marcador B).
4. ~~Strings de estado para riders~~ — **RESUELTO**: mismo vocabulario del cliente (`In Preparation`, `On The Way`, …). Confirmado con datos reales.
5. ~~Datos del restaurante (nombre + coords)~~ — **RESUELTO**: el WS manda `shop` como objeto hermano de `order` con `name`, `phone`, `logo`, `address`, `latitude`, `longitude`. El mapper y el pin A ya lo consumen; falta solo cablear el nombre/logo en `ActiveOrderCard` si se quiere reemplazar el título `Pedido #N` (fuera de alcance de este ajuste de tipos).
6. **`new_order` vs `order_update`** — Inicio muestra ambas por ahora (todo el batch del rider); el filtrado ofrecidas-vs-aceptadas se refina en el change del Overlay (03).
7. **¿Un `order_update` de solo estado sigue mandando `shop`/`customer` completos?** — sin confirmar; ver riesgo en Decisión 2. Verificar con un mensaje `order_update` real en runtime.
