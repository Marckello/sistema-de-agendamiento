# CitasPro - Documentación Completa del Proyecto

**Última actualización:** 3 de Enero de 2026  
**Versión:** 1.5.0  
**Cliente:** Serrano Marketing  
**Repositorio:** https://github.com/Marckello/sistema-de-agendamiento.git

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura Completa del Proyecto](#estructura-completa-del-proyecto)
5. [Rutas del Backend (API)](#rutas-del-backend-api)
6. [Páginas del Frontend](#páginas-del-frontend)
7. [Modelos de Base de Datos](#modelos-de-base-de-datos)
8. [Variables de Entorno](#variables-de-entorno)
9. [Seguridad y Autenticación](#seguridad-y-autenticación)
10. [Diseño Visual (Blitzit Style)](#diseño-visual-blitzit-style)
11. [Funcionalidad de IA](#funcionalidad-de-ia)
12. [Integración WhatsApp](#integración-whatsapp)
13. [Sistema de Permisos](#sistema-de-permisos)
14. [Sistema de Horarios Flexibles](#sistema-de-horarios-flexibles)
15. [Platform Admin vs Tenant Admin](#platform-admin-vs-tenant-admin)
16. [Despliegue en Producción](#despliegue-en-producción)
17. [Problemas Resueltos](#problemas-resueltos)
18. [Comandos Útiles](#comandos-útiles)
19. [Contexto para Continuación](#contexto-para-continuación)

---

## 📖 Descripción General

**CitasPro** es una plataforma SaaS multi-tenant para gestión de citas, diseñada para negocios que necesitan administrar:
- Citas y reservas
- Clientes
- Servicios con horarios específicos
- Empleados
- Calendario
- Asistente de IA

### Características Principales

- **Multi-tenant**: Cada negocio (tenant) tiene sus propios datos aislados
- **Roles de usuario**: SUPER_ADMIN, ADMIN, EMPLOYEE
- **Gestión completa de citas**: Crear, editar, confirmar, completar, cancelar
- **Calendario visual**: Vista de citas por día/semana/mes
- **Dashboard con estadísticas**: Gráficos de citas, ingresos, clientes
- **Asistente de IA**: Chat con OpenAI para gestión por lenguaje natural
- **Integración WhatsApp**: Recordatorios automáticos vía WhatsApp Web
- **Notificaciones por email**: Confirmaciones, recordatorios, cancelaciones
- **Diseño moderno**: Estilo Blitzit (tema oscuro elegante)
- **Verificación doble**: Email vía SMTP + SMS vía Firebase
- **Captcha Turnstile**: Protección anti-bots de Cloudflare en login
- **Platform Admin separado**: Panel de administración de la plataforma independiente

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│   PostgreSQL    │
│   (React/Vite)  │     │  (Express/Node) │     │   (Database)    │
│    Port 5173    │     │    Port 4000    │     │    Port 5432    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        │               │     OpenAI      │             │
        │               │   (gpt-4o-mini) │             │
        │               └─────────────────┘             │
        │                                               │
        ▼                                               │
┌─────────────────┐                                     │
│     Nginx       │                                     │
│  (Producción)   │                                     │
└─────────────────┘                                     │
```

### Contenedores Docker (Desarrollo Local)

| Contenedor | Imagen | Puerto | Descripción |
|------------|--------|--------|-------------|
| citas_db | postgres:16-alpine | 5432 | Base de datos PostgreSQL |
| citas_mailhog | mailhog/mailhog | 8025 | Testing de emails |

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18 | Framework UI |
| Vite | 5.4 | Build tool |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.x | Estilos utility-first |
| React Router | v6 | Navegación SPA |
| TanStack Query | 5.x | Estado del servidor |
| React Hook Form | 7.x | Formularios |
| Recharts | 2.x | Gráficos |
| date-fns | 3.x | Manejo de fechas |
| Headless UI | 2.x | Componentes accesibles |
| Heroicons | 2.x | Iconos |
| react-hot-toast | 2.x | Notificaciones toast |
| Firebase SDK | 10.x | Autenticación SMS |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | 20 | Runtime |
| Express | 4.x | Framework web |
| TypeScript | 5.x | Tipado estático |
| Prisma | 5.22 | ORM |
| PostgreSQL | 16 | Base de datos |
| JWT | - | Autenticación |
| bcryptjs | - | Hash de contraseñas |
| Zod | 3.x | Validación de esquemas |
| Nodemailer | 6.x | Envío de emails |
| OpenAI | 4.x | Asistente de IA |
| Firebase Admin | 12.x | Verificación SMS |
| Cloudflare Turnstile | - | Captcha anti-bots |

---

## 📁 Estructura Completa del Proyecto

```
e:\Gestión de Citas\
│
├── 📄 docker-compose.yml           # Contenedores desarrollo
├── 📄 docker-compose.prod.yml      # Contenedores producción
├── 📄 .env                         # Variables de entorno (GITIGNORED)
├── 📄 .env.production.example      # Plantilla producción
├── 📄 .gitignore
├── 📄 CITASPRO_DOCUMENTACION.md    # Este documento
├── 📄 EASYPANEL.md                 # Guía de despliegue
├── 📄 README.md
│
├── 📁 backend/
│   ├── 📄 Dockerfile
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 .env                     # Variables backend (GITIGNORED)
│   ├── 📄 .env.example
│   │
│   ├── 📁 prisma/
│   │   ├── 📄 schema.prisma        # ⭐ ESQUEMA DE BASE DE DATOS
│   │   ├── 📄 seed.ts              # Datos iniciales
│   │   └── 📁 migrations/          # Migraciones de BD
│   │
│   └── 📁 src/
│       ├── 📄 index.ts             # Entry point del servidor
│       │
│       ├── 📁 config/
│       │   └── 📄 database.ts      # Conexión Prisma
│       │
│       ├── 📁 controllers/
│       │   ├── 📄 auth.controller.ts
│       │   ├── 📄 appointments.controller.ts
│       │   ├── 📄 booking.controller.ts
│       │   ├── 📄 chat.controller.ts        # ⭐ IA CHAT
│       │   ├── 📄 clients.controller.ts
│       │   ├── 📄 dashboard.controller.ts
│       │   ├── 📄 public.controller.ts
│       │   ├── 📄 services.controller.ts
│       │   ├── 📄 settings.controller.ts
│       │   ├── 📄 users.controller.ts
│       │   └── 📄 index.ts
│       │
│       ├── 📁 middleware/
│       │   ├── 📄 auth.ts          # JWT middleware
│       │   └── 📄 errorHandler.ts
│       │
│       ├── 📁 routes/
│       │   ├── 📄 auth.routes.ts
│       │   ├── 📄 appointments.routes.ts
│       │   ├── 📄 booking.routes.ts
│       │   ├── 📄 chat.routes.ts           # ⭐ IA ROUTES
│       │   ├── 📄 clients.routes.ts
│       │   ├── 📄 dashboard.routes.ts
│       │   ├── 📄 public.routes.ts
│       │   ├── 📄 services.routes.ts
│       │   ├── 📄 settings.routes.ts
│       │   ├── 📄 users.routes.ts
│       │   ├── 📄 whatsapp.routes.ts       # 📱 WHATSAPP ROUTES
│       │   └── 📄 index.ts         # ⭐ REGISTRO DE TODAS LAS RUTAS
│       │
│       ├── 📁 services/
│       │   ├── 📄 ai.service.ts            # ⭐ LÓGICA OPENAI
│       │   ├── 📄 appointment.service.ts   # Slots y disponibilidad
│       │   ├── 📄 auth.service.ts
│       │   ├── 📄 email.service.ts
│       │   ├── 📄 turnstile.service.ts     # 🔒 CLOUDFLARE TURNSTILE
│       │   ├── 📄 webhook.service.ts
│       │   ├── 📄 whatsapp.service.ts      # 📱 WHATSAPP SERVICE
│       │   ├── 📄 reminder.scheduler.ts    # 📱 SCHEDULER RECORDATORIOS
│       │   └── 📄 index.ts
│       │
│       └── 📁 utils/
│           └── 📄 validators.ts    # Esquemas Zod
│
└── 📁 frontend/
    ├── 📄 Dockerfile
    ├── 📄 nginx.conf               # Config Nginx producción
    ├── 📄 package.json
    ├── 📄 tsconfig.json
    ├── 📄 tailwind.config.js       # ⭐ PALETA DE COLORES
    ├── 📄 vite.config.ts
    ├── 📄 index.html
    │
    └── 📁 src/
        ├── 📄 main.tsx
        ├── 📄 App.tsx              # Rutas React Router
        │
        ├── 📁 context/
        │   └── 📄 AuthContext.tsx  # ⭐ CONTEXTO DE AUTH
        │
        ├── 📁 styles/
        │   └── 📄 index.css        # ⭐ ESTILOS GLOBALES BLITZIT
        │
        ├── 📁 types/
        │   └── 📄 index.ts         # ⭐ TIPOS TYPESCRIPT
        │
        ├── 📁 services/            # Clientes API
        │   ├── 📄 api.ts           # Axios instance
        │   ├── 📄 appointments.ts
        │   ├── 📄 chat.ts          # ⭐ CLIENTE IA
        │   ├── 📄 clients.ts
        │   ├── 📄 dashboard.ts
        │   ├── 📄 services.ts
        │   ├── 📄 settings.ts
        │   └── 📄 users.ts
        │
        ├── 📁 components/
        │   ├── 📁 common/
        │   │   └── 📄 ...
        │   ├── 📁 layout/
        │   │   ├── 📄 MainLayout.tsx       # Layout principal
        │   │   ├── 📄 AuthLayout.tsx
        │   │   ├── 📄 AdminLayout.tsx      # Layout Panel Admin
        │   │   ├── 📄 Sidebar.tsx
        │   │   └── 📄 Navbar.tsx
        │   ├── 📁 appointments/
        │   │   ├── 📄 AppointmentModal.tsx
        │   │   └── 📄 AppointmentDetailModal.tsx
        │   ├── 📁 chat/
        │   │   └── 📄 AIChat.tsx           # ⭐ CHAT FLOTANTE IA
        │   └── 📄 Turnstile.tsx            # 🔒 CLOUDFLARE TURNSTILE
        │
        └── 📁 pages/
            ├── 📁 auth/
            │   ├── 📄 LoginPage.tsx        # Con Turnstile
            │   └── 📄 RegisterPage.tsx     # Con verificación Email + SMS
            ├── 📁 admin/
            │   ├── 📄 AdminLoginPage.tsx   # 🔒 LOGIN PLATFORM ADMIN
            │   ├── 📄 AdminDashboard.tsx
            │   ├── 📄 TenantsManagement.tsx
            │   ├── 📄 PlansManagement.tsx
            │   ├── 📄 ActivityPage.tsx
            │   └── 📄 PlatformSettings.tsx
            ├── 📁 dashboard/
            │   └── 📄 DashboardPage.tsx
            ├── 📁 calendar/
            │   └── 📄 CalendarPage.tsx
            ├── 📁 appointments/
            │   ├── 📄 AppointmentsPage.tsx
            │   └── 📄 AppointmentDetailPage.tsx
            ├── 📁 clients/
            │   ├── 📄 ClientsPage.tsx
            │   └── 📄 ClientDetailPage.tsx
            ├── 📁 services/
            │   └── 📄 ServicesPage.tsx     # ⭐ MODAL 3 PESTAÑAS
            ├── 📁 users/
            │   └── 📄 UsersPage.tsx        # ⭐ INCLUYE PERMISOS IA
            ├── 📁 settings/
            │   └── 📄 SettingsPage.tsx
            ├── 📁 profile/
            │   └── 📄 ProfilePage.tsx
            └── 📁 booking/
                └── 📄 BookingPage.tsx
```

---

## 🔗 Rutas del Backend (API)

### Base URL
- **Desarrollo:** `http://localhost:4000/api`
- **Producción:** `https://api.tudominio.com/api`

### Autenticación (`/api/auth`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Iniciar sesión | No |
| POST | `/auth/register` | Registrar tenant | No |
| POST | `/auth/refresh` | Refrescar token | No |
| POST | `/auth/logout` | Cerrar sesión | Sí |
| GET | `/auth/me` | Usuario actual | Sí |

### Citas (`/api/appointments`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/appointments` | Listar citas | Sí |
| GET | `/appointments/:id` | Detalle de cita | Sí |
| POST | `/appointments` | Crear cita | Sí |
| PUT | `/appointments/:id` | Actualizar cita | Sí |
| DELETE | `/appointments/:id` | Eliminar cita | Sí |
| PATCH | `/appointments/:id/status` | Cambiar estado | Sí |
| GET | `/appointments/available-slots` | Horarios disponibles | Sí |

### Clientes (`/api/clients`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/clients` | Listar clientes | Sí |
| GET | `/clients/:id` | Detalle de cliente | Sí |
| POST | `/clients` | Crear cliente | Sí |
| PUT | `/clients/:id` | Actualizar cliente | Sí |
| DELETE | `/clients/:id` | Eliminar cliente | Sí |

### Servicios (`/api/services`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/services` | Listar servicios | Sí |
| GET | `/services/:id` | Detalle de servicio | Sí |
| POST | `/services` | Crear servicio | Sí |
| PUT | `/services/:id` | Actualizar servicio | Sí |
| DELETE | `/services/:id` | Eliminar servicio | Sí |
| GET | `/services/categories` | Listar categorías | Sí |
| POST | `/services/categories` | Crear categoría | Sí |

### Usuarios (`/api/users`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/users` | Listar usuarios | Sí |
| GET | `/users/:id` | Detalle de usuario | Sí |
| POST | `/users` | Crear usuario | Sí |
| PUT | `/users/:id` | Actualizar usuario | Sí |
| DELETE | `/users/:id` | Eliminar usuario | Sí |

### Configuración (`/api/settings`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/settings/tenant` | Config del tenant | Sí |
| PUT | `/settings/tenant` | Actualizar tenant | Sí |
| GET | `/settings/work-schedule` | Horarios del negocio | Sí |
| PUT | `/settings/work-schedule` | Actualizar horarios | Sí |

### Dashboard (`/api/dashboard`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/dashboard/stats` | Estadísticas | Sí |
| GET | `/dashboard/appointments/today` | Citas de hoy | Sí |

### Chat IA (`/api/chat`) ⭐ NUEVO
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/chat` | Enviar mensaje | Sí + canUseAI |
| POST | `/chat/execute` | Ejecutar acción | Sí + canUseAI |
| GET | `/chat/access` | Verificar acceso IA | Sí |

### Health Check
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/health` | Estado del servidor | No |

---

## 📄 Páginas del Frontend

### Rutas de la Aplicación

| Ruta | Componente | Descripción | Protegida |
|------|------------|-------------|-----------|
| `/login` | LoginPage | Inicio de sesión | No |
| `/register` | RegisterPage | Registro de tenant | No |
| `/` | DashboardPage | Panel principal | Sí |
| `/calendar` | CalendarPage | Vista calendario | Sí |
| `/appointments` | AppointmentsPage | Lista de citas | Sí |
| `/appointments/:id` | AppointmentDetailPage | Detalle de cita | Sí |
| `/clients` | ClientsPage | Lista de clientes | Sí |
| `/clients/:id` | ClientDetailPage | Detalle de cliente | Sí |
| `/services` | ServicesPage | Servicios y categorías | Sí |
| `/users` | UsersPage | Empleados | Sí |
| `/settings` | SettingsPage | Configuración | Sí |
| `/profile` | ProfilePage | Perfil de usuario | Sí |
| `/booking/:slug` | BookingPage | Página pública de reserva | No |

---

## 🗄️ Modelos de Base de Datos

### Modelo User (Con Permisos)
```prisma
model User {
  id        String  @id @default(uuid())
  tenantId  String
  email     String
  password  String
  firstName String
  lastName  String
  phone     String?
  avatar    String?
  
  role      UserRole @default(EMPLOYEE)
  
  // ⭐ PERMISOS
  canModify Boolean @default(true)   // Puede modificar registros
  canDelete Boolean @default(false)  // Puede eliminar registros
  canUseAI  Boolean @default(false)  // Acceso al asistente IA
  
  title     String?   // "Dr.", "Lic.", etc.
  specialty String?
  bio       String?
  color     String  @default("#3B82F6")
  
  emailNotifications Boolean @default(true)
  pushNotifications  Boolean @default(true)
  theme              String  @default("system")
  
  isActive  Boolean  @default(true)
  lastLogin DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([tenantId, email])
  @@map("users")
}
```

### Modelo Service (Con Horarios)
```prisma
model Service {
  id          String   @id @default(uuid())
  tenantId    String
  categoryId  String?
  name        String
  description String?
  duration    Int      // minutos
  bufferTime  Int      @default(0)
  price       Decimal  @db.Decimal(10, 2)
  color       String   @default("#10B981")
  isActive    Boolean  @default(true)
  
  // Relaciones
  employees   UserService[]
  schedules   ServiceSchedule[]
  
  @@unique([tenantId, name])
  @@map("services")
}

model ServiceSchedule {
  id          String  @id @default(uuid())
  serviceId   String
  dayOfWeek   Int     // 0=Dom, 1=Lun, ..., 6=Sab
  isAvailable Boolean @default(true)
  startTime   String  // "09:00"
  endTime     String  // "18:00"
  
  @@unique([serviceId, dayOfWeek])
  @@map("service_schedules")
}
```

### Modelo Appointment
```prisma
model Appointment {
  id          String            @id @default(uuid())
  tenantId    String
  clientId    String
  employeeId  String
  serviceId   String
  
  date        DateTime
  startTime   String            // "10:00"
  endTime     String            // "10:30"
  duration    Int               // minutos
  price       Decimal           @db.Decimal(10, 2)
  
  status      AppointmentStatus @default(PENDING)
  notes       String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("appointments")
}

enum AppointmentStatus {
  PENDING       // Pendiente
  CONFIRMED     // Confirmada
  IN_PROGRESS   // En curso
  COMPLETED     // Completada
  CANCELED      // Cancelada (⚠️ UNA sola L)
  NO_SHOW       // No se presentó
  RESCHEDULED   // Reagendada
}
```

### Modelo WorkSchedule (Horarios)
```prisma
model WorkSchedule {
  id          String  @id @default(uuid())
  tenantId    String
  userId      String? // null = horario del negocio
  dayOfWeek   Int     // 0-6
  isWorking   Boolean @default(true)
  startTime   String  // "09:00"
  endTime     String  // "18:00"
  breakStart  String? // "13:00"
  breakEnd    String? // "14:00"
  
  @@unique([tenantId, userId, dayOfWeek])
  @@map("work_schedules")
}
```

---

## 🔐 Variables de Entorno

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/agenda

# JWT
JWT_ACCESS_SECRET=tu-super-secreto-access-key-cambiar-en-produccion
JWT_REFRESH_SECRET=tu-super-secreto-refresh-key-cambiar-en-produccion

# Server
PORT=4000
NODE_ENV=development

# Email (desarrollo con MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@citaspro.com

# Frontend URL (para emails)
FRONTEND_URL=http://localhost:5173

# ⭐ OpenAI (para asistente IA)
OPENAI_API_KEY=sk-proj-...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
```

### Raíz del Proyecto (.env)
```env
# Para docker-compose
OPENAI_API_KEY=sk-proj-... (configurar en .env)
```

---

## 👤 Credenciales de Prueba

```
Las credenciales de prueba se configuran en el archivo .env local.
No se incluyen en el repositorio por seguridad.
Ver backend/.env.example para la estructura.
```

---

## 🎨 Diseño Visual (Blitzit Style)

### Paleta de Colores (tailwind.config.js)

```javascript
colors: {
  primary: {
    400: '#2dd4bf',
    500: '#10b981',  // Verde principal
    600: '#059669',
  },
  accent: {
    400: '#e879f9',
    500: '#d946ef',  // Rosa/Fucsia
    600: '#c026d3',
  },
  dark: {
    700: '#1e293b',
    800: '#0f172a',
    900: '#0a0c10',
    950: '#050607',  // Negro puro
  }
}
```

### Clases CSS Importantes (index.css)

```css
/* Títulos con gradiente rosa-púrpura + glow */
.gradient-text {
  background-image: linear-gradient(90deg, #ec4899 0%, #d946ef 40%, #a855f7 100%);
  -webkit-background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 30px rgba(236, 72, 153, 0.5));
}

/* Botones principales */
.btn-primary {
  background-color: #10b981;
  color: #050607;
  font-weight: 600;
  border-radius: 9999px;
}

/* Cards con gradiente teal */
.card {
  background: linear-gradient(145deg, 
    rgba(20, 184, 166, 0.08) 0%, 
    rgba(6, 182, 212, 0.03) 30%, 
    #0a0c10 100%
  );
  border: 1px solid #1e293b;
}
```

---

## 🤖 Funcionalidad de IA

### Descripción
Chat flotante integrado en el dashboard que permite gestionar citas mediante lenguaje natural usando OpenAI GPT-4o-mini.

### Archivos Principales

| Archivo | Descripción |
|---------|-------------|
| `backend/src/services/ai.service.ts` | Lógica de OpenAI con lazy initialization |
| `backend/src/controllers/chat.controller.ts` | Endpoints del chat |
| `backend/src/routes/chat.routes.ts` | Rutas /api/chat |
| `frontend/src/services/chat.ts` | Cliente API |
| `frontend/src/components/chat/AIChat.tsx` | Componente flotante |

### Capacidades del Asistente
- ✅ Consultar citas de hoy/mañana/fecha específica
- ✅ Crear nuevas citas (con confirmación)
- ✅ Cancelar citas existentes (con confirmación)
- ✅ Reagendar citas (con confirmación)
- ✅ Buscar clientes y servicios
- ✅ Contexto según rol (SUPER_ADMIN ve todo, empleados solo sus citas)

### Lazy Initialization (Importante)
El cliente OpenAI se inicializa de forma perezosa para evitar crashes si no hay API key:

```typescript
// ai.service.ts
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no configurada');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}
```

---

## � Integración WhatsApp

### Descripción
Integración con WhatsApp Web usando la librería `whatsapp-web.js` para enviar recordatorios automáticos de citas a los clientes. Incluye sistema anti-ban y conexión por QR.

### Archivos Principales

| Archivo | Descripción |
|---------|-------------|
| `backend/src/services/whatsapp.service.ts` | Servicio principal de WhatsApp |
| `backend/src/services/reminder.scheduler.ts` | Scheduler de recordatorios automáticos |
| `backend/src/controllers/whatsapp.controller.ts` | Endpoints de WhatsApp |
| `backend/src/routes/whatsapp.routes.ts` | Rutas /api/whatsapp |
| `frontend/src/services/whatsapp.ts` | Cliente API |
| `frontend/src/components/settings/WhatsAppSettings.tsx` | UI de configuración |

### Características Anti-Ban

| Característica | Configuración | Descripción |
|----------------|---------------|-------------|
| **Delay entre mensajes** | 3-8 segundos | Tiempo aleatorio entre envíos |
| **Simulación de escritura** | 1.5-4 segundos | Muestra "typing..." antes de enviar |
| **Límite diario** | 50 mensajes | Máximo mensajes por día |
| **Burst control** | 5 mensajes + 1 min cooldown | Evita ráfagas |
| **Horario de operación** | 8:00 - 20:00 | No envía fuera de horario |
| **Auto-connect/disconnect** | Configurable | Conecta y desconecta automáticamente |

### Modelos de Base de Datos

```prisma
model WhatsAppSession {
  id        String @id @default(uuid())
  tenantId  String @unique
  
  status      WhatsAppStatus @default(DISCONNECTED)
  phone       String?
  pushName    String?
  sessionData Json?
  
  // Anti-ban
  dailyMessageCount  Int @default(0)
  lastMessageAt      DateTime?
  dailyLimitReached  Boolean @default(false)
  
  // Auto-connect
  autoConnectEnabled Boolean @default(false)
  connectAt          String? // "08:00"
  disconnectAt       String? // "20:00"
  
  // Recordatorios
  reminderEnabled    Boolean @default(true)
  reminder24hEnabled Boolean @default(true)
  reminder1hEnabled  Boolean @default(true)
  reminderMessage24h String
  reminderMessage1h  String
  
  // Estadísticas
  totalMessagesSent     Int @default(0)
  totalMessagesReceived Int @default(0)
}

enum WhatsAppStatus {
  DISCONNECTED
  CONNECTING
  QR_READY
  AUTHENTICATED
  CONNECTED
  SLEEPING
}
```

### Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/whatsapp/connect` | Iniciar conexión (genera QR) |
| GET | `/api/whatsapp/status` | Obtener estado actual |
| GET | `/api/whatsapp/qr` | Obtener QR code |
| POST | `/api/whatsapp/disconnect` | Desconectar |
| GET | `/api/whatsapp/config` | Obtener configuración |
| PUT | `/api/whatsapp/config` | Actualizar configuración |
| POST | `/api/whatsapp/send-test` | Enviar mensaje de prueba |
| POST | `/api/whatsapp/send-reminder/:id` | Enviar recordatorio manual |
| GET | `/api/whatsapp/logs` | Historial de mensajes |

### Configuración desde UI

1. Ir a **Configuración → WhatsApp**
2. Click en **"Conectar WhatsApp"**
3. Escanear QR con WhatsApp del teléfono
4. Configurar:
   - Horario de auto-conexión
   - Mensajes de recordatorio (24h y 1h)
   - Respuesta automática

### Variables de Mensaje

| Variable | Descripción |
|----------|-------------|
| `{clientName}` | Nombre del cliente |
| `{serviceName}` | Nombre del servicio |
| `{time}` | Hora de la cita |
| `{date}` | Fecha de la cita |

### Scheduler de Recordatorios

El scheduler (`reminder.scheduler.ts`) ejecuta:
- **Cada 15 minutos**: Verifica citas que necesitan recordatorio
- **A medianoche**: Resetea contadores diarios de mensajes
- **Cada 5 minutos**: Verifica auto-conexión de sesiones

### Dependencias

```json
{
  "whatsapp-web.js": "^1.26.0",
  "qrcode": "^1.5.4",
  "node-cron": "^3.0.3"
}
```

---

## �🔒 Sistema de Permisos

### Campos de Usuario

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `canModify` | Boolean | true | Puede editar registros |
| `canDelete` | Boolean | false | Puede eliminar registros |
| `canUseAI` | Boolean | false | Acceso al asistente IA |

### Gestión desde UI
En **Usuarios** → **Crear/Editar Usuario** → Sección "Permisos":
- ☑️ Puede modificar registros
- ☑️ Puede eliminar registros
- ✨ Acceso al asistente de IA (checkbox púrpura)

### Activar IA por SQL (Emergencia)
```sql
UPDATE users SET "canUseAI" = true WHERE email = 'usuario@email.com';
```

---

## ⏰ Sistema de Horarios Flexibles

### Tipos de Horario

1. **Horario del Negocio** (`WorkSchedule` con `userId = null`)
   - Define el horario comercial general
   - Se configura en Configuración → Horarios

2. **Horario del Empleado** (`WorkSchedule` con `userId = [id]`)
   - Define disponibilidad específica del empleado
   - Se configura en Usuarios → Editar → Horarios

3. **Horario del Servicio** (`ServiceSchedule`)
   - Define días/horas en que un servicio está disponible
   - Se configura en Servicios → Editar → Pestaña "Horarios"

### Lógica de Disponibilidad (appointment.service.ts)

| Situación | Resultado | Color |
|-----------|-----------|-------|
| Dentro horario local + empleado disponible | ✅ Disponible | Verde |
| Dentro horario local + empleado sin horario | ⚠️ Warning | Amarillo |
| Fuera horario local | ⚠️ Warning | Amarillo |
| Cita ya existente | ❌ No disponible | Gris |

---

## � Platform Admin vs Tenant Admin

### Diferencia Crítica

| Aspecto | Platform Admin | Tenant SUPER_ADMIN |
|---------|----------------|-------------------|
| **Entidad** | `PlatformAdmin` (tabla separada) | `User` con role SUPER_ADMIN |
| **Acceso** | Panel de administración de la plataforma | Dashboard de su negocio |
| **Login URL** | `/control/acceso` (oculta) | `/login` |
| **Puede ver** | Todos los tenants, planes, estadísticas globales | Solo su tenant |
| **JWT Flag** | `isPlatformAdmin: true` | `role: SUPER_ADMIN` |

### Ruta de Acceso Platform Admin (SEGURIDAD)
```
https://citas.serrano.marketing/control/acceso
```
⚠️ **Esta ruta NO está visible en ningún menú ni enlace. Solo el admin la conoce.**

### Modelo PlatformAdmin
```prisma
model PlatformAdmin {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("platform_admins")
}
```

### Script de Creación de Platform Admin
```bash
# En backend/scripts/create-platform-admin.ts
cd backend
$env:DATABASE_URL='postgres://postgres:PASSWORD@HOST:5432/agenda?sslmode=disable'
npx tsx scripts/create-platform-admin.ts
```

### Archivos Clave
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/pages/admin/AdminLoginPage.tsx` | Página de login exclusiva |
| `frontend/src/App.tsx` | Ruta `/control/acceso` |
| `backend/src/controllers/auth.controller.ts` | `loginAdmin()` |
| `backend/src/middleware/auth.ts` | `authenticatePlatformAdmin` |

---

## 🔒 Seguridad y Autenticación

### Sistema de Verificación en Registro

El registro de nuevos tenants requiere verificación doble:

1. **Verificación de Email** (vía SMTP)
   - Se envía código de 6 dígitos al correo
   - Servidor SMTP: `mail.serrano.marketing:465`
   - Expira en 10 minutos

2. **Verificación de Teléfono** (vía Firebase SMS)
   - Selector de país con 15 opciones (MX, US, ES, etc.)
   - Validación de 10 dígitos
   - Firebase Project: `citaspro-58dd6`
   - Verificación SMS obligatoria

### Cloudflare Turnstile (Captcha)

Protección anti-bots en ambos logins:

| Login | Ruta | Turnstile |
|-------|------|-----------|
| Usuarios/Tenants | `/login` | ✅ Sí |
| Platform Admin | `/control/acceso` | ✅ Sí |

**Configuración:**
```env
# Backend
TURNSTILE_SECRET_KEY=0x4AAAAAACKYtsVXKro5PEmPcGpB38un5Jw

# Frontend
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACKYtozYHP7m7Ixz
```

### Archivos de Turnstile
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/components/Turnstile.tsx` | Widget de Cloudflare |
| `backend/src/services/turnstile.service.ts` | Validación server-side |
| `backend/src/config/index.ts` | Config `turnstile.secretKey` |

### Firebase Configuration
```typescript
// frontend/src/config/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyDTvI29IbiY7mKFEe89YthlOREtcReDjh4",
  authDomain: "citaspro-58dd6.firebaseapp.com",
  projectId: "citaspro-58dd6",
  storageBucket: "citaspro-58dd6.firebasestorage.app",
  messagingSenderId: "685046800124",
  appId: "1:685046800124:web:9c7911fe8ed86255a28179"
};
```

---

## �🔧 Problemas Resueltos

### 1. Backend crash sin API key de OpenAI
**Problema**: OpenAI client se inicializaba al cargar el módulo, crasheando si no había API key.
**Solución**: Lazy initialization con función `getOpenAI()`.

### 2. CANCELED vs CANCELLED
**Problema**: Frontend usaba "CANCELLED" (doble L) pero Prisma usa "CANCELED" (una L).
**Solución**: Cambiar TODAS las referencias a "CANCELED".

### 3. TypeError: T.map is not a function
**Problema**: API devolvía `{ clients: [], pagination: {} }` pero frontend esperaba array.
**Solución**: Función `extractArray()` para extraer arrays de respuestas.

### 4. Slots de hora no aparecían
**Problema**: Frontend usaba `slot.start` pero backend devuelve `slot.time`.
**Solución**: Actualizar interface `TimeSlot` a `{ time, available, warning? }`.

### 5. Campos de permisos no existían
**Problema**: `canModify` y `canDelete` faltaban en el modelo User.
**Solución**: Agregados a schema.prisma y migración aplicada.

### 6. Error 400 al crear servicios
**Problema**: Los campos `maxAdvanceBooking` y `minAdvanceBooking` se enviaban al backend pero no existen en el schema de Prisma.
**Solución**: Extraer estos campos del objeto antes de pasarlo a Prisma create/update en `services.controller.ts`.

### 7. Slots de citas no aparecían en el modal
**Problema**: El frontend leía `slotsData.data` (un objeto) en lugar de `slotsData.data.slots` (el array de slots).
**Solución**: Corregir el tipo de respuesta en `appointments.ts` y la extracción en `AppointmentModal.tsx`.

### 8. Formulario de edición de usuarios no cargaba datos
**Problema**: `useForm` con `defaultValues` solo se evalúa en el primer render, no cuando cambia el usuario seleccionado.
**Solución**: Agregar `useEffect` con `reset()` para cargar los datos cuando cambia la prop del usuario.

### 9. Error 404 en rutas de configuración
**Problema**: El frontend llamaba a `/settings/general`, `/settings/branding`, etc., pero el backend solo tenía `PUT /settings/`.
**Solución**: Agregar rutas específicas en `settings.routes.ts`: `/general`, `/branding`, `/booking`, `/notifications`.

### 10. Datos de configuración no persistían en el formulario
**Problema**: Igual que usuarios, los componentes de configuración no cargaban los datos existentes.
**Solución**: Agregar `useEffect` con `reset()` a GeneralSettings, BrandingSettings, BookingSettings y NotificationSettings.

### 11. Subida de logo como archivo
**Problema**: El logo se configuraba como URL pero se necesitaba subir archivos.
**Solución**: 
- Agregar endpoint `POST /settings/logo` con multer
- Validar solo PNG/JPG, máximo 2MB
- Convertir a Base64 data URL para almacenar
- UI de upload con preview en BrandingSettings

### 12. Logo no se mostraba en el Sidebar
**Problema**: El Sidebar usaba un logo estático en lugar del logo del tenant.
**Solución**: Agregar query para obtener settings del tenant y mostrar logo/nombre dinámicamente.

---

## 💻 Comandos Útiles

### Desarrollo Local
```bash
# Backend
cd backend
npm run dev          # Servidor desarrollo con tsx watch

# Frontend
cd frontend
npm run dev          # Vite dev server

# Base de datos
docker start citas_db    # Iniciar PostgreSQL
```

### Prisma
```bash
cd backend
npx prisma generate           # Generar cliente
npx prisma migrate dev        # Migrar desarrollo
npx prisma migrate deploy     # Migrar producción
npx prisma studio             # GUI para ver datos
npx prisma db seed            # Ejecutar seed
npx prisma migrate reset      # Reset completo (¡BORRA TODO!)
```

### Docker
```bash
docker-compose up -d          # Iniciar contenedores
docker-compose logs -f        # Ver logs
docker exec -it citas_db psql -U postgres -d agenda  # SQL directo
```

### Git
```bash
git add .
git commit -m "descripción"
git push origin main
```

### URLs Locales
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000/api |
| Health Check | http://localhost:4000/api/health |
| MailHog | http://localhost:8025 |

---

## 🚀 Despliegue en Producción

### URLs de Producción (Activas)
| Servicio | URL |
|----------|-----|
| Frontend | https://citas.serrano.marketing |
| Backend API | https://api.citas.serrano.marketing |
| Platform Admin | https://citas.serrano.marketing/control/acceso |
| EasyPanel | https://panel.serrano.marketing |

### Infraestructura EasyPanel
| Servicio | Tipo | Puerto |
|----------|------|--------|
| agenda (frontend) | App GitHub | 80 |
| agendamiento (backend) | App GitHub | 4000 |
| citas (PostgreSQL) | Database | 5432 |

### Base de Datos Producción
```
Host externo: panel.serrano.marketing
Host interno: agenda_citas (para apps en EasyPanel)
Puerto: 5432
Usuario: postgres
Base de datos: agenda
```

### Variables de Entorno Producción (Backend)
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://postgres:PASSWORD@agenda_citas:5432/agenda?schema=public
JWT_ACCESS_SECRET=tu-secret-aqui-genera-uno
JWT_REFRESH_SECRET=tu-secret-aqui-genera-otro
SMTP_HOST=mail.serrano.marketing
SMTP_PORT=465
SMTP_USER=hola@serrano.marketing
SMTP_PASS=SerranoMail2025*
SMTP_FROM_NAME=CitasPro
SMTP_FROM_EMAIL=hola@serrano.marketing
OPENAI_API_KEY=sk-proj-...
TURNSTILE_SECRET_KEY=0x4AAAAAACKYtsVXKro5PEmPcGpB38un5Jw
CORS_ORIGINS=https://citas.serrano.marketing
```

### Variables de Entorno Producción (Frontend)
```env
VITE_API_URL=https://api.citas.serrano.marketing/api
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACKYtozYHP7m7Ixz
```

### Proceso de Deploy
1. **Push a GitHub**: `git push origin main`
2. **En EasyPanel**: Click "Implementar" en cada servicio
3. **Esperar build**: Frontend ~2min, Backend ~3min
4. **Verificar**: https://api.citas.serrano.marketing/api/health

### Archivo Dockerfile (Backend)
El Dockerfile del backend incluye:
- Chromium para Puppeteer (WhatsApp)
- OpenSSL para Prisma
- Build multi-stage (builder + production)

### Credenciales Privadas
Ver archivo `.credentials-private.md` (NO en GitHub, en .gitignore)

---

## 📝 Contexto para Continuación

### Archivos Críticos (NO modificar sin cuidado)
1. `tailwind.config.js` - Paleta de colores
2. `frontend/src/styles/index.css` - Estilos globales
3. `backend/prisma/schema.prisma` - Estructura de BD
4. `backend/src/services/ai.service.ts` - Lógica IA
5. `frontend/src/App.tsx` - Rutas incluyendo `/control/acceso`
6. `backend/src/config/index.ts` - Configuración central (named export!)

### Convenciones de Código
- Componentes React: PascalCase (`DashboardPage.tsx`)
- Servicios/Utils: camelCase (`appointments.ts`)
- Estilos: Tailwind CSS + clases personalizadas
- Estado servidor: TanStack Query
- Estado UI: useState/useReducer
- **Config import**: `import { config } from '../config/index.js'` (NO default!)

### API Response Format
```typescript
// Éxito
{ success: true, data: { ... } }

// Con paginación
{ success: true, data: { items: [...], pagination: {...} } }

// Error
{ success: false, message: "Error message" }
```

### Puntos Importantes

| Aspecto | Detalle |
|---------|---------|
| Status cancelado | `CANCELED` (una L) |
| Fecha cita | `appointment.date` |
| Hora cita | `appointment.startTime` (string "10:00") |
| Color botones | Verde `#10b981` con texto oscuro |
| Gradientes | Rosa-púrpura para títulos |
| OpenAI | Lazy initialization obligatoria |
| Permisos IA | Campo `canUseAI` en User |

### Estado Actual (2 Enero 2026)

✅ **Completado:**
- Sistema multi-tenant funcional
- CRUD completo de citas, clientes, servicios, usuarios
- Calendario visual
- Dashboard con estadísticas
- Sistema de horarios flexibles con warnings
- Modal de servicios con 3 pestañas (General, Empleados, Horarios)
- Asistente de IA con OpenAI
- Sistema de permisos (canModify, canDelete, canUseAI)
- Diseño Blitzit completo
- **Configuración de branding** (logo, nombre, colores)
- **Subida de logo** con validación PNG/JPG, 2MB max
- **Logo dinámico en Sidebar** desde configuración del tenant
- **Rutas de configuración** específicas (general, branding, booking, notifications)
- **Verificación de Email** vía SMTP (mail.serrano.marketing)
- **Verificación de SMS** vía Firebase (citaspro-58dd6)
- **Cloudflare Turnstile** en login de usuarios y Platform Admin
- **Platform Admin separado** con login en `/control/acceso`
- **Selector de código de país** en registro (15 países)
- **Desplegado en producción** (https://citas.serrano.marketing)

🔄 **Pendiente:**
- [ ] Aplicar colores personalizados a la UI dinámicamente
- [ ] Notificaciones push
- [ ] Recordatorios WhatsApp funcionales
- [ ] Pagos online
- [ ] Reportes exportables
- [ ] Multi-idioma

---

## 🚨 ÚLTIMA SESIÓN - Pasos para Retomar

### Lo Último que se Hizo (3 Enero 2026 - Sesión Completa)

#### Seguridad y Autenticación
1. ✅ Implementado Cloudflare Turnstile en login de usuarios
2. ✅ Implementado Cloudflare Turnstile en login de Platform Admin
3. ✅ Creado componente `frontend/src/components/Turnstile.tsx`
4. ✅ Creado servicio `backend/src/services/turnstile.service.ts`
5. ✅ Verificación SMS obligatoria (removido botón "omitir")

#### Platform Admin (CRÍTICO)
6. ✅ **Separación Platform Admin vs Tenant Admin** (error de seguridad corregido)
7. ✅ Creada página `frontend/src/pages/admin/AdminLoginPage.tsx`
8. ✅ Ruta cambiada de `/admin/login` a `/control/acceso` (por seguridad)
9. ✅ Removido enlace "Ir al Panel Admin" del Sidebar de tenants
10. ✅ Platform Admin creado en producción:
    - Email: `marco@serrano.marketing`
    - Password: `CSerrano6024502025*`
    - ID: `80dd5fda-670b-4b77-a555-7c91582a9dab`

#### Registro de Usuarios
11. ✅ Selector de código de país con 15 opciones (MX, US, ES, etc.)
12. ✅ Validación de 10 dígitos para teléfono
13. ✅ Verificación de email funcionando (SMTP)
14. ✅ Verificación de SMS funcionando (Firebase)

#### Correcciones de Build
15. ✅ Corregido import de config: `import { config }` en lugar de `import config`
16. ✅ Corregido type assertion en turnstile.service.ts
17. ✅ Archivo `.credentials-private.md` creado y agregado a .gitignore

### Commits Importantes de Esta Sesión
```
8a3f386 fix: corregir imports de config y cambiar ruta admin a /control/acceso
50e84e1 chore: agregar archivos privados a gitignore
```

### Archivos Modificados Esta Sesión

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/Turnstile.tsx` | NUEVO - Widget Cloudflare |
| `frontend/src/pages/admin/AdminLoginPage.tsx` | NUEVO - Login Platform Admin |
| `frontend/src/pages/auth/LoginPage.tsx` | Agregado Turnstile |
| `frontend/src/pages/auth/RegisterPage.tsx` | Selector país, SMS obligatorio |
| `frontend/src/components/layout/Sidebar.tsx` | Removido link a Panel Admin |
| `frontend/src/App.tsx` | Ruta `/control/acceso`, AdminRoute con isPlatformAdmin |
| `backend/src/services/turnstile.service.ts` | NUEVO - Validación Turnstile |
| `backend/src/controllers/auth.controller.ts` | Turnstile en login y loginAdmin |
| `backend/src/config/index.ts` | Agregado config.turnstile |
| `backend/scripts/create-platform-admin.ts` | NUEVO - Script crear admin |
| `.credentials-private.md` | NUEVO - Credenciales privadas (gitignored) |
| `.gitignore` | Agregado *.private.md |

### Para Continuar Desarrollo Local

```powershell
# Terminal 1 - Base de datos
docker start citas_db

# Terminal 2 - Backend
cd "e:\Gestión de Citas\backend"
npm run dev

# Terminal 3 - Frontend
cd "e:\Gestión de Citas\frontend"
npm run dev
```

### URLs de Desarrollo
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:4000/api |
| Health Check | http://localhost:4000/api/health |

### URLs de Producción
| Servicio | URL |
|----------|-----|
| Frontend | https://citas.serrano.marketing |
| Backend API | https://api.citas.serrano.marketing |
| Platform Admin | https://citas.serrano.marketing/control/acceso |
| EasyPanel | https://panel.serrano.marketing |

### Verificar Después de Deploy
1. Login normal en https://citas.serrano.marketing/login funciona
2. Turnstile aparece y valida correctamente
3. Platform Admin puede acceder en /control/acceso
4. Los tenants NO pueden ver el enlace al Panel Admin

### Archivo de Credenciales Privadas
El archivo `.credentials-private.md` contiene todas las credenciales de producción:
- Servidor EasyPanel (IP, URLs)
- Base de datos PostgreSQL (host, user, password)
- Firebase (API keys)
- Cloudflare Turnstile (site key, secret key)
- SMTP (host, user, password)
- Platform Admin (email, password)

⚠️ **Este archivo NO está en GitHub** (en .gitignore)

---

**Documento mantenido por GitHub Copilot**  
**Proyecto: CitasPro - Gestión de Citas**  
**Cliente: Serrano Marketing**
