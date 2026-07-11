## Context

Historial (`features/historial/`, ver `app/(app)/(tabs)/historial.tsx`) hoy es un `FlatList` con scroll infinito sobre `GET /riders/transactions` (`page`/`limit`/`total`, máx `limit=50`). La fila (`TransactionRow`, reusada de `features/balance/components/`) muestra `movementType`, `amount`, `createdAt`, `distanceKm` — nunca `orderId` ni `paymentMethod` (este último ocultado a propósito, Decisión 8 de `balance-screen`).

El wireframe 08 pide: tabla con paginación numerada, filtro de rango de fechas, `order_id` visible, y tap → detalle simple de la transacción. El endpoint no soporta ningún filtro (`docs/endpoints-yo-me-encargo.app.md`, confirmado también en el `proposal.md` del change original de Historial, que dejó los filtros fuera de alcance con la nota "se difiere a un change futuro"). El filtro de "estado" (Pendiente/Retirado) también pedido en el wireframe se difiere de nuevo aquí — no existe endpoint que devuelva ese campo ni en `GET /riders/transactions` ni en `POST /riders/withdrawal` (confirmado: `RecentWithdrawal.status` en `features/withdrawal/types/withdrawal.types.ts` es dato mockeado, no real).

## Goals / Non-Goals

**Goals:**
- Tabla con paginación numerada real (no scroll infinito acumulativo).
- Filtro de rango de fechas que nunca pierde ni duplica ítems al combinarse con la paginación, y que se aplica automáticamente al completar ambas fechas.
- Tap en una fila → detalle simple de esa transacción (mismos datos ya cargados, sin fetch adicional).
- Usar los tokens de marca existentes (`primary`) para los elementos interactivos, en vez de la paleta neutra del wireframe — el wireframe es grayscale a propósito, pero el producto real usa color (ver `CLAUDE.md`: "la paleta de color... sí están definidas y son estables").

**Non-Goals:**
- Filtro de "estado" (Pendiente/Retirado) — no hay campo real de backend. Documentado como brecha, igual que `rider-withdrawal`.
- Cualquier cambio en `GET /riders/transactions` o su contrato — el endpoint sigue recibiendo solo `page`/`limit`.
- Cambios en la fila de Balance (`TransactionsList` de `features/balance/`) — Balance sigue sin `onPress`.
- Mostrar `order_id` — se implementó (fila + detalle) y se retiró a pedido del usuario tras revisar en dispositivo; queda fuera de alcance para este change.

## Decisions

### 1. Dos modos de paginación: `server-paged` (sin filtro) y `client-filtered` (con filtro de fecha activo)

- **Sin filtro de fecha activo**: la tabla pagina 1:1 contra el servidor. Tamaño de página de la UI = `limit` enviado al servidor = **10** (constante `HISTORIAL_PAGE_SIZE`, separada de `MAX_SERVER_LIMIT = 50`). Página N de la tabla → `GET /riders/transactions?page=N&limit=10`. `totalPages = Math.ceil(total / 10)` viene directo del `total` que responde el servidor.
- **Con filtro de fecha activo**: se recorren todas las páginas del servidor con `limit=50` (el máximo permitido, para minimizar requests) hasta agotar `total`, se cachea el set completo en memoria, se filtra por `createdAt` dentro del rango, y la tabla pagina **en cliente** sobre el resultado filtrado con el mismo `HISTORIAL_PAGE_SIZE = 10`.
- **Por qué**: es la única forma de tener números de página reales y consistentes ("Página 3 de 12") sin que el backend soporte filtro de fecha. En el caso sin filtro (el uso más común) no hay sobrecarga — se sigue pidiendo de a una página. La sobrecarga de "traer todo" solo ocurre cuando el rider decide filtrar por fecha.
- **Alternativa descartada**: paginar en cliente sobre páginas parciales sin traer todo (fetch incremental hasta llenar la página filtrada). Se descarta porque no permite mostrar un número de página total confiable de entrada (cambiaría a medida que se sigue buscando), lo cual contradice el pedido explícito de una tabla con paginación real.
- **Cache del set completo**: una vez traído para un filtro, se mantiene en memoria mientras la pantalla esté montada y el filtro de fecha siga activo (cambiar el rango de fechas reusa el mismo set ya traído, sin refetch — solo se re-filtra y re-pagina en cliente). Se descarta al limpiar el filtro o al hacer pull-to-refresh.

### 2. `useTransactionHistory` pasa de "acumular páginas" a "página actual + filtro"

Cambia la forma del estado interno: de `transactions: Transaction[]` (acumulado) + `hasMore` a algo como `{ mode: "server" | "client-filtered", page, totalPages, rows: Transaction[], dateRange?, isLoadingFullSet }`. Es un cambio de forma interna del hook, no de su API pública hacia la pantalla (sigue devolviendo `rows`, `loading`, `error`, y ahora `page`/`totalPages`/`setPage`/`dateRange`/`setDateRange`).

### 3. `TransactionRow` se extiende solo con `onPress` (sin `orderId`)

