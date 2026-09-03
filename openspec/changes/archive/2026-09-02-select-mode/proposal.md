## Why

YoMeEncargo dejó de ser una app exclusiva para riders de delivery: ahora también da acceso al modo Pasajero (pedir transporte en moto o carro), y los mismos riders son quienes conducen esos viajes. Hoy la app no tiene ninguna pantalla que exponga esa elección — `app/index.tsx` redirige directo a `(auth)/login`, que es un login pensado solo para riders. Se necesita una pantalla de entrada que deje elegir el modo antes de continuar, siguiendo el frame "Mode" del System Design de Figma (sección "Welcome, Login and Register").

## What Changes

- Nueva pantalla "Elegir modo" en `(auth)`, con el fondo degradado de marca, el logo reverse y dos tarjetas: **Conductor** y **Pasajero**, replicando el frame `1:201` de Figma.
- La tarjeta **Conductor** navega al login de rider ya existente (`(auth)/login`), sin modificarlo.
- La tarjeta **Pasajero** navega a una pantalla mínima de marcador de posición ("Modo pasajero próximamente") — el flujo real de pasajero (registro/login) queda fuera de este change.
- `app/index.tsx` cambia su redirección cuando no hay sesión: de `(auth)/login` directo a la nueva pantalla "Elegir modo". **BREAKING** para quien dependiera de que el arranque sin sesión aterriza directo en el login.
- Nuevas rutas centralizadas en `constants/routes.ts` para la pantalla de elegir modo y el marcador de pasajero.
- Se instala `encargalo-icons` (paquete propio de Encárgalo) para el ícono de flecha de cada tarjeta, en vez de `@expo/vector-icons`.
- Nuevos assets de imagen (logo reverse blanco y las dos ilustraciones circulares de Pasajero/Conductor) provistos manualmente por el usuario en `assets/images/mode-select/`.

## Capabilities

### New Capabilities
- `mode-select`: pantalla de elegir modo (Pasajero/Conductor) que se muestra antes del login cuando no hay sesión activa, incluyendo el marcador de posición del modo pasajero.

### Modified Capabilities
- `rider-auth`: el escenario "App inicia sin sesión previa" cambia su destino de `(auth)/login` a la nueva pantalla de elegir modo.

## Impact

- `app/index.tsx` (lógica de redirección inicial)
- `constants/routes.ts` (nuevas rutas `ROUTES.AUTH.MODE_SELECT` y `ROUTES.AUTH.PASSENGER_SOON` o equivalentes)
- `app/(auth)/` (nueva(s) pantalla(s))
- Nueva carpeta `features/mode-select/` (o similar) si hay lógica no trivial que extraer
- `package.json` (nueva dependencia `encargalo-icons`)
- `assets/images/mode-select/` (assets nuevos, copiados manualmente por el usuario)
- `openspec/specs/rider-auth/spec.md` (delta al escenario de arranque sin sesión)
