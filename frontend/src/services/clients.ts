import api from './api';
import { 
  Client, 
  CreateClientData, 
  ClientFilters,
  ApiResponse,
  PaginatedResponse
} from '@/types';

export const clientService = {
  // Get all clients with filters
  getAll: async (filters?: ClientFilters): Promise<PaginatedResponse<Client>> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/clients?${params.toString()}`);
    return response.data;
  },

  // Get single client
  getById: async (id: string): Promise<ApiResponse<Client>> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  // Create client
  create: async (data: CreateClientData): Promise<ApiResponse<Client>> => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  // Update client
  update: async (id: string, data: Partial<CreateClientData>): Promise<ApiResponse<Client>> => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  // Delete client
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  // Get client appointments
  getAppointments: async (id: string) => {
    const response = await api.get(`/clients/${id}/appointments`);
    return response.data;
  },

  // Get client statistics
  getStats: async (id: string) => {
    const response = await api.get(`/clients/${id}/stats`);
    return response.data;
  },

  // Search clients
  search: async (query: string, limit: number = 10): Promise<ApiResponse<Client[]>> => {
    const response = await api.get(`/clients?search=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Import clients (CSV)
  import: async (file: File): Promise<ApiResponse<{ imported: number; errors: string[] }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/clients/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Export clients
  export: async (format: 'csv' | 'xlsx' = 'csv') => {
    const response = await api.get(`/clients/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
