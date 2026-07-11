## Context

La zona autenticada (`app/(app)/`) es hoy un `Stack` plano con `home`, `balance` y `orders/[id]` como hermanos, sin barra de navegación. El wireframe (docs/wireframes/, pantallas 02 y 04) define una tab bar global de 4 secciones presente en las pantallas principales, mientras que el Detalle de Orden se empuja por encima sin tab bar. Faltan además las rutas Historial y Perfil.

Restricciones del proyecto (CLAUDE.md):
- Rutas siempre desde `constants/routes.ts`, nunca literales.
- Tokens de color desde `Neutrals` / `OrderStatusColors`; el color de estado se reserva para órdenes.
- "Lo mínimo necesario": preferir features nativas de Expo/RN sin abstracciones.
- No instalar librerías de stack futuro; `@expo/vector-icons` y `expo-router` ya están.

## Goals / Non-Goals

**Goals:**
- Shell de navegación con tab bar de 4 secciones (Inicio, Balance, Historial, Perfil).
- Detalle de Orden se empuja sin tab bar y al volver reaparece.
- Placeholders navegables para Historial y Perfil.
- Estilo de la tab bar fiel al wireframe usando `Neutrals`.

**Non-Goals:**
- Overlay de nueva orden (prioridad máxima) — otro change.
- Contenido real de Historial y Perfil — cada uno su propio change.
- Cambiar el gate de autenticación de `app/index.tsx` o `rider-auth`.
- Componente de tab bar 100% custom (labels mono, etc.).

## Decisions

### 1. Grupo `(tabs)` anidado dentro de un `Stack` en `(app)`

Estructura objetivo:

```
app/(app)/
  _layout.tsx          Stack (headerShown:false)  ← wrapper
  ├─ (tabs)/
  │   _layout.tsx      <Tabs>  ← la tab bar
  │   ├─ home.tsx        (movido)
  │   ├─ balance.tsx     (movido)
  │   ├─ historial.tsx   (nuevo placeholder)
  │   └─ perfil.tsx      (nuevo placeholder)
  └─ orders/[id].tsx   ← empujado sobre el Stack, sin tab bar
```

**Por qué:** es el patrón idiomático de Expo Router para "tabs + pantallas de detalle full-screen". Al vivir `orders/[id]` en el nivel del `Stack` (por encima del grupo `(tabs)`), al hacer `push` la tab bar desaparece sin configuración extra, y al `back` reaparece. Como `(tabs)` es grupo (paréntesis), no altera las URLs: `/home` y `/balance` se mantienen.

**Alternativa descartada:** mantener `orders/[id]` dentro de `<Tabs>` con `href: null` para ocultarlo del bar. Deja la tab bar visible bajo el detalle (contradice wireframe 04) y las rutas dinámicas como hijas de Tabs son incómodas.

### 2. `<Tabs>` nativo estilizado por `screenOptions`, no tabBar custom

Configurar la tab bar en `(tabs)/_layout.tsx` con las opciones nativas:

```
tabBarActiveTintColor:   Primary               (#fc6b2b)  ← marca, no tinta
tabBarInactiveTintColor: Neutrals.placeholder  (#a9a69d)
tabBarStyle:  { height 60 + insets.bottom, borderTopColor: Neutrals.borderCard,
                borderTopWidth, backgroundColor: Neutrals.white }
```

Nota: el wireframe dibuja el activo en tinta `#2a2a2a`, pero por decisión del proyecto el ítem activo usa el naranja de marca `Primary` (`#fc6b2b`). Es color de marca, no de estado de orden, así que respeta la regla de reservar los colores de estado a las órdenes.

Cada screen define `title` (label) y `tabBarIcon`. El safe area lo maneja el propio `<Tabs>` (más `useSafeAreaInsets` para el alto exacto si hace falta).

**Por qué:** cubre todo el spec del wireframe sin componente extra — regla "lo mínimo necesario". Un tabBar custom solo valdría si las etiquetas fueran mono-mayúsculas con tracking; el wireframe usa labels normales.

**Alternativa descartada:** `tabBar={() => <CustomTabBar/>}`. Más código y superficie de bug para un beneficio estético que el wireframe no pide.

### 3. Iconos: lucide-react-native

Mapa de iconos monocromo de lucide: Inicio → `Home` · Balance → `Wallet` · Historial → `History` · Perfil → `User`. Lucide son iconos de trazo (no tienen variante rellena), así que el énfasis de la sección activa se da con `strokeWidth` (2.5 activo / 2 inactivo) además del color.

**Por qué:** el usuario optó por lucide como set de iconos del proyecto; monocromo y consistente con la estética de trazo del wireframe. Requiere `lucide-react-native` + `react-native-svg` (peer), instalados en este change.

**Alternativa descartada:** Ionicons de `@expo/vector-icons` (ya instalado, con variantes outline/filled). Se prefirió lucide por decisión de diseño del proyecto.

### 4. Reconciliar padding inferior de `home.tsx`

`home.tsx` hoy aplica `insets.bottom + 16` al `contentContainerStyle` del scroll. Con la tab bar ocupando la zona inferior, ese inset lo consume ahora la barra. Ajuste: quitar el `insets.bottom` del padding del scroll (dejar solo el padding visual, p. ej. 16) para evitar el doble espacio. El `paddingTop: insets.top` se mantiene (la barra está abajo).

### 5. Rutas nuevas en `constants/routes.ts`

Añadir a `ROUTES.APP`: `HISTORIAL: "/historial"` y `PERFIL: "/perfil"`. `HOME` y `BALANCE` no cambian.

## Risks / Trade-offs

- **[Mover `home.tsx`/`balance.tsx` rompe imports relativos]** → usan alias `@/…`, no rutas relativas al layout; el movimiento no afecta imports. Verificar con `npx tsc --noEmit`.
- **[Doble padding inferior en Home]** → mitigado por la decisión 4; verificar visualmente que la última tarjeta no queda tapada ni con hueco excesivo.
- **[La ruta `/home` cambia de URL al anidar en `(tabs)`]** → no ocurre: los grupos con paréntesis no aparecen en la URL; test de regresión: navegar por `ROUTES.APP.HOME`.
- **[Icono de Historial ambiguo]** → `time` vs `receipt`; decisión menor, ajustable en implementación sin impacto de arquitectura.

## Open Questions

- Ninguna bloqueante. La elección final del icono de Historial (`time` vs `receipt`) se resuelve en implementación.
