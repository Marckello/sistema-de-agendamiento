import api from './api';
import { User, ApiResponse, UsersApiResponse } from '@/types';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  canModify?: boolean;
  canDelete?: boolean;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  canModify?: boolean;
  canDelete?: boolean;
  isActive?: boolean;
}

export const userService = {
  // Get all users
  getAll: async (includeInactive = false): Promise<UsersApiResponse> => {
    const response = await api.get(`/users?includeInactive=${includeInactive}`);
    return response.data;
  },

  // Get single user
  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  create: async (data: CreateUserData): Promise<ApiResponse<User>> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  // Update user
  update: async (id: string, data: UpdateUserData): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete user
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Toggle user active status
  toggleActive: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/users/${id}/toggle-active`);
    return response.data;
  },

  // Get user's work schedule
  getSchedule: async (id: string) => {
    const response = await api.get(`/users/${id}/schedule`);
    return response.data;
  },

  // Update user's work schedule
  updateSchedule: async (id: string, schedule: any[]) => {
    const response = await api.put(`/users/${id}/schedule`, { schedule });
    return response.data;
  },

  // Get employees (all users who can receive appointments - includes ADMIN and EMPLOYEE roles)
  getEmployees: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users');
    // Handle both array and object responses
    const data = response.data?.data;
    if (data?.users) {
      return { ...response.data, data: data.users };
    }
    return response.data;
  },

  // Update current user's profile
  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('/auth/password', data);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