`TransactionRow` (features/balance) se extiende con un prop opcional `onPress?: () => void` para el tap-to-detail de Historial. Balance sigue llamándolo sin ese prop (no cambia su render). Evita duplicar el componente de fila entre las dos features (mismo criterio ya usado en el proyecto: reusar en vez de bifurcar).

- **`orderId` se probó y se retiró**: se agregó inicialmente como prop opcional (mostrando `#order-id` junto al monto), pero tras revisar la pantalla real en dispositivo el usuario pidió quitarlo ("pensaba que no iba a servir"). Se removió de `TransactionRow`, de la fila de Historial y del detalle — puede reconsiderarse en un change futuro con otro dato en su lugar.
- **Alternativa descartada**: crear `HistorialRow` propio en `features/historial/components/`. Se descarta porque el layout es idéntico salvo el prop opcional — bifurcar el componente duplicaría estilos y tests sin necesidad.

### 4. Detalle de transacción: `Modal` nativo de React Native, sin librería nueva

El tap-to-detail se resuelve con el componente `Modal` de React Native (ya disponible, sin instalar nada), mostrando los mismos campos de la fila (`movementType`, `amount`, `createdAt`, `distanceKm`) — `paymentMethod` se mantiene oculto (Decisión 8 de `balance-screen` sigue vigente, no hay motivo nuevo para revertirla), y `orderId` ya no se muestra (ver Decisión 3). No requiere fetch adicional: los datos ya están en memoria (fila tocada).

- **Por qué no `@gorhom/bottom-sheet`**: esa librería se reserva para el change de "Overlay nueva orden" según `CLAUDE.md`; el detalle acá es una vista de solo lectura sin gestos de arrastre ni necesidad de altura dinámica — `Modal` nativo alcanza y evita una dependencia adicional para un caso simple.

### 5. Filtro de rango de fechas: nueva dependencia `@react-native-community/datetimepicker`, con auto-aplicar

Ninguna librería instalada ni feature nativa de Expo cubre un selector de fecha con UI nativa (iOS/Android). Se instala `@react-native-community/datetimepicker` (estándar de facto en el ecosistema Expo/RN) para los dos inputs "Desde"/"Hasta". Sigue la convención del proyecto de instalar librerías dentro del change que las necesita.

El filtro se aplica automáticamente en cuanto ambas fechas quedan elegidas (en cualquier orden), sin que el rider deba tocar "Aplicar" — decisión tomada tras probar en dispositivo (el usuario esperaba que el filtro reaccionara solo). El botón "Aplicar" se mantiene visible como confirmación manual redundante (útil si se quiere forzar el mismo rango de nuevo), deshabilitado mientras falte una fecha.

### 6. Color: tokens de marca (`primary`) en vez de `ink` para elementos interactivos

Los botones de paginación, "Aplicar" y "Cerrar" del detalle, además de los chips de fecha ya elegidos y "Limpiar filtro", usan `bg-primary`/`border-primary`/`text-primary` (`#fc6b2b`, el mismo token que ya usa el tab bar activo) en vez de `bg-ink`. Decisión tomada tras probar en dispositivo: la pantalla se veía "muy opaca" con la paleta neutra del wireframe aplicada tal cual. `ink` se mantiene para texto informativo no interactivo (labels, monto cuando no hay color de estado, etc.). "Limpiar filtro" pasa de texto plano a un chip con borde e ícono (`X` de `lucide-react-native`, ya usado en el proyecto) — el usuario no lo encontraba fácilmente como texto suelto. También se agregó separación (`mt-3`) entre el título "Historial" y la tarjeta de filtro, que antes quedaba pegada.

- **Por qué no tokens nuevos**: `tailwind.config.js` ya expone `primary` como clase (`bg-primary`, `text-primary`, `border-primary`); no fue necesario hardcodear ningún hex nuevo.

## Risks / Trade-offs

- **[Riesgo] Historial muy largo + filtro de fecha activo** → "traer todo" puede significar muchas páginas de 50 si el rider lleva mucho tiempo activo. **Mitigación**: se muestra un estado de carga explícito ("Cargando historial completo para aplicar el filtro...") mientras se agotan las páginas; se cachea el resultado para no repetir el fetch completo en cada cambio de rango dentro de la misma sesión de filtro.
- **[Riesgo] Filtro de "estado" pedido por el wireframe queda sin resolver** → mismo riesgo aceptado ya documentado en `rider-withdrawal` (Decisión 8/Riesgo). **Mitigación**: ninguna por ahora — brecha conocida y coordinada con el usuario, se revisita si backend expone el campo.
- **[Riesgo] `TransactionRow` compartido entre Balance e Historial** → un cambio futuro en Balance podría romper Historial sin querer. **Mitigación**: props nuevas son opcionales y no alteran el render existente sin pasarlas explícitamente; tests de ambas features cubren su propio uso del componente.

## Open Questions

- Ninguna pendiente — alcance, brecha de "estado", componente de fila y librería de date picker ya se confirmaron con el usuario durante la exploración previa a este change.
