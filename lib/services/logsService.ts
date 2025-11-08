import axiosInstance from '@/lib/utils/axios';

export interface UserActivityLog {
  activity_id: string;
  username: string;
  stream_display_name: string;
  server_name: string;
  date_start: number;
  date_end: number;
  user_ip: string;
  geoip_country_code: string;
  [key: string]: any;
}

export const getUserActivityLog = async (): Promise<UserActivityLog[]> => {
  try {
    const response = await axiosInstance.post('/user_activity');
    return response.data.result || [];
  } catch (error) {
    console.error('Failed to fetch user activity logs:', error);
    return [];
  }
};

export const getUsersActivities = async (userId: string): Promise<UserActivityLog[]> => {
  try {
    const response = await axiosInstance.post(`/user_activity/${userId}`);
    return response.data.result || [];
  } catch (error) {
    console.error('Failed to fetch user activities:', error);
    return [];
  }
};
