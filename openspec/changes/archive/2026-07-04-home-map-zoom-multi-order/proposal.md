## Why

El mapa de Inicio asume que el rider tiene, a lo sumo, una orden aceptada relevante: el encuadre de cámara siempre mete rider + tienda + cliente sin importar en qué etapa está la orden, y solo se traza la ruta/pines de la primera orden aceptada (`getFocusedOrder`). Esto produce un zoom más lejano de lo necesario durante toda la entrega, y dado que el rider puede tener hasta 2 órdenes aceptadas simultáneas (límite que impone el backend), la segunda orden queda hoy sin ruta ni pines propios en el mapa. Además, el mapa solo existe en tamaño reducido (no hay forma de verlo más grande), su posición no se actualiza mientras el rider se mueve (lectura única de GPS), y la etiqueta "Mapa en tiempo real" no comunica ninguna acción disponible.

## What Changes

- El encuadre de cámara deja de incluir siempre los 3 puntos (rider/tienda/cliente) y pasa a encuadrar únicamente `[rider, destino de la etapa actual]` por orden: hacia la tienda mientras la orden está en recogida pendiente, hacia el cliente una vez pasa a "En camino".
- Soporte para hasta 2 órdenes aceptadas simultáneas en el mapa: cada una dibuja su propia ruta y sus propios pines de tienda/cliente, en vez de solo la primera orden aceptada de la lista. Las ofertas sin decidir (sin `riderId`) siguen sin mostrar pines ni afectar el encuadre.
- Prioridad visual cuando hay 2 órdenes trazadas a la vez:
  - **Etapas distintas** (una "En camino" + otra en recogida pendiente): la ruta de la que va "En camino" (más cerca de completarse) se muestra a opacidad normal; la de recogida pendiente se muestra con opacidad reducida, manteniendo su color de bucket de estado habitual (ámbar/azul, sin inventar colores nuevos).
  - **Misma etapa** (las 2 órdenes "En camino" simultáneamente): ambas rutas comparten el mismo color de bucket de estado (azul); la ruta hacia el destino más cercano al rider (distancia recta, `haversineKm`) se muestra a opacidad normal y la más lejana a opacidad reducida.
- El encuadre de cámara se ajusta para incluir los puntos relevantes de ambas órdenes cuando hay 2 aceptadas (rider + hasta 2 destinos), no solo los de una.
- La etiqueta "Mapa en tiempo real" se reemplaza por "Toca para ver en pantalla completa"; tocar el mapa (sin arrastrar) lo abre en un modal a pantalla completa dentro de Inicio, con el mismo `OrdersMap` (mismos pines, rutas, botón de seguimiento) y un botón para cerrar. El gesto de pan/zoom del mapa sigue funcionando con normalidad — se distingue de un tap por duración y desplazamiento máximos.
- Nuevo botón "Hacer seguimiento" (apagado por defecto, requiere que el rider lo presione) que activa la posición en vivo del rider (`watchPositionAsync` en vez de lectura única) y bloquea la cámara centrada y con zoom cercano sobre el rider mientras se mueve. Si el rider hace pan manual sobre el mapa, el seguimiento se apaga solo. Disponible tanto en el mapa chico como en pantalla completa (es el mismo componente). Solo visible para el propio rider.

## Capabilities

### New Capabilities
_Ninguna — el mapa de Inicio ya es una capability existente._

### Modified Capabilities
- `rider-orders-home`: cambian los requirements "Mapa con posición del rider, restaurante y cliente" y "Ruta trazada según la etapa de la orden aceptada" para soportar hasta 2 órdenes aceptadas simultáneas (en vez de solo la primera) y para que el encuadre de cámara dependa de la etapa de cada orden en vez de encuadrar siempre los 3 puntos. Se agregan los requirements nuevos "Mapa en pantalla completa" y "Seguimiento en vivo del rider".

## Impact

- `features/orders/components/OrdersMap.tsx`: pasa de recibir `focusedOrder?: ActiveOrder` a recibir hasta 2 órdenes aceptadas; renderiza pines/ruta por cada una y calcula el encuadre de cámara sobre el conjunto de puntos relevante. Gana props de pantalla completa (`isFullscreen`, `onRequestFullscreen`, `onRequestClose`), detección de tap-vs-pan, botón de seguimiento y el switch de cámara en vivo.
- `features/orders/utils/getFocusedOrder.ts`: se reemplaza/extiende por una función que devuelve hasta 2 órdenes aceptadas (en vez de una sola), preservando el orden de prioridad que ya da `sortActiveOrders`.
- `features/orders/utils/routeStage.ts`: gana la lógica de prioridad visual entre 2 órdenes (misma etapa vs. etapas distintas), reutilizando `getColorKey`/`OrderStatusColors` existentes — sin colores nuevos.
- `features/orders/utils/haversine.ts`: se reutiliza (ya existe) como métrica de cercanía para decidir prioridad entre 2 rutas en la misma etapa.
- `features/orders/hooks/useLiveRiderLocation.ts` (nuevo): posición en vivo del rider vía `watchPositionAsync`, activa solo mientras el modo seguimiento está encendido.
- `app/(app)/(tabs)/home.tsx`: pasa la lista de órdenes enfocadas (hasta 2) en vez de una sola a `OrdersMap`; agrega el estado de pantalla completa y el `Modal` que envuelve el mismo `OrdersMap` a tamaño completo; agrega y levanta el estado ON/OFF de "Hacer seguimiento" (`isFollowingRider`) para que sobreviva al remonte entre mapa chico y pantalla completa (ver `design.md`, Decisión 8).
- `features/orders/types/react-native-maps-directions.d.ts` (nuevo): augmentación de tipos para agregar `testID?: string` a `MapViewDirectionsProps` — la librería ya reenvía props extra al `Polyline` interno en runtime, pero sus tipos no lo declaran; sin esto no se puede testear el color de cada ruta.
- `jest.setup.js` (nuevo, referenciado en `package.json` → `jest.setupFiles`): define una API key de prueba para `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` en el entorno de tests, ya que Jest no carga `.env` — sin esto, `MapViewDirections` nunca intenta el fetch y las rutas no son testeables.
- Tests a actualizar/extender: `OrdersMap.test.tsx`, `getFocusedOrder.test.ts`, `routeStage.test.ts`, y nuevo `useLiveRiderLocation.test.ts`.
- Fuera de alcance de este change: el fix de opacidad de markers en Android ya pendiente sin commitear en el working tree previo a este change (se resuelve por separado).
