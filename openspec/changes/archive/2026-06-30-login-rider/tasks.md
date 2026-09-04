## 1. Dependencias

- [x] 1.1 Instalar `expo-secure-store` (`npm install expo-secure-store`)
- [x] 1.2 Instalar `jest`, `jest-expo`, `@testing-library/react-native` y `@types/jest` como dev dependencies
- [x] 1.3 Configurar `package.json` (`"test": "jest"`) y `jest.config.js`/`jest` field con preset `jest-expo`
- [x] 1.4 Instalar `react-native-svg` y `lucide-react-native@0.577.0` (misma versión que `encargalo-mobile-v2`) — requeridos por los íconos de `PhoneInput`/`PasswordInput` globales

## 2. Rutas y navegación base

- [x] 2.1 Poblar `constants/routes.ts` con `ROUTES.AUTH.LOGIN` y `ROUTES.APP.HOME`
- [x] 2.2 Crear `app/(auth)/_layout.tsx` (Stack sin header)
- [x] 2.3 Crear `app/(app)/_layout.tsx` (Stack placeholder)
- [x] 2.4 Crear `app/(app)/home.tsx` placeholder ("Próximamente") — NO usar `index.tsx` (colisiona con `app/index.tsx`, ambos resolverían a `/`)
- [x] 2.5 Reescribir `app/index.tsx` como gate: lee `isHydrated`/`isAuthenticated` del store de auth y hace `router.replace(ROUTES.AUTH.LOGIN)` o `router.replace(ROUTES.APP.HOME)`; no renderiza contenido mientras `!isHydrated`

## 3. Tipos (`features/auth/types/`)

- [x] 3.1 Tipar request de login (`phone_number`, `password`)
- [x] 3.2 Tipar el error de la API (union por código: 400/422/500/network) usado por el store y el hook de formulario

## 4. Utils (`features/auth/utils/`)

- [x] 4.1 `validatePhone(localNumber, countryCode)` → valida E.164 (`^\+[1-9]\d{7,14}$`), retorna `{ valid, e164, error }`
- [x] 4.2 `validatePassword(password)` → valida `required`, retorna `{ valid, error }`
- [x] 4.3 Tests unitarios de `validatePhone` (happy path + inválido)
- [x] 4.4 Tests unitarios de `validatePassword` (happy path + vacío)

## 5. Servicio (`features/auth/services/`)

- [x] 5.1 `signInRider({ phone_number, password })` — `POST /auth/sign-in/riders` vía `lib/axios.ts`, tipado con genéricos, `async/await`, errores tipados como `AxiosError`

## 6. Store de sesión (`features/auth/store/`)

- [x] 6.1 `useAuthStore` (Zustand): estado `isAuthenticated`, `phoneNumber`, `isLoading`, `error`, `isHydrated`
- [x] 6.2 Acción `hydrate()` — lee la bandera de `expo-secure-store`, setea `isAuthenticated`/`phoneNumber`/`isHydrated`
- [x] 6.3 Acción `login(phone_number, password)` — llama al servicio, mapea errores por código (400/422/500/sin red) a `error`, en éxito guarda bandera en `expo-secure-store` y actualiza estado
- [x] 6.4 Acción `logout()` — limpia bandera de `expo-secure-store` y resetea estado
- [x] 6.5 Test de integración: `login()` éxito actualiza estado a autenticado
- [x] 6.6 Test de integración: `login()` con 422 setea `error` y mantiene `isAuthenticated: false`

## 7. Interceptor de sesión (`lib/axios.ts`)

- [x] 7.1 Interceptor de respuesta: en `401`, invocar un handler registrado externamente (`setUnauthorizedHandler`) que llama a `useAuthStore.getState().logout()` y navega a `ROUTES.AUTH.LOGIN` — el handler se registra desde `app/_layout.tsx`, no importado directo en `lib/axios.ts`, para evitar un require cycle (axios → store → service → axios)

## 8. Hook de formulario (`features/auth/hooks/`)

- [x] 8.1 `useLoginForm()` — estado local de campos (código país fijo `+57`, número local, password), validación on-submit usando utils de la sección 4, llama a `useAuthStore.login`, expone `errors`, `isSubmitting`, `onSubmit`
- [x] 8.2 Test de integración: submit con campos inválidos no llama al store/servicio
- [x] 8.3 Test de integración: submit con campos válidos llama a `login` con el `phone_number` E.164 correcto

## 9. Componentes globales (`components/`)

- [x] 9.1 `Button` — botón primario reutilizable (naranja `Primary`, pill-shape, estados `disabled`/`loading`), estilo calcado de `encargalo-mobile-v2/components/ui/Button.tsx`
- [x] 9.2 `PhoneInput` — prefijo fijo `+57 🇨🇴` + input numérico limitado a 10 dígitos (`maxLength`), error inline; estilo calcado de `encargalo-mobile-v2/components/ui/PhoneInput.tsx` (agrega `lucide-react-native` para el ícono)
- [x] 9.3 `PasswordInput` — input de contraseña con toggle mostrar/ocultar (`lucide-react-native` Eye/EyeOff), error inline; estilo calcado de `encargalo-mobile-v2/components/ui/PasswordInput.tsx`

**Nota:** originalmente planeados en `features/auth/components/`; el usuario pidió que fueran componentes globales (`components/`) ya que `Button` en particular se reutilizará en toda la app, no solo en login.

## 10. Pantalla de Login (`app/(auth)/login.tsx`)

- [x] 10.1 Layout según wireframe 01: logo centrado arriba, `PhoneInput`/`PasswordInput` globales, `Button` global "Iniciar sesión"
- [x] 10.2 `Button` con `loading={isSubmitting}` (spinner interno) y `disabled={!isPhoneValid}` — deshabilitado mientras el teléfono no es válido o mientras está cargando, se habilita reactivamente al completar un teléfono válido (`isPhoneValid` recalculado en cada render en `useLoginForm`, ver design.md §4c)
- [x] 10.3 Mostrar mensaje de error general (400/500/sin red) bajo el formulario; error 422 inline en los campos, ambos en rojo
- [x] 10.4 Navegar a `ROUTES.APP.HOME` con `router.replace` tras login exitoso

## 11. Verificación manual

- [x] 11.1 Levantar la app (`npx expo start`), probar login con credenciales válidas e inválidas contra el backend real o un mock
- [x] 11.2 Verificar que cerrar y reabrir la app mantiene la sesión (o degrada correctamente a login si la cookie no persistió)
- [x] 11.3 Verificar `npx tsc --noEmit` y `npm run lint` sin errores
- [x] 11.4 Ejecutar `npm test` y confirmar que todos los tests pasan
