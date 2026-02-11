// services/api/methods/subscriptionService.ts

import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  duration: string; 
  description?: string;
  is_active: boolean;
}

export interface RazorpayInitiateResponse {
  order_id: string;
  amount: number;
  currency: string;
  key: string;
  plan_id: number;
}

// Razorpay Verify Payload
export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Active Subscription
export interface CurrentSubscription {
  id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

// Invoice
export interface Invoice {
  id: number;
  invoice_no: string;
  amount: number;
  created_at: string;
  download_url?: string;
}

const subscriptionService = {
  /* --------------------------------- PLANS -------------------------------- */

  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.SUBSCRIPTION.PLANS
    );
    console.log('Subscription Plans:', response.data);
    return response.data;
  },

  /* -------------------------- RAZORPAY INITIATE ---------------------------- */

initiateRazorpay: async (
  planId: number,
  durationId: number
) => {
  const response = await apiClient.post(
    API_ENDPOINTS.SUBSCRIPTION.RAZORPAY.INITIATE,
    {
      plan_id: planId,
      duration_id: durationId,
    }
  );

  console.log('Razorpay Initiate Response:', response.data);
  return response.data;
},


  /* --------------------------- RAZORPAY VERIFY ----------------------------- */

  verifyRazorpay: async (
    payload: RazorpayVerifyPayload
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(
      API_ENDPOINTS.SUBSCRIPTION.RAZORPAY.VERIFY,
      payload
    );

    console.log('Razorpay Verify Response:', response.data);
    return response.data;
  },

  /* ------------------------- CURRENT SUBSCRIPTION -------------------------- */

  getCurrentSubscription: async (): Promise<CurrentSubscription | null> => {
    const response = await apiClient.get(
      API_ENDPOINTS.SUBSCRIPTION.CURRENT
    );

    console.log('Current Subscription:', response.data);
    return response.data;
  },

  /* ------------------------------- INVOICES -------------------------------- */

  getInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.SUBSCRIPTION.INVOICES.LIST
    );

    console.log('Invoice List:', response.data);
    return response.data;
  },

  downloadInvoice: async (invoiceId: number | string): Promise<Blob> => {
    const response = await apiClient.get(
      API_ENDPOINTS.SUBSCRIPTION.INVOICES.DOWNLOAD(invoiceId),
      {
        responseType: 'blob', // important for PDF
      }
    );

    console.log('Invoice Downloaded:', invoiceId);
    return response.data;
  },
};

export default subscriptionService;
