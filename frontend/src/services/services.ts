import api from './api';
import { 
  Service, 
  ServiceCategory,
  CreateServiceData,
  ApiResponse,
} from '@/types';

export const serviceService = {
  // Get all services
  getAll: async (includeInactive = false): Promise<ApiResponse<Service[]>> => {
    const response = await api.get(`/services?includeInactive=${includeInactive}`);
    return response.data;
  },

  // Get single service
  getById: async (id: string): Promise<ApiResponse<Service>> => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  // Create service
  create: async (data: CreateServiceData): Promise<ApiResponse<Service>> => {
    const response = await api.post('/services', data);
    return response.data;
  },

  // Update service
  update: async (id: string, data: Partial<CreateServiceData>): Promise<ApiResponse<Service>> => {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  // Delete service
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  // Toggle service active status
  toggleActive: async (id: string): Promise<ApiResponse<Service>> => {
    const response = await api.patch(`/services/${id}/toggle-active`);
    return response.data;
  },

  // Get all categories
  getCategories: async (): Promise<ApiResponse<ServiceCategory[]>> => {
    const response = await api.get('/services/categories');
    return response.data;
  },

  // Create category
  createCategory: async (data: { name: string; description?: string; color?: string }): Promise<ApiResponse<ServiceCategory>> => {
    const response = await api.post('/services/categories', data);
    return response.data;
  },

  // Update category
  updateCategory: async (id: string, data: Partial<{ name: string; description?: string; color?: string }>): Promise<ApiResponse<ServiceCategory>> => {
    const response = await api.put(`/services/categories/${id}`, data);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/services/categories/${id}`);
    return response.data;
  },

  // Reorder categories
  reorderCategories: async (categoryIds: string[]): Promise<ApiResponse<void>> => {
    const response = await api.post('/services/categories/reorder', { categoryIds });
    return response.data;
  },
};
