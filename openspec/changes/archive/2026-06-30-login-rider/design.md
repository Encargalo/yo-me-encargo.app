## Context

Proyecto recién scaffoldeado (Expo Router + NativeWind + Zustand + Axios), sin ninguna pantalla real todavía. `POST /auth/sign-in/riders` autentica con `phone_number` + `password` y responde con una **cookie httpOnly con JWT** (no hay token en el body de la respuesta 201). `lib/axios.ts` ya tiene `withCredentials: true`. No existen `(auth)`/`(app)` ni `constants/routes.ts` poblado. Jest no está instalado.

## Goals / Non-Goals

**Goals:**
- Pantalla de login funcional, fiel al wireframe 01, contra el endpoint real.
- Auditoría completa de validaciones cliente + mapeo de todos los códigos de respuesta documentados (201/400/422/500) a UI.
- Sesión persistente entre reinicios de la app (el rider no debe re-loguearse cada vez que abre la app).
- Estructura de rutas `(auth)`/`(app)` que el resto de changes va a reutilizar.
- Dejar instalado el setup de testing para que este y futuros changes puedan testear utils/hooks/stores.

**Non-Goals:**
- Construir el contenido real de Home/Balance/Historial/Perfil (quedan como placeholders vacíos en `(app)`).
- Registro de cuentas (no existe en el flujo — las aprueba el admin).
- Refresh token / expiración proactiva del JWT (el backend no documenta ese flujo; se maneja reactivamente vía 401).

## Decisions

### 1. La cookie es la fuente de verdad de sesión; SecureStore solo guarda una bandera local
El JWT vive en una cookie httpOnly — JS no puede leerla ni debe intentarlo. Para decidir a qué grupo de rutas mandar al rider al abrir la app (sin esperar un roundtrip), se guarda en `expo-secure-store` una bandera mínima no sensible: `{ hasSession: boolean, phoneNumber: string }`. Es una decisión **optimista de UI**, no de seguridad — cualquier request real sigue autenticado (o no) por la cookie que Axios ya envía automáticamente (`withCredentials: true`).
- Alternativa descartada: guardar el JWT manualmente en SecureStore y adjuntarlo por header — requeriría que el backend exponga el token en el body, y no lo hace (solo cookie).

### 2. Reconciliación de sesión vía interceptor 401, no vía verificación activa
No hay endpoint tipo `GET /auth/me` documentado para validar la sesión al abrir la app. En vez de inventar una llamada, se confía en la bandera de SecureStore para el enrutamiento inicial, y un interceptor de respuesta en `lib/axios.ts` detecta cualquier `401` de cualquier endpoint futuro, limpia la bandera + el store de Zustand, y redirige a `(auth)/login`. Esto cubre el caso "la cookie expiró pero la bandera local seguía en true".

**Corrección post-implementación:** `lib/axios.ts` NO importa `useAuthStore` directamente — `useAuthStore` → `auth.service.ts` → `lib/axios.ts` → `useAuthStore` es un require cycle real (confirmado en runtime por un warning de Metro). En su lugar, `lib/axios.ts` expone `setUnauthorizedHandler(handler)` y el interceptor solo invoca ese callback; `app/_layout.tsx` (que no participa del ciclo) registra el handler real al arrancar la app, delegando ahí el `logout()` + `router.replace`.

### 3. Store de Zustand `features/auth/store/useAuthStore.ts`
Estado: `isAuthenticated`, `phoneNumber`, `isLoading`, `error`, `isHydrated`. `isHydrated` evita un flash de la pantalla incorrecta mientras se lee SecureStore al arrancar. Acciones: `login(phone, password)`, `logout()`, `hydrate()`. Sigue la convención del proyecto: un store por feature, tipado, con selectores.

### 4b. Componentes globales calcados de `encargalo-mobile-v2` (post-implementación)
El usuario pidió que `Button`, `PhoneInput` y `PasswordInput` vivan en `components/` (globales, no en `features/auth/components/`) y que repliquen el mismo estilo visual que sus equivalentes en `encargalo-mobile-v2/components/ui/` (la app hermana de clientes) — mismos colores, mismo `StyleSheet` (no NativeWind, para estos 3 en particular), mismo layout. Se instaló `lucide-react-native` (misma versión `0.577.0`) + `react-native-svg` como dependencia nueva de este change, ya que ambos inputs usan íconos de esa librería en la app de referencia. `Button` se extendió con un prop `loading` (ausente en la versión original) porque el wireframe de login requiere spinner en el botón mientras autentica — el resto de la API (`label`, `onPress`, `type`, `disabled`) se mantiene idéntica. `PhoneInput` mantiene el prefijo fijo `+57` (sin emoji de bandera, removido a pedido del usuario) y agrega `maxLength={10}` al `TextInput` (número celular colombiano = 10 dígitos), consistente con el pedido del usuario.

### 4c. Validación de teléfono en tiempo real para habilitar/deshabilitar el botón (post-implementación)
`/opsx:verify` detectó que los escenarios "Teléfono con formato inválido" / "Teléfono válido" de `specs/rider-auth/spec.md` exigen que el botón "Iniciar sesión" quede deshabilitado mientras el teléfono no es válido. La Decisión 4 original (validación solo on-submit) no cumplía eso. Se ajustó `useLoginForm` para calcular `isPhoneValid` en cada render (`validatePhone(localPhone, COUNTRY_CODE).valid`) y limpiar `errors.phone` reactivamente vía `useEffect` cuando el teléfono pasa a ser válido; `login.tsx` pasa `disabled={!isPhoneValid}` a `Button`. La contraseña sigue validándose solo on-submit (el spec no exige gating reactivo del botón por password) — no se tocó la Decisión 6.

