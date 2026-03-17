import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

// ────────────────────────────────────────────────
// Domain Models / Response Types
// ────────────────────────────────────────────────

export interface Policy {
  id: number | string;
  slug?: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PoliciesListResponse {
  status: 'success' | 'error';
  message?: string;
  data: Policy[]; // most common shape for list endpoints
}

export interface PolicyDetailResponse {
  status: 'success' | 'error';
  message?: string;
  data: Policy; // single policy
}

const policyService = {
  
  getPolicies: async (): Promise<PoliciesListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.POLICIES.LIST);
    return response.data;
  },

  getPolicyDetails: async (identifier: string | number): Promise<PolicyDetailResponse> => {
    if (!identifier || String(identifier).trim() === '') {
      throw new Error('Policy identifier (ID or slug) is required');
    }

    const endpoints: any = API_ENDPOINTS.POLICIES;
    const endpointStr = endpoints.SLUG_POLICY || `/policies/:slug`;
    
    const url = endpointStr.replace(':slug', String(identifier));

    const response = await apiClient.get(url);
    return response.data;
  },

};

export default policyService;