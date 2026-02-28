import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

const customerProfileServices = {
  getAllProfiles: async () => {
    const response = await apiClient.get(
      API_ENDPOINTS.CUSTOMER_PROFILE.GET_PROFILE
    );
    return response.data?.data ?? response.data;
  },

  // --- Profile Management ---
  getProfile: async () => {
    const response = await apiClient.get(
      API_ENDPOINTS.PROFILE.GET
    );
    return response.data?.data ?? response.data;
  },

updateGeneralProfile: async (data: any) => {
    const response = await apiClient.post(
      API_ENDPOINTS.PROFILE.UPDATE, 
      data,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data?.data ?? response.data;
  },

  sendUpdateOtp: async (data: any) => {
    const response = await apiClient.post(
      API_ENDPOINTS.PROFILE.OTP_SEND, 
      data
    );
    return response.data?.data ?? response.data;
  },

  verifyAndUpdate: async (data: any) => {
    const response = await apiClient.post(
      API_ENDPOINTS.PROFILE.OTP_VERIFY, 
      data
    );
    return response.data?.data ?? response.data;
  },

  // --- Password Reset Flow ---
  sendPasswordOtp: async (data: any) => {
    const response = await apiClient.post(
      API_ENDPOINTS.PROFILE.PASSWORD.SEND_OTP, 
      data
    );
    return response.data?.data ?? response.data;
  },

  verifyPasswordOtp: async (data: any) => {
    const response = await apiClient.post(
      API_ENDPOINTS.PROFILE.PASSWORD.VERIFY_OTP, 
      data
    );
    return response.data?.data ?? response.data;
  },

  updatePasswordFinal: async (data: any) => {
    const response = await apiClient.post(
      API_ENDPOINTS.PROFILE.PASSWORD.UPDATE, 
      data
    );
    return response.data?.data ?? response.data;
  },
};

export default customerProfileServices;