// C:\Users\Bhupendra Dhote\OneDrive\Desktop\bharat-stockApp\services\api\methods\blogAndNewsService.ts

import apiClient from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

const blogAndNewsService = {

  news: {
    // --- Categories ---
    getAllCategories: async () => {
      const response = await apiClient.get(
        API_ENDPOINTS.NEWS.CATEGORIES.LIST
      );
      return response.data?.data ?? response.data;
    },

    getCategoryById: async (id: number | string) => {
      const response = await apiClient.get(
        API_ENDPOINTS.NEWS.CATEGORIES.DETAILS(id)
      );
      return response.data?.data ?? response.data;
    },

    // --- News Articles ---
    getAllNews: async () => {
      const response = await apiClient.get(API_ENDPOINTS.NEWS.LIST);
      return response.data?.data ?? response.data;
    },

    getNewsById: async (id: number | string) => {
      const response = await apiClient.get(API_ENDPOINTS.NEWS.DETAILS(id));
      return response.data?.data ?? response.data;
    },
  },

  // BLOGS SERVICE
  blogs: {
    getAllBlogs: async () => {
      const response = await apiClient.get(API_ENDPOINTS.BLOGS.LIST);
      return response.data?.data ?? response.data;
    },

    getBlogById: async (id: number | string) => {
      const response = await apiClient.get(API_ENDPOINTS.BLOGS.DETAILS(id));
      return response.data?.data ?? response.data;
    },
  },
};

export default blogAndNewsService;