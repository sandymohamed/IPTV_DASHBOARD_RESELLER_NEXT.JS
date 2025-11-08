import axiosInstance from '@/lib/utils/axios';

export interface Package {
  id: string;
  package_name: string;
  official_credits: number;
  official_duration: number;
  official_duration_in: string;
  max_connections: number;
  is_trial: number;
  [key: string]: any;
}

export const getPackagesMembersList = async (memberGroupId: string): Promise<Package[]> => {
  try {
    const response = await axiosInstance.get(`/packages/${memberGroupId}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    return [];
  }
};
