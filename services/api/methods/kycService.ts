import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';


export interface KycStartResponse {
  message: string;
  status: string;
  reference_id?: string;
}

export interface KycStatusResponse {
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  reason?: string;
  updated_at?: string;
}

const kycService = {
 
  startKyc: async (): Promise<KycStartResponse> => {
    const response = await apiClient.post(
      API_ENDPOINTS.KYC.START
    );
    return response.data;
  },

 
  getKycStatus: async (): Promise<KycStatusResponse> => {
    const response = await apiClient.get(
      API_ENDPOINTS.KYC.STATUS
    );
    return response.data;
  },
};

export default kycService;
