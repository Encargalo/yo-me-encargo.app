## Context

`features/orders/components/OrdersMap.tsx` y `app/(app)/(tabs)/home.tsx` vienen del change `home-map-routes` (archivado), que dejó el mapa asumiendo **una sola** orden aceptada relevante en todo momento:

- `getFocusedOrder(orders)` devuelve `orders.find(o => o.riderId)` — la primera orden aceptada, ignora si hay una segunda.
- `getRouteStageInfo(status)` en `routeStage.ts` deriva, de **un** status, el destino (tienda/cliente), el color de línea y la opacidad de los 2 pines de esa orden. No hay noción de "otra orden" en su firma.
- El encuadre de cámara en `OrdersMap.tsx` (`fitToCoordinates`) siempre mete los 3 puntos disponibles (rider + tienda + cliente) sin mirar la etapa — el zoom queda más alejado de lo necesario durante toda la entrega.
- El backend limita al rider a 2 órdenes aceptadas simultáneas (no hay enforcement de ese límite en el cliente hoy — ni en `useOrderOffers`, ni en el store); el cliente solo debe *renderizar* correctamente cuando llegan hasta 2 órdenes con `riderId` propio.
- `sortActiveOrders` ya prioriza `enroute > pending > error > completed` (vía `getStatusPriority`) y por recencia de cambio de estado como desempate — es la misma señal de "qué tan cerca está de completarse" que se necesita para decidir prioridad visual entre 2 rutas.
- `haversineKm` ya existe (`features/orders/utils/haversine.ts`) y se usa hoy para la distancia mostrada en `ActiveOrderCard` — es la métrica de cercanía elegida para desempatar prioridad cuando 2 órdenes están en la misma etapa.
- Hallazgo relevante de un bug ya resuelto en este mismo componente (working tree, sin commitear): combinar el prop nativo `opacity` de `Marker` con un ícono custom hace que Android descarte el marcador completo en vez de solo atenuarlo. La opacidad de los pines ahora se aplica a un `View` interno, no al prop nativo. Este precedente importa para la Decisión 4 de abajo: `Polyline` (usado internamente por `MapViewDirections`) tampoco tiene un prop `opacity` dedicado como `Marker`, así que no conviene depender de canales alfa poco confiables entre plataformas para atenuar una ruta.

## Goals / Non-Goals

**Goals:**
- El encuadre de cámara pasa de `[rider, tienda, cliente]` fijo a `[rider, destino de la etapa actual]` por orden.
- Hasta 2 órdenes aceptadas simultáneas dibujan, cada una, su propia ruta y sus propios pines de tienda/cliente.
- Cuando hay 2 rutas simultáneas, una se marca visualmente como prioritaria (opacidad/tono normal) y la otra como secundaria (tono atenuado), usando el mismo color de bucket de estado que ya existe (ámbar/azul) — sin colores nuevos.
- La prioridad entre 2 rutas se decide con una sola regla: primero por prioridad de estado (`enroute` > `pending`, ya existente en `getStatusPriority`), y solo si empatan (misma etapa), por cercanía del rider al destino (`haversineKm`, menor distancia gana).
- El encuadre de cámara incluye los destinos relevantes de ambas órdenes cuando hay 2 aceptadas (rider + hasta 2 destinos, no los 4 puntos tienda+cliente de ambas).

**Goals (pantalla completa y seguimiento):**
- Tocar el mapa (sin arrastrar) lo abre en un modal a pantalla completa dentro de Inicio; el label "Mapa en tiempo real" pasa a "Toca para ver en pantalla completa".
- Un botón "Hacer seguimiento" (apagado por defecto) activa posición en vivo del rider (`watchPositionAsync`) y bloquea la cámara centrada sobre el rider con zoom cercano; se apaga solo si el rider hace pan manual.

**Non-Goals:**
- Enforcement del límite de 2 órdenes aceptadas — lo impone el backend; el cliente se limita a tomar como máximo 2 de forma defensiva aunque llegaran más.
- Navegación turn-by-turn con instrucciones paso a paso o voz, o botón para abrir Google Maps/Waze externo — descartado explícitamente (mismo criterio que el change `home-map-routes`).
- Tracking en vivo visible para el cliente/usuario final — el modo seguimiento es exclusivamente para la propia vista del rider.
- Recalcular la ruta trazada (`MapViewDirections`) de forma continua mientras el rider se mueve — sigue recalculándose solo por transición de etapa; el modo seguimiento mueve el marcador y la cámara, no la ruta.
- El fix de opacidad de markers en Android (ya presente sin commitear en el working tree) — se resuelve por separado, no es parte de las tareas de este change.
- Cambios al shape de `ActiveOrder`, al store de órdenes o al WebSocket — este change es puramente de presentación en el mapa de Inicio.

