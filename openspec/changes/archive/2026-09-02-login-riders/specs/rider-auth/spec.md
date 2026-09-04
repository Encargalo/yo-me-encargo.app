## ADDED Requirements

### Requirement: Pantalla hub de acceso del conductor

El sistema SHALL mostrar en `(auth)/login` una pantalla hub que replica el frame `Login Riders` del System Design: header con el gradiente de marca, el logo reverse, el título "Ingresa como conductor", el subtítulo "O envía la solicitud para registrarte" y un badge "MODO CONDUCTOR", sobre una hoja blanca redondeada que contiene tres acciones: **Continuar con tu teléfono**, **Registrarme como conductor** y **Cambiar a modo pasajero**. Esta pantalla NO SHALL pedir credenciales ni realizar llamadas al backend.

#### Scenario: El hub se muestra al entrar al login del conductor

- **WHEN** el usuario llega a `(auth)/login` (por ejemplo, tras tocar la tarjeta "Conductor" en "Elegir modo")
- **THEN** el sistema muestra la pantalla hub con las acciones "Continuar con tu teléfono", "Registrarme como conductor" y "Cambiar a modo pasajero" visibles, sin ningún campo de teléfono ni de contraseña

#### Scenario: Continuar con tu teléfono lleva al formulario de login

- **WHEN** el usuario toca "Continuar con tu teléfono" en el hub
- **THEN** el sistema navega a `(auth)/login/phone`, donde se encuentra el formulario de teléfono + contraseña

#### Scenario: Registrarme como conductor lleva a un marcador de posición

- **WHEN** el usuario toca "Registrarme como conductor" en el hub
- **THEN** el sistema navega a la pantalla "Registro de conductor próximamente", que solo informa que el registro todavía no está disponible y NO SHALL exponer ningún flujo funcional de postulación o registro

#### Scenario: Volver desde el marcador de registro

- **WHEN** el usuario está en "Registro de conductor próximamente" y navega hacia atrás
- **THEN** el sistema vuelve a la pantalla hub

#### Scenario: Cambiar a modo pasajero

- **WHEN** el usuario toca "Cambiar a modo pasajero" en el hub
- **THEN** el sistema reemplaza la pantalla actual por la pantalla "Elegir modo" (`router.replace`), de modo que volver atrás no regresa al hub del conductor

### Requirement: Ubicación del formulario de teléfono + contraseña

El sistema SHALL servir el formulario de login del conductor (teléfono + contraseña) en la ruta `(auth)/login/phone`. La ruta `(auth)/login` SHALL renderizar el hub de acceso, no el formulario. Las reglas de validación de teléfono, validación de contraseña, envío de credenciales y manejo de errores SHALL permanecer sin cambios respecto a como estaban definidas para el formulario.

#### Scenario: El formulario responde en su nueva ruta

- **WHEN** el usuario navega a `(auth)/login/phone`
- **THEN** el sistema muestra el formulario de teléfono + contraseña con el mismo comportamiento de validación y envío que antes de este cambio

#### Scenario: La ruta del hub no muestra el formulario

- **WHEN** el usuario navega a `(auth)/login`
- **THEN** el sistema muestra el hub de acceso del conductor y no el formulario de teléfono + contraseña

## MODIFIED Requirements

### Requirement: Invalidación de sesión ante respuesta 401
El sistema SHALL interceptar cualquier respuesta `401` de cualquier endpoint autenticado, limpiar la bandera de sesión local y el store de autenticación, y redirigir al rider al formulario de login en `(auth)/login/phone`.

#### Scenario: Sesión expirada detectada en una petición autenticada
- **WHEN** cualquier petición realizada desde `(app)` recibe `401` del backend
- **THEN** el sistema borra la bandera de sesión del almacenamiento seguro, resetea el store de autenticación y navega a `(auth)/login/phone`
