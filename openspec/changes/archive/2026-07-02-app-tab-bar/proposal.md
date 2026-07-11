## Why

Hoy `(app)/_layout.tsx` es un `Stack` plano con `home`, `balance` y `orders/[id]` como hermanos, sin barra de navegación. El wireframe define una **tab bar global de 4 ítems** (`Inicio · Balance · Historial · Perfil`) presente en todas las pantallas principales, mientras que el Detalle de Orden se empuja *por encima* sin tab bar. Sin este shell de navegación no hay forma de moverse entre las secciones de la app ni de llegar a Historial y Perfil, que aún no existen como rutas.

## What Changes

- Reestructurar `app/(app)/` para introducir un grupo `(tabs)/` anidado dentro de un `Stack`:
  - `(tabs)/_layout.tsx` con `<Tabs>` de Expo Router = la tab bar global.
  - Mover `home.tsx` y `balance.tsx` dentro de `(tabs)/`.
  - Añadir `historial.tsx` y `perfil.tsx` como placeholders ("Próximamente"), igual que el `balance.tsx` actual.
- `(app)/_layout.tsx` pasa a `Stack` que envuelve el grupo `(tabs)` + la ruta `orders/[id]`, de modo que el Detalle de Orden se empuja **sin** tab bar (wireframe 04).
- Añadir `ROUTES.APP.HISTORIAL` (`/historial`) y `ROUTES.APP.PERFIL` (`/perfil`) a `constants/routes.ts`.
- Estilizar la tab bar con los tokens del wireframe: activo `Neutrals.ink` (`#2a2a2a`), inactivo `Neutrals.placeholder` (`#a9a69d`), borde superior `Neutrals.borderCard`, fondo blanco, alto 60px + safe area. Iconos monocromo de `@expo/vector-icons` (Ionicons).
- Reconciliar el padding inferior de `home.tsx`: hoy aplica `insets.bottom` manual al scroll; con la tab bar ocupando la zona inferior debe evitarse el doble padding.

Como `(tabs)` es un grupo de rutas (paréntesis = no aparece en la URL), `ROUTES.APP.HOME` sigue siendo `/home` y `ROUTES.APP.BALANCE` sigue siendo `/balance` — sin rutas rotas.

## Capabilities

### New Capabilities
- `app-navigation`: Shell de navegación de la app autenticada — tab bar global de 4 secciones (Inicio, Balance, Historial, Perfil) y la relación con las pantallas empujadas por encima (Detalle de Orden) que ocultan la tab bar.

### Modified Capabilities
<!-- Ninguna. rider-auth no cambia sus requisitos; el gate de autenticación en app/index.tsx permanece igual. -->

## Impact

- **Rutas / estructura:** `app/(app)/_layout.tsx`, nuevo `app/(app)/(tabs)/_layout.tsx`, movimiento de `home.tsx` y `balance.tsx`, nuevos `historial.tsx` y `perfil.tsx`.
- **Constantes:** `constants/routes.ts` (nuevas rutas `HISTORIAL`, `PERFIL`).
- **Dependencias:** ninguna nueva — `@expo/vector-icons` y `expo-router` ya están instalados.
- **Sin impacto** en `rider-auth`, `home-orders-map` (contenido), ni en el gate de `app/index.tsx`.
- Fuera de alcance: overlay de nueva orden (prioridad máxima, otro change) y el contenido real de Historial y Perfil.
