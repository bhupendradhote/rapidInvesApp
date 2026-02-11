import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../../types/auth.types';

export const authService = {
  
  // 1. Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },

  // 2. Register (Get Temp Key)
  register: async (data: Omit<RegisterRequest, 'dob'>): Promise<AuthResponse> => {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
      dob: '2000-01-01', 
    };
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload);
    return response.data;
  },

  // 3. Send OTP (Link Mobile to Temp Key)
  sendOtp: async (tempKey: string, phone: string) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.SEND_OTP, { 
      temp_key: tempKey,
      phone: phone 
    });
    return response.data;
  },

  // 4. Verify OTP (Finalize)
  verifyOtp: async (tempKey: string, otp: string): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      temp_key: tempKey,
      otp: otp,
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },
};