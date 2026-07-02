# EncargaloApp · Wireframes App de Riders (Fase 1)

Wireframes de baja-media fidelidad para la app de riders de delivery de comida **EncargaloApp**.
Pensados para uso **en movimiento, con una mano, con luz solar directa**: bloques grandes, texto mínimo, jerarquía por color/ícono de estado, acciones primarias en el tercio inferior (zona del pulgar).

> **Este `.md` es la fuente de verdad de diseño y debe reproducir el `.html` gemelo (`EncargaloApp Riders Wireframes.html`).**
> No es solo una lista de contenido de pantallas: es un **brief visual**. Un agente que reproduzca estos wireframes debe respetar **al pie de la letra** los tokens, el marco de dispositivo y el patrón de anotación de la sección [Sistema visual](#sistema-visual). Describir solo "qué va en la pantalla" produce algo que **no se parece** al `.html`.

---

## Cómo se renderiza el documento completo

El entregable NO es una pantalla suelta: es **un solo lienzo (canvas) de presentación** que contiene todas las pantallas como maquetas de teléfono, tipo tablero de diseño. La estructura de arriba a abajo es:

1. **Lienzo (página):** fondo papel cálido `#faf9f5`, padding `48px 56px 80px`, fuente base `'Inter Tight', -apple-system, sans-serif`. Todo el texto en escala de grises sobre este papel.
2. **Cabecera del documento** (ancho máx. 920px):
   - Eyebrow monoespaciada en mayúsculas, tracking amplio, gris: `WIREFRAMES · BAJA-MEDIA FIDELIDAD · v1`.
   - `h1` 34px/700: **EncargaloApp · App de Riders**.
   - Párrafo 14px, `color:#6b685f`, ancho máx. 680px, explicando el enfoque (uso en movimiento, una mano, escala de grises, color reservado para estados).
3. **Leyenda / sistema** — dos tarjetas lado a lado (`background:#fbfbf9; border:1px solid #d8d5cd; border-radius:12px; padding:16px 18px`):
   - Tarjeta 1 "COLORES DE ESTADO · CONSISTENTES EN TODA LA APP": cuatro chips (cuadro de color 14px + etiqueta) con los 4 estados.
   - Tarjeta 2 "NAVEGACIÓN GLOBAL · TAB BAR (4) + OVERLAY DE PRIORIDAD MÁXIMA": pastillas `Inicio · Balance · Historial · Perfil`.
4. **Flow strip** — una línea monoespaciada gris de migas:
   `FLUJO → 01 Login → 02 Home → 03 Overlay → 04 Detalle → 05 Entrega → 06 Balance → 07 Retiro → 08 Historial → 09 Perfil`.
5. **Contenedor de pantallas** — `display:flex; flex-wrap:wrap; gap:56px 60px; align-items:flex-start`. Cada pantalla es un bloque [marco + anotaciones](#patrón-de-cada-pantalla).

---

## Sistema visual

Esta es la parte que hace que el resultado **se vea** como el `.html`. Respetarla es obligatorio.

### Filosofía
Escala de grises + placeholders. **El color se reserva exclusivamente para el estado de la orden.** Las notas en tipografía monoespaciada explican la función de cada elemento (no son parte de la UI real; son andamiaje del wireframe).

### Tipografía
- **UI:** `'Inter Tight'` (sans). Pesos usados: 600 (semibold) y 700 (bold) para énfasis; 400 normal.
- **Notas / etiquetas / eyebrows (`.mono`):** monoespaciada, casi siempre en **MAYÚSCULAS**, `letter-spacing` amplio (`.12em`–`.14em`), tamaño 9–12px, color gris (`#9b988f` / `#a9a69d`).
- Títulos grandes usan `letter-spacing:-.02em`.

### Tokens de gris (neutros)
| Token | Hex | Uso |
|-------|-----|-----|
| Tinta / primario | `#2a2a2a` | Texto principal, botón primario, borde del marco, badges numerados |
| Texto medio | `#6b685f` | Cuerpo, notas |
| Texto atenuado | `#8d8a81` | Subtítulos, direcciones |
| Gris etiqueta | `#9b988f` | Eyebrows mono |
| Placeholder | `#a9a69d` / `#b6b3aa` | Texto de placeholder, inputs vacíos |
| Borde input | `#cbc8c0` | Bordes de campos y pastillas |
| Borde tarjeta | `#d8d5cd` | Bordes de tarjetas/paneles |
| Fondo tarjeta | `#fbfbf9` | Superficie de tarjeta / marco de teléfono |
| Blanco | `#fff` | Inputs, tarjetas de orden, tab bar |
| Fondo bloque tenue | `#f2f0ea` | Cajas destacadas neutras (p. ej. comisión) |
| Lienzo | `#faf9f5` | Fondo de la página |

### Colores de estado — **versión wireframe (apagada)**
En estos wireframes en escala de grises se usan **tintes desaturados** de los colores de estado (encajan con la estética de maqueta). No hardcodear otros:

| Estado | Hex wireframe | Significado |
|--------|---------------|-------------|
| 🟠 Ámbar | `#d39a2a` | Recogida pendiente |
| 🔵 Azul | `#3f72a8` | En camino / Entregando |
| 🟢 Verde | `#4a9469` | Completado |
| 🔴 Rojo | `#bd5b54` | Error / deuda |

> **Nota para la app real:** en la app implementada, estos estados usan los tokens **saturados** de `constants/theme.ts` / `tailwind.config.js` (`pending #f59e0b`, `enroute #3b82f6`, `completed #22c55e`, `error #ef4444`). El wireframe muestra la versión apagada; el producto usa la saturada. Son el **mismo** sistema de 4 estados, solo cambia la intensidad.

### Convenciones de componentes
- **Tarjeta / panel:** `background:#fbfbf9` (o `#fff` para tarjetas de orden), `border:1px solid #d8d5cd`, `border-radius:12–18px`, `padding:13–20px`.
- **Badge de estado (píldora):** texto 11px/600 blanco sobre el color de estado, `padding:3px 9px`, `border-radius:20px`.
- **Botón primario:** `background:#2a2a2a`, texto blanco 15–16px/600–700, alto 52–56px, `border-radius:12–14px`.
- **Botón secundario:** `background:#fff`, `border:1.5px solid #cbc8c0`, texto `#6b685f`.
- **Input:** alto 48px, `border:1.5px solid #cbc8c0`, `border-radius:10px`, `background:#fff`; en error el borde pasa a `#bd5b54`.
- **Toggle disponibilidad:** pista 42×24 `border-radius:14px`, verde `#4a9469` cuando "Disponible", perilla blanca 20px a la derecha.

### Patrón de cada pantalla
Cada una de las 9 pantallas se dibuja igual:

1. **Cabecera de la pantalla** (encima del marco): badge oscuro mono con el número (`background:#2a2a2a; color:#fff; padding:3px 9px; border-radius:5px`, p. ej. `01`) + nombre de la pantalla en 16px/600.
2. **Marco de teléfono:** `width:375px; height:812px; background:#fbfbf9; border:1.5px solid #2a2a2a; border-radius:34px; overflow:hidden; box-shadow:0 12px 30px rgba(0,0,0,.10)`, en `flex-direction:column`.
   - **Status bar** (siempre): fila de 34px, `9:41` a la izquierda + ícono de batería (rectángulo 18×9 con borde) a la derecha, `color:#555`, 12px/600.
   - Debajo, el contenido específico de la pantalla.
3. **Columna de anotaciones** (a la derecha del marco, `width:228px; padding-top:48px`, gap 14px): lista de notas numeradas. Cada nota = un **marcador circular 17px** (número blanco 9px/700) + texto mono 11px `color:#6b685f; line-height:1.5`.
   - El **color del marcador** refuerza el estado: normalmente `#2a2a2a` (tinta), pero se usa el color de estado cuando la nota habla de ese estado (p. ej. la nota del error 422 usa marcador rojo `#bd5b54`; la del toggle Disponible usa verde `#4a9469`).

Marco + columna van dentro de un contenedor `display:flex; gap:20px; align-items:flex-start`.

---

## Pantallas

Cada pantalla lista su **contenido/función** (qué mostrar) y sus **notas** (la columna de anotaciones). Renderizar siempre con el [patrón de pantalla](#patrón-de-cada-pantalla) y los [tokens](#sistema-visual) de arriba.

### 01 · Login
- Logo centrado arriba en placeholder cuadrado 78px con **borde punteado** (`2px dashed #b6b3aa`) y texto mono `LOGO`. Debajo: "Bienvenido" (19px/600) + subtítulo "Ingresa para empezar a recibir órdenes".
- Etiqueta mono `TELÉFONO` → fila: selector de código de país (caja 74px con `+57 ▾`) + campo de número (placeholder `300 000 0000`).
- Etiqueta mono `CONTRASEÑA` → input con puntos `••••••••` y ojo 👁; en el mock el **borde está en rojo** `#bd5b54` (estado de error).
- Error inline (no alert): punto rojo `!` + texto mono `422 · Credenciales incorrectas`.
- Botón primario oscuro con **spinner** (aro 15px) + "Iniciar sesión" — estado de carga mientras autentica.
- Pie: "Las cuentas las aprueba el administrador".
- **Notas:** ① selector de país (+57 por defecto) separado del número · ② error inline alineado al endpoint **422**, campo en rojo, no alert genérico (marcador rojo) · ③ botón con spinner; sin registro.

### 02 · Inicio (Home) — Órdenes activas + Mapa
- **Header (dentro del marco):** a la izquierda toggle verde "Disponible" + subtexto mono "recibiendo órdenes"; a la derecha pastilla de acceso rápido a balance (aro + `$24.500`).
- **Mapa (~60%, `flex:1.4`):** rectángulo con textura de rayas diagonales (`repeating-linear-gradient(45deg,#eceae4,#e4e1d9)`), `border-radius:16px`, etiqueta mono `MAPA EN TIEMPO REAL` arriba-izq. Marcadores: **rider** = círculo oscuro `#2a2a2a` con punto blanco (●); **restaurante** = pin `A` con el color del estado (ámbar); **cliente** = pin `B` (azul). Los pines usan `border-radius:50% 50% 50% 2px` (forma de gota) y borde blanco.
- **Lista (~40%, scrolleable):** encabezado "Órdenes activas" + contador mono "2 · desliza ↓". Tarjetas blancas (`border:1px solid #d8d5cd; radius:14px`): badge de estado (píldora de color) + distancia a la derecha, nombre del restaurante (15px/600), línea "Cliente · dirección" atenuada. Tap → Detalle (04).
- **Tab bar** (60px, borde superior, fondo blanco): 4 ítems Inicio·Balance·Historial·Perfil; el activo (Inicio) en tinta `#2a2a2a`, el resto en gris `#a9a69d`.
- **Notas:** ① toggle Disponible/No disponible siempre visible, sincroniza con Perfil (marcador verde) · ② mapa 60% con ●/A/B, color del pin = estado · ③ lista 40% scrolleable, tap → 04, badge por color · ④ acceso rápido a balance en header, tab bar global.

#### 02b · Inicio — Sin órdenes (estado vacío)
- Mismo marco. Mapa centrado en el rider **sin marcadores A/B**. En la zona de lista, mensaje tranquilo "Sin órdenes activas" (no alarmar). Tab bar igual.

### 03 · Overlay — Nueva orden disponible
- **Fondo atenuado:** pista de la pantalla anterior oscurecida detrás (hint de que interrumpe cualquier pantalla).
- **Sheet modal** limpio anclado abajo (urgente sin generar pánico).
- **Temporizador circular regresivo** arriba: aro 54px con `border` de 4px, la mayor parte en ámbar `#d39a2a` y el resto en gris (arco consumido), con el número de segundos al centro (p. ej. `14`).
- Etiqueta mono `RESTAURANTE` + nombre grande (24px/700). Dirección de entrega con pin `B` azul + distancia/tiempo ("≈ 3.1 km · 12 min").
- **Comisión destacada:** caja tenue `#f2f0ea` con "Comisión" a la izquierda y el monto **muy grande** (30px/700) a la derecha — es el dato que decide.
- Dos botones grandes lado a lado (56px): "Rechazar" (secundario, `flex:1`) / "Aceptar" (primario oscuro, `flex:1.3`). Nota mono debajo: "Zona del pulgar · acciones grandes lado a lado".
- Si el tiempo llega a 0 sin respuesta → cierre automático (rechazo implícito) y vuelve a la pantalla anterior.
- **Notas:** ① interrumpe cualquier pantalla, urgente sin pánico (marcador rojo) · ② comisión es el dato que decide, tipografía más grande · ③ temporizador regresivo, al llegar a 0 se cierra solo.

### 04 · Detalle de Orden
- **Header** con badge de estado (mismo color que en la tarjeta de Inicio) + número/título de orden.
- **Bloque Restaurante** y **bloque Cliente**: cada uno con pin (A ámbar / B azul), nombre, dirección, y botones circulares de **navegar (⌖)** y **llamar (✆)**.
- **Lista de productos** del pedido (colapsable).
- **Comisión** siempre visible.
- **Acción primaria contextual al estado:** "Confirmar recogida" / "Marcar en camino"; cuando el estado es "En camino / Entregando" → aparece el campo de código (05).

### 05 · Confirmación de entrega — Código del cliente
- Estado **dentro** del Detalle (no pantalla aparte). Campo **OTP de 6 casillas** con teclado numérico.
- Botón "Confirmar entrega" **deshabilitado** hasta completar los 6 dígitos.
- **Errores inline por código de backend** (cada uno con su mensaje propio, no genérico), presentados como referencia:
  - `200` Éxito → check verde y transición a Pedido completado.
  - `400` Código inválido → las casillas se vacían.
  - `409` Código ya utilizado.
  - `422` Estado de pedido incorrecto (no está "En camino").

#### 05b · Pedido completado (200)
- Confirmación visual de éxito: **check verde** `#4a9469` + resumen breve (cliente, distancia, comisión sumada) antes de volver a Inicio.

### 06 · Balance — `GET /riders/balance`
- **Card hero de saldo neto:** fondo verde muy tenue (`background:#f1f7f2; border:1px solid #cfe0d4; radius:18px`). Eyebrow mono `SALDO NETO` + badge "Zona: normal" a la derecha. **Saldo grande** 38px/700 en verde `#3c7a57` (positivo) / rojo si negativo.
- Bajo una línea divisoria: desglose `GANADO` (`+ $38.000` verde) vs. `DESCONTADO` (`− $13.500` rojo).
- "Últimos movimientos" (10 recientes) en tarjeta blanca: tipo, monto (verde/rojo), fecha, distancia del pedido y método de pago.
- Botón primario fijo abajo "Solicitar retiro"; link secundario "Ver historial completo" → Historial (08). Tab bar debajo.

### 07 · Solicitud de retiro — `POST /riders/withdrawal`
- Saldo disponible arriba (reutiliza el dato de Balance).
- Regla de negocio visible: **"Disponible para retiro a partir de $15.000"**.
- Botón "Solicitar retiro" **deshabilitado** si el balance está bajo el umbral (alineado a `422 Balance insuficiente`).
- Historial de retiros con estado: **Pendiente** (píldora ámbar) / **Procesado** (píldora verde).

#### 07b · Retiro solicitado (éxito)
- Confirmación con el monto retirado (`amount_withdrawn`) + mensaje de éxito. El nuevo retiro aparece como "Pendiente".

### 08 · Historial de movimientos — `GET /riders/transactions`
- Filtros: rango de fechas + estado (**chips**). Estado vacío si no hay movimientos en el filtro.
- Lista paginada con el **mismo formato de tarjeta** que Balance: `movement_type`, `amount`, `created_at`, `distance_km`, `payment_method`, `order_id`.
- Paginación scroll infinito o "Cargar más" (`page`/`limit`, máx 50). Tap → detalle simple de la transacción.

### 09 · Perfil
- **Avatar** (placeholder circular). Datos editables nombre, correo, teléfono (cada uno con ícono ✎).
- **Switch de disponibilidad** duplicado del Home — ambos deben mantenerse sincronizados (verde `#4a9469`).
- Atajos a Balance e Historial.
- "Cerrar sesión" separado visualmente (**zona de riesgo**), tono rojo `#bd5b54`, lejos de las acciones frecuentes. Tab bar debajo.

---

## Consideraciones de UX transversales
- Estados de carga y vacío en cada pantalla con datos (skeletons que replican el layout real, no spinners genéricos).
- Colores de estado consistentes en toda la app (los 4 tokens, mismos significados).
- El overlay de nueva orden tiene la prioridad visual más alta — urgente sin generar pánico.
- Toda acción que dependa de un código de backend (400/404/409/422/500) tiene su propio mensaje de error inline visible, no genérico.
- Diseño para uso con una mano: acciones primarias siempre en el tercio inferior (zona del pulgar).
