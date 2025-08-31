# 🚀 TurifyTasks - Guía de Instalación y Despliegue

## 📋 **Requisitos Previos**

### **Software Necesario**
- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior
- **Git**: Para clonado del repositorio
- **Navegador moderno**: Chrome, Firefox, Safari, Edge

### **Herramientas de Desarrollo (Opcionales)**
- **VS Code**: Editor recomendado
- **Postman**: Para testing de APIs
- **Terminal**: Para comandos de desarrollo

## 🔧 **Instalación Local**

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/Turify-Tech/TurifyTasks.git
cd TurifyTasks
```

### **2. Configurar el Backend**
```bash
# Navegar al directorio del backend
cd backend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
```

### **3. Configurar Variables de Entorno**
Editar el archivo `.env` en la carpeta `backend/`:
```env
# Base de datos Turso
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# Puerto del servidor
PORT=3000

# Entorno
NODE_ENV=development
```

### **4. Configurar el Frontend**
```bash
# Abrir nueva terminal y navegar al frontend
cd ../frontend

# Instalar dependencias
npm install
```

### **5. Iniciar los Servidores**

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### **6. Verificar Instalación**

**Backend (Puerto 3000):**
```bash
curl http://localhost:3000/api/health
```
Respuesta esperada:
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "responseTime": "189ms",
    "type": "Turso SQLite"
  }
}
```

**Frontend (Puerto 4322):**
- Abrir navegador en `http://localhost:4322`
- Verificar que carga la página de inicio

## 🗄️ **Configuración de Base de Datos**

### **Opción A: Turso (Recomendado)**
1. Crear cuenta en [Turso](https://turso.tech)
2. Crear nueva base de datos
3. Obtener URL y token de autenticación
4. Configurar en archivo `.env`

### **Opción B: SQLite Local**
```bash
# En el directorio backend
touch database.sqlite
```
Modificar `db.js` para usar archivo local en lugar de Turso.

## 🔐 **Configuración de Autenticación**

### **JWT Secret**
Generar clave secreta segura:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Configuración CORS**
En `server.js`, ajustar CORS según entorno:
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://tu-dominio.com' 
    : 'http://localhost:4322',
  credentials: true
};
```

## 🚀 **Despliegue en Producción**

### **Backend - Opciones de Despliegue**

#### **Vercel**
1. Instalar Vercel CLI: `npm i -g vercel`
2. En directorio `backend/`: `vercel`
3. Configurar variables de entorno en dashboard de Vercel

#### **Railway**
1. Conectar repositorio en [Railway](https://railway.app)
2. Configurar variables de entorno
3. Deploy automático desde Git

#### **Heroku**
```bash
# Instalar Heroku CLI
heroku create tu-app-backend
heroku config:set JWT_SECRET=tu_jwt_secret
heroku config:set TURSO_DATABASE_URL=tu_turso_url
heroku config:set TURSO_AUTH_TOKEN=tu_turso_token
git push heroku main
```

### **Frontend - Opciones de Despliegue**

#### **Vercel (Recomendado para Astro)**
```bash
# En directorio frontend/
npm run build
vercel --prod
```

#### **Netlify**
```bash
npm run build
# Subir carpeta dist/ a Netlify
```

#### **GitHub Pages**
```bash
npm run build
# Configurar GitHub Pages para servir desde /dist
```

## 🔧 **Scripts de Desarrollo**

### **Backend**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint ."
  }
}
```

### **Frontend**
```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

## 🐛 **Solución de Problemas Comunes**

### **Error: Puerto en Uso**
```bash
# Encontrar proceso usando puerto 3000
lsof -i :3000
# Terminar proceso
kill -9 [PID]
```

### **Error: Base de Datos no Conecta**
1. Verificar variables de entorno
2. Comprobar URL y token de Turso
3. Revisar logs del servidor

### **Error: CORS**
1. Verificar configuración de CORS en backend
2. Asegurar que frontend esté en puerto correcto
3. Revisar headers de requests

### **Error: JWT Token**
1. Verificar JWT_SECRET en .env
2. Comprobar formato del token
3. Revisar expiración del token

## 📊 **Monitoreo y Logs**

### **Backend Logs**
```bash
# Logs en tiempo real
tail -f logs/app.log

# Logs de errores
tail -f logs/error.log
```

### **Health Check**
Endpoint para monitoreo:
```
GET /api/health
```

### **Métricas Importantes**
- Tiempo de respuesta de base de datos
- Número de usuarios conectados
- Errores de autenticación
- Tiempo de carga del frontend

## 🔐 **Seguridad en Producción**

### **Variables de Entorno**
- No commitear archivos `.env`
- Usar gestores de secretos en producción
- Rotar claves JWT regularmente

### **HTTPS**
- Configurar certificados SSL
- Forzar redirección HTTPS
- Actualizar CORS para HTTPS

### **Headers de Seguridad**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## 📝 **Checklist de Despliegue**

### **Pre-Despliegue**
- [ ] Variables de entorno configuradas
- [ ] Base de datos accesible
- [ ] Tests pasando
- [ ] Build exitoso
- [ ] URLs de producción actualizadas

### **Post-Despliegue**
- [ ] Health check funcionando
- [ ] Autenticación operativa
- [ ] CRUD de tareas funcional
- [ ] Frontend cargando correctamente
- [ ] Responsive design verificado

## 🚀 **Comandos Rápidos**

### **Desarrollo Local**
```bash
# Iniciar todo de una vez (requiere GNU parallel o similar)
parallel -j2 ::: "cd backend && npm start" "cd frontend && npm run dev"
```

### **Build de Producción**
```bash
# Backend
cd backend && npm install --production

# Frontend  
cd frontend && npm run build
```

### **Reset Completo**
```bash
# Limpiar node_modules y reinstalar
rm -rf backend/node_modules frontend/node_modules
cd backend && npm install
cd ../frontend && npm install
```

---

*Guía de instalación actualizada al 31 de agosto de 2025*
*Para soporte técnico, consultar la documentación del proyecto*
