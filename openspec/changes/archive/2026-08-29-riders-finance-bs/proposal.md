## Why

El backend ya migró (en prod desde `fd0bb7d`) el balance y los movimientos del rider de USD plano a **bolívares**: `GET /riders/balance` y `GET /riders/transactions` ya no devuelven los campos `balance` / `amount`, sino `balance_bs` + `balance_usd` y `amount_bs` + `amount_usd`, más `bcv_rate`, `withdrawal_min_bs` (mínimo de retiro dinámico) y `zone`. La app de riders sigue leyendo los campos viejos: hoy la pantalla de Balance **crashea al entrar** (guard de forma que dispara sobre un `balance` ausente) y el Historial y el CTA de retiro muestran datos incorrectos.

## What Changes

- **BREAKING**: `getBalance()` deja de leer `data.balance` (número USD) y pasa a leer `balance_bs`, `balance_usd`, `bcv_rate`, `withdrawal_min_bs`, `zone`. El guard de forma valida `balance_bs` y tolera campos opcionales ausentes en vez de lanzar `throw` (era la causa del crash).
- **BREAKING**: `Transaction` deja de tener `amount` (USD) y pasa a `amountBs` + `amountUsd` + `bcvRate`. Afecta a `features/balance` y `features/historial` (que reusa el tipo).
- Toda la UI de dinero del rider (Balance, Historial, Retiro, confirmación de retiro) muestra **Bs como cifra principal** y **USD como subtítulo referencial** (`Ref. N$`). Se portan `formatBs` / `formatRef` desde `encargalo-mobile-v2/utils/formatters.ts` adaptados a NativeWind, reemplazando `formatAmount` / `formatSignedAmount` USD actuales.
- Se elimina la constante hardcodeada `MIN_WITHDRAWAL_BALANCE`. El CTA "Solicitar retiro" pasa a gatearse por `zone === "withdrawal_available"` (no por comparación numérica). El aviso de mínimo usa `withdrawal_min_bs` del backend y el copy "te faltan X Bs" se calcula como `withdrawal_min_bs - balance_bs`.
- `summarizeTransactions` (desglose Ganado/Descontado) suma `amountBs`.
- `bcv_rate` se muestra únicamente como fila informativa en el detalle de movimiento (`TransactionDetailModal`).
- `getWithdrawalErrorMessage` agrega el caso **503** (`bcv_rate_unavailable`) con copy propio ("la tasa no está disponible, intenta en unos minutos"), distinto del genérico.
- Retiros recientes siguen mockeados; sus montos pasan a interpretarse como Bs.
- Se regeneran los snapshots de los componentes afectados (~9).

### Non-goals

- El envoltorio de respuesta `{ data, error, meta }` opt-in por header `X-Api-Response-Version: 2` (change posterior, aislado en `lib/axios.ts`).
- Los endpoints `/riders/staff/finance/*` (pertenecen al CRM, no a esta app).

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `rider-balance`: el saldo, el desglose y las filas de movimiento pasan a expresarse en Bs (con USD referencial); el color del saldo se decide sobre `balance_bs`; la respuesta consumida cambia de `balance`/`amount` a `balance_bs`/`balance_usd`/`amount_bs`/`amount_usd`/`bcv_rate`/`withdrawal_min_bs`; un error de forma en la respuesta ya no debe crashear la pantalla.
- `rider-transaction-history`: las filas y el detalle de transacción pasan a Bs (con USD referencial); el detalle agrega la tasa BCV (`bcv_rate`) como dato informativo.
- `rider-withdrawal`: el saldo disponible se muestra en Bs; el umbral fijo de `$0.1` se reemplaza por el gate `zone === "withdrawal_available"` y el mínimo dinámico `withdrawal_min_bs`; el manejo de errores agrega el caso 503 (tasa BCV no disponible); la confirmación de éxito muestra `amount_withdrawn` en Bs.

## Impact

- **Código**:
  - `features/balance/`: `services/balance.service.ts`, `types/balance.types.ts`, `hooks/useBalance.ts`, `utils/formatAmount.ts`, `utils/summarizeTransactions.ts`, `components/NetBalanceCard.tsx`, `components/TransactionRow.tsx`, `__snapshots__/*`.
  - `features/historial/`: `services/historial.service.ts`, `types/historial.types.ts`, `components/TransactionDetailModal.tsx`, `hooks/useTransactionHistory.ts` (si toca el shape), `__snapshots__/*`.
  - `features/withdrawal/`: `types/withdrawal.types.ts` (borrar `MIN_WITHDRAWAL_BALANCE`), `hooks/useWithdrawal.ts`, `utils/withdrawalErrorMessage.ts`, `services/withdrawal.service.ts` (mock), `components/AvailableBalanceCard.tsx`, `components/MinimumBalanceNotice.tsx`, `components/WithdrawalSuccess.tsx`, `components/RecentWithdrawalRow.tsx`, `__snapshots__/*`.
  - `app/(app)/(tabs)/balance.tsx`, `app/(app)/withdrawal.tsx`.
- **API consumida**: `GET /riders/balance`, `GET /riders/transactions`, `POST /riders/withdrawal` (nuevo status 503).
- **Dependencias**: ninguna nueva. Se copia lógica de formato desde `encargalo-mobile-v2` (no se agrega como dependencia).
- **Tests**: se actualizan tests de servicios, hooks, utils y componentes de las tres features; se regeneran snapshots.
