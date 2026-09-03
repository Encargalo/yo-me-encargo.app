## Purpose

Pantalla de entrada de YoMeEncargo que deja elegir entre modo Conductor y modo Pasajero antes de continuar hacia el login correspondiente, siguiendo el frame "Mode" del System Design de Figma.

## Requirements

### Requirement: Pantalla de elegir modo como entrada sin sesión
El sistema SHALL mostrar la pantalla "Elegir modo" con el título "¿Qué modo deseas usar?", su subtítulo, y dos tarjetas seleccionables — **Pasajero** y **Conductor** — cada una con ilustración, título y descripción, cuando no hay sesión activa.

#### Scenario: Pantalla de elegir modo se muestra sin sesión
- **WHEN** la app termina de leer el almacenamiento seguro y no hay sesión activa
- **THEN** el sistema muestra la pantalla "Elegir modo" con las tarjetas Pasajero y Conductor visibles

### Requirement: Selección de modo Conductor
El sistema SHALL navegar al login de rider existente (`(auth)/login`) cuando el usuario toca la tarjeta **Conductor**.

#### Scenario: Tocar la tarjeta Conductor
- **WHEN** el usuario toca la tarjeta "Conductor" en la pantalla de elegir modo
- **THEN** el sistema navega a `(auth)/login`

### Requirement: Selección de modo Pasajero
El sistema SHALL navegar a una pantalla de marcador de posición cuando el usuario toca la tarjeta **Pasajero**, indicando que el modo pasajero todavía no está disponible. El sistema NO SHALL exponer ningún flujo funcional de registro, login o pedido de viaje para pasajeros en este marcador.

#### Scenario: Tocar la tarjeta Pasajero
- **WHEN** el usuario toca la tarjeta "Pasajero" en la pantalla de elegir modo
- **THEN** el sistema navega a la pantalla "Modo pasajero próximamente", que solo informa que el modo pasajero no está disponible aún

#### Scenario: Volver desde el marcador de pasajero
- **WHEN** el usuario está en la pantalla "Modo pasajero próximamente" y navega hacia atrás
- **THEN** el sistema vuelve a la pantalla de elegir modo
