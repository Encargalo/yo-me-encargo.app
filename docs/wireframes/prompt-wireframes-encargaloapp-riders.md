# Prompt para Claude Design — Wireframes EncargaloApp Riders (Fase 1)

Actúa como un diseñador UI/UX senior especializado en apps móviles operativas (logística, delivery, last-mile). Crea wireframes de **baja-media fidelidad** (escala de grises, placeholders, sin branding final) para una app de riders de delivery de comida llamada **EncargaloApp**. El rider la usa principalmente **en movimiento, con una mano, con luz solar directa y distracción del tránsito**, así que prioriza: bloques grandes, texto mínimo, jerarquía visual clara por color/ícono de estado, y acciones primarias siempre accesibles con el pulgar (zona inferior de la pantalla).

Formato deseado: pantallas tipo móvil (375x812 aprox, iPhone), una al lado de la otra como flujo, con anotaciones breves de qué hace cada elemento.

---

## 0. Sistema de navegación global

Tab bar inferior con 4 secciones:
- **Inicio** (órdenes activas + mapa)
- **Balance**
- **Historial**
- **Perfil**

Además, un **overlay modal global** (notificación de nueva orden) que puede aparecer encima de cualquier pantalla, en cualquier momento, sin que el rider lo busque.

---

## 1. Login

- Logo de la app centrado arriba.
- Campo: número de teléfono (con selector de código de país, ej. +57).
- Campo: contraseña.
- Botón primario "Iniciar sesión".
- Texto de error inline si las credenciales fallan (alineado al endpoint `422 Credenciales incorrectas`).
- Sin opción de registro (las cuentas las aprueba el admin).
- Estado de carga en el botón mientras autentica.

## 2. Inicio (Home) — Órdenes activas + Mapa

Pantalla principal, dividida en dos zonas:

**Zona superior (60%): Mapa en tiempo real**
- Mapa con marcador del rider (posición GPS actual, ícono distintivo).
- Marcadores diferenciados: restaurante (ícono A) vs. cliente (ícono B), con color según el estado de la orden a la que pertenecen.
- Si no hay órdenes activas: mapa centrado en la posición del rider, sin marcadores, con mensaje breve "Sin órdenes activas".

**Zona inferior (40%, scrolleable): Lista de órdenes activas**
- Tarjetas de orden, cada una con:
  - Badge de estado con color: Recogida pendiente (ámbar), En camino (azul), Entregando (verde).
  - Nombre del restaurante.
  - Distancia/dirección breve del cliente.
  - Tap en la tarjeta → abre Detalle de Orden.
- Si está vacío: estado vacío ilustrado, breve, sin alarmar.

**Header superior:**
- Toggle de disponibilidad (Disponible / No disponible) — switch visible siempre, ya que afecta si recibe nuevas órdenes.
- Ícono de balance rápido (acceso directo, opcional).

## 3. Overlay — Nueva orden disponible

Modal de pantalla completa (o casi completa), interrumpe cualquier pantalla:
- Título corto: "Nueva orden disponible".
- Nombre del restaurante (grande, legible).
- Dirección de entrega.
- Valor de la comisión (destacado, tipografía grande — es el dato que decide la aceptación).
- **Temporizador circular o barra regresiva visible**, contando el tiempo restante para responder.
- Dos botones grandes, lado a lado, en la zona del pulgar:
  - "Rechazar" (secundario).
  - "Aceptar" (primario, color de acción).
- Anotar: si el tiempo llega a 0 sin respuesta, el overlay se cierra automáticamente (rechazo implícito) y vuelve a la pantalla anterior.

## 4. Detalle de Orden

- Header con estado actual de la orden (badge de color, igual que en la tarjeta de Inicio).
- Bloque "Restaurante": nombre, dirección, botón de navegación/llamar (ícono).
- Bloque "Cliente": nombre, dirección, botón de navegación/llamar (ícono).
- Lista de productos del pedido (colapsable si es larga).
- Acción principal contextual según estado:
  - Si "Recogida pendiente" → botón "Confirmar recogida" / "Marcar en camino".
  - Si "En camino" / "Entregando" → ver sección 5 (campo de código).
- Comisión de la orden visible en la parte inferior o header.

## 5. Confirmación de entrega (código del cliente)

