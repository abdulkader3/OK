import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../services/apiClient';

const TOKEN_KEY = 'access_token';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions: {
    canCreateLedger: boolean;
    canEditLedger: boolean;
    canDeleteLedger: boolean;
    canRecordPayment: boolean;
    canViewAllLedgers: boolean;
    canManageStaff: boolean;
  };
  active: boolean;
  phone?: string;
  company?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await Promise.race([
        apiClient.get<{ user: User }>('/api/auth/me'),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      if (response && response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{ user: User; tokens: { access_token: string } }>('/api/auth/login', {
      email,
      password,
    });
    if (response.success && response.data?.user) {
      if (response.data.tokens?.access_token) {
        await SecureStore.setItemAsync(TOKEN_KEY, response.data.tokens.access_token);
        apiClient.setAuthToken(response.data.tokens.access_token);
      }
      setUser(response.data.user);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      console.warn('Logout API call failed');
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      apiClient.clearAuthToken();
      setUser(null);
    }
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          apiClient.setAuthToken(token);
        }
      } catch (e) {
        console.warn('Failed to load token:', e);
      }
    };
    loadToken();
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