## Decisions

### 1. `getFocusedOrder` → `getFocusedOrders` (hasta 2)
Se reemplaza `getFocusedOrder(orders): ActiveOrder | undefined` por `getFocusedOrders(orders): ActiveOrder[]` (0 a 2 elementos), que filtra por `riderId` presente y toma como máximo los 2 primeros de la lista ya priorizada por `sortActiveOrders`. Único consumidor hoy es `home.tsx`, así que se reemplaza directo (sin shim de compatibilidad) — consistente con "no backwards-compat hacks" de `CLAUDE.md`.
- Alternativa descartada: mantener `getFocusedOrder` singular y agregar `getSecondFocusedOrder` aparte — dos funciones acopladas que siempre se usan juntas es peor que una sola que devuelve la lista.

### 2. Ranking de prioridad como una sola función ordenable
Nueva función pura en `routeStage.ts` (o archivo hermano), ej. `rankOrdersByPriority(orders: ActiveOrder[], riderCoord: LatLng | null): ActiveOrder[]`, que ordena por:
1. `getStatusPriority(order.status)` descendente (reutiliza lo que ya usa `sortActiveOrders`).
2. Desempate: distancia haversine del rider al destino de la etapa actual de esa orden (menor gana), usando `getRouteStageInfo` para saber si el destino es tienda o cliente.

El primer elemento del resultado es la orden prioritaria (ruta/tono normal), el segundo (si existe) es la secundaria (ruta/tono atenuado). Esta única función cubre tanto el caso "etapas distintas" (gana por paso 1) como "misma etapa" (se resuelve en el paso 2, el desempate) sin duplicar lógica en dos ramas if/else separadas.
- Alternativa descartada: dos funciones distintas según el caso (mixto vs. mismo stage) — se descarta porque el componente tendría que decidir primero cuál caso aplica, duplicando la comparación de prioridad que el ranking ya resuelve internamente.

### 3. Encuadre de cámara: `[rider, destinoA, destinoB]`
`OrdersMap` arma los puntos a encuadrar como el rider más, por cada orden enfocada, únicamente su destino de etapa actual (no tienda+cliente de cada una) — reutilizando `destinationCoord` que ya calcula hoy para una sola orden, ahora por orden. Con 1 orden aceptada esto se reduce exactamente al comportamiento pedido en "zoom dinámico" (rider + 1 destino); con 2, a `[rider, destinoA, destinoB]`.
- Alternativa descartada: seguir encuadrando tienda+cliente de ambas órdenes (hasta 5 puntos) — vuelve a alejar el zoom innecesariamente, exactamente el problema que se quiere resolver.

### 4. Ruta secundaria atenuada con color "blanqueado", no `opacity`
`Polyline`/`MapViewDirections` no expone un prop `opacity` dedicado (a diferencia de `Marker`, donde ya se comprobó que combinarlo con contenido custom rompe el render en Android — ver Context). En vez de depender de canales alfa (`rgba(...)`) de soporte incierto entre plataformas para el `strokeColor`, la ruta secundaria usa una variante del mismo color de bucket mezclada hacia blanco (ej. ~65% blanco), calculada con una función pura (`lightenColor(hex, ratio)`), mantiene la identidad de color (sigue siendo "ámbar" o "azul" reconocible) pero visualmente subordinada. Los pines siguen usando el mecanismo de `opacity` en `View` interno ya resuelto (Decisión 4 del change anterior), eso no cambia — solo aplica a la línea de ruta.
- Alternativa descartada: `strokeColor` con alfa real (`rgba(r,g,b,0.35)`) — más simple de calcular, pero repite el mismo patrón de riesgo (canal alfa + render nativo Android) que ya causó un bug real en este componente con `Marker`; se prefiere no repetirlo en `Polyline` sin verificarlo primero.
- Complementario, no obligatorio: reducir levemente `strokeWidth` de la ruta secundaria (ej. 3 vs. 4) como refuerzo visual adicional al color — a definir en implementación si el color blanqueado no basta por sí solo para distinguir prioridad.

