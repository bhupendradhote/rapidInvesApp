import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

const customerProfileServices = {
  getAllProfiles: async () => {
    const response = await apiClient.get(
      API_ENDPOINTS.CUSTOMER_PROFILE.GET_PROFILE
    );
    return response.data?.data ?? response.data;
  },
};

export default customerProfileServices;
