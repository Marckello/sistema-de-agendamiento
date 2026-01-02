# 📅 CitasPro - Plataforma de Gestión de Citas Multi-Tenant

Sistema SaaS completo para gestión de citas, diseñado para múltiples negocios (médicos, veterinarios, estéticas, tatuadores, etc.)

## 🚀 Características

- **Multi-Tenant**: Cada empresa tiene su cuenta independiente con subdominio
- **Gestión de Citas**: Agenda completa con calendario visual
- **CRM Integrado**: Gestión completa de clientes
- **Booking Público**: Los clientes pueden agendar online
- **Métricas y Reportes**: Dashboard con estadísticas detalladas
- **Webhooks**: Integración con n8n para notificaciones
- **Notificaciones**: Email automático para recordatorios
- **Multi-Rol**: Super Admin, Admin, Empleados
- **Modo Oscuro/Claro**: Interfaz adaptable

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + Tailwind CSS
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT + Refresh Tokens
- **Email**: Nodemailer + Templates
- **Deploy**: Docker + EasyPanel

## 📁 Estructura del Proyecto

```
├── backend/                 # API REST
│   ├── src/
│   │   ├── config/         # Configuraciones
│   │   ├── controllers/    # Controladores
│   │   ├── middleware/     # Middlewares
│   │   ├── routes/         # Rutas
│   │   ├── services/       # Lógica de negocio
│   │   ├── utils/          # Utilidades
│   │   └── types/          # Tipos TypeScript
│   ├── prisma/             # Schema y migraciones
│   └── Dockerfile
├── frontend/               # App React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas
│   │   ├── hooks/          # Custom hooks
│   │   ├── context/        # Context API
│   │   ├── services/       # API calls
│   │   └── utils/          # Utilidades
│   └── Dockerfile
├── docker-compose.yml      # Orquestación local
└── docker-compose.prod.yml # Producción
```

## 🚀 Deploy en EasyPanel

1. Conectar repositorio de GitHub a EasyPanel
2. Crear servicio PostgreSQL en EasyPanel
3. Configurar variables de entorno
4. Deploy automático en cada push

## 📝 Variables de Entorno

Ver archivos `.env.example` en backend y frontend.

## 🔧 Desarrollo Local

```bash
# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# Iniciar base de datos
docker-compose up -d postgres

# Migraciones
cd backend && npx prisma migrate dev

# Iniciar desarrollo
npm run dev  # En cada carpeta
```

## 📄 Licencia

Propietario - Todos los derechos reservados