### 5. Pines por orden con `testID` únicos
Con hasta 2 órdenes puede haber hasta 4 pines (tienda/cliente × 2 órdenes) en pantalla a la vez. Los `testID` existentes (`marker-shop`, `pin-shop`, etc.) se namespacean por id de orden (ej. `pin-shop-${order.id}`) para que sigan siendo direccionables individualmente en tests. La opacidad interna de cada pin (destino de esa orden a opacidad normal, el otro atenuado) no cambia — sigue siendo por orden, independiente de la prioridad entre órdenes de la Decisión 2.

### 6. Pantalla completa: mismo `OrdersMap`, contenedor distinto — nunca 2 instancias montadas a la vez
`OrdersMap` gana 3 props: `isFullscreen: boolean`, `onRequestFullscreen: () => void`, `onRequestClose: () => void`. El componente en sí no sabe "cómo" se lo muestra en pantalla completa — solo decide qué overlay dibujar (label+tap-zone si `!isFullscreen`, botón de cerrar si `isFullscreen`) y llama al callback correspondiente. `home.tsx` mantiene un solo estado `isFullscreen` y renderiza:
- El `OrdersMap` "chico" (`flex-[48]` de siempre) SOLO cuando `!isFullscreen`.
- Un `<Modal visible={isFullscreen} animationType="slide" onRequestClose={...}>` que envuelve OTRO `OrdersMap` a tamaño completo, SOLO cuando `isFullscreen`.

Nunca hay 2 `OrdersMap` montados simultáneamente (uno se desmonta cuando el otro aparece), evitando 2 `MapView` nativos vivos a la vez (doble GPS/Directions/batería). El `MapView` se remonta al alternar — mismo patrón ya aceptado hoy cuando `enabled` cambia (el mapa ya se desmonta/remonta al activarse/desactivarse), así que el re-encuadre de cámara al abrir pantalla completa no es un caso nuevo, reutiliza el mismo ciclo `onMapReady` → efecto de encuadre que ya existe.
- Alternativa descartada: mantener un solo `OrdersMap` y moverlo de contenedor con un `Portal`/reparenting — React Native no soporta mover un `MapView` nativo montado entre árboles sin remontarlo de todos modos; no gana nada sobre desmontar/montar explícito y es más complejo.

### 7. Tap vs. pan: temporizador + desplazamiento máximo en `onTouchStart`/`onTouchEnd`
El wrapper directo del `MapView` (no el `MapView` en sí, para no interferir con su gesture handler nativo) escucha `onTouchStart`/`onTouchEnd` — eventos de toque "crudos" de React Native que no reclaman el responder gesto a gesto como sí lo hacen `Pressable`/`TouchableOpacity`, coexistiendo mejor con el pan/zoom nativo del mapa. En `onTouchStart` se guarda `{x, y, timestamp}`; en `onTouchEnd` se compara contra 2 constantes ajustables (`TAP_MAX_DURATION_MS`, `TAP_MAX_MOVEMENT_PX`) — si el toque duró menos que el máximo Y se movió menos que el máximo, se interpreta como tap y se llama `onRequestFullscreen`. Caso contrario (usuario arrastrando/haciendo zoom) no se abre pantalla completa. Los botones overlay (seguimiento, cerrar) son `Pressable` **hermanos** del `View` que envuelve el `MapView` (no descendientes), para que un tap sobre ellos nunca dispare también el detector de tap del mapa.
- Riesgo abierto (ver Open Questions): el comportamiento exacto del gesture handler nativo de `react-native-maps` frente a estos eventos de toque no está 100% verificado sin dispositivo — los valores de las constantes quedan como parámetro ajustable en implementación, tal como se acordó explorando el problema.

