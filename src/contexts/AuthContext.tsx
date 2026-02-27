import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// eslint-disable-next-line import/no-named-as-default
import apiClient from '../services/apiClient';

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
      const response = await apiClient.get<{ user: User }>('/api/auth/me');
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{ user: User }>('/api/auth/login', {
      email,
      password,
    });
    if (response.success && response.data?.user) {
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
      setUser(null);
    }
  };

  useEffect(() => {
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
