import axiosInstance from '@/lib/utils/axios';

export interface Code {
  id: string;
  code: string;
  status: number;
  created_at: string;
  expire_date: string;
  [key: string]: any;
}

export const getCodes = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ data: Code[]; total?: number }> => {
  try {
    const { page = 1, pageSize = 10, searchTerm = {} } = params || {};
    const response = await axiosInstance.post('/codes/page', { page, pageSize, ...searchTerm });
    return {
      data: response.data.result || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch codes:', error);
    return { data: [], total: 0 };
  }
};

export const getCodeById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/codes/${id}`);
    return response.data.data || response.data.result || response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const createCode = async (data: any) => {
  try {
    const response = await axiosInstance.post('/codes/create', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateCode = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/codes/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteCode = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/codes/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};