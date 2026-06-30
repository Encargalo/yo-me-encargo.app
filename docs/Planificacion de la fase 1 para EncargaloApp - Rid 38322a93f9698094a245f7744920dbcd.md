# Planificacion de la fase 1 para EncargaloApp - Riders

📌 Proyectos: EncargaloApp - App de riders (https://app.notion.com/p/EncargaloApp-App-de-riders-38322a93f96980899457ec2fb66e03dd?pvs=21)

Aplicación móvil para que riders gestionen órdenes de comida rápida de forma autónoma. El rider opera completamente desde la app: recibe órdenes, las gestiona en tiempo real, confirma entregas y administra su balance. A continuación se describen los módulos que debe contemplar la Fase 1.

# Módulos de la Aplicación

## 1. Autenticación (Login)

Pantalla de inicio de sesión para que el rider acceda a su cuenta en la plataforma.

- Login con credenciales (correo/teléfono + contraseña).
- Sesión persistente: el rider no debe iniciar sesión en cada apertura de la app.
- Solo cuentas activas y aprobadas por el administrador pueden acceder.

## 2. Perfil del Rider

Sección donde el rider puede consultar y gestionar su información personal.

- Vista y edición de datos personales: nombre, correo y teléfono.
- El rider puede activar o desactivar su disponibilidad desde el perfil.

## 3. Módulo de Órdenes en Curso

Vista principal donde el rider ve todas las órdenes que tiene activas y asignadas en este momento.

- Lista de órdenes activas con estado actual: Recogida pendiente, En camino, Entregando.
- Acceso al detalle completo de cada orden: restaurante, cliente, dirección y productos.
- Indicadores visuales del estado (colores o íconos) para identificar prioridad de cada entrega.

## 4. Notificación y Aceptación de Nuevas Órdenes

Cuando se publica una nueva orden disponible, la app interrumpe la pantalla actual con un overlay para que el rider decida si la toma o no.

- El overlay aparece en primer plano sin importar en qué pantalla esté el rider.
- Muestra: nombre del restaurante, dirección de entrega y valor de la comisión.
- Botones de Aceptar y Rechazar con temporizador: si no responde en el tiempo definido, la orden se rechaza automáticamente y pasa al siguiente rider disponible.

## 5. Mapa en Tiempo Real

Vista de mapa interactivo que centraliza la información geográfica relevante para el rider en todo momento.

- Posición actual del rider obtenida por GPS del dispositivo.
- Marcadores diferenciados para restaurantes con órdenes pendientes asignadas a ese rider.
- Marcadores diferenciados para los clientes que esperan cada entrega.
- Las posiciones se actualizan en tiempo real para que el mapa refleje el estado actual.

## 6. Confirmación de Entrega (Código del Cliente)

Mecanismo para verificar que la orden fue entregada correctamente al cliente correcto.

- Dentro del detalle de la orden, el rider dispone de un campo para ingresar el código que el cliente le muestra al recibir su pedido.
- El backend valida el código y, si es correcto, la orden pasa a estado Completada.
- Se muestra confirmación visual clara de éxito o error al ingresar el código.

## 7. Histórico de Movimientos

Registro de toda la actividad pasada del rider para que tenga trazabilidad de su trabajo.

- Lista de órdenes completadas y canceladas con fecha, restaurante, cliente y comisión obtenida.
- Filtros por rango de fechas y por estado de la orden.
- Vista de detalle por cada entrega histórica.

## 8. Balance Actual

Sección financiera donde el rider consulta en todo momento cuánto tiene a favor o en contra con la plataforma.

- Muestra el saldo neto: positivo si la plataforma le debe al rider, negativo si el rider tiene deuda pendiente.
- Desglose del balance: comisiones ganadas, descuentos o deudas aplicadas.
- Accesible desde la pantalla principal o desde el módulo de movimientos.

## 9. Solicitud de Retiro

Funcionalidad para que el rider solicite el desembolso de su saldo disponible a favor.

- Botón de solicitud de retiro disponible dentro del módulo de balance o movimientos.
- El rider indica el monto a retirar (limitado al saldo disponible a favor).
- La solicitud queda en estado Pendiente hasta que el administrador la procese.
- El rider puede ver el historial de sus retiros y el estado de cada uno (Pendiente, Procesado).