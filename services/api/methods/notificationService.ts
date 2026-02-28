import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

const notificationServices = {

  // Fetch unseen notifications for the bell icon badge
  getUnseenNotifications: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNSEEN);
      return response.data;
    } catch (error) {
      console.error('Error fetching unseen notifications:', error);
      throw error;
    }
  },

  // Mark a specific notification as read via ID (Bell Icon route)
  markAsRead: async (id: string | number) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },


  // Fetch all notifications for the dedicated Notification Screen
  getAllNotifications: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_NOTIFICATIONS.LIST);
      return response.data;
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      throw error;
    }
  },

  // Mark specific notification(s) as read
  userMarkRead: async (ids: (string | number)[]) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.USER_NOTIFICATIONS.READ, { 
        ids: Array.isArray(ids) ? ids : [ids] 
      });
      return response.data;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  },

  // Mark every notification as read for the user
  markAllRead: async () => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.USER_NOTIFICATIONS.READ_ALL);
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete specific notification(s)
  deleteNotifications: async (ids: (string | number)[]) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.USER_NOTIFICATIONS.DELETE, { 
        ids: Array.isArray(ids) ? ids : [ids] 
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  },

  // Get the numeric count of unread notifications
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_NOTIFICATIONS.UNREAD_COUNT);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },
};

export default notificationServices;