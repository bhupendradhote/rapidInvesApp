import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

const announcementServices = {
  // Get all announcements
  getAllAnnouncements: async () => {
    const response = await apiClient.get(
      API_ENDPOINTS.ANNOUNCEMENTS.LIST
    );
    return response.data?.data ?? response.data;
  },

  // Get active announcements
  getActiveAnnouncements: async () => {
    const response = await apiClient.get(
      API_ENDPOINTS.ANNOUNCEMENTS.ACTIVE
    );
    return response.data?.data ?? response.data;
  },

  // Get announcement by ID
  getAnnouncementById: async (id: number | string) => {
    const response = await apiClient.get(
      API_ENDPOINTS.ANNOUNCEMENTS.DETAILS(id)
    );
    return response.data?.data ?? response.data;
  },
};

export default announcementServices;
