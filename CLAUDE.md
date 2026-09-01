@AGENTS.md

# YoMeEncargo (app de riders)

App móvil para los **riders** de Encárgalo — la app hermana de `encargalo-mobile-v2` (app de clientes). Esta app permite a los riders gestionar órdenes, mapa en tiempo real, confirmación de entrega y balance/retiros, de forma autónoma desde el dispositivo.

## Stack

- Expo SDK 54 + React Native 0.81 + React 19 + TypeScript (strict mode)
- Package manager: npm — NUNCA usar bun ni yarn

## Comandos

- `npx expo start` → servidor Expo
- `npx expo start --android` → abrir en Android
- `npx expo run:ios` → abrir en iOS
- `npm install <paquete>` → instalar dependencia
- `npm install --save-dev <paquete>` → instalar dev dependency
- `npx tsc --noEmit` → chequeo de tipos
- `npm run lint` → lint (eslint-config-expo)

## Librerías core actuales

- **Expo Router** → file-based routing
- **NativeWind v4** → estilos con clases Tailwind
- **Zustand** → estado global
- **Axios** → llamadas HTTP (instancia en `lib/axios.ts`)

**Importante:** librerías adicionales como `react-native-maps`, `@gorhom/bottom-sheet`, `lottie-react-native`, `expo-secure-store`, `react-native-paper` o `react-native-reanimated` (más allá de lo que el template de Expo ya trae como dependencia transitiva) **se instalan dentro del change de OpenSpec que las necesite** — no instalar de antemano. Ej: `react-native-maps` se instala en el change de "Inicio" (mapa), `@gorhom/bottom-sheet` en el change de "Overlay nueva orden", `expo-secure-store` en el change de "Login" (sesión persistente).

## Navegación — Expo Router

- Todas las rutas viven en `app/`
- Grupos de rutas tipo `(auth)/` (login) y `(app)/` (resto) se crean en el change de navegación/login — todavía no existen
- Rutas siempre desde `constants/routes.ts` — nunca strings literales
- Para navegar: `import { router } from 'expo-router'` → `router.push(ROUTES.X)` / `router.replace(ROUTES.X)`

## Estructura de carpetas

```
app/              → rutas Expo Router
features/         → módulos por dominio, creados por change:
  [feature]/
  ├── components/ → componentes exclusivos del módulo
  ├── hooks/      → hooks exclusivos del módulo
  ├── services/   → llamadas API del módulo
  ├── store/      → estado Zustand del módulo
  ├── types/      → tipos e interfaces del módulo
  └── utils/      → utilidades del módulo
components/       → componentes reutilizables globales
store/            → stores Zustand globales
services/         → servicios globales
lib/              → configuración (axios.ts)
constants/        → theme.ts, routes.ts
utils/            → utilidades puras
```

## Convenciones

### Componentes

- PascalCase para nombres de archivos y componentes
- Un componente por archivo
- Props siempre tipadas con `interface` encima del componente
- Nunca usar `View` como wrapper si hay un componente semántico

### Zustand

- Un store por feature o dominio
- Tipado completo, siempre con selector: `const x = useXStore((s) => s.x)`

### Axios

- Configuración en `lib/axios.ts`, `withCredentials: true`
- Nunca llamado directo desde componentes — siempre a través de `services/`
- Siempre tipado con genéricos: `axios.get<MyType>(url)`

### Servicios

- Siempre `async/await`, nunca `.then()`
- Errores tipados como `AxiosError`

### TypeScript

- Sin `any`, sin `@ts-ignore`
- Interfaces para objetos, `type` para uniones
- Tipos compartidos en `types/` de cada feature

## Colores de estado — obligatorio

La app usa colores de estado consistentes para identificar el estado de una orden, derivados del System Design de YoMeEncargo en Figma:

- 🟠 Ámbar (`status.pending` / `OrderStatusColors.pending` = `#F7AA28`) — Recogida pendiente
- 🔵 Azul Intenso (`status.enroute` / `OrderStatusColors.enroute` = `#1D4ED8`) — En camino / Entregando
- 🟢 Verde (`status.completed` / `OrderStatusColors.completed` = `#09E55B`) — Completado
- 🔴 Rojo (`status.error` / `OrderStatusColors.error` = `#DC2626`) — Error / deuda

