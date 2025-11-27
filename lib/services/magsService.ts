import axiosInstance from '@/lib/utils/axios';

export interface Mag {
  id: string;
  username: string;
  status: number;
  created_at: string;
  expire_date: string;
  [key: string]: any;
}

export const getMags = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ data: Mag[]; total?: number }> => {
  try {
    const { page = 1, pageSize = 10, searchTerm = {} } = params || {};
    const response = await axiosInstance.post('/mags/page', { page, pageSize, searchTerm });
    return {
      data: response.data.result || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch mags:', error);
    return { data: [], total: 0 };
  }
};

export const getMagById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/mags/${id}`);
    return response.data.result || response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const createMag = async (data: any) => {
  try {
    const response = await axiosInstance.post('/mags/', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateMag = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/mags/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteMag = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/mags/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const renewMag = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/mags/renew/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const enableDisableMag = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/mags/enable_disable/${id}`, {});
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const lockUnlockMag = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/mags/lock_unlock/${id}`, {});
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const killMagConnections = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/mags/kill/${id}`, {});
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};