# EncargaloApp · Wireframes App de Riders (Fase 1)

Wireframes de baja-media fidelidad para la app de riders de delivery de comida **EncargaloApp**.
Pensados para uso **en movimiento, con una mano, con luz solar directa**: bloques grandes, texto mínimo, jerarquía por color/ícono de estado, acciones primarias en el tercio inferior (zona del pulgar).

---

## Sistema visual

**Colores de estado (consistentes en toda la app):**
- 🟠 **Ámbar** — Recogida pendiente
- 🔵 **Azul** — En camino / Entregando
- 🟢 **Verde** — Completado
- 🔴 **Rojo** — Error / deuda

**Navegación global:** Tab bar inferior de 4 secciones — **Inicio · Balance · Historial · Perfil** — más un **overlay modal de nueva orden** de prioridad máxima, que puede aparecer encima de cualquier pantalla.

**Flujo:** 01 Login → 02 Home → 03 Overlay → 04 Detalle → 05 Entrega → 06 Balance → 07 Retiro → 08 Historial → 09 Perfil.

---

## 01 · Login
- Logo centrado arriba; campos teléfono (con selector de código de país, +57 por defecto) y contraseña.
- Botón primario "Iniciar sesión" con **estado de carga** (spinner) mientras autentica.
- Error inline alineado al endpoint **`422 Credenciales incorrectas`** (campo en rojo, no alert genérico).
- Sin opción de registro — las cuentas las aprueba el administrador.

## 02 · Inicio (Home) — Órdenes activas + Mapa
- **Header:** toggle Disponible/No disponible siempre visible (controla si recibe órdenes; sincroniza con Perfil) + acceso rápido a balance.
- **Zona superior (~60%):** mapa en tiempo real con marcador del rider (●), restaurante (A) y cliente (B). Color del pin = estado de su orden.
- **Zona inferior (~40%, scrolleable):** tarjetas de orden con badge de estado, nombre del restaurante y distancia/dirección. Tap → Detalle de Orden (04).

### 02b · Inicio — Sin órdenes (estado vacío)
- Mapa centrado en el rider, sin marcadores. Mensaje breve y tranquilo "Sin órdenes activas" (no alarmar).

## 03 · Overlay — Nueva orden disponible
- Modal de prioridad máxima que interrumpe cualquier pantalla; fondo atenuado, sheet limpio (urgente sin generar pánico).
- Nombre del restaurante grande, dirección de entrega, **comisión destacada** (tipografía más grande — es el dato que decide).
- **Temporizador circular regresivo** visible.
- Dos botones grandes lado a lado en zona del pulgar: "Rechazar" (secundario) / "Aceptar" (primario).
- Si el tiempo llega a 0 sin respuesta → cierre automático (rechazo implícito) y vuelve a la pantalla anterior.

## 04 · Detalle de Orden
- Header con estado actual (badge de color, igual que en la tarjeta de Inicio).
- Bloques **Restaurante** y **Cliente**: nombre, dirección, botones de navegar (⌖) y llamar (✆).
- Lista de productos del pedido (colapsable). Comisión siempre visible.
- Acción primaria contextual al estado: "Confirmar recogida / Marcar en camino"; en "En camino / Entregando" → campo de código (05).

## 05 · Confirmación de entrega — Código del cliente
- Estado dentro del Detalle (no pantalla aparte). Campo **OTP de 6 casillas** con teclado numérico.
- Botón "Confirmar entrega" deshabilitado hasta completar los 6 dígitos.
- Mensajes de error inline por código de backend (cada uno con su mensaje propio):
  - **`200`** Éxito → check verde y transición a Pedido completado.
  - **`400`** Código inválido → las casillas se vacían.
  - **`409`** Código ya utilizado.
  - **`422`** Estado de pedido incorrecto (no está "En camino").

### 05b · Pedido completado (200)
- Confirmación visual de éxito: check verde + resumen breve (cliente, distancia, comisión sumada) antes de volver a Inicio.

## 06 · Balance — `GET /riders/balance`
- Card superior destacada: **saldo neto** grande (verde positivo / rojo negativo) + badge de **zona** del rider.
- Desglose ganado vs. descontado bajo el saldo.
- "Últimos movimientos" (10 recientes): tipo, monto (verde/rojo), fecha, distancia del pedido y método de pago.
- Botón primario fijo abajo "Solicitar retiro"; link secundario "Ver historial completo" → Historial (08).

## 07 · Solicitud de retiro — `POST /riders/withdrawal`
- Saldo disponible arriba (reutiliza el dato de Balance).
- Regla de negocio visible: **"Disponible para retiro a partir de $15.000"**.
- Botón "Solicitar retiro" **deshabilitado** si el balance está bajo el umbral (alineado a `422 Balance insuficiente`).
- Historial de retiros con estado: Pendiente (ámbar) / Procesado (verde).

### 07b · Retiro solicitado (éxito)
- Confirmación con el monto retirado (`amount_withdrawn`) y mensaje de éxito. El nuevo retiro aparece como "Pendiente".

## 08 · Historial de movimientos — `GET /riders/transactions`
- Filtros: rango de fechas + estado (chips). Estado vacío si no hay movimientos en el filtro.
- Lista paginada con mismo formato de tarjeta que Balance: `movement_type`, `amount`, `created_at`, `distance_km`, `payment_method`, `order_id`.
- Paginación scroll infinito o "Cargar más" (`page`/`limit`, máx 50). Tap → detalle simple de la transacción.

## 09 · Perfil
- Avatar (placeholder); datos editables nombre, correo, teléfono (cada uno con ícono ✎).
- Switch de disponibilidad duplicado del Home — ambos deben mantenerse sincronizados.
- Atajos a Balance e Historial.
- "Cerrar sesión" separado visualmente (zona de riesgo), tono rojo, lejos de las acciones frecuentes.

---

## Consideraciones de UX transversales
- Estados de carga y vacío en cada pantalla con datos.
- Colores de estado consistentes en toda la app.
- El overlay de nueva orden tiene la prioridad visual más alta — urgente sin generar pánico.
- Toda acción que dependa de un código de backend (400/404/409/422/500) tiene su propio mensaje de error visible, no genérico.
- Diseño para uso con una mano: acciones primarias siempre en el tercio inferior.
