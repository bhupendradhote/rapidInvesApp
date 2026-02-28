import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

const chatServices = {
  // Get chat history
  getChatHistory: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CHAT.HISTORY);
      
    //   console.log('Chat History Response:', response.data);

      if (response.data && Array.isArray(response.data.messages)) {
        return response.data.messages;
      }

      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
  },

  sendMessage: async (data: any) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CHAT.SEND, data);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  markNotificationRead: async (id: number | string) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CHAT.NOTIFICATIONS.MARK_READ(id));
      return response.data;
    } catch (error) {
      console.error('Error in markNotificationRead:', error);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CHAT.NOTIFICATIONS.READ_ALL);
      return response.data;
    } catch (error) {
      console.error('Error in markAllNotificationsRead:', error);
    }
  },
};

export default chatServices;