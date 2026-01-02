import api from './api';
import { DashboardStats, AppointmentsByDay, TopEmployee, TopService, ApiResponse } from '@/types';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
}

export const dashboardService = {
  // Get overview statistics
  getStats: async (filters?: DashboardFilters): Promise<ApiResponse<DashboardStats>> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);

    const response = await api.get(`/dashboard/stats?${params.toString()}`);
    return response.data;
  },

  // Get appointments by day
  getAppointmentsByDay: async (filters?: DashboardFilters): Promise<ApiResponse<AppointmentsByDay[]>> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/dashboard/appointments-by-day?${params.toString()}`);
    return response.data;
  },

  // Get appointments by status
  getAppointmentsByStatus: async (filters?: DashboardFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/dashboard/appointments-by-status?${params.toString()}`);
    return response.data;
  },

  // Get top employees
  getTopEmployees: async (filters?: DashboardFilters, limit = 5): Promise<ApiResponse<TopEmployee[]>> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    params.append('limit', limit.toString());

    const response = await api.get(`/dashboard/top-employees?${params.toString()}`);
    return response.data;
  },

  // Get top services
  getTopServices: async (filters?: DashboardFilters, limit = 5): Promise<ApiResponse<TopService[]>> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    params.append('limit', limit.toString());

    const response = await api.get(`/dashboard/top-services?${params.toString()}`);
    return response.data;
  },

  // Get revenue by period
  getRevenueByPeriod: async (filters?: DashboardFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/dashboard/revenue?${params.toString()}`);
    return response.data;
  },

  // Get busiest hours
  getBusiestHours: async (filters?: DashboardFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/dashboard/busiest-hours?${params.toString()}`);
    return response.data;
  },

  // Get client retention
  getClientRetention: async (filters?: DashboardFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/dashboard/client-retention?${params.toString()}`);
    return response.data;
  },

  // Get quick stats for header/sidebar
  getQuickStats: async () => {
    const response = await api.get('/dashboard/quick-stats');
    return response.data;
  },
};
