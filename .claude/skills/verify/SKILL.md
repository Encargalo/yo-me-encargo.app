---
name: verify
description: Runtime verification recipe for YoMeEncargo (Expo/React Native app de riders)
---

# Verify — YoMeEncargo (app de riders)

Surface: **GUI** (Expo SDK 54 / React Native app en dispositivo Android/iOS o simulador). Es la única superficie que expone este repo — no hay CLI ni HTTP API propia (consume un backend remoto vía Axios, `lib/axios.ts`).

## Constraints específicas de este proyecto

- Este entorno de agente **no tiene ninguna herramienta para accionar una UI móvil** (no hay ADB, ni screenshot/interacción de simulador, ni control remoto de Expo). No hay forma de alcanzar la superficie GUI desde acá.
- El dev server de Expo, si está corriendo, es del usuario. **No reiniciarlo** — reiniciarlo puede tumbar la sesión que el usuario ya tenía abierta en su dispositivo. Solo levantar uno nuevo (`npx expo start`) si no hay ninguno activo y el usuario lo pide explícitamente.

## Qué significa esto para la verificación

El agente **no puede** verificar de forma autónoma el comportamiento en runtime de este repo — no hay handle sobre la superficie GUI. La verificación del comportamiento real de la app (pantallas, gestos, mapa en tiempo real, WebSocket/red visible en el dispositivo) la hace el usuario en su dispositivo/simulador.

Lo que el agente SÍ puede hacer como parte de "verificación":
- Leer logs de red/backend que el usuario pega de vuelta (ej. `console.log` temporal agregado durante debugging, removido una vez confirmado) — usar `mcp__claude-in-chrome__read_console_messages` no aplica acá; los logs los trae el usuario.
- Confirmar que el diff coincide con el cambio descrito (code review).
- Correr `npx tsc --noEmit` (typecheck) y `npm run lint`, y cuando Jest esté instalado, correr solo los tests de los archivos tocados. Son chequeos equivalentes a CI, no verificación de runtime.

Cuando se pida `/verify` un cambio en este repo: reportar **BLOQUEADO** la parte de observación de runtime (sin handle sobre la GUI desde este entorno) y pedir explícitamente al usuario que confirme el comportamiento en su dispositivo/simulador activo — o apoyarse en la verificación que el usuario ya haya hecho y reportado en la conversación. Nunca asumir que algo funciona sin haberlo comprobado o sin confirmación del usuario.
