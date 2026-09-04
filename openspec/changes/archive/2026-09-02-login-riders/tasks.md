## 1. Rutas y reestructuración

- [x] 1.1 En `constants/routes.ts` agregar `ROUTES.AUTH.LOGIN_PHONE = "/login/phone"` y `ROUTES.AUTH.REGISTER_RIDER_SOON = "/register-rider-soon"`; `ROUTES.AUTH.LOGIN` queda en `/login`. Verificar que `tsc` los reconoce tras regenerar los typed routes (memoria `project-typed-routes-tsc`).
- [x] 1.2 `git mv "app/(auth)/login.tsx" "app/(auth)/login/phone.tsx"` y ajustar dentro del archivo el redirect de éxito a `ROUTES.APP.HOME` (sin otros cambios de lógica). Verificar que `features/auth/hooks/useLoginForm.test.ts` sigue pasando sin tocarlo.
- [x] 1.3 En `app/_layout.tsx` cambiar el handler de `401` a `router.replace(ROUTES.AUTH.LOGIN_PHONE)`. Verificar por lectura que ya no referencia `ROUTES.AUTH.LOGIN` ahí.

## 2. Componentes

- [x] 2.1 Extender `components/Button.tsx`: quitar `type`, agregar `variant?: "primary" | "green" | "secondary"` (default `"primary"`) e `icon?: ReactNode` (slot izquierdo). `green` = fondo `Colors.exito` + texto blanco; `secondary` = fondo `Colors.bordeSuave` + texto `Colors.textoSuave`. Verificar con snapshot/render test que las tres variantes montan y que `perfil.tsx` sigue compilando (`npx tsc --noEmit`).
- [x] 2.2 Crear `features/auth/components/RiderLoginHeader.tsx`: gradiente (`Gradient`), `assets/images/mode-select/logo-reverse.png`, título "Ingresa como conductor", subtítulo "O envía la solicitud para registrarte" y badge "MODO CONDUCTOR" (posición absoluta sobre el borde de la hoja). Props tipadas con `interface`. Verificar con render test que muestra título y badge.
- [x] 2.3 Crear `features/auth/components/RegisterConductorButton.tsx`: fondo azul (`Colors.marca`), `Image` de `assets/images/auth/illustration-registro-conductor.png` a la izquierda, label "Registrarme como conductor" centrado, `ArrowRight` de `encargalo-icons` a la derecha, prop `onPress`. Verificar con render test que dispara `onPress` y renderiza el label.

## 3. Pantalla hub

- [x] 3.1 Crear `app/(auth)/login/index.tsx` componiendo `RiderLoginHeader`, la hoja blanca redondeada, `Button variant="green"` con `icon={<Call/>}` "Continuar con tu teléfono" → `router.push(ROUTES.AUTH.LOGIN_PHONE)`, el divisor inline "¿Aún no tienes cuenta?", `RegisterConductorButton` → `router.push(ROUTES.AUTH.REGISTER_RIDER_SOON)`, separador, y `Button variant="secondary"` con `icon={<ArrowLeft/>}` "Cambiar a modo pasajero" → `router.replace(ROUTES.AUTH.SELECT_MODE)`. Usar `useSafeAreaInsets`. Sin campos de credenciales.
- [x] 3.2 Crear `app/(auth)/login/index.test.tsx`: (happy) las tres acciones visibles sin inputs de teléfono/contraseña; "Continuar con tu teléfono" navega a `LOGIN_PHONE`; "Cambiar a modo pasajero" hace `replace` a `SELECT_MODE`. (error/edge) tocar "Registrarme como conductor" navega a `REGISTER_RIDER_SOON` y no dispara ninguna llamada de auth. Mockear `expo-router` como en `select-mode.test.tsx`.

## 4. Marcador de registro

- [x] 4.1 Crear `app/(auth)/register-rider-soon.tsx` con el patrón de `passenger-soon.tsx` (gradiente + "Registro de conductor próximamente" + texto + link "Volver" con `router.back()`). Sin navegación automática ni llamadas.
- [x] 4.2 Crear `app/(auth)/register-rider-soon.test.tsx` (espejo de `passenger-soon.test.tsx`): muestra el título y no dispara `back` ni navegación al montar.

## 5. Ajustes de ronda de revisión

- [x] 5a.1 Logo del header al mismo tamaño que `mode-select` (134×39).
- [x] 5a.2 Badge "MODO CONDUCTOR": renderizarlo detrás de la hoja blanca (hermano previo + `absolute`, siempre visible el trozo que asoma) y con efecto vidrio aproximado sin código nativo (chip `LinearGradient` de blancos translúcidos + borde, texto blanco). Añadir `utils/color.ts` (`withAlpha`) + test para no usar `rgba()` literal. `expo-blur` se descartó: exige recompilar el binario.
- [x] 5a.3 `Button`: íconos como props `leftIcon`/`rightIcon` (nada hardcodeado, es reutilizable), en `position: absolute`, con el label `flex-1` + centrado respecto al botón completo. Verificar con los tests de `Button` y del hub.
- [x] 5a.4 Hub: quitar 9px entre el divisor "¿Aún no tienes cuenta?" y el botón especial (divisor `mt-26`, botón especial `mt-17`).
- [x] 5a.5 `RegisterConductorButton`: label en MAYÚSCULAS en una sola línea (`fontSize 13`, `numberOfLines`, `adjustsFontSizeToFit`), ícono derecho como prop `rightIcon`, fondo con el gradiente de marca (no color plano), ilustración sobre una placa `Colors.marca` con `borderRadius: 17`, y borde con gradiente animado en bucle (`#F83D25` → `#7C3AED`, RN `Animated`, sin reanimated). Añadir `NeonAccent` a `constants/theme.ts` (acento decorativo, no del System Design).
- [x] 5a.6 Hub: la línea sobre "Cambiar a modo pasajero" sangra fuera del padding de la hoja (`-mx-[17px]`) para ocupar todo el ancho del teléfono.
- [x] 5a.7 Badge "MODO CONDUCTOR": anclarlo a `top: 0` y bajar la hoja con `marginTop` 36px (sin `top` negativo, que Android recorta). El badge se extiende hacia abajo con un `paddingBottom` grande (queda tapado por la hoja → parece una pestaña detrás del cuadro) y el texto va arriba con `paddingTop` para verse centrado en la franja visible.
- [x] 5a.8 Quitar comentarios innecesarios de todo el código del change y agregar la regla de comentarios a `CLAUDE.md`.

## 6. Verificación

- [x] 6.1 Correr `npx tsc --noEmit` y `npm run lint` — ambos limpios.
- [x] 6.2 Correr `npm test` sobre los archivos tocados/creados (Button, RiderLoginHeader, RegisterConductorButton, login hub, register-rider-soon, withAlpha, y los tests de auth/select-mode que no debían cambiar) — todo verde.
- [x] 6.3 `openspec validate login-riders --strict` — sin errores.
- [x] 6.4 Reportar BLOQUEADA la verificación de runtime (navegación real, layout del badge, gradiente en dispositivo) y pedir al usuario que confirme en su dispositivo contra el frame `1:107` de Figma.
