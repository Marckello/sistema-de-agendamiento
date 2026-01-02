import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  tenantSlug: z.string().optional(),
});

export const registerTenantSchema = z.object({
  // Datos del negocio
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(50, 'El slug debe tener máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  email: z.string().email('Email del negocio inválido'),
  phone: z.string().optional(),
  
  // Datos del admin
  adminEmail: z.string().email('Email del administrador inválido'),
  adminPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  adminFirstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  adminLastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  adminPhone: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']).optional(),
  title: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  color: z.string().optional(),
  canModify: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canUseAI: z.boolean().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  canModify: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canUseAI: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

// Client schemas
export const createClientSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(8, 'Teléfono inválido'),
  phoneAlt: z.string().optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().transform(val => val?.toLowerCase()),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  referredBy: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  petName: z.string().optional(),
  petSpecies: z.string().optional(),
  petBreed: z.string().optional(),
  petAge: z.string().optional(),
  petNotes: z.string().optional(),
  acceptsMarketing: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'VIP', 'BLOCKED']).optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Service schemas
export const createServiceCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const createServiceSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional().nullable(),
  duration: z.coerce.number().min(5, 'La duración mínima es 5 minutos').max(480, 'La duración máxima es 8 horas'),
  bufferBefore: z.coerce.number().min(0).optional(),
  bufferAfter: z.coerce.number().min(0).optional(),
  bufferTime: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  depositRequired: z.boolean().optional(),
  depositAmount: z.coerce.number().optional(),
  depositPercent: z.coerce.number().min(0).max(100).optional(),
  maxAttendees: z.coerce.number().min(1).optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
  requiresConfirm: z.boolean().optional(),
  requiresConfirmation: z.boolean().optional(),
  color: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sortOrder: z.coerce.number().optional(),
  maxAdvanceBooking: z.coerce.number().min(1).optional(),
  minAdvanceBooking: z.coerce.number().min(0).optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
  schedules: z.array(z.object({
    dayOfWeek: z.coerce.number().min(0).max(6),
    isAvailable: z.boolean(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  })).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

// Appointment schemas
export const createAppointmentSchema = z.object({
  clientId: z.string().uuid('ID de cliente inválido'),
  employeeId: z.string().uuid('ID de empleado inválido'),
  serviceId: z.string().uuid('ID de servicio inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  notes: z.string().optional(),
  clientNotes: z.string().optional(),
  source: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  clientId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW', 'RESCHEDULED']).optional(),
  notes: z.string().optional(),
  clientNotes: z.string().optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED']).optional(),
  paymentMethod: z.string().optional(),
  discount: z.number().min(0).optional(),
  discountType: z.enum(['percent', 'fixed']).optional(),
  cancelReason: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  review: z.string().optional(),
});

export const checkAvailabilitySchema = z.object({
  employeeId: z.string().uuid('ID de empleado inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  serviceId: z.string().uuid('ID de servicio inválido'),
});

// Schedule schemas
export const createScheduleSchema = z.object({
  userId: z.string().uuid().optional(),
  dayOfWeek: z.number().min(0).max(6),
  isWorking: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  dayOfWeek: z.number().min(0).max(6),
});

// Holiday schemas
export const createHolidaySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isFullDay: z.boolean().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isRecurring: z.boolean().optional(),
});

// Tenant settings schema
export const updateTenantSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  weekStartsOn: z.number().min(0).max(6).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  webhookSecret: z.string().optional(),
  webhookActive: z.boolean().optional(),
  // SMTP Configuration
  smtpHost: z.string().optional().or(z.literal('')),
  smtpPort: z.number().min(1).max(65535).optional(),
  smtpUser: z.string().optional().or(z.literal('')),
  smtpPass: z.string().optional().or(z.literal('')),
  smtpFrom: z.string().email().optional().or(z.literal('')),
  smtpFromName: z.string().optional().or(z.literal('')),
  smtpEnabled: z.boolean().optional(),
});

// Notification template schema
export const updateNotificationTemplateSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  isActive: z.boolean().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Date range schema - accepts both date-only and full ISO formats
export const dateRangeSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de fin inválida' }),
});
