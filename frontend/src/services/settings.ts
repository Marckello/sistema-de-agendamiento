import api from './api';
import { TenantSettings, WorkSchedule, Holiday, NotificationTemplate, ApiResponse } from '@/types';

export const settingsService = {
  // Get all settings
  getSettings: async (): Promise<ApiResponse<TenantSettings>> => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update general settings
  updateGeneral: async (data: TenantSettings['general']): Promise<ApiResponse<void>> => {
    const response = await api.put('/settings/general', data);
    return response.data;
  },

  // Update branding settings
  updateBranding: async (data: TenantSettings['branding']): Promise<ApiResponse<void>> => {
    const response = await api.put('/settings/branding', data);
    return response.data;
  },

  // Update booking settings
  updateBooking: async (data: TenantSettings['booking']): Promise<ApiResponse<void>> => {
    const response = await api.put('/settings/booking', data);
    return response.data;
  },

  // Update notification settings
  updateNotifications: async (data: TenantSettings['notifications']): Promise<ApiResponse<void>> => {
    const response = await api.put('/settings/notifications', data);
    return response.data;
  },

  // Update webhook settings
  updateWebhook: async (data: TenantSettings['webhook']): Promise<ApiResponse<void>> => {
    const response = await api.put('/settings/webhook', data);
    return response.data;
  },

  // Upload logo
  uploadLogo: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Work Schedule
  getWorkSchedule: async (): Promise<ApiResponse<WorkSchedule[]>> => {
    const response = await api.get('/settings/work-schedule');
    return response.data;
  },

  updateWorkSchedule: async (schedule: Partial<WorkSchedule>[]): Promise<ApiResponse<void>> => {
    const response = await api.put('/settings/work-schedule', { schedule });
    return response.data;
  },

  // Holidays
  getHolidays: async (): Promise<ApiResponse<Holiday[]>> => {
    const response = await api.get('/settings/holidays');
    return response.data;
  },

  createHoliday: async (data: Omit<Holiday, 'id' | 'tenantId'>): Promise<ApiResponse<Holiday>> => {
    const response = await api.post('/settings/holidays', data);
    return response.data;
  },

  deleteHoliday: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/settings/holidays/${id}`);
    return response.data;
  },

  // Notification Templates
  getNotificationTemplates: async (): Promise<ApiResponse<NotificationTemplate[]>> => {
    const response = await api.get('/settings/notification-templates');
    return response.data;
  },

  updateNotificationTemplate: async (id: string, data: Partial<NotificationTemplate>): Promise<ApiResponse<NotificationTemplate>> => {
    const response = await api.put(`/settings/notification-templates/${id}`, data);
    return response.data;
  },

  // Test webhook
  testWebhook: async (): Promise<ApiResponse<{ success: boolean; response?: any; error?: string }>> => {
    const response = await api.post('/settings/webhook/test');
    return response.data;
  },

  // Get webhook logs
  getWebhookLogs: async (page = 1, limit = 20) => {
    const response = await api.get(`/settings/webhook/logs?page=${page}&limit=${limit}`);
    return response.data;
  },
};
