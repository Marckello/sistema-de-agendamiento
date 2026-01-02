// User types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  canModify: boolean;
  canDelete: boolean;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  // Datos del negocio
  name: string;
  slug: string;
  email: string;
  phone?: string;
  // Datos del admin
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  planId: string;
  plan?: Plan;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  maxUsers: number;
  maxClients: number;
  maxAppointmentsPerMonth: number;
  features: Record<string, any>;
  isActive: boolean;
}

// Client types
export interface Client {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  address?: string;
  city?: string;
  notes?: string;
  tags: string[];
  source?: string;
  referredById?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    appointments: number;
  };
  totalSpent?: number;
  lastVisit?: string;
}

export interface CreateClientData {
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  address?: string;
  city?: string;
  notes?: string;
  tags?: string[];
  source?: string;
  referredById?: string;
}

// Service types
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  tenantId: string;
  services?: Service[];
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  bufferTime: number;
  price: number;
  color?: string;
  isActive: boolean;
  requiresConfirmation: boolean;
  maxAdvanceBooking: number;
  minAdvanceBooking: number;
  categoryId?: string;
  category?: ServiceCategory;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  duration: number;
  bufferTime?: number;
  price: number;
  color?: string;
  isActive?: boolean;
  requiresConfirmation?: boolean;
  maxAdvanceBooking?: number;
  minAdvanceBooking?: number;
  categoryId?: string;
}

// Appointment types
export type AppointmentStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'CANCELLED' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'RESCHEDULED';

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  internalNotes?: string;
  cancellationReason?: string;
  price?: number;
  isPaid: boolean;
  paymentMethod?: string;
  reminderSent: boolean;
  confirmationSent: boolean;
  clientId: string;
  client: Client;
  serviceId: string;
  service: Service;
  employeeId: string;
  employee: User;
  tenantId: string;
  bookedById?: string;
  bookedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentData {
  startTime: string;
  clientId: string;
  serviceId: string;
  employeeId: string;
  notes?: string;
  internalNotes?: string;
}

export interface UpdateAppointmentData {
  startTime?: string;
  status?: AppointmentStatus;
  notes?: string;
  internalNotes?: string;
  price?: number;
  isPaid?: boolean;
  paymentMethod?: string;
  cancellationReason?: string;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

// Dashboard types
export interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
  averagePerAppointment: number;
  newClients: number;
  returningClients: number;
  busiestDay: string;
  busiestHour: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface AppointmentsByDay {
  date: string;
  count: number;
  revenue: number;
}

export interface TopEmployee {
  id: string;
  name: string;
  appointments: number;
  revenue: number;
}

export interface TopService {
  id: string;
  name: string;
  count: number;
  revenue: number;
}

// Work Schedule types
export interface WorkSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  userId?: string;
  tenantId: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  isRecurring: boolean;
  tenantId: string;
}

// Notification types
export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'PLATFORM';
  event: string;
  subject?: string;
  body: string;
  isActive: boolean;
  tenantId: string;
}

export interface NotificationLog {
  id: string;
  type: string;
  recipient: string;
  subject?: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error?: string;
  sentAt?: string;
  createdAt: string;
}

// Webhook types
export interface WebhookLog {
  id: string;
  event: string;
  url: string;
  payload: Record<string, any>;
  response?: Record<string, any>;
  statusCode?: number;
  success: boolean;
  error?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter types
export interface AppointmentFilters {
  status?: AppointmentStatus;
  employeeId?: string;
  clientId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ClientFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Form types
export interface SelectOption {
  value: string;
  label: string;
}

// Settings types
export interface TenantSettings {
  general: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    timezone: string;
    currency: string;
  };
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  booking: {
    allowOnlineBooking: boolean;
    requireConfirmation: boolean;
    cancellationPolicy?: string;
    maxAdvanceBooking: number;
    minAdvanceBooking: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    reminderHours: number;
  };
  webhook: {
    url?: string;
    secret?: string;
    isActive: boolean;
    events: string[];
  };
}
