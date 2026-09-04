## Context

Ver `proposal.md` (Why). Estado actual relevante:

- `app/(auth)/login.tsx` es hoy el formulario de teléfono + contraseña; su lógica vive en `features/auth/` (`useLoginForm`, `useAuthStore`, `auth.service`, `validators`) y funciona contra `POST /auth/sign-in/riders`.
- `app/_layout.tsx` registra el handler de `401` con `router.replace(ROUTES.AUTH.LOGIN)`.
- `app/(auth)/select-mode.tsx` navega a `ROUTES.AUTH.LOGIN` desde la tarjeta "Conductor".
- `components/Button.tsx` solo tiene la variante `primary` (fondo `Colors.marca`, plano); lo usan `perfil.tsx` y el formulario, ambos con `label` + `onPress`.
- `app/(auth)/passenger-soon.tsx` es el patrón ya establecido de pantalla-marcador (gradiente + textos + link de volver, sin navegación automática).
- `assets/images/mode-select/logo-reverse.png` (logo blanco) ya existe y se reutiliza.
- Typed routes están activas: agregar rutas nuevas rompe `tsc` hasta regenerar `.expo/types` (ver memoria `project-typed-routes-tsc`).

## Goals / Non-Goals

**Goals:**

- Pantalla hub fiel al frame `1:107` de Figma, montada en `(auth)/login`.
- Mover el formulario a `(auth)/login/phone` sin cambiar una línea de su lógica ni sus tests.
- Extender `Button` de forma retrocompatible (los usos actuales siguen compilando sin cambios).

**Non-Goals:**

- Cualquier cambio de backend o del flujo de autenticación (multi-paso teléfono→contraseña de Figma, chequeo de número, OAuth).
- El flujo real de registro/postulación del conductor ("Register Riders").
- Rediseñar el formulario de teléfono + contraseña al estilo subrayado de Figma (queda como está).
- Selector de país / cambio del prefijo `+57`.

## Decisions

### 1. Estructura de rutas: carpeta `app/(auth)/login/`

`(auth)/login` pasa de archivo a carpeta:

```
app/(auth)/login/
  index.tsx   -> /login        (hub, nuevo)
  phone.tsx   -> /login/phone   (formulario, movido tal cual desde login.tsx)
```

Expo Router mapea `login/index.tsx` a `/login`, así que `ROUTES.AUTH.LOGIN` conserva su URL y `select-mode` no cambia. Alternativa descartada: dejar el hub en `login.tsx` y el formulario en `login-phone.tsx` (ruta hermana) — funciona pero la relación jerárquica hub → formulario queda menos explícita y `login/` deja sitio natural para los futuros pasos del flujo de Figma.

### 2. `Button` gana `variant` + slot de ícono; el botón de registro es componente propio

`components/Button.tsx`:
- Nueva prop `variant?: "primary" | "green" | "secondary"` (default `"primary"`).
  - `green`: fondo `Colors.exito`, texto blanco — es el "Button Green" del design system (Figma), no un color de estado de orden mal usado.
  - `secondary`: fondo `Colors.bordeSuave` / gris, texto `Colors.textoSuave`.
- Nueva prop `icon?: ReactNode` — se renderiza a la izquierda del label, dentro del mismo `Pressable`.
- `type` se elimina (solo tenía el valor `"primary"`, sin usos con valor explícito).

El botón "Registrarme como conductor" NO es una variante de `Button`: lleva una ilustración (`Image`) a la izquierda, label centrado y `ArrowRight` a la derecha sobre fondo azul. Va en `features/auth/components/RegisterConductorButton.tsx`. Alternativa descartada: sobrecargar `Button` con slots izquierdo/derecho + fondo imagen — infla el componente base para un único caso.

### 3. Header del hub como componente de feature

`features/auth/components/RiderLoginHeader.tsx`: gradiente (`Gradient` de theme) + logo reverse + título/subtítulo + badge "MODO CONDUCTOR". Encapsula el layout del badge saliente (posición absoluta sobre el borde de la hoja blanca). Vive en `features/auth/` porque es específico del hub; si el flujo de Figma luego necesita el mismo header en otras pantallas, se promueve.

### 4. Divisor "¿Aún no tienes cuenta?"

Se implementa inline en el hub (dos `View` de 1px + `Text`). No amerita componente propio con un solo uso.

