import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../../services/storage'; 

type AuthContextType = {
  userToken: string | null;
  isLoading: boolean;
  signIn: (token: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  userToken: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await storage.getToken();
        if (token) {
          setUserToken(token);
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const signIn = async (token: string, userData: any) => {
    await storage.saveToken(token);
    await storage.saveUser(userData);
    setUserToken(token); 
  };

  const signOut = async () => {
    await storage.clearAll();
    setUserToken(null); 
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}