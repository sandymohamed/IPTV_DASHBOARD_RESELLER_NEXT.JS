import axiosInstance from '@/lib/utils/axios';

export interface Transaction {
  id: string;
  type: number;
  admin: string;
  admin_name?: string;
  amount: number;
  dateadded: string;
  Notes: string;
  [key: string]: any;
}

export interface Invoice {
  id: string;
  trans_id: string;
  admin: string;
  admin_name?: string;
  amount: number;
  dateadded: string;
  Notes: string;
  codes?: string;
  code_trans?: string;
  [key: string]: any;
}

export interface SubInvoice {
  id: string;
  admin: string;
  admin_name?: string;
  amount: number;
  dateadded: string;
  Notes: string;
  [key: string]: any;
}

export const getAllTransactions = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ result: Transaction[]; total: number }> => {
  try {
    const { page = 1, pageSize = 10, searchTerm = {} } = params || {};
    const response = await axiosInstance.post('/trans/page', { page, pageSize, searchTerm });
    return {
      result: response.data.result || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return { result: [], total: 0 };
  }
};

export const getAllInvoices = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ result: Invoice[]; total: number }> => {
  try {
    const { page = 1, pageSize = 10, searchTerm = {} } = params || {};
    const response = await axiosInstance.post('/trans/invoices/page', { page, pageSize, searchTerm });
    return {
      result: response.data.result || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return { result: [], total: 0 };
  }
};

export const getAllSubInvoices = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ result: SubInvoice[]; total: number }> => {
  try {
    const { page = 1, pageSize = 10, searchTerm = {} } = params || {};
    const response = await axiosInstance.post('/trans/sub-invoices/page/', { page, pageSize, searchTerm });
    return {
      result: response.data.result || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch sub-invoices:', error);
    return { result: [], total: 0 };
  }
};

export const getAllTransResellers = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ result: Transaction[]; total: number }> => {
  try {
    const { page = 1, pageSize = 10, searchTerm = {} } = params || {};
    const response = await axiosInstance.post('/trans/resellers/page', { page, pageSize, searchTerm });
    return {
      result: response.data.result || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch reseller transactions:', error);
    return { result: [], total: 0 };
  }
};

export const getTransactionById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/trans/${id}`);
    return response.data.result?.[0] || response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const addNewPayment = async (data: any) => {
  try {
    const response = await axiosInstance.post('/trans/', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const editPayment = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/trans/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const addNewTransfer = async (data: any) => {
  try {
    const response = await axiosInstance.post('/trans/transfer/', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
