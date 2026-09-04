## 1. Rutas

- [x] 1.1 Añadir `HISTORIAL: "/historial"` y `PERFIL: "/perfil"` a `ROUTES.APP` en `constants/routes.ts`

## 2. Reestructurar el shell de navegación

- [x] 2.1 Crear la carpeta de grupo `app/(app)/(tabs)/`
- [x] 2.2 Mover `app/(app)/home.tsx` → `app/(app)/(tabs)/home.tsx` (imports usan alias `@/…`, no cambian)
- [x] 2.3 Mover `app/(app)/balance.tsx` → `app/(app)/(tabs)/balance.tsx`
- [x] 2.4 Convertir `app/(app)/_layout.tsx` en un `Stack` (headerShown:false) que envuelve el grupo `(tabs)` + la ruta `orders/[id]`, de modo que el Detalle de Orden se empuje sin tab bar

## 3. Tab bar

- [x] 3.1 Crear `app/(app)/(tabs)/_layout.tsx` con `<Tabs>` de Expo Router y las 4 pantallas (home, balance, historial, perfil) en orden
- [x] 3.2 Configurar `screenOptions`: `tabBarActiveTintColor` = `Primary` (#fc6b2b, naranja de marca), `tabBarInactiveTintColor` = `Neutrals.placeholder`, `tabBarStyle` con alto 60 + safe area, borde superior `Neutrals.borderCard`, fondo `Neutrals.white`, `headerShown:false`
- [x] 3.3 Definir por pantalla `title` (Inicio · Balance · Historial · Perfil) y `tabBarIcon` con lucide-react-native (Home / Wallet / History / User), stroke más grueso cuando la sección está activa

## 4. Placeholders de secciones nuevas

- [x] 4.1 Crear `app/(app)/(tabs)/historial.tsx` como placeholder ("Historial · Próximamente"), mismo patrón que el `balance.tsx` actual
- [x] 4.2 Crear `app/(app)/(tabs)/perfil.tsx` como placeholder ("Perfil · Próximamente")

## 5. Reconciliar Home

- [x] 5.1 Ajustar el padding inferior del scroll en `home.tsx`: quitar `insets.bottom` del `contentContainerStyle` (lo consume ahora la tab bar), dejando solo el padding visual; mantener `paddingTop: insets.top`

## 6. Verificación

- [x] 6.1 `npx tsc --noEmit` sin errores
- [x] 6.2 `npm run lint` sin errores (solo warning en archivo autogenerado `.expo/types/router.d.ts`)
- [x] 6.3 Verificar en la app: tab bar visible en las 4 secciones con Inicio activo por defecto; activo en `#fc6b2b` (naranja de marca), inactivos en `#a9a69d`
- [x] 6.4 Verificar que al abrir el Detalle de Orden desde Inicio la tab bar desaparece y reaparece al volver; que la última tarjeta de Home no queda tapada ni con hueco excesivo
