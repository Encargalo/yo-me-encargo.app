## MODIFIED Requirements

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
