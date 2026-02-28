import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

const ticketServices = {
  
  // Fetch the list of all tickets
  getTicketList: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TICKETS.LIST);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket list:', error);
      throw error;
    }
  },

  // Create a new ticket
  storeTicket: async (data: any) => {
    try {
      const isFormData = data instanceof FormData;
      const response = await apiClient.post(API_ENDPOINTS.TICKETS.STORE, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  // Fetch details for a specific ticket
  getTicketDetails: async (id: number | string) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TICKETS.DETAILS(id));
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for ticket ${id}:`, error);
      throw error;
    }
  },
};

export default ticketServices;