## 1. Selección de órdenes enfocadas

- [x] 1.1 Reemplazar `getFocusedOrder` por `getFocusedOrders(orders): ActiveOrder[]` en `features/orders/utils/getFocusedOrder.ts` (o renombrar el archivo a `getFocusedOrders.ts`): filtra por `riderId` presente y toma como máximo los 2 primeros de la lista ya priorizada por `sortActiveOrders`.
- [x] 1.2 Actualizar `getFocusedOrder.test.ts` para cubrir: ninguna orden aceptada → `[]`; 1 orden aceptada → array de 1; 2 órdenes aceptadas → array de 2 en el orden de prioridad; 3+ órdenes aceptadas (caso defensivo) → se recortan a 2.
- [x] 1.3 Actualizar `app/(app)/(tabs)/home.tsx` para usar `getFocusedOrders(orders)` en vez de `getFocusedOrder(orders)`.

## 2. Ranking de prioridad entre rutas

- [x] 2.1 Agregar `rankOrdersByPriority(orders: ActiveOrder[], riderCoord: LatLng | null): ActiveOrder[]` en `features/orders/utils/routeStage.ts`: ordena por `getStatusPriority` descendente y, en caso de empate, por distancia haversine del rider al destino de etapa de cada orden (menor gana). Reutiliza `getRouteStageInfo`/`haversineKm` existentes.
- [x] 2.2 Agregar `lightenColor(hex: string, ratio: number): string` (utilidad pura, mezcla el color hacia blanco) — colocarla en `routeStage.ts` o en un archivo de utilidad de color si ya existe uno; si no existe, crear `features/orders/utils/color.ts`.
- [x] 2.3 Tests unitarios para `rankOrdersByPriority`: etapas distintas (enroute gana sobre pending sin mirar distancia), misma etapa (gana el destino más cercano por haversine), 1 sola orden (devuelve esa orden sin comparar), lista vacía.
- [x] 2.4 Tests unitarios para `lightenColor`: mezcla correcta hacia blanco para ratios conocidos (ej. `#f59e0b` con ratio 0.65 produce el hex esperado), ratio 0 devuelve el color original, ratio 1 devuelve blanco.

## 3. `OrdersMap`: soporte multi-orden

- [x] 3.1 Cambiar la prop `focusedOrder?: ActiveOrder` de `OrdersMap` por `focusedOrders: ActiveOrder[]` (0 a 2 elementos).
- [x] 3.2 Por cada orden en `focusedOrders`, calcular su `stageInfo` (destino, color base, opacidad de pines) reutilizando `getRouteStageInfo` existente.
- [x] 3.3 Cuando `focusedOrders.length === 2`, usar `rankOrdersByPriority` para determinar cuál es prioritaria (color base normal) y cuál secundaria (color vía `lightenColor`, ratio inicial ~0.65). Con 1 sola orden, siempre color normal (sin cambios respecto al comportamiento actual de una orden).
- [x] 3.4 Renderizar hasta 2 pares de `Marker` (tienda/cliente) por orden, con `testID` namespaceados por id de orden (ej. `pin-shop-${order.id}`, `pin-customer-${order.id}`).
- [x] 3.5 Renderizar hasta 2 `MapViewDirections`, uno por orden enfocada, cada uno con su `strokeColor` (normal o aclarado según prioridad) y `onError` propio.
- [x] 3.6 Reemplazar el cálculo de puntos para `fitToCoordinates`/`animateToRegion`: en vez de `[rider, shop, customer]` fijo, usar `[rider, ...destinos de etapa de cada orden en focusedOrders]` (1 o 2 destinos según cuántas órdenes haya).
- [x] 3.7 Ajustar el efecto de `tracksViewChanges` (`tracks`) para que siga cubriendo el remount/cambio de hasta 2 órdenes enfocadas (dependencias del `useEffect` actualizadas a la lista, no a un solo `focusedOrder?.id`).

## 4. Integración en Inicio

- [x] 4.1 Actualizar `app/(app)/(tabs)/home.tsx` para pasar `focusedOrders` (array) a `OrdersMap` en vez de `focusedOrder`.

## 5. Tests de `OrdersMap`

- [x] 5.1 Actualizar `OrdersMap.test.tsx` a la nueva prop `focusedOrders` (array) en todos los casos existentes (0 o 1 orden).
- [x] 5.2 Nuevo caso: 2 órdenes en etapas distintas (una "On The Way", otra en recogida pendiente) — verificar que ambas rutas y los 4 pines se renderizan, que la ruta "On The Way" queda con color normal y la de recogida pendiente con color aclarado.
- [x] 5.3 Nuevo caso: 2 órdenes en la misma etapa ("On The Way" ambas) — verificar que la ruta hacia el destino más cercano (mockeando `region`/coords para que la distancia sea determinística) queda con color normal y la otra aclarada.
- [x] 5.4 Nuevo caso: encuadre de cámara — verificar que con 1 orden se llama `fitToCoordinates`/`animateToRegion` solo con `[rider, destino]` (no tienda+cliente), y con 2 órdenes con `[rider, destinoA, destinoB]`.

## 6. Verificación automatizada (zoom + multi-orden)

- [x] 6.1 Correr `npx tsc --noEmit` y `npm run lint` sin errores.

## 7. Mapa en pantalla completa: `OrdersMap`

