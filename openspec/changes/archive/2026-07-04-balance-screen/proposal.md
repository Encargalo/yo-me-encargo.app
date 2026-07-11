## Why

El rider no tiene forma de ver su saldo ni sus últimos movimientos dentro de la app — el tab **Balance** existe hoy solo como placeholder (`app/(app)/(tabs)/balance.tsx`). Es la pantalla 06 del wireframe y consume un endpoint que el backend ya expone (`GET /riders/balance`), así que es el siguiente bloque natural tras Login, Inicio y Detalle de Orden.

## What Changes

- Reemplaza el placeholder de `app/(app)/(tabs)/balance.tsx` por la pantalla real de Balance (wireframe 06): card hero de saldo neto (verde/rojo según signo + badge de zona), desglose Ganado/Descontado, y lista de "Últimos movimientos" (máx. 10, ya vienen del mismo endpoint).
- Fetch de `GET /riders/balance` al entrar a la pantalla y al volver a tomar foco (`useFocusEffect`), más gesto de pull-to-refresh manual. Sin depender del WebSocket de órdenes.
- Estado de carga con **skeleton** que replica el layout real (card hero + filas de movimientos) — nunca un spinner genérico, por convención del proyecto.
- Estado vacío de movimientos (sin transacciones) y estado de error de red, cada uno con su propio mensaje.
- Nuevo formatter de moneda para montos USD "sueltos" (símbolo al final, sin decimales si el monto es entero — ej. `$0.54`, `$2`, `$38`), distinto del `formatUsd` existente en `features/orders` (símbolo adelante, siempre 2 decimales) que se usa para `deliveryFee` de una orden individual. Ambos formatters siguen siendo válidos; no se unifican en este change.
- Botón primario "Solicitar retiro" navega a un stub de pantalla nuevo (la Solicitud de retiro real, wireframe 07 / `POST /riders/withdrawal`, es un change de OpenSpec aparte). Requiere agregar `ROUTES.APP.WITHDRAWAL` a `constants/routes.ts`.
- Link secundario "Ver historial completo" navega al tab `Historial` ya existente (`ROUTES.APP.HISTORIAL`), aunque su contenido siga siendo placeholder hasta su propio change.

## Capabilities

### New Capabilities
- `rider-balance`: pantalla de Balance del rider — fetch y presentación del saldo neto, zona, desglose ganado/descontado y últimos movimientos desde `GET /riders/balance`, con sus estados de carga/vacío/error.

### Modified Capabilities
_(ninguna — no cambian requisitos de `app-navigation`; se agrega una constante de ruta nueva para un stub, no se altera el comportamiento de la tab bar ni de las rutas existentes)_

## Impact

- **Afectado:** `app/(app)/(tabs)/balance.tsx` (reemplaza placeholder), `constants/routes.ts` (nueva `ROUTES.APP.WITHDRAWAL`), nuevo módulo `features/balance/` (services, hooks, store, types, components, utils).
- **Nueva pantalla stub:** ruta de Solicitud de retiro (placeholder, sin lógica) para que el botón primario tenga destino.
- **Sin dependencias nuevas:** no requiere instalar librerías adicionales (no hay mapa, bottom sheet ni OTP en esta pantalla).
- **Sin cambios de backend:** consume `GET /riders/balance` tal como está documentado en `docs/endpoints-yo-me-encargo.app.md`.
