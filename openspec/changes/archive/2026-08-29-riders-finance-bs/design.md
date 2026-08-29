## Context

Ver `proposal.md` — Why. El backend ya está en prod con el contrato en Bs; esta app quedó atrás. Contrato confirmado contra `documentacion-api-encargalo/api-docs.md`:

- `BalanceResponse`: `balance_bs`, `balance_usd`, `bcv_rate`, `withdrawal_min_bs`, `zone` (enum `normal | withdrawal_available`), `transactions: TransactionDTO[]`. **Todos los campos son opcionales en el schema** (`number` sin `required`).
- `TransactionDTO`: `id`, `amount_bs`, `amount_usd`, `bcv_rate`, `created_at`, `distance_km`, `movement_type`, `order_id`, `payment_method` (+ `notes`, `proof_url`, `staff_id` de payouts de staff, no usados acá).
- `TransactionsResponse`: `page`, `limit` (default 20, máx 50), `total`, `transactions`.
- `POST /riders/withdrawal`: 200 `{ amount_withdrawn }` · 401 · 422 (insuficiente) · 503 (tasa BCV no disponible) · 500.

Estado del código: `features/balance`, `features/historial` y `features/withdrawal` ya existen (changes `balance-screen`, `historial-screen`, `historial-filtros-paginacion`, `withdrawal-screen`). `features/historial` importa `Transaction` desde `features/balance/types` pero **duplica** `mapTransaction` a propósito. Hay un guard sin commitear en `balance.service.ts` que hace `throw` sobre `data.balance` ausente — es el crash reportado al entrar a Balance.

App hermana `encargalo-mobile-v2` ya hizo esta migración: `utils/formatters.ts` expone `formatAmount(value, "." | ",")`, `formatBs(bs) → "3.200Bs"`, `formatRef(usd) → "Ref. 80$"`, y el componente `DualCurrencyAmount` (Bs grande + `formatRef` chico). Usa `StyleSheet` + `react-native-paper`; esta app usa NativeWind.

## Goals / Non-Goals

**Goals:**
- Alinear las 3 features de finanzas del rider al contrato en Bs sin romper el patrón de arquitectura existente (services → hooks → components, un store por feature, sin axios en componentes).
- Bs como unidad de presentación primaria; USD siempre como subtítulo referencial, nunca cifra sola.
- Parsing defensivo: una respuesta con forma inesperada degrada a estado de error, no a crash.
- Fuente única del mínimo de retiro y del gate: el backend (`withdrawal_min_bs`, `zone`).

**Non-Goals:**
- Unificar `mapTransaction` entre `features/balance` y `features/historial` (se mantiene la duplicación deliberada del código actual).
- Extraer un paquete compartido de formateo con `encargalo-mobile-v2` (se copia la lógica, no se comparte).
- Envoltorio de respuesta v2 y endpoints de staff (ver `proposal.md` — Non-goals).
- Mostrar `bcv_rate` en la card hero de Balance o en la lista de movimientos (solo en el detalle).

## Decisions

### 1. Formateo: portar `formatBs` / `formatRef` a `features/balance/utils/formatAmount.ts`
Se reemplaza el contenido actual de `formatAmount.ts` (`formatAmount(value) → "2$"`, `formatSignedAmount`) por:
- `formatBs(value: number): string` → parte entera con separador de miles `.`, decimales con `,` solo si el valor no es entero (`"3.200Bs"`, `"1.280,5Bs"`).
- `formatSignedBs(value: number): string` → antepone `+` / `−` tipográfico (cero sin signo), reusando `formatBs(Math.abs(value))`.
- `formatRef(usd: number): string` → `"Ref. 80$"` para el subtítulo referencial.

**Por qué:** consistencia visual con la app de clientes, que los riders también usan. **Alternativa descartada:** `Intl.NumberFormat` — Hermes no trae datos de locale completos (mismo motivo por el que `TransactionRow` formatea fechas a mano).

Los consumidores actuales de `formatAmount` / `formatSignedAmount` (`NetBalanceCard`, `TransactionRow`, `TransactionDetailModal`, `AvailableBalanceCard`, `MinimumBalanceNotice`, `WithdrawalSuccess`) migran a los nuevos helpers.

### 2. Tipos: `Transaction` pasa a `amountBs` + `amountUsd` + `bcvRate`
```ts
interface Transaction {
  id: string;
  amountBs: number;
  amountUsd: number;
  bcvRate?: number;       // informativo, opcional
  createdAt: string;
  distanceKm?: number;
  movementType: string;
  orderId?: string;
  paymentMethod?: string; // sigue sin mostrarse
}
```
`RiderBalanceResponse` pasa a `{ balanceBs, balanceUsd, bcvRate?, zone, withdrawalMinBs, transactions }`. Se elimina `balance` plano.

