## Why

El rider no tiene forma de ver su historial completo de movimientos — el tab **Historial** existe hoy solo como placeholder (`app/(app)/(tabs)/historial.tsx`) y el link "Ver historial completo" de Balance no lleva a nada real. Es la pantalla 08 del wireframe y consume un endpoint que el backend ya expone (`GET /riders/transactions`), así que es el siguiente bloque natural tras Balance y Retiro.

## What Changes

- Reemplaza el placeholder de `app/(app)/(tabs)/historial.tsx` por la pantalla real de Historial (wireframe 08): lista paginada de movimientos con el mismo formato de tarjeta que Balance (`TransactionRow`/`TransactionsList`, reusados de `features/balance`).
- Fetch paginado de `GET /riders/transactions` (`page`/`limit`, máx. 50) con **scroll infinito** (`FlatList` + `onEndReached`) — primer uso de `FlatList` en el repo, justificado porque el historial puede tener cientos de movimientos (a diferencia de Balance, que muestra un máximo fijo de 10).
- Pull-to-refresh que reinicia la paginación desde la página 1.
- Estado de carga inicial con **skeleton** que replica el layout real (filas de movimiento), más un indicador de carga de página siguiente al pie de la lista durante `loadMore`.
- Estado vacío (sin transacciones) y estado de error de red (inicial y de "cargar más"), cada uno con su propio mensaje.
- **Fuera de alcance explícito** (documentado como brecha con el wireframe, mismo patrón que otros changes de este repo):
  - Sin filtros de fecha ni de estado — `GET /riders/transactions` solo documenta `page`/`limit`, no hay query params de fecha/estado. Se difiere a un change futuro si el backend los agrega.
  - Sin tap-to-detail en la transacción — la tarjeta ya muestra los campos relevantes (tipo, monto, fecha, distancia); se difiere un detalle expandido a un change futuro si se necesita.

## Capabilities

### New Capabilities
- `rider-transaction-history`: pantalla de Historial del rider — fetch paginado, scroll infinito y presentación del historial completo de movimientos desde `GET /riders/transactions`, con sus estados de carga/vacío/error.

### Modified Capabilities
_(ninguna — no cambian requisitos de `app-navigation` ni de `rider-balance`; el tab Historial y su ruta ya existen, y `TransactionRow`/`TransactionsList` se reusan tal cual sin cambiar su contrato)_

## Impact

- **Afectado:** `app/(app)/(tabs)/historial.tsx` (reemplaza placeholder), nuevo módulo `features/historial/` (services, hooks, types, con components/utils solo si no se puede reusar `features/balance` directamente).
- **Reuso cross-feature:** `TransactionRow` y `TransactionsList` de `features/balance/components` se importan directo desde `features/historial` — primer import cruzado entre features del repo, evita duplicar la fila de movimiento.
- **Sin dependencias nuevas:** no requiere instalar librerías adicionales (`FlatList` es de React Native core).
- **Sin cambios de backend:** consume `GET /riders/transactions` tal como está documentado en `docs/endpoints-yo-me-encargo.app.md`.
