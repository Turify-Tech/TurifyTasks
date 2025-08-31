# 🔌 TurifyTasks - Documentación de APIs

## 📝 **Información General**

### **Base URL**
- **Desarrollo**: `http://localhost:3000`
- **Producción**: `https://tu-dominio-api.com`

### **Formato de Respuestas**
Todas las APIs retornan JSON con la siguiente estructura:

**Éxito:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Descripción del error",
  "code": "ERROR_CODE"
}
```

### **Autenticación**
Las rutas protegidas requieren header de autorización:
```
Authorization: Bearer <jwt_token>
```

## 🔐 **Endpoints de Autenticación**

### **POST /api/auth/register**
Registra un nuevo usuario en el sistema.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "confirmPassword": "contraseña123"
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "created_at": "2025-08-31T17:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Usuario registrado exitosamente"
}
```

**Errores Posibles:**
- `400` - Datos inválidos o contraseñas no coinciden
- `409` - Email ya registrado
- `500` - Error interno del servidor

---

### **POST /api/auth/login**
Inicia sesión de usuario existente.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Inicio de sesión exitoso"
}
```

**Errores Posibles:**
- `400` - Datos faltantes
- `401` - Credenciales inválidas
- `500` - Error interno del servidor

---

### **GET /api/auth/profile**
Obtiene información del perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "created_at": "2025-08-31T17:00:00.000Z",
      "updated_at": "2025-08-31T17:00:00.000Z"
    }
  }
}
```

**Errores Posibles:**
- `401` - Token inválido o expirado
- `404` - Usuario no encontrado
- `500` - Error interno del servidor

---

### **POST /api/auth/logout**
Cierra la sesión del usuario (invalida el token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

**Errores Posibles:**
- `401` - Token inválido
- `500` - Error interno del servidor

---

## 📋 **Endpoints de Tareas**

### **GET /api/tasks**
Obtiene todas las tareas del usuario autenticado.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters (Opcionales):**
```
?filter=completed     # Filtrar por estado
?priority=high        # Filtrar por prioridad
?limit=10            # Limitar resultados
?offset=0            # Paginación
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "Completar documentación",
        "description": "Escribir documentación completa del proyecto",
        "completed": false,
        "priority": "high",
        "due_date": "2025-09-01T00:00:00.000Z",
        "created_at": "2025-08-31T17:00:00.000Z",
        "updated_at": "2025-08-31T17:00:00.000Z"
      }
    ],
    "total": 1,
    "count": 1
  }
}
```

**Errores Posibles:**
- `401` - Token inválido
- `500` - Error interno del servidor

---

### **POST /api/tasks**
Crea una nueva tarea.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Nueva tarea",
  "description": "Descripción de la tarea",
  "priority": "medium",
  "due_date": "2025-09-01T10:00:00.000Z"
}
```

**Campos Requeridos:**
- `title` (string): Título de la tarea

**Campos Opcionales:**
- `description` (string): Descripción detallada
- `priority` (string): "low", "medium", "high" (default: "medium")
- `due_date` (string): Fecha límite en formato ISO

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": 2,
      "title": "Nueva tarea",
      "description": "Descripción de la tarea",
      "completed": false,
      "priority": "medium",
      "due_date": "2025-09-01T10:00:00.000Z",
      "created_at": "2025-08-31T17:30:00.000Z",
      "updated_at": "2025-08-31T17:30:00.000Z"
    }
  },
  "message": "Tarea creada exitosamente"
}
```

**Errores Posibles:**
- `400` - Datos inválidos o título faltante
- `401` - Token inválido
- `500` - Error interno del servidor

---

### **PUT /api/tasks/:id**
Actualiza una tarea existente.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (integer): ID de la tarea a actualizar

**Body:**
```json
{
  "title": "Tarea actualizada",
  "description": "Nueva descripción",
  "completed": true,
  "priority": "high",
  "due_date": "2025-09-02T10:00:00.000Z"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": 1,
      "title": "Tarea actualizada",
      "description": "Nueva descripción",
      "completed": true,
      "priority": "high",
      "due_date": "2025-09-02T10:00:00.000Z",
      "created_at": "2025-08-31T17:00:00.000Z",
      "updated_at": "2025-08-31T17:45:00.000Z"
    }
  },
  "message": "Tarea actualizada exitosamente"
}
```

**Errores Posibles:**
- `400` - Datos inválidos
- `401` - Token inválido
- `403` - Tarea no pertenece al usuario
- `404` - Tarea no encontrada
- `500` - Error interno del servidor

---

### **DELETE /api/tasks/:id**
Elimina una tarea.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id` (integer): ID de la tarea a eliminar

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Tarea eliminada exitosamente"
}
```

**Errores Posibles:**
- `401` - Token inválido
- `403` - Tarea no pertenece al usuario
- `404` - Tarea no encontrada
- `500` - Error interno del servidor

---

## 🏥 **Endpoint de Health Check**

### **GET /api/health**
Verifica el estado del servidor y conexiones.

**Respuesta Exitosa (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-31T17:25:32.000Z",
  "database": {
    "status": "connected",
    "responseTime": "189ms",
    "type": "Turso SQLite"
  },
  "server": {
    "uptime": "2h 30m 45s",
    "memory": {
      "used": "45.2 MB",
      "total": "512 MB"
    },
    "nodeVersion": "v18.17.0"
  }
}
```

**Errores Posibles:**
- `503` - Servicio no disponible (DB desconectada)

---

## 🔧 **Códigos de Error Personalizados**

### **Autenticación**
- `AUTH_INVALID_CREDENTIALS` - Credenciales incorrectas
- `AUTH_TOKEN_EXPIRED` - Token JWT expirado
- `AUTH_TOKEN_INVALID` - Token JWT malformado
- `AUTH_USER_EXISTS` - Email ya registrado
- `AUTH_USER_NOT_FOUND` - Usuario no encontrado

### **Tareas**
- `TASK_NOT_FOUND` - Tarea no encontrada
- `TASK_ACCESS_DENIED` - Sin permisos para acceder
- `TASK_INVALID_DATA` - Datos de tarea inválidos
- `TASK_TITLE_REQUIRED` - Título requerido

### **Sistema**
- `DATABASE_ERROR` - Error en base de datos
- `VALIDATION_ERROR` - Error de validación
- `INTERNAL_ERROR` - Error interno del servidor

---

## 📊 **Ejemplos de Uso con cURL**

### **Registro de Usuario**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### **Inicio de Sesión**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "password123"
  }'
```

### **Obtener Tareas**
```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Crear Tarea**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nueva tarea desde API",
    "description": "Creada con cURL",
    "priority": "high"
  }'
```

### **Actualizar Tarea**
```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

---

## 🔒 **Seguridad y Mejores Prácticas**

### **Rate Limiting**
- Las APIs tienen límite de requests por IP
- Máximo 100 requests por minuto para auth
- Máximo 1000 requests por minuto para tareas

### **Validación de Datos**
- Todos los inputs son validados en el servidor
- Sanitización de datos para prevenir XSS
- Validación de tipos y longitudes

### **Manejo de Errores**
- Nunca exponer información sensible en errores
- Logs detallados solo en servidor
- Respuestas consistentes para el cliente

### **CORS**
- Configurado para permitir solo dominios autorizados
- Headers de seguridad incluidos
- Credentials permitidos solo para dominios específicos

---

*Documentación de APIs actualizada al 31 de agosto de 2025*
*Versión: v1.0*
