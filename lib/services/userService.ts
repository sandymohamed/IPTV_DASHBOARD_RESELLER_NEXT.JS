//@lib/services/userService.ts
import axiosInstance from '@/lib/utils/axios';

export interface User {
  id: string;
  username: string;
  email: string;
  status: number;
  created_at: string;
  expire_date: string;
  [key: string]: any;
}

export const getUsers = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ data: User[]; total?: number }> => {
  try {
    const { page = 1, pageSize = 10, searchTerm = {} } = params || {};
    const response = await axiosInstance.post('/users/page', { page, pageSize, searchTerm: { ...searchTerm } });
    return {
      data: response.data.result || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return { data: [], total: 0 };
  }
};

export const createUser = async (data: any) => {
  try {
    const response = await axiosInstance.post('/users/', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateUser = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/users/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getUserById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data.result || response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteUser = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const renewUser = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.post(`/users/renew/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const enableDisableUser = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/users/enable_disable/${id}`, {});
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const lockUnlockUser = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/users/lock_unlock/${id}`, {});
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const killUserConnections = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/users/kill/${id}`, {});
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const changePassword = async (data: { old_pass: string; new_pwd: string; new_pwd2: string }) => {
  try {
    const response = await axiosInstance.post('/auth/change-password', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};