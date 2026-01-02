# CitasPro - Documentación Completa del Proyecto

**Última actualización:** 2 de Enero de 2026  
**Versión:** 1.0.0  
**Cliente:** Serrano Marketing

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Configuración de Base de Datos](#configuración-de-base-de-datos)
6. [Variables de Entorno](#variables-de-entorno)
7. [Credenciales de Prueba](#credenciales-de-prueba)
8. [Diseño Visual (Blitzit Style)](#diseño-visual-blitzit-style)
9. [Problemas Resueltos](#problemas-resueltos)
10. [Estado Actual del Desarrollo](#estado-actual-del-desarrollo)
11. [Despliegue EasyPanel (desde Git)](#despliegue-easypanel-desde-git)
12. [Comandos Útiles](#comandos-útiles)
13. [Troubleshooting](#troubleshooting)
14. [Contexto para Continuación](#contexto-para-continuación)

---

## 📖 Descripción General

**CitasPro** es una plataforma SaaS multi-tenant para gestión de citas, diseñada para negocios que necesitan administrar:
- Citas y reservas
- Clientes
- Servicios
- Empleados
- Calendario
- Pagos

### Características Principales

- **Multi-tenant**: Cada negocio (tenant) tiene sus propios datos aislados
- **Roles de usuario**: SUPER_ADMIN, ADMIN, EMPLOYEE
- **Gestión completa de citas**: Crear, editar, confirmar, completar, cancelar
- **Calendario visual**: Vista de citas por día/semana/mes
- **Dashboard con estadísticas**: Gráficos de citas, ingresos, clientes
- **Notificaciones por email**: Confirmaciones, recordatorios, cancelaciones
- **Diseño moderno**: Estilo Blitzit (tema oscuro elegante)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│   PostgreSQL    │
│   (React/Vite)  │     │  (Express/Node) │     │   (Database)    │
│    Port 3000    │     │    Port 4000    │     │    Port 5432    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│     Nginx       │     │    MailHog      │
│  (Reverse Proxy)│     │  (Email Testing)│
│                 │     │    Port 8025    │
└─────────────────┘     └─────────────────┘
```

### Contenedores Docker (Desarrollo Local)

| Contenedor | Imagen | Puerto | Descripción |
|------------|--------|--------|-------------|
| citas_frontend | nginx:alpine | 3000 | Frontend React compilado |
| citas_backend | node:20-alpine | 4000 | API REST Express |
| citas_db | postgres:15-alpine | 5432 | Base de datos PostgreSQL |
| citas_mailhog | mailhog/mailhog | 8025 | Testing de emails |

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **React Router v6** - Navegación
- **TanStack Query (React Query)** - Manejo de estado del servidor
- **React Hook Form** - Formularios
- **Recharts** - Gráficos
- **date-fns** - Manejo de fechas
- **Headless UI** - Componentes accesibles
- **Heroicons** - Iconos
- **react-hot-toast** - Notificaciones

### Backend
- **Node.js 20** - Runtime
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **Prisma** - ORM
- **PostgreSQL 15** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas
- **Zod** - Validación de esquemas
- **Nodemailer** - Envío de emails
- **node-cron** - Tareas programadas

---

## 📁 Estructura del Proyecto

```
Gestión de Citas/
├── docker-compose.yml          # Contenedores (desarrollo local)
├── CITASPRO_DOCUMENTACION.md   # Este documento
│
├── backend/
│   ├── Dockerfile              # Build para EasyPanel
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.production.example # Plantilla producción
│   ├── prisma/
│   │   ├── schema.prisma       # Esquema de base de datos
│   │   └── seed.ts             # Datos iniciales
│   └── src/
│       ├── index.ts            # Entry point (health check: /api/health)
│       ├── config/
│       │   └── database.ts     # Conexión Prisma
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── appointments.controller.ts
│       │   ├── clients.controller.ts
│       │   ├── services.controller.ts
│       │   └── users.controller.ts
│       ├── middleware/
│       │   ├── auth.ts         # JWT middleware
│       │   └── errorHandler.ts
│       ├── routes/
│       │   └── index.ts        # Todas las rutas
│       ├── services/
│       │   ├── appointment.service.ts
│       │   ├── email.service.ts
│       │   └── webhook.service.ts
│       └── utils/
│           └── validators.ts   # Esquemas Zod
│
└── frontend/
    ├── Dockerfile              # Build para EasyPanel
    ├── nginx.conf              # Configuración Nginx
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js      # Configuración Tailwind (COLORES)
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── context/
        │   └── AuthContext.tsx
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx
        │   │   ├── Navbar.tsx
        │   │   ├── MainLayout.tsx
        │   │   └── AuthLayout.tsx
        │   └── appointments/
        │       ├── AppointmentModal.tsx
        │       └── AppointmentDetailModal.tsx
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.tsx
        │   │   └── RegisterPage.tsx
        │   ├── dashboard/
        │   │   └── DashboardPage.tsx
        │   ├── appointments/
        │   │   ├── AppointmentsPage.tsx
        │   │   └── AppointmentDetailPage.tsx
        │   ├── calendar/
        │   │   └── CalendarPage.tsx
        │   ├── clients/
        │   │   ├── ClientsPage.tsx
        │   │   └── ClientDetailPage.tsx
        │   ├── services/
        │   │   └── ServicesPage.tsx
        │   └── settings/
        │       └── SettingsPage.tsx
        ├── services/           # API calls
        │   ├── api.ts
        │   ├── auth.ts
        │   ├── appointments.ts
        │   ├── clients.ts
        │   └── dashboard.ts
        ├── styles/
        │   └── index.css       # CSS global (ESTILOS BLITZIT)
        └── types/
            └── index.ts        # Tipos TypeScript
```

---

## 🗄️ Configuración de Base de Datos

### Modelos Principales (Prisma Schema)

```prisma
// Tenant (Negocio)
model Tenant {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  email       String
  phone       String?
  logo        String?
  isActive    Boolean  @default(true)
}

// Usuario
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  firstName   String
  lastName    String
  role        UserRole @default(EMPLOYEE)
  tenantId    String
}

// Cliente
model Client {
  id          String   @id @default(uuid())
  firstName   String
  lastName    String
  email       String?
  phone       String
  tenantId    String
}

// Servicio
model Service {
  id          String   @id @default(uuid())
  name        String
  description String?
  duration    Int      // minutos
  price       Decimal
  color       String?
  tenantId    String
}

// Cita
model Appointment {
  id          String            @id @default(uuid())
  date        DateTime
  startTime   String            // "10:00"
  endTime     String            // "10:30"
  status      AppointmentStatus @default(PENDING)
  notes       String?
  clientId    String
  employeeId  String
  serviceId   String
  tenantId    String
}
```

### Enums Importantes

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  EMPLOYEE
}

enum AppointmentStatus {
  PENDING      // Pendiente
  CONFIRMED    // Confirmada
  IN_PROGRESS  // En curso
  COMPLETED    // Completada
  CANCELED     // Cancelada (UNA sola L - IMPORTANTE)
  NO_SHOW      // No se presentó
  RESCHEDULED  // Reagendada
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  VIP
  BLOCKED
}
```

---

## 🔐 Variables de Entorno

### Backend - Desarrollo (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/agenda

# JWT
JWT_SECRET=tu-super-secreto-jwt-key-cambiar-en-produccion
JWT_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# Email (desarrollo con MailHog)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@citaspro.com

# Frontend URL (para emails)
FRONTEND_URL=http://localhost:3000
```

### Backend - Producción (EasyPanel)
```env
# Database (PostgreSQL de EasyPanel)
DATABASE_URL=postgresql://postgres:[PASSWORD]@citaspro-db:5432/agenda

# JWT - CAMBIAR POR UN SECRETO LARGO Y SEGURO
JWT_SECRET=cambiar-por-un-secreto-muy-largo-y-seguro-de-al-menos-32-caracteres
JWT_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=production

# Email (ejemplo con SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx...
EMAIL_FROM=noreply@tudominio.com

# Frontend URL
FRONTEND_URL=https://app.tudominio.com
```

### Frontend (.env / variable de build en EasyPanel)
```env
VITE_API_URL=http://localhost:4000/api        # Desarrollo
VITE_API_URL=https://api.tudominio.com/api    # Producción
```

---

## 👤 Credenciales de Prueba

### Super Admin (creado en seed)
```
Email: marco@serrano.marketing
Password: Serrano602450*
Rol: SUPER_ADMIN
Tenant: Serrano Marketing
```

---

## 🎨 Diseño Visual (Blitzit Style)

El diseño sigue el estilo de https://www.blitzit.app/

### Paleta de Colores (tailwind.config.js)

```javascript
colors: {
  primary: {
    // Verde/Teal - Color principal para botones
    400: '#2dd4bf',
    500: '#10b981',  // Principal
    600: '#059669',
  },
  accent: {
    // Rosa/Fucsia - Para gradientes de texto
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
  },
  dark: {
    // Fondos oscuros
    700: '#1e293b',
    800: '#0f172a',
    900: '#0a0c10',
    950: '#050607',  // Más oscuro
  }
}
```

### Estilos CSS Clave (index.css)

```css
/* Títulos con gradiente rosa-púrpura + glow */
.gradient-text {
  background-image: linear-gradient(90deg, #ec4899 0%, #d946ef 40%, #a855f7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 30px rgba(236, 72, 153, 0.5));
}

/* Botones principales - Verde con texto oscuro */
.btn-primary {
  background-color: #10b981;
  color: #050607;
  font-weight: 600;
  border-radius: 9999px; /* rounded-full */
}
.btn-primary:hover {
  background-color: #34d399;
}

/* Cards con gradiente teal sutil */
.card {
  background: linear-gradient(145deg, 
    rgba(20, 184, 166, 0.08) 0%, 
    rgba(6, 182, 212, 0.03) 30%, 
    #0a0c10 100%
  );
  border: 1px solid #1e293b;
  border-radius: 1rem;
}
```

### Características Visuales
- **Fondo**: Negro puro (#050607)
- **Botones**: Verde sólido (#10b981), texto oscuro, redondeados (rounded-full)
- **Títulos**: Gradiente rosa→púrpura con efecto glow (drop-shadow)
- **Cards**: Gradiente sutil de turquesa/teal
- **Iconos en botones**: Texto oscuro sobre fondo verde

---

## 🔧 Problemas Resueltos

### 1. TypeError: T.map is not a function
**Problema**: La API devolvía objetos `{ clients: [], pagination: {} }` pero el frontend esperaba arrays directos.

**Solución**: Se agregó función `extractArray()` en los componentes:
```typescript
const extractArray = (data: any, key?: string): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (key && data[key] && Array.isArray(data[key])) return data[key];
  return [];
};
```

**Archivos afectados**: `AppointmentModal.tsx`, `appointments.ts`, `DashboardPage.tsx`, `ClientDetailPage.tsx`

### 2. RangeError: Invalid time value
**Problema**: Se intentaba formatear `appointment.startTime` ("10:00") como fecha.

**Solución**: Usar `appointment.date` para fechas y mostrar `startTime` directamente:
```typescript
// Antes (error)
format(new Date(appointment.startTime), 'HH:mm')

// Después (correcto)
{appointment.startTime}
```

**Archivos afectados**: `DashboardPage.tsx`, `AppointmentsPage.tsx`, `AppointmentDetailModal.tsx`, `AppointmentDetailPage.tsx`, `ClientDetailPage.tsx`

### 3. Validación de género (MALE vs male)
**Problema**: Frontend enviaba "MALE" pero validador esperaba "male".

**Solución**: Validador ahora transforma a minúsculas:
```typescript
// backend/src/utils/validators.ts
gender: z.string().optional().transform(val => val?.toLowerCase()),
```

### 4. Status CANCELLED vs CANCELED
**Problema**: Frontend usaba "CANCELLED" (doble L británico) pero Prisma usa "CANCELED" (una L americano).

**Solución**: Cambiar TODAS las referencias en frontend a "CANCELED":
- `types/index.ts`
- `DashboardPage.tsx`
- `CalendarPage.tsx`
- `AppointmentDetailModal.tsx`
- `AppointmentsPage.tsx`
- `AppointmentDetailPage.tsx`
- `ClientDetailPage.tsx`

### 5. Falta de botones de acción en citas
**Problema**: La página de detalle de cita no tenía botones para editar/cancelar/completar.

**Solución**: Se agregaron en `AppointmentDetailPage.tsx`:
- Barra de acciones con botones (Editar, Confirmar, Completar, No asistió, Cancelar)
- Modal de confirmación para cancelar
- Soporte de edición en `AppointmentModal` con prop `editAppointment`

---

## 📊 Estado Actual del Desarrollo

### ✅ Funcionalidades Completadas

| Módulo | Estado | Notas |
|--------|--------|-------|
| Autenticación | ✅ | Login, registro, JWT |
| Dashboard | ✅ | Estadísticas, gráficos |
| Calendario | ✅ | Vista mensual/semanal |
| Citas | ✅ | CRUD completo, cambio de estado |
| Clientes | ✅ | CRUD, historial de citas |
| Servicios | ✅ | CRUD, categorías |
| Empleados | ✅ | CRUD, horarios |
| Configuración | ✅ | Tenant, horarios, notificaciones |
| Diseño Blitzit | ✅ | Tema oscuro, gradientes, glow |

### 🔄 Pendiente / Mejoras Futuras

- [ ] Notificaciones push
- [ ] Recordatorios automáticos por WhatsApp
- [ ] Pagos online (Stripe/PayPal)
- [ ] App móvil
- [ ] Reportes exportables (PDF/Excel)
- [ ] Multi-idioma
- [ ] Integraciones (Google Calendar, Outlook)

---

## 🚀 Despliegue EasyPanel (desde Git)

### Flujo de Despliegue
1. Push a repositorio Git (GitHub/GitLab)
2. EasyPanel clona el repositorio
3. EasyPanel usa los Dockerfiles para construir las imágenes
4. Los servicios se despliegan automáticamente

### Paso 1: Preparar repositorio Git

```bash
# En la carpeta del proyecto
git init  # Si no existe
git add .
git commit -m "CitasPro v1.0 - Ready for EasyPanel"
git remote add origin https://github.com/tu-usuario/citaspro.git
git push -u origin main
```

### Paso 2: Crear PostgreSQL en EasyPanel

1. **Services** → **Create Service** → **Database** → **PostgreSQL**
2. Configurar:
   - **Name**: `citaspro-db`
   - **Database Name**: `agenda`
   - **Username**: `postgres`
   - **Password**: `[generar-password-seguro]` ← GUARDAR ESTO
3. Esperar a que inicie

**URL de conexión resultante:**
```
postgresql://postgres:[PASSWORD]@citaspro-db:5432/agenda
```

### Paso 3: Crear Backend en EasyPanel

1. **Services** → **Create Service** → **App**
2. Configurar:
   - **Name**: `citaspro-backend`
   - **Source**: GitHub/GitLab
   - **Repository**: tu-repo-url
   - **Branch**: `main`
   - **Build Path**: `backend` ← IMPORTANTE
3. **Variables de Entorno** (Environment Variables):
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@citaspro-db:5432/agenda
JWT_SECRET=cambiar-por-un-secreto-muy-largo-y-seguro-de-al-menos-32-caracteres
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=4000
SMTP_HOST=smtp.tuservidor.com
SMTP_PORT=587
SMTP_USER=tu-email
SMTP_PASS=tu-password
EMAIL_FROM=noreply@tudominio.com
FRONTEND_URL=https://app.tudominio.com
```
4. **Port**: `4000`
5. **Health Check Path**: `/api/health`
6. **Dominio**: `api.tudominio.com`

### Paso 4: Ejecutar Migraciones

Una vez el backend esté corriendo:
1. Ir a **citaspro-backend** → **Console**
2. Ejecutar:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### Paso 5: Crear Frontend en EasyPanel

1. **Services** → **Create Service** → **App**
2. Configurar:
   - **Name**: `citaspro-frontend`
   - **Source**: GitHub/GitLab
   - **Repository**: tu-repo-url
   - **Branch**: `main`
   - **Build Path**: `frontend` ← IMPORTANTE
3. **Variables de Entorno** (Build time):
```
VITE_API_URL=https://api.tudominio.com/api
```
4. **Port**: `80`
5. **Dominio**: `app.tudominio.com`

### Paso 6: Configurar Dominios SSL

1. Ir a cada servicio → **Domains**
2. Agregar dominio personalizado
3. EasyPanel genera certificados SSL automáticamente

### Checklist de Despliegue

- [ ] Código pusheado a Git
- [ ] PostgreSQL creado en EasyPanel
- [ ] Backend desplegado y corriendo
- [ ] Migraciones ejecutadas (`npx prisma migrate deploy`)
- [ ] Seed ejecutado (`npx prisma db seed`)
- [ ] Frontend desplegado
- [ ] Dominios configurados con SSL
- [ ] Login funciona correctamente

### Estructura de Repositorio Lista para EasyPanel

```
repositorio/
├── backend/
│   ├── Dockerfile          ← EasyPanel usa esto
│   ├── package.json
│   ├── prisma/
│   └── src/
│
├── frontend/
│   ├── Dockerfile          ← EasyPanel usa esto
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│
├── docker-compose.yml      # Solo para desarrollo local
└── CITASPRO_DOCUMENTACION.md
```

### Auto-Deploy (Opcional)

Para despliegue automático en cada push:
1. Ir a cada servicio → **Settings** → **Auto Deploy**
2. Habilitar **Auto Deploy on Push**
3. Cada push a `main` desplegará automáticamente

---

## 💻 Comandos Útiles

### Docker (Desarrollo Local)
```bash
# Iniciar todo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Reconstruir después de cambios
docker-compose build --no-cache
docker-compose up -d

# Ejecutar seed (primera vez)
docker exec -it citas_backend npx prisma db seed

# Entrar a un contenedor
docker exec -it citas_backend sh
docker exec -it citas_db psql -U postgres -d agenda
```

### Prisma (dentro del contenedor backend)
```bash
npx prisma generate          # Generar cliente
npx prisma migrate dev       # Migrar (desarrollo)
npx prisma migrate deploy    # Migrar (producción)
npx prisma studio            # Ver datos (GUI)
npx prisma db seed           # Seed
npx prisma migrate reset     # Reset completo
```

### URLs Locales
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- MailHog: http://localhost:8025

---

## 🆘 Troubleshooting

### Frontend no carga
1. Verificar contenedor: `docker ps`
2. Ver logs: `docker logs citas_frontend`
3. Reconstruir: `docker-compose build --no-cache frontend`

### Error de conexión a base de datos
1. Verificar que postgres esté healthy
2. Verificar DATABASE_URL
3. Reiniciar: `docker-compose restart postgres backend`

### Los cambios no se reflejan
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Error 401 Unauthorized
- El token JWT expiró - hacer login nuevamente
- Verificar que JWT_SECRET sea el mismo

### Backend no inicia en EasyPanel
1. Verificar logs
2. Verificar DATABASE_URL (formato correcto)
3. Asegurar que la BD esté corriendo primero

### Frontend muestra errores de API en EasyPanel
1. Verificar VITE_API_URL
2. Verificar CORS en backend
3. Verificar que el dominio del backend sea accesible

---

## 📝 Contexto para Continuación

### Archivos Críticos (NO modificar sin cuidado)
1. **tailwind.config.js** - Paleta de colores Blitzit
2. **index.css** - Estilos globales (.btn-primary, .card, .gradient-text)
3. **prisma/schema.prisma** - Estructura de BD
4. **docker-compose.yml** - Configuración de contenedores

### Convenciones de Código
- Componentes React: PascalCase (`DashboardPage.tsx`)
- Servicios/Utils: camelCase (`appointments.ts`)
- Estilos: Tailwind CSS classes
- Estado: TanStack Query para servidor, useState para UI

### API Response Format
```typescript
// Éxito simple
{ success: true, data: { ... } }

// Con paginación
{
  success: true,
  data: {
    clients: [ ... ],  // o appointments, services, etc.
    pagination: { page, limit, total, pages }
  }
}

// Error
{ success: false, message: "Error message" }
```

### Puntos Importantes para Retomar el Proyecto

1. **CANCELED tiene UNA sola L** - Prisma usa versión americana
2. **extractArray()** - Función helper para extraer arrays de respuestas API
3. **appointment.date** para fechas, **appointment.startTime** para hora (string)
4. **Diseño Blitzit**: verde (#10b981) para botones, rosa-púrpura para gradientes
5. **Backend health check**: GET `/api/health` devuelve status del servidor
6. **Multi-tenant**: Todo filtrado por `tenantId` automáticamente

### Si el Chat se Pierde

Este documento contiene TODO el contexto necesario para:
1. Entender la arquitectura completa
2. Conocer los problemas ya resueltos (no volver a caer en ellos)
3. Saber el estado actual del desarrollo
4. Desplegar en EasyPanel paso a paso
5. Continuar el desarrollo con las mismas convenciones

---

**Documento creado por GitHub Copilot**  
**Proyecto: CitasPro - Gestión de Citas**  
**Cliente: Serrano Marketing**
