import axiosInstance from '@/lib/utils/axios';

export interface Enigma {
  id: string;
  username: string;
  status: number;
  created_at: string;
  expire_date: string;
  [key: string]: any;
}

export const getEnigmas = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ data: Enigma[]; total?: number }> => {
  try {
    const { page = 1, pageSize = 10, searchTerm = {} } = params || {};
    const response = await axiosInstance.post('/enigmas/page', { page, pageSize, searchTerm });
    return {
      data: response.data.result || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch enigmas:', error);
    return { data: [], total: 0 };
  }
};

export const getEnigmaById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/enigmas/${id}`);
    return response.data.result || response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const createEnigma = async (data: any) => {
  try {
    const response = await axiosInstance.post('/enigmas/', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateEnigma = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/enigmas/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteEnigma = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/enigmas/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const renewEnigma = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/enigmas/renew/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const lockUnlockEnigma = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/enigmas/lock_unlock/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const killEnigmaConnections = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/enigmas/kill/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};