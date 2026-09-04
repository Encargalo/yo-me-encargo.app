## 1. Tipos

- [x] 1.1 Crear `features/withdrawal/types/withdrawal.types.ts`: `MIN_WITHDRAWAL_BALANCE = 0.1`, `WithdrawalResponse { amountWithdrawn: number }`, `RecentWithdrawal { amount: number, date: string, status: "pending" | "processed" }`

## 2. Servicio — `POST /riders/withdrawal` + retiros recientes mockeados

- [x] 2.1 Crear `features/withdrawal/services/withdrawal.service.ts` con `requestWithdrawal(): Promise<WithdrawalResponse>` vía `apiClient.post("/riders/withdrawal")`, mapeo `amount_withdrawn` → `amountWithdrawn`
- [x] 2.2 En el mismo servicio, `getMockRecentWithdrawals(): RecentWithdrawal[]` síncrono, sin llamada HTTP, 2-3 registros fijos, con comentario marcando que es placeholder hasta que exista un endpoint real (ver design.md, Decisión 8)
- [x] 2.3 Tests `withdrawal.service.test.ts`: `requestWithdrawal` happy path (200 con `amount_withdrawn`) y error propagado como `AxiosError`; `getMockRecentWithdrawals` devuelve el array esperado

## 3. Utilidad — mensajes de error por código de status

- [x] 3.1 Crear `features/withdrawal/utils/withdrawalErrorMessage.ts`: `getWithdrawalErrorMessage(status?: number): string` — `422` → mensaje de saldo insuficiente, `401` → mensaje de sesión expirada, cualquier otro caso (incluido sin status, error de red) → mensaje genérico de reintento (ver design.md, Decisión 6)
- [x] 3.2 Tests `withdrawalErrorMessage.test.ts`: los tres casos (`422`, `401`, otro/`undefined`)

## 4. Hook orquestador `useWithdrawal`

- [x] 4.1 Crear `features/withdrawal/hooks/useWithdrawal.ts`: expone `{ status: "idle" | "submitting" | "success" | "error", amountWithdrawn, errorMessage, submit, recentWithdrawals }` — `submit()` llama `requestWithdrawal()`, pasa a `"submitting"` mientras está en curso, `"success"` + `amountWithdrawn` en el 200, `"error"` + `errorMessage` (vía `getWithdrawalErrorMessage`) si falla
- [x] 4.2 `recentWithdrawals` se puebla desde `getMockRecentWithdrawals()` al montar (sin refetch ni foco — son datos estáticos)
- [x] 4.3 Tests `useWithdrawal.test.ts`: envío exitoso, error 422, error 401, error genérico/red, estado inicial expone los retiros recientes mockeados

## 5. Componentes UI

- [x] 5.1 `features/withdrawal/components/AvailableBalanceCard.tsx`: tarjeta "Disponible para retiro" + monto grande (reutiliza `formatAmount` de `features/balance/utils/formatAmount`) — sin badge de zona ni desglose Ganado/Descontado (eso es exclusivo de Balance)
- [x] 5.2 `features/withdrawal/components/MinimumBalanceNotice.tsx`: aviso inline del umbral mínimo, usa `formatAmount(MIN_WITHDRAWAL_BALANCE)` en el texto (nunca un número hardcodeado aparte de la constante)
- [x] 5.3 `features/withdrawal/components/RecentWithdrawalRow.tsx`: fila con monto, fecha y píldora de estado (ámbar "Pendiente" / verde "Retirado" — ajustado de "Procesado" tras feedback del usuario, usando `OrderStatusColors.pending`/`.completed`)
- [x] 5.4 `features/withdrawal/components/RecentWithdrawalsList.tsx`: lista de `RecentWithdrawalRow` a partir de `recentWithdrawals`
- [x] 5.5 `features/withdrawal/components/WithdrawalSuccess.tsx`: check de éxito, "Retiro solicitado", monto retirado (`formatAmount(amountWithdrawn)`), botón "Entendido" — envuelto en `Animated.View` con `entering={FadeIn.duration(350)}` (`react-native-reanimated`, ya instalado desde `order-completed-polish`)
- [x] 5.6 Snapshot tests de los componentes presentacionales (`AvailableBalanceCard`, `MinimumBalanceNotice`, `RecentWithdrawalRow`, `RecentWithdrawalsList`, `WithdrawalSuccess`)

## 6. Pantalla — integración

- [x] 6.1 Reemplazar el stub de `app/(app)/withdrawal.tsx`: usa `useBalance()` (de `features/balance`) para el saldo disponible con sus propios estados de carga/error, y `useWithdrawal()` para la acción de retiro
- [x] 6.2 Estado inicial (`idle`): `AvailableBalanceCard` + `MinimumBalanceNotice` + `RecentWithdrawalsList` + botón "Solicitar retiro" fijo abajo (`bg-ink`, hand-rolled con NativeWind, mismo patrón que Balance — no `components/Button.tsx`)
- [x] 6.3 Botón deshabilitado si `balance < MIN_WITHDRAWAL_BALANCE`; durante `status === "submitting"` muestra `ActivityIndicator` en vez del label y permanece deshabilitado
- [x] 6.4 Banner inline de error arriba del botón cuando `status === "error"`, con el mensaje de `errorMessage`, sin ocultar el resto del contenido
- [x] 6.5 Cuando `status === "success"`, swap a `WithdrawalSuccess`; "Entendido" hace `router.back()` (vuelve a Balance, que refresca solo vía `useFocusEffect` ya existente)

## 7. Verificación

- [x] 7.1 `npx tsc --noEmit` y `npm run lint` en verde
- [x] 7.2 Prueba manual en dispositivo real, dos pasadas:
  - Camino de error: con balance $14.0 (arriba del umbral frontend de $0.1) el botón quedó habilitado, el envío disparó el POST real contra el backend, y el 422 real (`"insufficient balance for withdrawal"`) se tradujo correctamente al mensaje de "saldo insuficiente" — ver Riesgo confirmado en design.md (backend real aún no desplegaba el umbral de $0.1 en ese momento)
  - Camino de éxito: verificado manualmente por el usuario — retiro aprobado muestra `WithdrawalSuccess` con el monto correcto y "Entendido" vuelve a Balance con el saldo actualizado
  - Log de depuración temporal usado para diagnosticar el 422 ya se retiró del código