El azul de estado (`#1D4ED8`) es distinto del azul de marca (`Colors.marca` = `#2563EB`) a propósito: ningún elemento de marca (tab bar, botones) debe poder confundirse con un indicador de estado de orden.

Usar siempre estas constantes (definidas en `tailwind.config.js` y `constants/theme.ts`) — nunca hardcodear otro hex para representar estado de orden.

## Git workflow — obligatorio

1. Crear branch antes de tocar cualquier archivo:
   - `feat/nombre-corto`
   - `fix/nombre-corto`
   - `refactor/nombre-corto`
   - `chore/nombre-corto`
2. Nunca trabajar directo en `main`
3. **Una rama por change de OpenSpec.**
   - Cada change de OpenSpec vive en su propia rama, creada **antes de tocar cualquier archivo** — no al final.
   - Ejemplo correcto: change `login` → `git checkout -b feat/login` → implementar todas las tareas del change → preguntar al usuario → commit ✅
   - Ejemplo incorrecto: implementar sin crear rama primero ❌; commit sin preguntar ❌
4. **Nunca hacer commit sin preguntar primero.**
   - Al terminar la implementación, Claude DEBE preguntar: "¿Quieres hacer commit ahora o prefieres revisar/agregar algo más antes?"
   - Solo hacer commit cuando el usuario lo confirme explícitamente.

## Antes de escribir código — checklist obligatorio

Antes de implementar cualquier cosa, evaluar en orden:

1. ¿Esta función ya existe en una librería instalada? → usarla directamente
2. ¿Expo/React Native tiene una feature nativa que lo resuelve? → usarla sin abstracciones
3. ¿Se puede hacer en una línea? → hacerlo así
4. Solo entonces: implementar lo mínimo necesario

Lo que NUNCA se reduce: validación en boundaries externos, manejo de errores, seguridad, accesibilidad.

## Testing — obligatorio

Jest no está instalado todavía — se instala (junto con `@testing-library/react-native`) en el primer change de OpenSpec que introduzca lógica testeable (utils, hooks, services, stores).

Cuando se instale, aplicar este árbol de decisión:

| Tipo | Cuándo aplica |
|------|---------------|
| **Unit** | Funciones puras, utils, formatters, hooks sin side effects |
| **Integration** | Componentes con lógica interna, hooks/stores con estado |
| **Snapshot** | Solo componentes puramente presentacionales y estables |

Regla universal: cada cambio incluye tests — happy path + al menos un caso de error.

## Lo que Claude NO debe hacer

- Usar bun ni yarn — solo npm con Expo
- Usar `any` o `@ts-ignore`
- Llamar axios directamente desde un componente
- Poner lógica de negocio en componentes
- Usar `AsyncStorage` directamente una vez que `expo-secure-store` esté instalado — usar secure-store para todo dato sensible/sesión
- Usar strings literales de rutas — siempre `constants/routes.ts`
- Usar spinners/`ActivityIndicator` genéricos como estado de carga una vez que haya pantallas con fetch — preferir skeletons que repliquen el layout real
- Instalar librerías de stack futuro (maps, bottom-sheet, lottie, secure-store, Paper, Reanimated) antes de que el change que las necesita lo requiera
- Construir las pantallas de la app (Login, Inicio, Overlay, Detalle de Orden, Balance, Retiro, Historial, Perfil) fuera del flujo de `/opsx:propose` — cada una es un change de OpenSpec separado

## Pendiente de diseño

El branding final (logotipo, splash, favicon de YoMeEncargo) está pendiente de diseño gráfico. Los assets actuales en `assets/images/` son el placeholder genérico del template de Expo — reemplazar en un change de OpenSpec dedicado cuando el arte final esté listo. La paleta de color (marca `#2563EB`, ver `constants/theme.ts`) y los colores de estado sí están definidos y son estables — derivados del System Design de YoMeEncargo en Figma.

## Archivos y carpetas que Claude NUNCA debe eliminar

- `app/` y todo su contenido
- `features/` y todo su contenido
- `components/` y todo su contenido
- `CLAUDE.md`
