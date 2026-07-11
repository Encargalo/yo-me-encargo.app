## Why

Tras el login, el rider aterriza en `app/(app)/home.tsx`, que hoy es un placeholder "Próximamente". Inicio es la pantalla operativa central del rider: es donde ve sus órdenes activas en tiempo real, se ubica en el mapa respecto al restaurante y al cliente, y controla si está disponible para recibir nuevas órdenes. Sin ella no hay flujo de trabajo real — es el siguiente bloque funcional después de la autenticación y la puerta de entrada al resto de pantallas (Detalle, Entrega, Balance).

## What Changes

- Reemplazar el placeholder de `app/(app)/home.tsx` por la pantalla real de Inicio (wireframe 02): header con toggle de disponibilidad + acceso a balance, zona superior de mapa (~60%) y zona inferior scrolleable de tarjetas de orden (~40%).
- Nuevo módulo `features/orders/` (services, store, hooks, types, utils, components) siguiendo la estructura que dejó `features/auth/`.
- **Conexión WebSocket en tiempo real** contra `GET /orders/rider` (canal exclusivo del rol rider): singleton con reconexión y un mapper defensivo `RawOrder → ActiveOrder` (patrón calcado de `ordersWsService.ts` de la app hermana `encargalo-mobile-v2`), que alimenta las órdenes activas y sus actualizaciones de estado.
- **Mapa** con `react-native-maps` + `expo-location`: marcador del rider (●, GPS local), restaurante (A) y cliente (B), con el color del pin según el estado de la orden (`OrderStatusColors`). Skeleton de carga del mapa (no `ActivityIndicator` genérico) y estado vacío "Sin órdenes activas" (wireframe 02b).
- **Tarjetas de orden** en la zona inferior con badge de estado, nombre del restaurante y distancia/dirección; tap navega al Detalle de Orden (ruta placeholder por ahora — el Detalle es un change posterior).
- **Toggle de disponibilidad** (online/offline) en el header: controla si el rider recibe nuevas órdenes. Es ortogonal a la conexión WS — el socket permanece conectado aunque el rider esté "No disponible", para que siga viendo/gestionando una orden en curso. El estado se comunica al backend a través de una función de servicio aislada (`setAvailability`), cuyo mecanismo real (mensaje WS saliente vs REST) se confirma en implementación.
- **Dependencias nuevas:** `react-native-maps@1.20.1` y `expo-location@~19.0.8` (mismas versiones que `encargalo-mobile-v2`). Config: plugin `expo-location` en `app.json` y variable `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env`.
- **Tests** (patrón del change de login): mapper del WS, ordenamiento de órdenes activas, y store (happy path + caso de error/desconexión).

## Capabilities

### New Capabilities
- `rider-orders-home`: pantalla de Inicio del rider — recepción y visualización en tiempo real de las órdenes activas asignadas (vía WebSocket `GET /orders/rider`), representación en mapa (rider/restaurante/cliente) con color por estado, tarjetas de orden navegables, control de disponibilidad para recibir nuevas órdenes, y estados de carga/vacío.

### Modified Capabilities
_(ninguna — `rider-auth` no cambia sus requisitos; Inicio consume la sesión existente pero no modifica su contrato)_

## Impact

- **Código nuevo:** `features/orders/**`, `features/orders/components/**`, reescritura de `app/(app)/home.tsx`. Posible ampliación de `constants/routes.ts` (ruta al Detalle de Orden como placeholder).
- **Dependencias nuevas:** `react-native-maps`, `expo-location`.
- **Config:** plugin `expo-location` en `app.json`; `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env`.
- **API:** `GET /orders/rider` (WebSocket, único canal consumido en este change). El `set_availability` sale por el mismo socket (a confirmar en implementación).
- **Fuera de alcance:** contenido real de Detalle/Entrega/Balance/Historial/Perfil/Overlay; la notificación por WhatsApp cuando el rider se desconecta con una orden en curso (se implementará en un change posterior, es lógica de backend + trabajo futuro de la app).
