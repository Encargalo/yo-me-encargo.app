## 1. Setup

- [x] 1.1 Instalar `encargalo-icons` con `npm install encargalo-icons` y verificar que queda en `package.json`/`package-lock.json`
- [x] 1.2 Verificar que `assets/images/mode-select/logo-reverse.png`, `illustration-pasajero.png` e `illustration-conductor.png` existen (avisar al usuario si falta alguno antes de continuar)
- [x] 1.3 Agregar `ROUTES.AUTH.SELECT_MODE` (`/select-mode`) y `ROUTES.AUTH.PASSENGER_SOON` (`/passenger-soon`) en `constants/routes.ts`

## 2. Componente ModeCard

- [x] 2.1 Crear `components/ModeCard.tsx` (props tipadas: `illustration`, `title`, `description`, `onPress`) replicando la tarjeta del frame `1:201` (icono ilustración circular, título, descripción, flecha de `encargalo-icons`) y verificar que compila con `npx tsc --noEmit`
- [x] 2.2 Escribir `components/ModeCard.test.tsx`: happy path (renderiza título/descripción y llama `onPress` al tocar) y un caso de error/edge (no llama `onPress` si el componente está deshabilitado, o falla claramente si falta una prop requerida) y verificar que `npm test -- ModeCard` pasa

## 3. Pantalla "Elegir modo"

- [x] 3.1 Crear `app/(auth)/select-mode.tsx`: fondo degradado (`expo-linear-gradient` + `Gradient` de `constants/theme.ts`), logo reverse, título/subtítulo (`Typography.header1`) y las dos `ModeCard` (Pasajero, Conductor) según el frame `1:201`
- [x] 3.2 Tarjeta Conductor navega con `router.push(ROUTES.AUTH.LOGIN)`; tarjeta Pasajero navega con `router.push(ROUTES.AUTH.PASSENGER_SOON)`
- [x] 3.3 Escribir `app/(auth)/select-mode.test.tsx` (mock de `expo-router`): tocar Conductor llama `router.push(ROUTES.AUTH.LOGIN)`; tocar Pasajero llama `router.push(ROUTES.AUTH.PASSENGER_SOON)`; verificar con `npm test -- select-mode`

## 4. Pantalla "Modo pasajero próximamente"

- [x] 4.1 Crear `app/(auth)/passenger-soon.tsx`: pantalla mínima que informa que el modo pasajero no está disponible aún, sin ningún formulario ni llamada a API
- [x] 4.2 Escribir `app/(auth)/passenger-soon.test.tsx`: verifica que el mensaje se renderiza (happy path) y que no dispara ninguna llamada a servicios (caso de error evitado por diseño, se verifica ausencia de side effects)

## 5. Redirección inicial

- [x] 5.1 En `app/index.tsx`, cambiar `router.replace(ROUTES.AUTH.LOGIN)` por `router.replace(ROUTES.AUTH.SELECT_MODE)` en la rama `!isAuthenticated`
- [x] 5.2 Actualizar/crear el test de `app/index.tsx` (mock de `useAuthStore` y `expo-router`) verificando que sin sesión redirige a `ROUTES.AUTH.SELECT_MODE` y con sesión sigue redirigiendo a `ROUTES.APP.HOME`

## 6. Verificación final

- [x] 6.1 Correr `npx tsc --noEmit` y `npm run lint` sobre el diff y confirmar que no hay errores
- [x] 6.2 Correr `npm test` solo sobre los archivos tocados en este change y confirmar que todos pasan
- [x] 6.3 Reportar como BLOQUEADA la verificación visual en dispositivo/simulador (gradiente, ilustraciones, logo) y pedir confirmación del usuario, según `.claude/skills/verify/SKILL.md`
