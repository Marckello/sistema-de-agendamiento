import api from './api';
import { ApiResponse, PaginatedResponse, Extra, CreateExtraData, UpdateExtraData } from '../types';

export const extrasService = {
  // Get all extras with pagination
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Extra>> => {
    const response = await api.get('/extras', { params });
    return response.data;
  },

  // Get active extras (for select dropdowns)
  getActive: async (): Promise<ApiResponse<Extra[]>> => {
    const response = await api.get('/extras/active');
    return response.data;
  },

  // Get single extra
  getById: async (id: string): Promise<ApiResponse<Extra>> => {
    const response = await api.get(`/extras/${id}`);
    return response.data;
  },

  // Create extra
  create: async (data: CreateExtraData): Promise<ApiResponse<Extra>> => {
    const response = await api.post('/extras', data);
    return response.data;
  },

  // Update extra
  update: async (id: string, data: UpdateExtraData): Promise<ApiResponse<Extra>> => {
    const response = await api.put(`/extras/${id}`, data);
    return response.data;
  },

  // Delete extra
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/extras/${id}`);
    return response.data;
  },

  // Reorder extras
  reorder: async (items: { id: string; sortOrder: number }[]): Promise<ApiResponse<void>> => {
    const response = await api.post('/extras/reorder', { items });
    return response.data;
  },
};

export default extrasService;
