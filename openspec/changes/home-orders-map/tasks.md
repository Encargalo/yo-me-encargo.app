## 1. Dependencias y configuración

- [x] 1.1 Instalar `react-native-maps@1.20.1` y `expo-location@~19.0.8` (`npm install`, mismas versiones que `encargalo-mobile-v2`)
- [x] 1.2 Agregar el plugin `expo-location` a `app.json` con su string de permiso (`locationWhenInUsePermission`)
- [x] 1.3 `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env` + `app.config.ts` que inyecta la key en el AndroidManifest (`withAndroidManifest`, patrón de `encargalo-mobile-v2`)
- [x] 1.4 `expo prebuild --clean -p android` regenerado con la key + permisos de ubicación en el manifest (verificado); pendiente `expo run:android` del dev para instalar el binario
- [x] 1.5 Paleta neutra en `tailwind.config.js` (`ink`/`body`/`muted`/`label`/`line`/`hair`/`card`/`block`/`canvas`) + `fontFamily.mono`, en sync con `Neutrals` de `constants/theme.ts`

## 2. Rutas

- [x] 2.1 Ampliar `constants/routes.ts` con rutas para Detalle de Orden (con parámetro de id) y Balance; placeholders `app/(app)/orders/[id].tsx` y `app/(app)/balance.tsx` para que `typedRoutes` acepte la navegación

## 3. Tipos (`features/orders/types/`)

- [x] 3.1 Definir `OrderStatus` (vocabulario del backend + normalización) y los estados terminales
- [x] 3.2 Definir `ActiveOrder` (id, number, status, pickupCode, shop/customer, methodPayment, deliveryFee, deliveryFeeBs, createdAt)
- [x] 3.3 Definir los tipos de mensajes entrantes del WebSocket (`OrderWsMessage`)

## 4. Utils (`features/orders/utils/`)

- [x] 4.1 `normalizeStatus(raw)` → mapea alias del backend a la forma canónica
- [x] 4.2 Mapper `mapRawOrder(raw) → ActiveOrder` defensivo (tolerante a nombres de campo alternativos)
- [x] 4.3 Utilidad para mapear estado → color (`OrderStatusColors`) reutilizable por tarjeta y marcadores (`getStatusColor`/`getStatusLabel`/`getStatusPriority`)
- [x] 4.4 Utilidad de orden/sort de órdenes activas para la lista
- [x] 4.5 `haversineKm(a, b)` — distancia rider → cliente para la tarjeta (el WS no trae `distance_km`)
- [x] 4.6 Tests unitarios: `normalizeStatus`, `mapRawOrder` (shape real: cliente a nivel raíz), `sortActiveOrders`, `haversineKm`

## 5. Servicio WebSocket (`features/orders/services/`)

- [x] 5.1 `ordersRiderWsService.ts`: `resolveWsUrl()` (deriva `ws(s)://` de `EXPO_PUBLIC_API_URL` + `/orders/rider`)
- [x] 5.2 Socket singleton con contador de suscriptores, `handleMessage` (parseo + `upsertOrder`/estado de conexión), reconexión con delay
- [x] 5.3 `subscribeToRiderOrders()` que abre el socket en la primera suscripción y devuelve función de limpieza
- [x] 5.4 `setAvailability(available)` — envía el estado al backend (hipótesis: mensaje WS saliente `set_availability`), aislado en un solo punto

## 6. Store (`features/orders/store/`)

- [x] 6.1 `useOrdersStore` (Zustand): `activeOrders`, `isConnecting`, `isConnected`, `isAvailable`
- [x] 6.2 Acciones: `upsertOrder` (agrega/actualiza sin duplicar, retira terminales), `setConnected`, `setConnecting`, `setAvailable`, `reset`
- [x] 6.3 Test de integración: `upsertOrder` agrega una nueva y actualiza una existente sin duplicar
- [x] 6.4 Test de integración: orden en estado terminal se retira de `activeOrders`
- [x] 6.5 Test de integración: `setAvailable` cambia `isAvailable` sin alterar el estado de conexión

## 7. Hook (`features/orders/hooks/`)

- [x] 7.1 `useRiderOrders()` — suscribe al WS al montar y desuscribe al desmontar; expone órdenes ordenadas, `isConnecting`, `isConnected`
- [x] 7.2 `useRiderLocation()` — pide permiso (`expo-location`), obtiene posición inicial, maneja permiso denegado sin romper la pantalla

## 8. Componentes (`features/orders/components/`)

- [x] 8.1 `MapSkeleton` — skeleton animado (Animated nativo de RN; reanimated no está en babel) para el área del mapa
- [x] 8.2 `OrdersMap` — `react-native-maps` con marcador del rider (●) y pines SVG A/B (`react-native-svg`, +10px) coloreados por `OrderStatusColors`; `tracksViewChanges` true→false para render en Android; `fitToCoordinates` para encuadrar; skeleton mientras inicializa; degradación si se niega el permiso. A no se dibuja hasta que el WS traiga coords de tienda
- [x] 8.3 `ActiveOrderCard` — píldora de estado + distancia (`haversineKm`), título `Pedido #N`, línea "Cliente · dirección"; `onPress` navega al Detalle
- [x] 8.4 `OrdersEmptyState` — mensaje "Sin órdenes activas" (wireframe 02b)
- [x] 8.5 `AvailabilityToggle` — switch del header; cambia `isAvailable` vía `setAvailability`, sin cerrar el socket
- [x] 8.6 `HomeHeader` — header con `AvailabilityToggle` + acceso rápido a balance

## 9. Pantalla de Inicio (`app/(app)/home.tsx`)

- [x] 9.1 Reemplazar el placeholder por el layout real: `HomeHeader` + `OrdersMap` (~48%) + lista scrolleable de `ActiveOrderCard` (~52%)
- [x] 9.2 Cablear `useRiderOrders` y el store; render de estado vacío cuando no hay órdenes
- [x] 9.3 Navegación: tap en tarjeta → ruta de Detalle con el id; acceso a balance → ruta de Balance

## 9b. Criterio de estilos unificado (NativeWind)

- [x] 9b.1 Migrar todo `features/orders/**` + `app/(app)/home.tsx` de `StyleSheet` a `className` (NativeWind), según CLAUDE.md
- [x] 9b.2 Reservar `style` inline solo para: color de estado dinámico, componentes nativos/terceros (`MapView`/`Svg`/`Marker`) e `insets` de safe-area

## 10. Verificación

- [x] 10.1 Confirmada la conexión al WS `GET /orders/rider` en device; shape real capturado (`order_update`/`new_order`, cliente a nivel raíz, sin nombre/coords de tienda, `pickup_code`) y mapper ajustado en consecuencia
- [ ] 10.2 Verificar mapa: marcador del rider con permiso concedido, y degradación al negar el permiso (requiere device/emulador)
- [ ] 10.3 Verificar toggle de disponibilidad: cambia estado y NO cierra el socket (la orden en curso sigue visible) (requiere device/emulador)
- [x] 10.4 `npx tsc --noEmit` y `npm run lint` sin errores
- [x] 10.5 `npm test` — todos los tests pasan