### 5b. Badge "MODO CONDUCTOR": efecto vidrio y z-order (ronda de revisión)

El badge no lleva fondo blanco sólido ni es hijo de la hoja: se renderiza como
**hermano previo** de la hoja dentro del contenedor `flex-1`, en `position:
absolute` anclado a `top: 0`, y la hoja baja `BADGE_OVERHANG` (36px) con
`marginTop`. Como la hoja (opaca, `bg-superficie`) se declara después, la pinta
encima y solo queda visible el trozo del badge que asoma por arriba. Se evita
el `top` negativo porque Android recorta los hijos absolutos que se salen del
padre (primera iteración: el badge quedaba invisible). El efecto vidrio de Figma (glass: ángulo 180, refracción 48, profundidad 100,
dispersión 59) no tiene equivalente en RN. Se probó `expo-blur` pero requiere
recompilar el binario nativo (el `BlurView` no está en el dev client actual del
usuario), así que se descartó. Se **aproxima sin código nativo**: un chip
`LinearGradient` de blancos translúcidos derivados del token
(`withAlpha(Colors.superficie, 0.38 → 0.12)`), borde
`withAlpha(Colors.superficie, 0.5)` y texto blanco. No difumina el fondo, pero
lee como un chip de vidrio y no necesita rebuild.

### 5c. Borde con gradiente animado del botón de registro (ronda de revisión)

`RegisterConductorButton` envuelve el contenido en un marco de 2px con
`overflow: hidden` y, detrás, un `LinearGradient` cuadrado (520px) centrado que
gira 360° en bucle de ~2.6s. Se usa `Animated` de React Native con
`useNativeDriver: true` — **no** `react-native-reanimated`, que no está
configurado en el babel del proyecto (mismo criterio que `MapSkeleton`). Los colores son un acento decorativo (`NeonAccent` en `constants/theme.ts`:
`coral #F83D25` → `violet #7C3AED`, en palíndromo para que el giro cierre sin
salto). Está declarado aparte de `Colors` y documentado como NO derivado del
System Design: excepción acotada a este borde. El resto de `design-system`
(paleta semántica, cero literales en componentes) se mantiene.
El label del botón va en una sola línea: `fontSize 13`, `numberOfLines={1}`,
`adjustsFontSizeToFit`, ilustración reducida a 44×30 para dar ancho al texto.

### 5d. `utils/color.ts` → `withAlpha` (ronda de revisión)

Para no escribir `rgba()` literales (lo prohíbe `design-system`), se añade
`withAlpha(hex, alpha)` que deriva la variante translúcida de un token en
tiempo de ejecución. Mismo patrón que `features/orders/utils/color.ts`
(`lightenColor`), pero global.

### 5e. Íconos y centrado en `Button` (ronda de revisión)

`Button` es reutilizable en toda la app, así que los íconos son props:
`leftIcon?` y `rightIcon?` (ningún ícono hardcodeado). Ambos van en `position:
absolute` sobre los bordes; el label lleva `flex: 1` + `textAlign: center` y el
botón `paddingHorizontal: 44`, de modo que el texto queda centrado respecto al
botón completo aunque haya un solo ícono. El logo del header se iguala a
`mode-select` (134×39). En `RegisterConductorButton` el ícono derecho también
es prop (`rightIcon`, por defecto flecha).

### 5. Destino del `401` → `(auth)/login/phone`

Para no agregar un toque extra en el re-login tras sesión expirada, el handler apunta al formulario, no al hub. Es un cambio de una constante en `app/_layout.tsx` y queda reflejado en el delta de `rider-auth`.

## Risks / Trade-offs

- **Typed routes rompen `tsc` al agregar `LOGIN_PHONE` y `REGISTER_RIDER_SOON`** → seguir la receta de la memoria `project-typed-routes-tsc` para regenerar los tipos sin levantar el dev server antes de correr `npx tsc --noEmit`.
- **Mover `login.tsx` puede confundir a `git` como archivo nuevo + borrado** → usar `git mv` para preservar el historial.
- **El asset `illustration-registro-conductor.png` lo provee el usuario a mano** → si no está al implementar, el `require()` rompe el bundle; el `apply` se detiene en esa tarea hasta que el archivo exista (mismo criterio que `mode-select`).
- **`Button` pierde la prop `type`** → hay que confirmar por grep que ningún call site la pasa (hoy: ninguno).
