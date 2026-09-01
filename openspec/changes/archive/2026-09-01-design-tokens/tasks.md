## 1. Dependencias y assets

- [x] 1.1 Instalar `expo-linear-gradient` con `npx expo install` para que resuelva la versión del SDK 54
- [x] 1.2 Descargar y versionar en `assets/fonts/` los cinco `.ttf`: PlusJakartaSans Bold, SemiBold y Regular; Inter Regular; Manrope Medium
- [x] 1.3 Cargar las cinco fuentes con `useFonts` en `app/_layout.tsx`, manteniendo el splash visible con `SplashScreen.preventAutoHideAsync()` hasta que terminen de cargar
- [x] 1.4 Verificar que los nombres de familia registrados por `useFonts` son los que consumen los tokens tipográficos, idénticos en Android e iOS

## 2. Definición de tokens

- [x] 2.1 Reescribir `constants/theme.ts`: paleta con nombres por rol (marca, contraste, éxito, error, texto, superficie, borde), retirando `Colors.light`/`Colors.dark`, `Neutrals` y `Primary`
- [x] 2.2 Añadir a `constants/theme.ts` el mapa de colores de estado de orden: pendiente `#F7AA28`, en camino `#1D4ED8`, completado `#09E55B`, error `#DC2626`
- [x] 2.3 Añadir el token de gradiente como objeto con `colors`, `locations`, `start` y `end`, traduciendo el ángulo 135.93° del System Design a vectores
- [x] 2.4 Añadir los tokens tipográficos (familias y escala Header 1 / Header 2 / H2 / H3 / Subtítulos / Text Regular) y los de radio (12, 20) y espaciado (10, 12)
- [x] 2.5 Hacer que `tailwind.config.js` importe los valores de `constants/theme.ts` en vez de redeclararlos; si la importación no funciona en contexto CommonJS, extraer los valores planos a un módulo `.js` compartido según la salida prevista en design.md
- [x] 2.6 Confirmar que los tokens antiguos (`ink`, `body`, `muted`, `label`, `placeholder`, `line`, `hair`, `card`, `block`, `canvas`) ya no existen en `tailwind.config.js`

## 3. Migración de pantallas

- [x] 3.1 Migrar `app/(app)/(tabs)/_layout.tsx`: ítem activo en marca `#2563EB`, inactivo en gris `#BDBDBD`, borde superior y fondo desde tokens
- [x] 3.2 Migrar `app/(app)/(tabs)/home.tsx`
- [x] 3.3 Migrar `app/(app)/(tabs)/balance.tsx`
- [x] 3.4 Migrar `app/(app)/(tabs)/historial.tsx`
- [x] 3.5 Migrar `app/(app)/withdrawal.tsx`, incluyendo los usos de `OrderStatusColors.error` con opacidad
- [x] 3.6 Migrar `app/(app)/orders/[id].tsx`, incluyendo los `pinColor` de los marcadores de mapa

## 4. Migración de componentes

- [x] 4.1 Migrar los componentes de tarjeta y cabecera: `ActiveOrderCard`, `HomeHeader`, `AvailabilityToggle`, `OrdersEmptyState`
- [x] 4.2 Migrar los componentes de detalle de orden: `OrderPartyBlock`, `OrderItemsList`, `OrderCompletedSummary`, `DeliveryCodeInput`
- [x] 4.3 Migrar los componentes de mapa y tiempo: `OrdersMap`, `MapSkeleton`, `CountdownRing`
- [x] 4.4 Migrar `OrderOfferModal`
- [x] 4.5 Sustituir los hex literales restantes en `app/` y `features/` por referencias a token, incluidos los grises sueltos `#9ca3af`, `#d1d5db`, `#111827` y `#374151`

## 5. Tipografía aplicada

- [x] 5.1 Aplicar la familia de texto corrido como tipografía por defecto, de modo que un `Text` sin familia declarada no caiga en la del sistema operativo
- [x] 5.2 Aplicar los tokens de la escala tipográfica en los encabezados de las cinco pantallas migradas, reemplazando los tamaños literales

## 6. Documentación

- [x] 6.1 Actualizar la sección "Colores de estado — obligatorio" de `CLAUDE.md` con los cuatro valores nuevos y la distinción entre el azul de marca y el azul de estado
- [x] 6.2 Actualizar en `CLAUDE.md` la mención a la paleta `primary #fc6b2b` / `tint #0a7ea4` y la nota de "Pendiente de diseño", que ya no reflejan el estado real

## 7. Verificación

- [x] 7.1 `npx tsc --noEmit` sin errores — confirma que no queda ningún import de `Neutrals` ni `Primary`
- [x] 7.2 Grep de los diez nombres de token retirados sobre `app/`, `features/` y `components/` con salida vacía
- [x] 7.3 Grep de hex literales sobre `app/` y `features/` con salida vacía, salvo los snapshots de test
- [x] 7.4 `npm run lint` sin errores
- [x] 7.5 Regenerar los 16 snapshots afectados y revisar su diff para confirmar que solo cambian valores de color y clase, no la estructura del árbol
- [x] 7.6 `npm test` en verde (49/49 suites, 199/199 tests, 17/17 snapshots)
- [x] 7.7 Abrir la app y revisar las cinco pantallas migradas más la tab bar, comprobando que ninguna conserva la paleta naranja