### 8. Seguimiento en vivo: hook dedicado, gateado por el botón; estado ON/OFF levantado a `home.tsx`
Nuevo hook `useLiveRiderLocation(enabled: boolean): LatLng | null` en `features/orders/hooks/`, que usa `Location.watchPositionAsync` (a diferencia de `useRiderLocation`, que sigue haciendo una sola lectura — eso no cambia, sigue siendo la fuente de la posición para el encuadre de rutas de la Decisión 3). `OrdersMap` llama a `useLiveRiderLocation(followEnabled)` — el GPS en vivo (con su costo de batería) solo corre mientras el botón está activo, nunca de fondo. La posición efectiva del marcador del rider pasa a ser `followEnabled && liveCoord ? liveCoord : riderCoord` (con `riderCoord` como respaldo antes de que llegue el primer fix en vivo).

**Revisión post-implementación:** el estado ON/OFF de `followEnabled` originalmente vivía como `useState` propio de `OrdersMap` (alternativa que esta decisión prefería, ver más abajo). En pruebas manuales se detectó que activar seguimiento y luego abrir pantalla completa perdía el seguimiento — porque el mapa chico y el de pantalla completa son 2 instancias distintas de `OrdersMap` (Decisión 6): al desmontarse una y montarse la otra, el `useState` interno se reinicia a `false`. Se corrigió con el patrón controlado/no-controlado estándar de React: `OrdersMap` acepta `followEnabled?`/`onFollowChange?` opcionales; si `home.tsx` los pasa (que sí lo hace, con un solo `useState` compartido entre las 2 instancias), ese valor manda y sobrevive al remonte; si no se pasan (uso standalone, tests), `OrdersMap` sigue manejando su propio estado interno como antes — no rompe compatibilidad. Solo se levantó el booleano ON/OFF, no el `watchPositionAsync` en sí (que sigue viviendo dentro de `OrdersMap`, gateado por el valor efectivo de `followEnabled` venga de donde venga).
- Alternativa descartada (decisión original, ya no vigente): mantener `followEnabled` como estado 100% interno de `OrdersMap` sin control externo — se descartó tras el hallazgo de arriba, porque 2 instancias del mismo componente no comparten estado de React entre sí.
- Alternativa descartada: levantar también el `watchPositionAsync` (el propio hook) a `home.tsx` y pasar la posición en vivo como prop — se descarta porque solo el interruptor ON/OFF necesita sobrevivir al remonte; la suscripción de GPS en sí puede reiniciarse sin costo perceptible cada vez que se remonta `OrdersMap` (mismo criterio que ya aplica a `tracksViewChanges`/`ready` en la Decisión 6).
- Alternativa descartada: mantener siempre activo `watchPositionAsync` y usar el botón solo para la cámara — se descarta por costo de batería innecesario cuando el rider no pidió seguimiento, y porque el pedido original ata explícitamente "pulsar el botón" a activar el comportamiento.

### 9. Cámara de seguimiento vs. encuadre de rutas: mutuamente excluyentes, `onPanDrag` corta el seguimiento
Mientras `followEnabled` es `true`, un efecto nuevo llama `map.animateToRegion({...liveCoord, latitudeDelta: FOLLOW_ZOOM_DELTA, longitudeDelta: FOLLOW_ZOOM_DELTA}, 500)` cada vez que llega una posición nueva (`FOLLOW_ZOOM_DELTA` ≈ 0.005, zoom cercano fijo tipo navegación — ver Open Questions). El efecto de encuadre de rutas de la Decisión 3 gana una guarda adicional (`if (!ready || followEnabled) return;`) para que nunca compita por la cámara con el efecto de seguimiento — se pisarían entre sí si ambos corrieran a la vez. Para apagar el seguimiento automáticamente ante un pan manual (como Google Maps), se usa el prop nativo de `react-native-maps` `onPanDrag` (se dispara solo con gestos del usuario, nunca por `animateToRegion` programático): `onPanDrag={() => followEnabled && setFollowEnabled(false)}`.
- Alternativa descartada: comparar la región resultante de `onRegionChangeComplete` contra la región esperada para inferir un pan manual — más frágil (falsos positivos por la propia animación) que usar `onPanDrag`, que ya está diseñado exactamente para distinguir gesto de usuario vs. cambio programático.

## Risks / Trade-offs

