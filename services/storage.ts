import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const storage = {
  // Save Token
  saveToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  // Get Token
  getToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  },

  // Save User Object (e.g., name, email)
  saveUser: async (user: any) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  // Get User Object
  getUser: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(USER_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      return null;
    }
  },

  // Clear All (Logout)
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};