**Por qué mantener `amountUsd` como no-opcional:** aunque el schema lo marca opcional, el backend siempre lo envía en pares con `amountBs`; tratarlo como requerido simplifica los consumidores. `bcvRate` sí opcional porque el detalle debe manejar su ausencia (spec).

### 3. Guard de forma en `getBalance()`: degradar, no `throw` sin control
El guard sin commitear se reescribe: si `typeof data.balance_bs !== "number"` o `!Array.isArray(data.transactions)`, se lanza un `Error` **dentro del `try` del servicio** — pero el contrato con `useBalance` no cambia: el hook ya hace `catch { setStatus("error") }`, así que un throw acá aterriza en el estado de error de la pantalla, no en un crash de render. Se documenta con comentario que el throw es intencional y capturado aguas arriba.

**Por qué no devolver un shape parcial:** un `balance_bs` ausente significa respuesta rota; mostrar "Bs 0" sería peor que un error honesto con reintento. **Alternativa descartada:** validar con zod — no hay zod en el stack y es una sola validación.

### 4. `useBalance` expone `balanceBs`, `balanceUsd`, `withdrawalMinBs`, `zone`
Hoy expone `balance` plano. Pasa a exponer los campos en Bs + `withdrawalMinBs` + `zone` (ya exponía `zone`). `summarizeTransactions` cambia su firma para sumar `amountBs` y su tipo de retorno a `{ earnedBs, deductedBs }`.

`app/(app)/withdrawal.tsx` deja de calcular `canWithdraw = balance >= MIN_WITHDRAWAL_BALANCE` y pasa a `canWithdraw = zone === "withdrawal_available"`.

### 5. `MIN_WITHDRAWAL_BALANCE` se elimina de `withdrawal.types.ts`
`MinimumBalanceNotice` deja de ser un componente sin props: recibe `withdrawalMinBs` y `balanceBs` y arma el copy (mínimo vigente + faltante cuando aplica). `AvailableBalanceCard` recibe `balanceBs` + `balanceUsd`.

### 6. 503 en `getWithdrawalErrorMessage`
Se agrega `if (status === 503) return "La tasa BCV no está disponible ahora. Intenta en unos minutos."` antes del genérico. `useWithdrawal` no cambia (ya pasa `error.response?.status`).

### 7. `bcv_rate` solo en `TransactionDetailModal`
Fila informativa "Tasa BCV" con formato `${bcvRate} Bs/$` (o similar), renderizada solo si `transaction.bcvRate != null`. No se toca `TransactionRow` ni `NetBalanceCard`.

### 8. Retiros recientes: mock sin cambio estructural
`getMockRecentWithdrawals` mantiene forma; los montos de ejemplo se ajustan a valores plausibles en Bs. `RecentWithdrawalRow` formatea con `formatBs`.

## Risks / Trade-offs

- **`amount_bs` / `balance_bs` con decimales largos por conversión BCV** → `formatBs` redondea a 2 decimales (patrón de `encargalo-mobile-v2`), suficiente para display; el USD referencial viene ya calculado del backend, no se reconstruye.
- **`withdrawal_min_bs` ausente en la respuesta (campo opcional)** → `MinimumBalanceNotice` debe manejar `undefined`: si falta, mostrar el aviso genérico sin el número en vez de `"NaN Bs"`. Se cubre con test.
- **Zona `withdrawal_available` pero `POST /riders/withdrawal` responde 422** → posible carrera (saldo cambió entre fetch y submit); ya está cubierto por el manejo de error 422 existente.
- **Snapshots** → ~9 archivos `.snap` cambian de `$` a `Bs`; regenerar con `-u` y revisar el diff, no aceptar a ciegas.
- **`features/historial` importa el tipo `Transaction` de `features/balance`** → el cambio de tipo se propaga solo; hay que actualizar el `mapTransaction` duplicado de `historial.service.ts` en el mismo change o el build de tipos rompe.

## Migration Plan

1. Rama `feat/riders-finance-bs`.
2. Tipos y utils primero (`balance.types.ts`, `formatAmount.ts`, `summarizeTransactions.ts`) — rompe el type-check hasta terminar, es esperado.
3. Services (`balance.service.ts`, `historial.service.ts`, `withdrawal.service.ts` mock) + sus tests.
4. Hooks (`useBalance.ts`) + tests.
5. Componentes de las 3 features + tests + regenerar snapshots.
6. Pantallas (`balance.tsx`, `withdrawal.tsx`).
7. `npx tsc --noEmit` + `npm test` en verde.

Rollback: revertir la rama; el backend en v1 (sin header) no se ve afectado.

## Open Questions

- Formato exacto de la fila "Tasa BCV" en el detalle (`"40 Bs/$"` vs `"Bs 40 / USD"`) — cosmético, se decide al implementar el componente sin afectar specs ni tasks.
