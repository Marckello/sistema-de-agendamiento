import api from './api';
import { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters,
  TimeSlot,
  ApiResponse,
  PaginatedResponse
} from '@/types';

export const appointmentService = {
  // Get all appointments with filters
  getAll: async (filters?: AppointmentFilters): Promise<PaginatedResponse<Appointment>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.serviceId) params.append('serviceId', filters.serviceId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/appointments?${params.toString()}`);
    return response.data;
  },

  // Get single appointment
  getById: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Create appointment
  create: async (data: CreateAppointmentData): Promise<ApiResponse<Appointment>> => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  // Update appointment
  update: async (id: string, data: UpdateAppointmentData): Promise<ApiResponse<Appointment>> => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },

  // Cancel appointment
  cancel: async (id: string, reason?: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.post(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  // Confirm appointment
  confirm: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.post(`/appointments/${id}/confirm`);
    return response.data;
  },

  // Complete appointment
  complete: async (id: string, data?: { price?: number; isPaid?: boolean; paymentMethod?: string }): Promise<ApiResponse<Appointment>> => {
    const response = await api.post(`/appointments/${id}/complete`, data);
    return response.data;
  },

  // Mark as no-show
  noShow: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.post(`/appointments/${id}/no-show`);
    return response.data;
  },

  // Get available time slots
  getAvailableSlots: async (
    employeeId: string,
    serviceId: string,
    date: string
  ): Promise<ApiResponse<TimeSlot[]>> => {
    const response = await api.get(`/appointments/availability`, {
      params: { employeeId, serviceId, date },
    });
    return response.data;
  },

  // Check availability for specific time
  checkAvailability: async (
    employeeId: string,
    startTime: string,
    endTime: string
  ): Promise<ApiResponse<{ available: boolean }>> => {
    const response = await api.post('/appointments/check-availability', {
      employeeId,
      startTime,
      endTime,
    });
    return response.data;
  },

  // Get calendar events for a date range
  getCalendarEvents: async (start: string, end: string, employeeId?: string) => {
    const params = new URLSearchParams({ startDate: start, endDate: end });
    if (employeeId) params.append('employeeId', employeeId);
    
    const response = await api.get(`/appointments?${params.toString()}`);
    return response.data.data;
  },

  // Get today's appointments
  getToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get(`/appointments?startDate=${today}&endDate=${today}`);
    return response.data;
  },

  // Get upcoming appointments
  getUpcoming: async (limit: number = 10) => {
    const today = new Date().toISOString();
    const response = await api.get(`/appointments?startDate=${today}&limit=${limit}&status=PENDING,CONFIRMED`);
    return response.data;
  },
};
