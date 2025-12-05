import axiosInstance from '@/lib/utils/axios';

export interface DashboardStats {
  total_lines: number;
  total_mags: number;
  total_enigmas: number;
  online_users: number;
  created_today?: number;
  created_month?: number;
  open_connections?: number;
  active_subscriptions?: number;
  expired_week?: Array<{
    id: number;
    username: string;
    exp_date: number;
    reseller_notes?: string;
    type?: string;
  }>;
  expired?: Array<{
    id: number;
    username: string;
    exp_date: number;
    reseller_notes?: string;
    type?: string;
  }>;
  total_users?: number;
  [key: string]: any;
}

export const getDashboard = async (): Promise<DashboardStats | null> => {
  try {
    const response = await axiosInstance.get('/main/dashbord');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
    return null;
  }
};

export const getOpenConnections = async () => {
  try {
    const response = await axiosInstance.post('/main/client_connection');
    return response.data.result || [];
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return [];
  }
};

export const getMapConnections = async () => {
  try {
    const response = await axiosInstance.get('/main/map_connection');
    return response.data.result || [];
  } catch (error) {
    console.error('Failed to fetch map connections:', error);
    return [];
  }
};
