## Why

El CTA "Solicitar retiro" de Balance hoy navega a un stub ("Próximamente", `app/(app)/withdrawal.tsx`) dejado a propósito en el change `balance-screen` (design.md, Decisión 6). El rider ya puede ver cuánto ganó, pero no puede retirar ese dinero desde la app — hay que construir la pantalla real contra `POST /riders/withdrawal`.

## What Changes

- Reemplaza el stub de `app/(app)/withdrawal.tsx` por la pantalla real de Solicitud de retiro (wireframe 07/07b): saldo disponible, aviso de umbral mínimo, botón "Solicitar retiro" y confirmación de éxito con el monto retirado.
- Nuevo módulo `features/withdrawal/` (servicio, hook, tipos, utils, componentes) — separado de `features/balance/`: Balance es una vista de lectura de lo ganado; Retiro es la acción de sacar ese dinero, con su propio flujo de POST/éxito/error.
- **BREAKING (regla de negocio):** el umbral mínimo de retiro baja de $15 a **$0.1** — ya coordinado con backend. `docs/endpoints-yo-me-encargo.app.md` se actualiza para reflejar esto (ya corregido durante la exploración).
- Sección "Retiros recientes" del wireframe se construye con datos mockeados en el frontend (no existe endpoint de lectura de retiros todavía) — placeholder explícito hasta que backend exponga uno.
- Mensajes de error de 401/422/500 se escriben en el frontend por código de status (el backend no manda un cuerpo estructurado en este endpoint, a diferencia de `confirm-delivery`).
- Confirmación de éxito (07b) como swap de estado dentro de la misma pantalla (mismo patrón que `order-completed-polish`), no una ruta/modal nueva.

## Capabilities

### New Capabilities
- `rider-withdrawal`: pantalla de Solicitud de retiro — saldo disponible, validación de umbral mínimo, solicitud de retiro (`POST /riders/withdrawal`), confirmación de éxito con el monto retirado, y lista de retiros recientes (datos mockeados por ahora).

### Modified Capabilities
(ninguna — `rider-balance` ya especifica la navegación hacia `ROUTES.APP.WITHDRAWAL`, sin cambios de requirement)

## Impact

- **Código nuevo:** `features/withdrawal/{services,hooks,types,utils,components}/`
- **Código modificado:** `app/(app)/withdrawal.tsx` (de stub a pantalla real)
- **Docs:** `docs/endpoints-yo-me-encargo.app.md` (umbral corregido a $0.1)
- **Dependencias:** ninguna nueva librería — reutiliza patrones ya instalados (NativeWind, `useFocusEffect`, Reanimated ya presente desde `order-completed-polish`)
- **Sin impacto en balance:** `useBalance()` ya refetch-ea en foco, así que el saldo se actualiza solo al volver de un retiro exitoso
