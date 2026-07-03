## Context

`features/orders/components/OrdersMap.tsx` y `app/(app)/(tabs)/home.tsx` vienen del change `home-orders-map` (archivado). Hechos confirmados durante la exploración previa a este change:

- `useOrdersStore.activeOrders` mezcla ofertas sin decidir (`riderId` ausente, llegaron como `new_order`) y órdenes ya aceptadas (`riderId` presente). `home.tsx` elige `focusedOrder = orders[0]` sin filtrar por `riderId` → el mapa puede mostrar los pines de una oferta que el rider todavía no aceptó.
- `useRiderLocation` hace una sola lectura de GPS al montar (`getCurrentPositionAsync`), no hay `watchPositionAsync`. Esto es intencional para este change: la ruta se recalcula una vez por transición de etapa, no en vivo.
- Los estados terminales (`Completed`) ya sacan la orden de `activeOrders` vía `isVisibleStatus`/`TERMINAL_STATUSES` — "mapa limpio al completar" no requiere lógica nueva, sale de que `focusedOrder` deja de encontrar la orden.
- `getColorKey(status)` en `features/orders/utils/orderStatus.ts` ya clasifica cada `OrderStatus` en el bucket `pending` (Pending/Accepted/In Preparation/Ready) o `enroute` (On The Way) — es la misma función que decide la etapa de la ruta y la opacidad de los pines, sin estado derivado nuevo.
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` ya está en `.env` y ya habilita el SDK nativo de mapas (Android manifest vía `app.config.ts`). No está confirmado que la Directions API esté habilitada para esa key en Google Cloud Console.
- El usuario ya agregó `assets/shop-location.png` y `assets/user-location.png` (pines con forma de gota, ícono de tienda / ícono de recibo, en naranja). No hay convención previa en el repo para cargar imágenes locales con `require()` + `Image`/`expo-image`.
- Decisiones de producto ya cerradas con el usuario (no reabrir): solo línea de ruta en el propio mapa (sin panel de instrucciones ni botón a Google Maps externo), sin tracking en vivo (ruta recalculada una vez por transición de etapa), placeholder estático (no ocultar la tarjeta completa) cuando el mapa está deshabilitado, línea de ruta coloreada con `OrderStatusColors` (ámbar/azul) igual que el resto del feature.

## Goals / Non-Goals

**Goals:**
- El mapa solo dibuja pines de restaurante/cliente cuando hay una orden **aceptada** por el rider.
- Los pines de restaurante/cliente usan los assets `shop-location.png`/`user-location.png` en vez del pin SVG con letra.
- Se traza una ruta (polyline) desde la posición del rider hacia el destino que corresponde a la etapa actual de la orden aceptada enfocada, con opacidad de pines y color de línea que reflejan esa etapa.
- El mapa (GPS + `MapView`) se desactiva por completo cuando el rider está "No disponible" o no tiene ninguna orden (ni ofertas ni aceptadas), mostrando un placeholder estático del mismo tamaño.

**Non-Goals:**
- Navegación turn-by-turn con instrucciones paso a paso o voz — descartado explícitamente por el usuario.
- Botón para abrir Google Maps/Waze externo — descartado explícitamente.
- Tracking en vivo de la posición del rider mientras se mueve dentro de la misma etapa (`watchPositionAsync`) — la ruta se recalcula solo en la transición de etapa.
- Cambios al shape de `ActiveOrder`, al store de órdenes o al WebSocket — este change es puramente de presentación en Inicio.

## Decisions

### 1. Selección de `focusedOrder` filtrada por `riderId`
En `home.tsx`, `focusedOrder` pasa de `orders[0]` a `orders.find((o) => o.riderId)`. `orders` ya viene de `sortActiveOrders` (prioridad por estado + recencia), así que el filtro conserva el criterio de "la más próxima a completarse" pero solo entre las aceptadas. Si ninguna orden tiene `riderId`, `focusedOrder` es `undefined` y `OrdersMap` no dibuja pines de tienda/cliente (comportamiento que el componente ya soporta: `shopCoord`/`customerCoord` son condicionales).
- Alternativa descartada: filtrar dentro de `OrdersMap` recibiendo la lista completa — se prefiere mantener `OrdersMap` con la misma prop `focusedOrder?: ActiveOrder` que ya tiene, y resolver la selección donde ya vive la lógica de priorización (`home.tsx`), sin ensanchar el contrato del componente.

### 2. Pines de imagen en vez de SVG con letra
Se elimina `MapPin` (SVG + letra A/B + color por estado) de `OrdersMap.tsx`. El `Marker` de restaurante renderiza un `Image`/`expo-image` con `require("@/assets/shop-location.png")`, el de cliente con `require("@/assets/user-location.png")`, ambos con `anchor={{ x: 0.5, y: 1 }}` (igual que hoy, son pines con punta abajo). Se mantiene `tracksViewChanges` en `true` al montar/cambiar de orden enfocada y se apaga a los 1.5s (mismo patrón ya probado para que Android renderice marcadores custom).
- El color por estado de estos pines se elimina: ahora son identidad fija (tienda vs cliente), no estado. El estado de la orden lo sigue mostrando la píldora de `ActiveOrderCard` — no se pierde información, solo se deja de duplicar en el mapa.
- Alternativa descartada: mantener el pin SVG y superponerle el ícono como imagen dentro — más complejo sin aportar nada que el asset ya resuelto no tenga.

### 3. Ruta con `react-native-maps-directions`
Se instala `react-native-maps-directions` (wrapper de `<MapViewDirections>` sobre la Directions API de Google, pensado para usarse dentro de un `<MapView>` de `react-native-maps` — mismo mapa ya instalado). Se renderiza un único `<MapViewDirections>` con:
- `origin`: posición actual del rider (`region` de `useRiderLocation`).
- `destination`: coords de `focusedOrder.shop` si el bucket de estado es `pending`, o de `focusedOrder.customer` si es `enroute`.
- `apikey`: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
- `strokeColor`: `OrderStatusColors.pending` (ámbar) en la etapa "hacia la tienda", `OrderStatusColors.enroute` (azul) en la etapa "hacia el cliente" — mismo criterio que ya usa `getStatusColor`/`getColorKey`.
- Solo se monta cuando hay `focusedOrder` con `riderId` y coordenadas de rider disponibles; sin eso, no hay `<MapViewDirections>` en el árbol (sin ruta ni request a la API).
- Recalculo: al ser un componente declarativo, `MapViewDirections` vuelve a pedir la ruta cuando cambian sus props `origin`/`destination`. Como `origin` solo cambia si `region` cambia (lectura única de `useRiderLocation`, no watch) y `destination` solo cambia cuando el bucket de estado cambia (pending↔enroute), el recálculo ocurre naturalmente una vez por transición de etapa, sin código adicional para "detectar la transición".
- Alternativa descartada: llamar la Directions API a mano con `axios` y decodificar el polyline (algoritmo de Google) manualmente — más código propio para el mismo resultado visual; se prefiere la librería porque ya resuelve el decode + dibujo del `Polyline` y es el patrón estándar de `react-native-maps` para este caso.
- Riesgo abierto: no está confirmado si la Directions API está habilitada para la key actual en Google Cloud Console (hoy solo se sabe que el SDK de mapas y (probablemente) Geocoding lo están). Se verifica en implementación; si falla, `MapViewDirections` expone `onError` para degradar sin romper el mapa (sin línea, pero pines y resto de la pantalla intactos).

### 4. Opacidad de pines derivada del bucket de estado
Nueva constante local en `OrdersMap.tsx` (ej. `DIMMED_OPACITY = 0.35`). Se envuelve cada `Image` de pin en una `View`/prop `style={{ opacity }}` donde:
- bucket `pending` → tienda `1`, cliente `DIMMED_OPACITY`.
- bucket `enroute` → tienda `DIMMED_OPACITY`, cliente `1`.
Se deriva de `getColorKey(focusedOrder.status)`, ya existente — no hace falta estado ni prop nueva más allá de lo que `focusedOrder` ya trae.

### 5. Mapa deshabilitado por disponibilidad/ausencia de órdenes
`home.tsx` calcula `mapEnabled = isAvailable && orders.length > 0` (mismo `orders.length === 0` que hoy ya dispara `OrdersEmptyState`, y el mismo `isAvailable` de `useOrdersStore`). Cuando `mapEnabled` es `false`:
- `OrdersMap` no monta `MapView` ni `MapViewDirections` — en su lugar renderiza un placeholder estático del mismo tamaño (`FILL`), estilo consistente con `OrdersEmptyState`/lenguaje de wireframes (papel cálido, `Neutrals`, label mono), con un mensaje breve invitando a activarse (ej. "Actívate para ver el mapa").
- `useRiderLocation` gana un parámetro `enabled: boolean` (default `true` por compatibilidad con otros consumidores como `useOrderDetail`, que sigue queriendo la ubicación siempre). Cuando `enabled` es `false`, el efecto no pide permiso ni posición — `status` se queda en `"loading"` y `region` en `null` hasta que vuelva a habilitarse, punto en el que el efecto corre de nuevo.
- La conexión WebSocket (`subscribeToRiderOrders`) no se toca: sigue abierta independientemente de `isAvailable`, tal como especifica el requirement existente de disponibilidad.
- Alternativa descartada: mantener `MapView` montado pero congelado (sin actualizar cámara) — no cumple el objetivo de "no gastar recursos" porque el `MapView` nativo sigue vivo (tiles, GPU) aunque no reciba props nuevas.

### 6. Convención de imports de assets locales
Primer uso en el repo de imágenes locales vía `require()`. Se usan directo como `require("../../../assets/shop-location.png")` (ruta relativa desde `features/orders/components/`, ya que `@/assets/...` no está confirmado como alias configurado para binarios estáticos — se verifica en implementación cuál resuelve Metro correctamente) pasado como `source` de `Image` de `expo-image` (ya dependencia del proyecto), consistente con "usar la librería ya instalada" del checklist de CLAUDE.md antes de considerar otra.

## Risks / Trade-offs

- **[Riesgo] Directions API no habilitada para la key actual** → Mitigación: `onError` de `MapViewDirections` degrada sin romper el resto del mapa; se verifica/activa en Google Cloud Console durante implementación.
- **[Riesgo] Ruta desactualizada si el rider se desvía dentro de la misma etapa** (sin tracking en vivo, decisión de producto ya tomada) → Aceptado: mitigación futura si se pide, fuera de alcance de este change.
- **[Trade-off] Nueva dependencia nativa (`react-native-maps-directions`)** → Aceptado: sigue el patrón de CLAUDE.md de instalar librerías dentro del change que las necesita; es la librería estándar para este caso sobre `react-native-maps`.
- **[Riesgo] `useRiderLocation` con parámetro `enabled` cambia su firma** → Mitigación: default `true`, no rompe a `useOrderDetail` (único otro consumidor), que sigue sin pasar el parámetro.

## Migration Plan

Feature existente que se modifica, sin datos que migrar. Se instala `react-native-maps-directions` (requiere `expo prebuild`/rebuild nativo si trae código nativo propio — a confirmar, aunque siendo un wrapper puramente JS sobre `Polyline` de `react-native-maps` es probable que no lo requiera). Rollback: revertir la rama `feat/home-map-routes`; `home.tsx` y `OrdersMap.tsx` vuelven al comportamiento actual (pines SVG A/B, sin ruta, mapa siempre activo) sin efectos en backend.

## Open Questions

1. **¿La Directions API está habilitada en Google Cloud Console para `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`?** — a verificar en implementación; si no, activar o gestionar el error con degradación (Decisión 3).
2. **¿`react-native-maps-directions` requiere rebuild nativo?** — a confirmar al instalar; si trae dependencias nativas, aplica el mismo flujo de `expo prebuild` que otras libs de mapas.
3. **Valor exacto de `DIMMED_OPACITY`** — `0.35` es un punto de partida razonable (visible pero claramente secundario); ajustable en implementación si visualmente no se distingue bien sobre el mapa.
