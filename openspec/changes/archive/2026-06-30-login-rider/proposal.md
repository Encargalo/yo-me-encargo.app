## Why

Los encargueros (riders) no tienen forma de autenticarse en la app — no existe pantalla de login, ni grupos de rutas `(auth)`/`(app)`, ni persistencia de sesión. Sin login no se puede construir ninguna otra pantalla (Home, Balance, Historial, Perfil), porque todas requieren una sesión de rider activa. Este change es el primer bloque funcional real del proyecto y desbloquea el resto del roadmap.

## What Changes

- Nueva pantalla de Login (`app/(auth)/login.tsx`) según wireframe 01: logo centrado, campo teléfono con selector de código de país (+57 por defecto), campo contraseña, botón primario "Iniciar sesión" con estado de carga, sin opción de registro.
- Nuevos grupos de rutas `app/(auth)/` y `app/(app)/` con sus respectivos `_layout.tsx` — `(auth)` para pantallas sin sesión, `(app)` como placeholder protegido por sesión (contendrá Home/Balance/Historial/Perfil en changes futuros).
- `app/index.tsx` pasa a redirigir según estado de sesión: sin sesión → `(auth)/login`, con sesión → `(app)`.
- `constants/routes.ts` se puebla con las rutas reales (`LOGIN`, `APP_HOME`) reemplazando el objeto vacío.
- Nuevo módulo `features/auth/` completo:
  - `services/`: llamada a `POST /auth/sign-in/riders` tipada con Axios.
  - `store/`: store Zustand de sesión (estado autenticado, teléfono, loading, error).
  - `hooks/`: hook de formulario de login (validación + submit).
  - `types/`: tipos de request/response del login y errores de la API.
  - `utils/`: validación de teléfono (E.164, prefijo `+57` por defecto) y contraseña.
- Nuevos componentes globales en `components/` (no en `features/auth/`, ya que se reutilizarán en toda la app): `Button` (primario), `PhoneInput` (prefijo `+57` fijo + número, máximo 10 dígitos) y `PasswordInput` (toggle mostrar/ocultar) — estilo calcado de `encargalo-mobile-v2/components/ui/`.
- Validación de credenciales auditada end-to-end (cliente + mapeo de errores de servidor) — ver `design.md`.
- Se instala `expo-secure-store` para persistir el estado de sesión (bandera de "hay sesión activa") entre reinicios de la app, ya que el JWT real vive en cookie httpOnly manejada por el backend.
- Se instalan `jest`, `jest-expo` y `@testing-library/react-native` — primer change con lógica testeable (utils de validación, hook de formulario, store).
- Tests: validadores de teléfono/contraseña (unit), hook `useLoginForm` y store de auth (integration) — happy path + al menos un caso de error cada uno.

## Capabilities

### New Capabilities
- `rider-auth`: autenticación de riders (login con teléfono + contraseña contra `POST /auth/sign-in/riders`), validación de credenciales, manejo de errores por código de respuesta, persistencia de sesión y enrutamiento condicionado a sesión activa (`(auth)` vs `(app)`).

### Modified Capabilities
_(ninguna — no existen specs previas en el proyecto)_

## Impact

- **Código nuevo:** `app/(auth)/`, `app/(app)/`, `features/auth/**`, actualización de `app/index.tsx`, `app/_layout.tsx`, `constants/routes.ts`.
- **Dependencias nuevas:** `expo-secure-store`, `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest` (dev), `react-native-svg`, `lucide-react-native`.
- **API:** `POST /auth/sign-in/riders` (único endpoint consumido en este change).
- **Sin impacto** en Home/Balance/Historial/Perfil/Overlay — quedan como placeholders vacíos dentro de `(app)` hasta sus propios changes.
