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

export const createTicket = async (data: { title: string; message: string; member_id?: number; adminid?: number }) => {
  try {
    // First, create the ticket
    const ticketResponse = await axiosInstance.post('/ticketss', {
      member_id: data.member_id,
      title: data.title,
      admin_read: 0,
      status: 1,
      user_read: 1,
    });

    if (ticketResponse.data.success) {
      // If the ticket creation was successful, add a reply with the message
      const ticketId = ticketResponse.data.result.insertId;
      const replyResponse = await axiosInstance.post('/tickets_repliess', {
        ticket_id: ticketId,
        admin_reply: data.adminid || 0, // Use adminid for the initial reply
        message: data.message,
        date: Math.floor(new Date().getTime() / 1000),
      });

      return replyResponse.data;
    }
    throw new Error('Failed to create ticket');
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export interface TicketReply {
  id: number;
  ticket_id: number;
  message: string;
  adm_username: string;
  date: number;
  admin_reply: number;
}

export const getTicketHistoryList = async (ticketId: number): Promise<TicketReply[]> => {
  try {
    const response = await axiosInstance.get(`/tickets_repliess/${ticketId}`);
    return response.data.result || [];
  } catch (error: any) {
    console.error('Failed to fetch ticket history:', error);
    throw error.response?.data || error;
  }
};

export const updateTicketHistory = async (ticketId: number, memberId: number, message: string) => {
  try {
    const response = await axiosInstance.post('/tickets_repliess/', {
      ticket_id: ticketId,
      admin_reply: memberId,
      message,
      date: Math.floor(new Date().getTime() / 1000),
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
