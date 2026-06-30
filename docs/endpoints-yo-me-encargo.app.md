# Endpoints - Yo Me Encargo (Riders)

## Autenticación

### `POST /auth/sign-in/riders`
**Iniciar sesión como rider**

Autentica a un rider usando su número de teléfono y contraseña. Si las credenciales son correctas, se crea una sesión y se devuelve una cookie con un JWT.

**Parámetros**

| Nombre | Ubicación | Tipo | Descripción |
|---|---|---|---|
| body * | body | object | Datos de inicio de sesión |

**Content-Type:** `application/json`

**Ejemplo de body:**
```json
{
  "password": "claveSegura123",
  "phone_number": "+573001112233"
}
```

**Respuestas**

| Código | Descripción | Ejemplo |
|---|---|---|
| 201 | session created | `"string"` |
| 400 | Solicitud inválida (validación o JSON incorrecto) | `{ "additionalProp1": "string", "additionalProp2": "string", "additionalProp3": "string" }` |
| 422 | Credenciales incorrectas | `{ "additionalProp1": "string", "additionalProp2": "string", "additionalProp3": "string" }` |
| 500 | Error inesperado del servidor | `{ "additionalProp1": "string", "additionalProp2": "string", "additionalProp3": "string" }` |

---

## Pedidos

### `POST /orders/{id}/confirm-delivery`
**Confirmar entrega del pedido**

El rider introduce el código de 6 dígitos que le muestra el usuario para confirmar la entrega. Transiciona el pedido de "On The Way" a "Completed".

**Parámetros**

| Nombre | Ubicación | Tipo | Descripción |
|---|---|---|---|
| id * | path | string | ID del pedido |
| body * | body | object | Código de entrega |

**Content-Type:** `application/json`

**Ejemplo de body:**
```json
{
  "code": "string"
}
```

**Respuestas**

| Código | Descripción | Ejemplo |
|---|---|---|
| 200 | Pedido entregado | `{ "additionalProp1": "string", "additionalProp2": "string", "additionalProp3": "string" }` |
| 400 | Código inválido | `{ "code": 400, "message": "invalid request" }` |
| 404 | Pedido no encontrado | `{ "code": 400, "message": "invalid request" }` |
| 409 | Código ya utilizado | `{ "code": 400, "message": "invalid request" }` |
| 422 | Estado del pedido incorrecto | `{ "code": 400, "message": "invalid request" }` |

---

## Riders WebSocket

### `GET /orders/rider`
**WebSocket de gestión de órdenes para riders**

Establece una conexión WebSocket exclusiva para el rol Rider.

**Parámetros:** Ninguno

**Respuestas**

| Código | Descripción | Ejemplo |
|---|---|---|
| 401 | Sesión no encontrada o inválida | `"string"` |
| 403 | Acceso denegado | `"string"` |
| 500 | Error interno del servidor | `"string"` |

---

## Riders

### `GET /riders/balance`
**Balance del rider**

Retorna el balance actual del rider, su zona de control y los últimos 10 movimientos.

**Parámetros:** Ninguno

**Respuestas**

| Código | Descripción | Ejemplo |
|---|---|---|
| 200 | balance, zona y últimos 10 movimientos | Ver abajo |
| 401 | No autorizado | `"string"` |
| 500 | Error interno | `"string"` |

**Ejemplo de respuesta 200:**
```json
{
  "balance": 0,
  "transactions": [
    {
      "amount": 0,
      "created_at": "string",
      "distance_km": 0,
      "id": "string",
      "movement_type": "string",
      "order_id": "string",
      "payment_method": "string"
    }
  ],
  "zone": "normal"
}
```

---

### `GET /riders/transactions`
**Historial de movimientos del rider**

Retorna el historial paginado de movimientos de balance del rider.

**Parámetros**

| Nombre | Ubicación | Tipo | Descripción |
|---|---|---|---|
| page | query | integer | Página (default 1) |
| limit | query | integer | Límite por página, máx 50 (default 20) |

**Respuestas**

| Código | Descripción | Ejemplo |
|---|---|---|
| 200 | OK | Ver abajo |
| 401 | No autorizado | `"string"` |
| 500 | Error interno | `"string"` |

**Ejemplo de respuesta 200:**
```json
{
  "limit": 0,
  "page": 0,
  "total": 0,
  "transactions": [
    {
      "amount": 0,
      "created_at": "string",
      "distance_km": 0,
      "id": "string",
      "movement_type": "string",
      "order_id": "string",
      "payment_method": "string"
    }
  ]
}
```

---

### `POST /riders/withdrawal`
**Solicitar retiro de balance**

El rider solicita retirar su balance acumulado. Requiere balance >= +$15.

**Parámetros:** Ninguno

**Respuestas**

| Código | Descripción | Ejemplo |
|---|---|---|
| 200 | OK | `{ "amount_withdrawn": 0 }` |
| 401 | No autorizado | `"string"` |
| 422 | Balance insuficiente para retiro | `"string"` |
| 500 | Error interno | `"string"` |
