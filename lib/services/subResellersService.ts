import axiosInstance from '@/lib/utils/axios';

export interface SubReseller {
  id: string;
  username: string;
  email: string;
  status: number;
  created_at: string;
  [key: string]: any;
}

export const getSubResellers = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ data: SubReseller[]; total: number }> => {
  try {
    const { page = 1, pageSize = 10, searchTerm = {} } = params || {};
    const response = await axiosInstance.post('/resellers/page', { page, pageSize, searchTerm });
    return {
      data: response.data.result || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch sub-resellers:', error);
    return { data: [], total: 0 };
  }
};

export const getSubResellerById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/resellers/${id}`);
    return response.data.result || response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const createSubReseller = async (data: any) => {
  try {
    const response = await axiosInstance.post('/resellers', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateSubReseller = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/resellers/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteSubReseller = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/resellers/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getAllMemberGroupsName = async () => {
  try {
    const response = await axiosInstance.get('/resellers/member_groups_name');
    return response.data.result || [];
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const suspendSubReseller = async (id: string, sus: 'on' | 'off', action: string) => {
  try {
    const response = await axiosInstance.post('/resellers/dosuspend', {
      id,
      sus,
      action,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const addCreditsToSubReseller = async (id: string, data: { credits: number; notes?: string }) => {
  try {
    const response = await axiosInstance.post(`/resellers/add_credits_subreseller/${id}`, data);
    return response.data.result || response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};