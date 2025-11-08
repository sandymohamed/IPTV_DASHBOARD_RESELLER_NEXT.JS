import axiosInstance from '@/lib/utils/axios';

export interface Template {
  id: string;
  name: string;
  created_at: string;
  [key: string]: any;
}

export const getTemplates = async (): Promise<Template[]> => {
  try {
    const response = await axiosInstance.get('/templates');
    return response.data.result || [];
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return [];
  }
};

export const getTemplateById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/templates/${id}`);
    return response.data.result || response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteTemplate = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/templates/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const createTemplate = async (data: any) => {
  try {
    const response = await axiosInstance.post('/templates', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateTemplate = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/templates/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
