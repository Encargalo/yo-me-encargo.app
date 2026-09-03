## Purpose

Autenticación de riders en YoMeEncargo: login con teléfono + contraseña contra `POST /auth/sign-in/riders`, validación de credenciales, manejo de errores por código de respuesta, persistencia de sesión entre reinicios de la app y enrutamiento condicionado a sesión activa (`(auth)` vs `(app)`).

## Requirements

### Requirement: Validación de teléfono en el formulario de login
El sistema SHALL validar el número de teléfono antes de permitir el envío del formulario de login. El campo se compone del código de país (fijo en `+57` por defecto) más el número local ingresado por el rider, formando un valor E.164 (`^\+[1-9]\d{7,14}$`).

#### Scenario: Teléfono vacío
- **WHEN** el rider intenta enviar el formulario con el campo de número local vacío
- **THEN** el sistema muestra un error inline "Ingresa un número de teléfono válido" y no realiza la llamada al backend

#### Scenario: Teléfono con formato inválido
- **WHEN** el rider ingresa un número local que, combinado con el código de país, no cumple el formato E.164
- **THEN** el sistema muestra el error inline en el campo y mantiene el botón "Iniciar sesión" deshabilitado

#### Scenario: Teléfono válido
- **WHEN** el rider ingresa un número local que combinado con el código de país cumple el formato E.164
- **THEN** el sistema habilita el botón "Iniciar sesión" y limpia cualquier error previo del campo

### Requirement: Validación de contraseña en el formulario de login
El sistema SHALL requerir que el campo de contraseña no esté vacío antes de permitir el envío del formulario. El sistema NO SHALL aplicar reglas de complejidad no documentadas por el backend.

#### Scenario: Contraseña vacía
- **WHEN** el rider intenta enviar el formulario con el campo de contraseña vacío
- **THEN** el sistema muestra un error inline "Ingresa tu contraseña" y no realiza la llamada al backend

#### Scenario: Contraseña con contenido
- **WHEN** el rider ingresa cualquier valor no vacío en el campo de contraseña
- **THEN** el sistema no bloquea el envío del formulario por este campo

### Requirement: Envío de credenciales al backend
El sistema SHALL enviar `phone_number` (formato E.164) y `password` a `POST /auth/sign-in/riders` únicamente cuando ambos campos pasan la validación cliente, y SHALL mostrar un estado de carga (spinner en el botón primario) mientras la petición está en curso.

#### Scenario: Envío en curso
- **WHEN** el rider presiona "Iniciar sesión" con datos válidos
- **THEN** el sistema deshabilita el botón, muestra el spinner de carga y envía la petición al backend

#### Scenario: Envío exitoso limpia estado de carga
- **WHEN** la petición de login resuelve (éxito o error)
- **THEN** el sistema oculta el spinner y reactiva el formulario para permitir un nuevo intento si corresponde

### Requirement: Autenticación exitosa (201)
El sistema SHALL, ante una respuesta `201` de `POST /auth/sign-in/riders`, marcar al rider como autenticado, persistir una bandera local de sesión y redirigir a la sección `(app)`.

#### Scenario: Login exitoso
- **WHEN** el backend responde `201` a la petición de login
- **THEN** el sistema guarda `{ hasSession: true, phoneNumber }` en el almacenamiento seguro del dispositivo, actualiza el store de sesión a autenticado y navega a `(app)` reemplazando la pantalla de login en el stack

### Requirement: Manejo de errores de autenticación por código de respuesta
El sistema SHALL mostrar un mensaje de error específico, inline (sin alertas genéricas de sistema), para cada código de respuesta documentado de `POST /auth/sign-in/riders`, y SHALL distinguir el caso de error de red (sin `response` en el error de Axios).

#### Scenario: Credenciales incorrectas (422)
- **WHEN** el backend responde `422` a la petición de login
- **THEN** el sistema muestra el error inline "Credenciales incorrectas", marca los campos de teléfono y contraseña visualmente en rojo, y no navega

#### Scenario: Solicitud inválida (400)
- **WHEN** el backend responde `400` a la petición de login
- **THEN** el sistema muestra el mensaje inline genérico "Revisa los datos ingresados" bajo el formulario y no navega

#### Scenario: Error inesperado del servidor (500)
- **WHEN** el backend responde `500` a la petición de login
- **THEN** el sistema muestra el mensaje inline "Ocurrió un error, intenta de nuevo" y no navega

#### Scenario: Sin conexión de red
- **WHEN** la petición de login falla sin recibir respuesta del servidor (timeout o sin conexión)
- **THEN** el sistema muestra el mensaje inline "Sin conexión. Verifica tu internet" y no navega

### Requirement: Persistencia y verificación de sesión al iniciar la app
El sistema SHALL leer la bandera de sesión del almacenamiento seguro al iniciar la app y SHALL usarla para decidir la ruta inicial, evitando mostrar contenido de `(app)` o `(auth)` antes de completar esa lectura.

#### Scenario: App inicia con sesión previa guardada
- **WHEN** la app arranca y existe `hasSession: true` en el almacenamiento seguro
- **THEN** el sistema navega directamente a `(app)` sin pasar por el login

#### Scenario: App inicia sin sesión previa
- **WHEN** la app arranca y no existe bandera de sesión (o `hasSession: false`) en el almacenamiento seguro
- **THEN** el sistema navega a la pantalla "Elegir modo" en vez de ir directo a `(auth)/login`

#### Scenario: App inicia mientras se lee el almacenamiento seguro
- **WHEN** la app arranca y la lectura del almacenamiento seguro todavía no completó
- **THEN** el sistema no renderiza ni `(auth)` ni `(app)` hasta que la lectura complete

### Requirement: Invalidación de sesión ante respuesta 401
El sistema SHALL interceptar cualquier respuesta `401` de cualquier endpoint autenticado, limpiar la bandera de sesión local y el store de autenticación, y redirigir al rider a `(auth)/login`.

#### Scenario: Sesión expirada detectada en una petición autenticada
- **WHEN** cualquier petición realizada desde `(app)` recibe `401` del backend
- **THEN** el sistema borra la bandera de sesión del almacenamiento seguro, resetea el store de autenticación y navega a `(auth)/login`
