## Why

El frame `Login Riders` del System Design (sección "Welcome, Login and Register", `node 1:107`) define una pantalla hub de acceso para el conductor que hoy no existe: al tocar la tarjeta **Conductor** en "Elegir modo", la app cae directo en el formulario de teléfono + contraseña (`(auth)/login`), saltándose la elección entre **iniciar sesión** y **enviar la solicitud para registrarse**. Este change construye esa pantalla intermedia siguiendo Figma, sin tocar backend.

## What Changes

- Nueva pantalla **hub de acceso del conductor** en `(auth)/login`, replicando el frame `1:107` de Figma:
  - Header con el gradiente de marca, el logo reverse y un badge saliente **"MODO CONDUCTOR"**, sobre una hoja blanca redondeada.
  - Botón verde **"Continuar con tu teléfono"** (ícono `Call`) → navega al formulario de teléfono + contraseña.
  - Divisor **"¿Aún no tienes cuenta?"** con líneas a los lados.
  - Botón azul **"Registrarme como conductor"** con ilustración de carro y flecha (`ArrowRight`) → navega a un marcador de posición.
  - Botón secundario gris **"‹ Cambiar a modo pasajero"** → `router.replace` a "Elegir modo".
- **El formulario de teléfono + contraseña actual se mueve** de `(auth)/login` a `(auth)/login/phone`, sin cambios de comportamiento ni de backend. **BREAKING** para quien dependiera de que `(auth)/login` renderiza el formulario directamente.
- Nueva pantalla de marcador **"Registro de conductor próximamente"** en `(auth)`, con el mismo patrón que `passenger-soon` (el flujo real "Register Riders" es otro change).
- El handler de sesión expirada (`401`) en `app/_layout.tsx` pasa a redirigir a `(auth)/login/phone` (el formulario) en vez de `(auth)/login` (ahora el hub), para no agregar un toque extra al re-login.
- `components/Button.tsx` se extiende con la prop `variant` (`primary` | `green` | `secondary`) y un slot opcional de ícono a la izquierda. El botón de registro, por tener ilustración, es un componente propio.
- Nuevas rutas en `constants/routes.ts`: `ROUTES.AUTH.LOGIN_PHONE` (`/login/phone`) y `ROUTES.AUTH.REGISTER_RIDER_SOON` (`/register-rider-soon`). `ROUTES.AUTH.LOGIN` conserva su URL `/login`.
- Iconos vía `encargalo-icons` (`Call`, `ArrowRight`) — no `lucide-react-native` ni `@expo/vector-icons`.
- Nuevo asset de imagen provisto manualmente por el usuario: `assets/images/auth/illustration-registro-conductor.png` (carro isométrico, PNG transparente).

## Capabilities

### New Capabilities
<!-- Ninguna: el hub es la puerta de entrada de la autenticación de riders y encaja en la capability existente. -->

### Modified Capabilities
- `rider-auth`: se añade el requisito de la pantalla hub de acceso del conductor con sus tres acciones (iniciar con teléfono, registrarse, cambiar a modo pasajero); el formulario de teléfono + contraseña deja de ser el destino directo de `(auth)/login` y pasa a `(auth)/login/phone`; el destino de la redirección por `401` cambia de `(auth)/login` a `(auth)/login/phone`.

## Impact

- `app/(auth)/login.tsx` → se mueve a `app/(auth)/login/phone.tsx` (formulario, sin cambios de lógica)
- `app/(auth)/login/index.tsx` (nueva pantalla hub)
- `app/(auth)/register-rider-soon.tsx` (nuevo marcador)
- `app/_layout.tsx` (destino del handler `401`)
- `constants/routes.ts` (`LOGIN_PHONE`, `REGISTER_RIDER_SOON`)
- `components/Button.tsx` (prop `variant` + slot de ícono; usos actuales en `perfil.tsx` y el formulario siguen compilando por defecto)
- `features/auth/components/` (nuevos: header del hub, botón de registro con ilustración)
- `assets/images/auth/illustration-registro-conductor.png` (asset nuevo, copiado manualmente)
- `openspec/specs/rider-auth/spec.md` (delta: hub + ubicación del formulario + redirección `401`)
- Tests nuevos para la pantalla hub; los tests de `select-mode` y `useLoginForm` no cambian de ruta de import
