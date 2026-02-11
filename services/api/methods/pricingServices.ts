import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';


export interface PricingPlan {
  id: number;
  name: string;
  price: number;
  duration: string;
  description?: string;
  is_active: boolean;
}

const pricingServices = {
  getAllPricingPlans: async (): Promise<PricingPlan[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.SERVICE_PLANS.LIST
    );
    return response.data;
  },
};

export default pricingServices;