- **[Riesgo]** El color "blanqueado" de la Decisión 4 podría no distinguirse bien sobre el estilo del mapa en algunos dispositivos/temas → Mitigación: valor de mezcla (`ratio`) como constante ajustable, se afina visualmente en implementación; `strokeWidth` reducido como refuerzo si hace falta.
- **[Riesgo]** Con 2 órdenes activas hay hasta 2 llamadas simultáneas a la Directions API (una por `MapViewDirections`), duplicando el consumo de cuota respecto a hoy → Aceptado: volumen bajo (máx. 2 por transición de etapa, no continuo), se reevalúa si se vuelve un problema real de cuota/costo.
- **[Trade-off]** `rankOrdersByPriority` combina 2 señales (prioridad de estado + distancia) en una sola función → Aceptado: generaliza ambos casos del pedido original (etapas distintas / misma etapa) sin duplicar reglas, a costa de que la función haga algo más que una comparación simple.
- **[Riesgo]** Con 2 destinos geográficamente muy separados, `fitToCoordinates([rider, destinoA, destinoB])` puede producir un zoom-out grande, similar al problema que se busca resolver para 1 orden → Aceptado: es la realidad geográfica del caso 2 órdenes, sin mitigación especial en este change (ya es estrictamente mejor que el comportamiento actual de 3-5 puntos).
- **[Riesgo]** El detector de tap-vs-pan (Decisión 7) es lógica propia sin verificar en dispositivo real — el gesture handler nativo de `react-native-maps` podría reclamar el toque antes de que el `View` envolvente vea `onTouchEnd` en algunos casos → Mitigación: constantes ajustables, y si en la práctica no alcanza, opción de respaldo es un botón explícito "Pantalla completa" superpuesto al mapa (sin depender de distinguir el gesto).
- **[Riesgo]** `watchPositionAsync` en el modo seguimiento consume más batería que la lectura única existente → Mitigación: gateado detrás de un botón explícito que el rider debe activar (Decisión 8), con `timeInterval`/`distanceInterval` moderados (no el máximo de fluidez posible).
- **[Trade-off]** El modo seguimiento bloquea completamente el pan/zoom manual mientras está activo (se apaga automáticamente ante cualquier pan) → Aceptado: es exactamente el comportamiento pedido ("que no lo pueda mover"), y el rider puede desactivarlo tocando el botón de nuevo si lo prefiere.

## Migration Plan

Feature existente que se modifica, sin datos que migrar ni cambios de backend. Rollback: revertir la rama `feat/home-map-zoom-multi-order`; `home.tsx`/`OrdersMap.tsx`/`routeStage.ts` vuelven a encuadrar siempre 3 puntos, a enfocar una sola orden, sin pantalla completa ni seguimiento en vivo, sin efectos en backend.

## Open Questions

1. **Valor exacto del ratio de mezcla hacia blanco** (Decisión 4) — cerrado en `0.65` (`SECONDARY_ROUTE_LIGHTEN_RATIO`), sin reportes de que no se distinga bien; queda como constante ajustable si surge feedback al usarlo en producción.
2. **¿Reducir `strokeWidth` de la ruta secundaria además del color?** — no hizo falta; el color blanqueado solo resultó suficiente, `strokeWidth` se mantuvo en `4` para ambas rutas.
3. **Valores exactos de `TAP_MAX_DURATION_MS`/`TAP_MAX_MOVEMENT_PX`** (Decisión 7) — cerrado en 250ms / 10px, sin ajustes reportados tras probar en dispositivo.
4. **Valor exacto de `FOLLOW_ZOOM_DELTA`** (Decisión 9) — cerrado en `0.00176` tras 4 iteraciones en dispositivo real a pedido del usuario: `0.005` (punto de partida) → `0.0035` (-30%) → `0.0042` (+20%) → `0.00588` (+40%, quedó demasiado alejado) → `0.00176` (-70% desde `0.00588`, corrigiendo dirección). El historial completo queda comentado en el código (`OrdersMap.tsx`) para que quede claro qué pasó en cada paso.
5. **Ajustes de UI del botón "Hacer seguimiento" tras probar en dispositivo** (nuevo, post-implementación): se movió de arriba-derecha a abajo-derecha porque chocaba visualmente con la etiqueta "Toca para ver en pantalla completa" en el mapa chico (ambas arriba, ancho insuficiente en pantallas angostas); en pantalla completa el botón es ~10% más grande (`px-[13px] py-[7px]`, texto `11px` vs `px-3 py-1.5`/`10px` en el mapa chico); el texto quedó en negro (`text-ink`) y bold para destacar más que el gris apagado original.
