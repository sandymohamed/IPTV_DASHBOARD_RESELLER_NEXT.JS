import axiosInstance from '@/lib/utils/axios';

export interface Ticket {
  id: string;
  title: string;
  status: number;
  created_at: string;
  [key: string]: any;
}

export const getTickets = async (): Promise<Ticket[]> => {
  try {
    const response = await axiosInstance.get('/ticketss/manage/tickets');
    return response.data.result || [];
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return [];
  }
};

export const createTicket = async (data: { title: string; message: string }) => {
  try {
    const response = await axiosInstance.post('/ticketss', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
