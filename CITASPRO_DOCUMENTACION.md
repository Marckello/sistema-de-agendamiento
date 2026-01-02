# CitasPro - Documentación Completa del Proyecto

**Última actualización:** 2 de Enero de 2026  
**Versión:** 1.1.0  
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
9. [Credenciales de Prueba](#credenciales-de-prueba)
10. [Diseño Visual (Blitzit Style)](#diseño-visual-blitzit-style)
11. [Funcionalidad de IA](#funcionalidad-de-ia)
12. [Sistema de Permisos](#sistema-de-permisos)
13. [Sistema de Horarios Flexibles](#sistema-de-horarios-flexibles)
14. [Problemas Resueltos](#problemas-resueltos)
15. [Comandos Útiles](#comandos-útiles)
16. [Despliegue EasyPanel](#despliegue-easypanel-desde-git)
17. [Contexto para Continuación](#contexto-para-continuación)

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
- **Notificaciones por email**: Confirmaciones, recordatorios, cancelaciones
- **Diseño moderno**: Estilo Blitzit (tema oscuro elegante)

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
│       │   └── 📄 index.ts         # ⭐ REGISTRO DE TODAS LAS RUTAS
│       │
│       ├── 📁 services/
│       │   ├── 📄 ai.service.ts            # ⭐ LÓGICA OPENAI
│       │   ├── 📄 appointment.service.ts   # Slots y disponibilidad
│       │   ├── 📄 auth.service.ts
│       │   ├── 📄 email.service.ts
│       │   ├── 📄 webhook.service.ts
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
        │   │   ├── 📄 Sidebar.tsx
        │   │   └── 📄 Navbar.tsx
        │   ├── 📁 appointments/
        │   │   ├── 📄 AppointmentModal.tsx
        │   │   └── 📄 AppointmentDetailModal.tsx
        │   └── 📁 chat/
        │       └── 📄 AIChat.tsx           # ⭐ CHAT FLOTANTE IA
        │
        └── 📁 pages/
            ├── 📁 auth/
            │   ├── 📄 LoginPage.tsx
            │   └── 📄 RegisterPage.tsx
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
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/agenda

# JWT
JWT_SECRET=tu-super-secreto-jwt-key-cambiar-en-produccion
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

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
OPENAI_API_KEY=sk-proj-...
```

---

## 👤 Credenciales de Prueba

```
Email:    marco@serrano.marketing
Password: Serrano602450*
Rol:      SUPER_ADMIN
Tenant:   Serrano Marketing
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

## 🔒 Sistema de Permisos

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

## 🔧 Problemas Resueltos

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

## 🚀 Despliegue EasyPanel (desde Git)

### Pasos Resumidos

1. **Push a GitHub**: `git push origin main`
2. **PostgreSQL en EasyPanel**: Crear servicio de base de datos
3. **Backend en EasyPanel**: 
   - Source: GitHub
   - Build Path: `backend`
   - Port: 4000
   - Variables: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, etc.
4. **Migraciones**: `npx prisma migrate deploy && npx prisma db seed`
5. **Frontend en EasyPanel**:
   - Source: GitHub
   - Build Path: `frontend`
   - Port: 80
   - Variable: VITE_API_URL
6. **Dominios SSL**: Configurar en cada servicio

Ver **EASYPANEL.md** para guía detallada.

---

## 📝 Contexto para Continuación

### Archivos Críticos (NO modificar sin cuidado)
1. `tailwind.config.js` - Paleta de colores
2. `frontend/src/styles/index.css` - Estilos globales
3. `backend/prisma/schema.prisma` - Estructura de BD
4. `backend/src/services/ai.service.ts` - Lógica IA

### Convenciones de Código
- Componentes React: PascalCase (`DashboardPage.tsx`)
- Servicios/Utils: camelCase (`appointments.ts`)
- Estilos: Tailwind CSS + clases personalizadas
- Estado servidor: TanStack Query
- Estado UI: useState/useReducer

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

🔄 **Pendiente:**
- [ ] Notificaciones push
- [ ] Recordatorios WhatsApp
- [ ] Pagos online
- [ ] Reportes exportables
- [ ] Multi-idioma

---

**Documento mantenido por GitHub Copilot**  
**Proyecto: CitasPro - Gestión de Citas**  
**Cliente: Serrano Marketing**
