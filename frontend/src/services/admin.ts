import api from './api';

// Types
export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  totalClients: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  tenantsGrowth: {
    thisMonth: number;
    lastMonth: number;
    percentage: string;
  };
}

export interface RecentActivity {
  id: string;
  type: string;
  tenantName: string;
  tenantSlug: string;
  clientName: string;
  serviceName: string;
  date: string;
  status: string;
  createdAt: string;
}

export interface TopTenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  appointmentsCount: number;
}

export interface DashboardData {
  stats: PlatformStats;
  recentActivity: RecentActivity[];
  topTenants: TopTenant[];
}

export interface TenantListItem {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string | null;
  logo: string | null;
  plan: {
    name: string;
    displayName: string;
  };
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
  counts: {
    users: number;
    clients: number;
    appointments: number;
    services: number;
  };
}

export interface TenantDetail {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string | null;
  description: string | null;
  logo: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  timezone: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  plan: {
    id: string;
    name: string;
    displayName: string;
    price: number;
    maxEmployees: number;
    maxClients: number;
    maxAppointments: number;
  };
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
  }>;
  _count: {
    clients: number;
    appointments: number;
    services: number;
  };
  stats: {
    appointmentsThisMonth: number;
    totalRevenue: number;
    newClientsThisMonth: number;
  };
}

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  maxEmployees: number;
  maxClients: number;
  maxAppointments: number;
  maxServices: number;
  hasPublicBooking: boolean;
  hasEmailReminders: boolean;
  hasSmsReminders: boolean;
  hasWebhooks: boolean;
  hasReports: boolean;
  hasCustomBranding: boolean;
  isActive: boolean;
  _count: {
    tenants: number;
  };
}

export interface UsageMetrics {
  appointmentsTrend: Array<{ date: string; count: number }>;
  tenantsTrend: Array<{ date: string; count: number }>;
  clientsTrend: Array<{ date: string; count: number }>;
  planDistribution: Array<{ plan: string; count: number }>;
  conversionRate: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Service
const adminService = {
  // Dashboard
  async getStats(): Promise<DashboardData> {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Tenants
  async listTenants(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | '';
    planId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<TenantListItem>> {
    const response = await api.get('/admin/tenants', { params });
    return response.data;
  },

  async getTenant(id: string): Promise<TenantDetail> {
    const response = await api.get(`/admin/tenants/${id}`);
    return response.data;
  },

  async updateTenant(id: string, data: {
    isActive?: boolean;
    planId?: string;
    subscriptionStatus?: string;
  }): Promise<TenantListItem> {
    const response = await api.patch(`/admin/tenants/${id}`, data);
    return response.data;
  },

  // Plans
  async listPlans(): Promise<Plan[]> {
    const response = await api.get('/admin/plans');
    return response.data;
  },

  // Analytics
  async getMetrics(period: number = 30): Promise<UsageMetrics> {
    const response = await api.get('/admin/metrics', { params: { period } });
    return response.data;
  },

  async getActivityLogs(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: RecentActivity[] }> {
    const response = await api.get('/admin/activity', { params });
    return response.data;
  },
};

export default adminService;