- [x] 7.1 Agregar props `isFullscreen: boolean`, `onRequestFullscreen: () => void`, `onRequestClose: () => void` a `OrdersMapProps`.
- [x] 7.2 Cambiar la etiqueta "MAPA EN TIEMPO REAL" por "Toca para ver en pantalla completa" cuando `!isFullscreen`; cuando `isFullscreen`, mostrar en su lugar un control de cerrar (`Pressable`) que llama `onRequestClose`.
- [x] 7.3 Envolver el `MapView` (no sus hijos) en un `View` con `onTouchStart`/`onTouchEnd` que detecte tap (duración ≤ `TAP_MAX_DURATION_MS`, desplazamiento ≤ `TAP_MAX_MOVEMENT_PX`, ambas constantes ajustables) y llame `onRequestFullscreen`; solo activo cuando `!isFullscreen`.
- [x] 7.4 Asegurar que los overlays (label/cerrar, botón de seguimiento) sean hermanos del `View` del punto 7.3, no descendientes, para que un tap sobre ellos no dispare también el detector de tap del mapa.

## 8. Mapa en pantalla completa: integración en Inicio

- [x] 8.1 Agregar estado `isFullscreen` en `app/(app)/(tabs)/home.tsx`.
- [x] 8.2 Renderizar el `OrdersMap` reducido actual solo cuando `!isFullscreen`.
- [x] 8.3 Agregar un `Modal` (`visible={isFullscreen}`, `animationType="slide"`, `onRequestClose` → apaga `isFullscreen`) que envuelve un segundo `OrdersMap` a tamaño completo con las mismas props (`region`, `riderStatus`, `focusedOrders`, `enabled`) más `isFullscreen`/`onRequestFullscreen`/`onRequestClose`; nunca debe haber 2 `OrdersMap` montados a la vez.

## 9. Seguimiento en vivo: hook

- [x] 9.1 Crear `features/orders/hooks/useLiveRiderLocation.ts`: `useLiveRiderLocation(enabled: boolean): LatLng | null`, usa `Location.watchPositionAsync` solo mientras `enabled`, limpia la suscripción al desactivar/desmontar.
- [x] 9.2 Tests: no observa posición con `enabled=false`; al pasar a `true` llama `watchPositionAsync` y actualiza el valor devuelto con cada callback; cancela la suscripción (`remove()`) al volver a `enabled=false`.

## 10. Seguimiento en vivo: integración en `OrdersMap`

- [x] 10.1 Agregar estado interno `followEnabled` (default `false`) y botón "Hacer seguimiento" visible tanto en el mapa reducido como en pantalla completa (deshabilitado/oculto si `riderStatus !== "granted"`).
- [x] 10.2 Usar `useLiveRiderLocation(followEnabled)`; la posición efectiva del marcador del rider pasa a ser la posición en vivo si `followEnabled` y hay un fix disponible, si no la posición de lectura única existente.
- [x] 10.3 Nuevo efecto: mientras `followEnabled`, animar la cámara (`animateToRegion`) centrada en la posición en vivo con `FOLLOW_ZOOM_DELTA` (zoom cercano) en cada actualización.
- [x] 10.4 Agregar guarda `if (!ready || followEnabled) return;` al efecto de encuadre de rutas existente (tarea 3.6), para que nunca compita por la cámara con el efecto de seguimiento.
- [x] 10.5 Agregar `onPanDrag` al `MapView` que, si `followEnabled`, lo desactiva (`setFollowEnabled(false)`).

## 11. Tests nuevos de `OrdersMap` (pantalla completa + seguimiento)

- [x] 11.1 Tap corto sobre el mapa reducido (touchStart+touchEnd cercanos en tiempo/posición) llama `onRequestFullscreen`; un touchEnd lejano en posición o tiempo NO lo llama.
- [x] 11.2 En `isFullscreen=true` se muestra el control de cerrar y no la etiqueta de tap; tocarlo llama `onRequestClose`.
- [x] 11.3 Botón "Hacer seguimiento": al presionarlo con `riderStatus="granted"`, se activa `useLiveRiderLocation` (mock) y la cámara se centra en la posición en vivo simulada con `FOLLOW_ZOOM_DELTA`.
- [x] 11.4 Mientras el seguimiento está activo, el efecto de encuadre de rutas (multi-orden) NO se ejecuta (no compite por la cámara).
- [x] 11.5 Disparar `onPanDrag` con el seguimiento activo desactiva el seguimiento.

## 12. Verificación final

- [x] 12.1 Correr `npx tsc --noEmit`, `npm run lint` y la suite completa de tests sin errores.
- [x] 12.2 Probar en Android/iOS con datos simulados: 1 orden en recogida pendiente (zoom rider+tienda), 1 orden en camino (zoom rider+cliente), 2 órdenes en etapas distintas, 2 órdenes en la misma etapa (confirmar que el color aclarado de la ruta secundaria se distinga bien, ajustar `SECONDARY_ROUTE_LIGHTEN_RATIO` si hace falta), tap para abrir/cerrar pantalla completa (ajustar `TAP_MAX_DURATION_MS`/`TAP_MAX_MOVEMENT_PX` si el gesto no se siente natural), y botón de seguimiento moviéndose físicamente (ajustar `FOLLOW_ZOOM_DELTA` si hace falta).
