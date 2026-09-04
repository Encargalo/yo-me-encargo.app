## Why

Los tokens visuales del código nunca se alinearon con el System Design de YoMeEncargo en Figma: la app usa un naranja `#fc6b2b` heredado del template de Expo y una paleta neutra de grises cálidos derivada de `docs/wireframes/`, mientras que el sistema real es **azul** (`#2563EB`) sobre neutros fríos. Cada pantalla nueva que se construya sobre los tokens actuales aumenta la deuda de migración, y hoy ya hay cinco pantallas y quince componentes apoyados en ellos.

## What Changes

- **BREAKING** — El color de marca pasa de naranja `#fc6b2b` a azul `#2563EB` (`Colors/Primary` en Figma). Afecta tab bar, botones y todo elemento que hoy pinte marca.
- **BREAKING** — Se retira la paleta neutra de grises cálidos (`Neutrals` en `constants/theme.ts` y los tokens `ink`/`body`/`muted`/`label`/`placeholder`/`line`/`hair`/`card`/`block`/`canvas` en `tailwind.config.js`), reemplazada por los neutros fríos del System Design.
- **BREAKING** — Los colores de estado de orden se realinean a los valores de Figma: verde `#09E55B`, rojo `#DC2626`, ámbar `#F7AA28`, azul `#2563EB`. Los cuatro valores actuales (`#22c55e`, `#ef4444`, `#f59e0b`, `#3b82f6`) quedan obsoletos.
- Se incorpora la paleta completa: Azul Intenso `#1D4ED8`, Azul Claro `#60A5FA`, Amarillo Claro `#FEF3C7`, Gris `#BDBDBD`, Gris Suave `#F4F4F5`, Blanco `#FBFBFB`, Blanco Puro `#FFFFFF`, Skin Tone `#F5C2A0`, Negro Suave `#1A1A1A`.
- Se añade el gradiente de marca `linear-gradient(135.93deg, #1D4ED8 6.42%, #2563EB 43.78%, #60A5FA 100%)` como token, con `expo-linear-gradient` para renderizarlo en React Native.
- Se incorporan las tipografías del System Design (Plus Jakarta Sans, Inter, Manrope) con su escala, sustituyendo el `system-ui` actual.
- Se tokenizan radios (12, 20) y espaciados (10, 12), y se sustituyen los hex hardcodeados repartidos por las pantallas (`#f59e0b` aparece 15 veces, `#3b82f6` 10 veces) por referencias a token.
- Se actualiza la sección "Colores de estado — obligatorio" de `CLAUDE.md` con los valores reales.

## Capabilities

### New Capabilities

- `design-system`: define la fuente única de verdad visual de la app — paleta de color con nombres semánticos, gradiente de marca, familias y escala tipográfica, radios y espaciados. Establece que todo color de la interfaz SHALL provenir de un token y nunca de un hex literal, y fija el mapeo entre estados de orden y colores de la paleta.

### Modified Capabilities

- `app-navigation`: la tab bar deja de resaltar el ítem activo con el naranja de marca `#fc6b2b` sobre `#a9a69d`, y pasa al azul principal `#2563EB` sobre el gris del sistema. El requisito hoy fija ambos hex de forma literal, por lo que su redacción cambia.

## Impact

**Código afectado**

- `tailwind.config.js` y `constants/theme.ts` — reescritura completa de la paleta y la tipografía.
- `app/(app)/(tabs)/_layout.tsx` — único consumidor de `Primary`; cambia el color activo de la tab bar.
- 20 archivos usan los tokens neutros obsoletos: `app/(app)/withdrawal.tsx`, `app/(app)/orders/[id].tsx`, `app/(app)/(tabs)/{home,balance,historial}.tsx` y los componentes de `features/orders/` (`ActiveOrderCard`, `OrderOfferModal`, `OrderCompletedSummary`, `OrderPartyBlock`, `OrdersMap`, `HomeHeader`, `AvailabilityToggle`, `OrdersEmptyState`, `OrderItemsList`, `DeliveryCodeInput`, `MapSkeleton`, `CountdownRing`).
- Snapshots de tests: 16 suites con colores o clases de token serializados deben regenerarse (`DeliveryCodeInput`, `OrderPartyBlock`, `OrderCompletedSummary`, `OrderOfferModal`, `PickupCodeCard`, `OrderItemsList`, `TransactionsList`, `NetBalanceCard`, `RecentWithdrawalsList`, `MinimumBalanceNotice`, `AvailableBalanceCard`, `TransactionRow`, `WithdrawalSuccess`, `RecentWithdrawalRow`, `BalanceSkeleton`, `HistorialSkeleton`).
- `CLAUDE.md` — tabla de colores de estado.

**Dependencias**

- Alta de `expo-linear-gradient` (gradiente de marca) y de `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/inter` y `@expo-google-fonts/manrope` junto a `expo-font` para la carga tipográfica.

**Riesgo**

- El cambio es puramente visual pero de superficie amplia; una migración incompleta deja pantallas con la paleta vieja conviviendo con la nueva. La mitigación es que ningún token antiguo sobreviva al change: al eliminarlos de `tailwind.config.js` y `theme.ts`, cualquier uso pendiente falla en el chequeo de tipos o queda visible como clase sin efecto.

**Fuera de alcance**

- Reescribir `Button.tsx`, `PasswordInput.tsx` y `PhoneInput.tsx` para seguir los componentes de Figma (botones tipo píldora con seis variantes, inputs con línea inferior en lugar de caja).
- El prefijo telefónico `+57` de Colombia hardcodeado en `PhoneInput.tsx`, siendo que la app opera en Venezuela.
