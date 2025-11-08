import axiosInstance from '@/lib/utils/axios';
import { getAllTransactions } from './transactionsService';

export interface Payment {
  id: string;
  type: number;
  admin: string;
  admin_name?: string;
  amount: number;
  dateadded: string;
  Notes: string;
  [key: string]: any;
}

export const getPayments = async (params?: { page?: number; pageSize?: number; searchTerm?: any }): Promise<{ data: Payment[]; total: number }> => {
  try {
    const result = await getAllTransactions(params);
    return {
      data: result.result,
      total: result.total,
    };
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return { data: [], total: 0 };
  }
};

export const createPayment = async (data: any) => {
  try {
    const response = await axiosInstance.post('/trans/', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