### 4. Formulario de login sin librería externa
Dos campos, validación simple → no se instala `react-hook-form` ni similar (checklist "¿se puede hacer en una línea?"). Hook `features/auth/hooks/useLoginForm.ts` maneja estado local de campos + validación (`features/auth/utils/validators.ts`) + submit contra el store.

### 5. Validación de teléfono
- Formato esperado por backend: E.164 (`+573001112233`, visto en el ejemplo).
- Selector de código de país con `+57` preseleccionado (Colombia, único mercado según wireframe); el rider solo escribe el número local, el componente `PhoneInput` compone el E.164 final.
- Regex de validación: `^\+[1-9]\d{7,14}$` (E.164 estándar) aplicada al número compuesto antes de habilitar submit.
- Si el campo local está vacío o tiene menos de 7 dígitos → error inline "Ingresa un número de teléfono válido", sin llamar al backend.

### 6. Validación de contraseña
El backend no documenta reglas de complejidad (ni longitud mínima) para `password` — la única regla de negocio observable es "no vacío" (si se envía vacío, el backend respondería `400`). Cliente valida solo `required`; cualquier regla adicional de complejidad la aplica el backend y se refleja como error `400` genérico. No se inventan reglas no documentadas.

### 7. Mapeo de errores de `POST /auth/sign-in/riders`
| Código | Trigger UI |
|---|---|
| `201` | Guardar bandera SecureStore + store en `authenticated`, redirigir a `(app)` |
| `400` | Body/JSON inválido — el shape documentado (`additionalProp1..3`) es un placeholder de Swagger, no confiable para mensaje específico. Mensaje genérico inline bajo el botón: "Revisa los datos ingresados." |
| `422` | Credenciales incorrectas — mensaje inline exacto del wireframe, ambos campos en rojo, sin alert genérico |
| `500` | Mensaje genérico inline: "Ocurrió un error, intenta de nuevo." Botón vuelve a estado habilitado |
| Sin red / timeout | Mismo tratamiento que `500` con copy distinto: "Sin conexión. Verifica tu internet." (Axios `error.response` es `undefined` en este caso — se distingue por eso) |

Todos los errores limpian el estado de `isLoading` y reactivan el botón. Ninguno usa `Alert.alert` — todo inline, según wireframe y regla transversal de CLAUDE.md.

### 8. Estructura de rutas
```
app/
├── index.tsx           → gate: lee isHydrated/isAuthenticated y hace router.replace()
├── (auth)/
│   ├── _layout.tsx      → Stack sin header
│   └── login.tsx
└── (app)/
    ├── _layout.tsx      → Stack placeholder (tab bar real llega en change de navegación de Home)
    └── home.tsx          → placeholder temporal "Próximamente"
```
`constants/routes.ts` exporta `ROUTES.AUTH.LOGIN` (`/login`) y `ROUTES.APP.HOME` (`/home`).

**Nota:** el placeholder de `(app)` NO puede llamarse `index.tsx` — los grupos de rutas no agregan segmento a la URL, así que `app/(app)/index.tsx` colisionaría con `app/index.tsx` (ambos resolverían a `/`). Se usa `home.tsx` para evitar el conflicto. `app/index.tsx` se mantiene como único archivo en la raíz de `app/` (no se elimina, por regla de CLAUDE.md) y sigue siendo el gate.

Se evaluó adoptar `Stack.Protected` (guard declarativo introducido en versiones recientes de Expo Router) en vez del gate imperativo, pero se descarta para este change: el patrón de redirect manual sigue siendo válido (no deprecado) en SDK 54, es más simple para una sola pantalla de `(app)` placeholder, y evita introducir una segunda forma de manejar auth-guarding cuando el resto de la app (Home, Balance, etc.) todavía no existe.

### 9. Testing
Se instala `jest`, `jest-expo` (preset oficial de Expo) y `@testing-library/react-native`. Cobertura de este change:
- **Unit**: `features/auth/utils/validators.ts` (teléfono y password) — happy path + inválido.
- **Integration**: `useLoginForm` y `useAuthStore` — happy path (login exitoso) + al menos un caso de error (422).

## Risks / Trade-offs

- **[Riesgo] El adapter de red de React Native podría no persistir cookies entre reinicios de la app de forma confiable en todos los dispositivos** → Mitigación: verificar manualmente en Android/iOS durante implementación; si falla, la bandera SecureStore + interceptor 401 igual degradan con gracia (el rider ve `(app)` brevemente y es redirigido a login en la primera request fallida). Si el problema es sistemático, quedará como *open question* para un change de infraestructura de red (ej. `@react-native-cookies/cookies`).
- **[Riesgo] Bandera SecureStore desincronizada de la cookie real (falso positivo de sesión)** → Mitigación: interceptor 401 global limpia bandera + store y redirige, cubriendo el caso en la primera request real que se haga en `(app)`.
- **[Trade-off] No se valida la sesión activamente al abrir la app (no hay `GET /auth/me`)** → Aceptado: el costo de un falso positivo es una redirección a login en el primer request fallido, no una brecha de seguridad (la cookie sigue siendo la única fuente real de autenticación en el backend).

## Migration Plan

No aplica (feature nueva, sin datos existentes que migrar). Rollback: revertir la rama `feat/login-rider` sin efectos secundarios en backend.

## Open Questions

- Si en pruebas manuales se confirma que RN no persiste la cookie de sesión entre reinicios de forma confiable, evaluar `@react-native-cookies/cookies` en un change de infraestructura aparte — no bloquea este change.
