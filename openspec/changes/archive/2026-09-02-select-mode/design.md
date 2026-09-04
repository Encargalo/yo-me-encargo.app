## Context

Ver `proposal.md` - Why. Estado actual relevante:

- `app/index.tsx` decide la ruta inicial (`(app)` vs `(auth)/login`) una vez que `useAuthStore.hydrate()` termina; hoy sin sesión va directo a `(auth)/login`.
- `(auth)/login.tsx` ya existe (teléfono + contraseña) y no se toca en este change.
- `constants/theme.ts` ya define `Gradient` (mismos 3 colores del frame Figma `1:201`) y `Typography.header1` (Plus Jakarta Sans Bold 20px, coincide con el título de la pantalla). `expo-linear-gradient` ya está en `package.json` pero no se usa en ningún lado todavía.
- `app/_layout.tsx` solo carga los pesos Regular/SemiBold/Bold de Plus Jakarta Sans e Inter/Manrope Regular/Medium — no carga "Plus Jakarta Sans Medium", que es el peso que Figma usa para el subtítulo de cada tarjeta.
- No existe `encargalo-icons` en `package.json` todavía.
- No existe ningún concepto de "modo" (rider/pasajero) en `useAuthStore` ni en `constants/routes.ts`.

## Goals / Non-Goals

**Goals:**
- Pantalla "Elegir modo" fiel al frame `1:201` de Figma (gradiente, logo, dos tarjetas), como nueva entrada de `(auth)` cuando no hay sesión.
- Dejar ambas tarjetas navegando a un destino real (login existente / marcador de pasajero), sin botones muertos.
- Adoptar `encargalo-icons` como el paquete de iconos del proyecto desde este change en adelante.

**Non-Goals:**
- No se construye ningún flujo funcional de pasajero (registro, login, pedir viaje). Solo un marcador de posición.
- No se rediseña `(auth)/login.tsx` ni se toca `useAuthStore` más allá del punto de redirección en `index.tsx`.
- No se resuelve la falta del peso "Plus Jakarta Sans Medium" añadiendo el archivo de fuente — se usa un fallback (ver Decisiones).

## Decisions

**Sin `features/mode-select/`.** La pantalla no tiene llamadas a API, estado async ni validaciones — solo layout y dos `router.push`. Crear un dominio `features/` completo (services/store/hooks) violaría el checklist de "implementar lo mínimo necesario". La UI de la tarjeta se extrae como componente presentacional reutilizable en `components/ModeCard.tsx` (props tipadas: ilustración, título, descripción, `onPress`), siguiendo el patrón ya usado por `Button`/`PhoneInput`/`PasswordInput`.

**Rutas nuevas:** `ROUTES.AUTH.SELECT_MODE` (`/select-mode`) y `ROUTES.AUTH.PASSENGER_SOON` (`/passenger-soon`), ambas dentro del grupo `(auth)`. `app/index.tsx` cambia su `router.replace(ROUTES.AUTH.LOGIN)` por `router.replace(ROUTES.AUTH.SELECT_MODE)` cuando `!isAuthenticated`. La tarjeta Conductor navega con `router.push(ROUTES.AUTH.LOGIN)` (no `replace`, para que "atrás" desde el login regrese a elegir modo).

**Gradiente y tokens:** se reutiliza `Gradient`/`Colors`/`Typography` de `constants/theme.ts` tal cual existen hoy — ningún token nuevo. `expo-linear-gradient` ya es dependencia del proyecto, solo falta su primer uso real.

**Fallback tipográfico:** el subtítulo de cada tarjeta ("Pide una moto o un carro" / "Aplica para hacer conductor aqui") usa `FontFamilies.heading` (Plus Jakarta Sans Regular, ya cargado) en vez de bloquear el change por el peso Medium faltante. Cuando el archivo `PlusJakartaSans-Medium.ttf` esté disponible, cambiar el fallback es un ajuste de una línea, no un cambio de alcance.

**Iconografía:** se instala `encargalo-icons` (`npm install encargalo-icons`) en este change y se usa para la flecha de cada tarjeta, en vez de `@expo/vector-icons` o de exportar el SVG de Figma. Es el primer change que instala el paquete, así que también fija el precedente para el resto del proyecto.

**Assets de imagen:** el logo reverse y las dos ilustraciones circulares son PNG que el usuario copia manualmente en `assets/images/mode-select/` (carpeta ya creada durante la exploración) con nombres fijos (`logo-reverse.png`, `illustration-pasajero.png`, `illustration-conductor.png`) referenciados por `require(...)`. El código se escribe asumiendo que esos 3 archivos existen con esos nombres exactos.

**Metro `blockList` para tests colocalizados en `app/`.** Expo Router empaqueta `app/` completo vía `require.context` (solo excluye `+api`/`+html`/`+middleware`), sin distinguir si un archivo se usa o no. El blockList por defecto de Expo solo ignora carpetas `__tests__/`, pero este proyecto colocaliza los tests como `Componente.test.tsx` — patrón que nunca había chocado con esto porque hasta ahora ningún test vivía dentro de `app/`. Se agregó `/\.test\.[jt]sx?$/` al `resolver.blockList` de `metro.config.js` para que Metro los excluya del bundle nativo sin afectar a Jest (que usa su propio resolver, ajeno a `metro.config.js`).

## Risks / Trade-offs

- [Los 3 assets todavía no existen en el repo] → el build falla al compilar si se implementa antes de que el usuario los copie. Mitigación: la tarea de implementación verifica su presencia antes de escribir el `require()`, y se avisa explícitamente si faltan.
- [`encargalo-icons` es un paquete nuevo y privado, sin experiencia previa de uso en este repo] → puede requerir ajustar el nombre exacto del ícono de flecha una vez instalado. Mitigación: no es un cambio de alcance, solo de implementación menor durante `apply`.
- [Cambiar el destino de `app/index.tsx` sin sesión es un cambio de comportamiento visible] → cualquier flujo (manual o E2E futuro) que asuma "sin sesión = login directo" se rompe. Mitigación: ya documentado como **BREAKING** en el proposal y como delta en `specs/rider-auth`.

## Migration Plan

Sin datos ni backend involucrados — es un cambio de navegación puramente cliente. Al mergear, cualquier usuario sin sesión activa que abra la app verá la pantalla "Elegir modo" en vez de ir directo al login; no requiere migración de datos ni rollback especial más allá de revertir el commit.
