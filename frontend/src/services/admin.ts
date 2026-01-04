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
  monthlyRevenue: number;
  growth?: {
    tenants: number;
    users: number;
    appointments: number;
  };
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  plan?: { id: string; name: string; price: number };
  planId?: string;
  subscriptionStatus?: string;
  isActive: boolean;
  createdAt: string;
  users?: any[];
  _count?: {
    users: number;
    clients: number;
    appointments: number;
    services: number;
  };
}

export interface Plan {
  id: string;
  name: string;
  displayName?: string;
  price: number;
  maxUsers?: number;
  maxEmployees?: number;
  maxClients: number;
  maxAppointmentsPerMonth?: number;
  maxAppointments?: number;
  hasWhatsApp?: boolean;
  hasSmsReminders?: boolean;
  hasAI?: boolean;
  hasReports: boolean;
  hasCustomBranding: boolean;
  isActive?: boolean;
  _count?: {
    tenants: number;
  };
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  tenant?: { id: string; name: string };
  user?: { id: string; firstName: string; lastName: string };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Service
export const adminService = {
  // Platform Stats
  async getPlatformStats(): Promise<PlatformStats> {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Tenants
  async listTenants(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    planId?: string;
    sortBy?: string;
  }): Promise<{ tenants: Tenant[]; pagination: Pagination }> {
    const response = await api.get('/admin/tenants', { params });
    return response.data;
  },

  async getTenantDetail(id: string): Promise<Tenant> {
    const response = await api.get(`/admin/tenants/${id}`);
    return response.data;
  },

  async updateTenant(id: string, data: {
    isActive?: boolean;
    planId?: string;
    subscriptionStatus?: string;
    aiEnabled?: boolean;
    aiModel?: string;
    aiMaxTokens?: number;
    aiTemperature?: number;
  }): Promise<Tenant> {
    const response = await api.patch(`/admin/tenants/${id}`, data);
    return response.data;
  },

  async deleteTenant(id: string): Promise<void> {
    await api.delete(`/admin/tenants/${id}`);
  },

  // Plans
  async getPlans(): Promise<Plan[]> {
    const response = await api.get('/admin/plans');
    return response.data;
  },

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    const response = await api.post('/admin/plans', data);
    return response.data;
  },

  async updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
    const response = await api.patch(`/admin/plans/${id}`, data);
    return response.data;
  },

  async deletePlan(id: string): Promise<void> {
    await api.delete(`/admin/plans/${id}`);
  },

  // Activity Logs
  async getActivityLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
  }): Promise<{ logs: ActivityLog[]; pagination: Pagination }> {
    const response = await api.get('/admin/activity', { params });
    return response.data;
  },

  // Metrics
  async getUsageMetrics(period?: number): Promise<any> {
    const response = await api.get('/admin/metrics', { params: { period } });
    return response.data;
  },
};

export default adminService;