Puede ser un estado dentro del Detalle de Orden (no pantalla aparte):
- Campo de entrada de **6 dígitos**, tipo OTP (6 casillas individuales), teclado numérico.
- Botón "Confirmar entrega" (se habilita solo con los 6 dígitos completos).
- Estados de feedback inline, alineados a los códigos reales del backend:
  - Éxito → check verde + transición a "Pedido completado" (`200`).
  - Código inválido → mensaje de error, casillas se vacían (`400`).
  - Código ya utilizado → mensaje específico (`409`).
  - Estado de pedido incorrecto (ej. intenta confirmar algo que no está "En camino") → mensaje específico (`422`).
- Mostrar visualmente confirmación de éxito (pantalla de check + resumen breve) antes de volver a Inicio.

## 6. Balance

Basado en `GET /riders/balance`:
- Card superior destacada: **saldo neto** grande (positivo en verde, negativo en rojo si aplica).
- Indicador de **zona** del rider (`zone`: normal / otra), como badge pequeño.
- Desglose breve debajo del saldo: ganado vs. descontado (si el dato lo permite agrupar).
- Sección "Últimos movimientos" (los 10 que trae el endpoint), cada ítem con:
  - Tipo de movimiento (`movement_type`).
  - Monto (`amount`), en verde/rojo según signo.
  - Fecha (`created_at`).
  - Distancia del pedido asociado (`distance_km`), si aplica.
  - Método de pago (`payment_method`).
- Botón primario fijo abajo: **"Solicitar retiro"**.
- Link/botón secundario: "Ver historial completo" → lleva a la pantalla de Historial (transacciones paginadas).

## 7. Solicitud de retiro

Basado en `POST /riders/withdrawal`:
- Muestra el saldo disponible arriba (reutiliza el dato de Balance).
- Mensaje de regla de negocio visible: *"Disponible para retiro a partir de $15"*.
- Botón "Solicitar retiro" — **deshabilitado** si el balance es menor a $15 (alineado al `422 Balance insuficiente`).
- Estado de confirmación tras solicitar: pantalla/modal con el monto retirado (`amount_withdrawn`) y mensaje de éxito.
- Sección debajo (o pantalla enlazada): historial de retiros con estado (Pendiente / Procesado), cada uno como ítem de lista simple.

## 8. Historial de movimientos / transacciones

Basado en `GET /riders/transactions` (paginado):
- Filtros arriba: rango de fechas + estado de la orden (chips o dropdown).
- Lista de transacciones (mismo formato de tarjeta que en Balance, pero completa y paginada):
  - `movement_type`, `amount`, `created_at`, `distance_km`, `payment_method`, `order_id`.
- Paginación: scroll infinito o "Cargar más" (usa `page` / `limit`, máx 50 por página).
- Tap en una transacción → detalle simple (restaurante, cliente, comisión, fecha completa).
- Estado vacío si no hay movimientos en el filtro aplicado.

## 9. Perfil

- Foto/avatar del rider (placeholder).
- Datos editables: nombre, correo, teléfono — cada uno con ícono de editar.
- Switch de disponibilidad (duplicado del Home, para consistencia — anotar que ambos deben sincronizarse).
- Acceso a Balance e Historial (atajos, opcional).
- Botón "Cerrar sesión" al final, separado visualmente (zona de riesgo, tap accidental improbable).

---

## Consideraciones de UX transversales (anótalas en el wireframe como notas)

- **Estados de carga y vacío** en cada pantalla con datos (skeleton o spinner simple).
- **Colores de estado consistentes** en toda la app: Recogida pendiente = ámbar, En camino/Entregando = azul, Completado = verde, Error/deuda = rojo.
- El **overlay de nueva orden** tiene la prioridad visual más alta de toda la app — debe sentirse urgente pero no genere pánico.
- Toda acción que dependa de un código de respuesta del backend (400/404/409/422/500) debe tener su propio mensaje de error visible en el wireframe, no un genérico.
- Diseño pensado para **uso con una mano**: acciones primarias siempre en el tercio inferior de la pantalla.

---

**Entregable esperado:** un set de wireframes de baja-media fidelidad cubriendo las 9 pantallas/estados anteriores, mostrando el flujo de principio a fin (Login → Home → Overlay nueva orden → Detalle/Confirmación de entrega → Balance → Retiro → Historial → Perfil), con anotaciones breves junto a cada elemento explicando su función.
