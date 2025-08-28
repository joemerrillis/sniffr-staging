'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string, tenantId?: string) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Validate token and get user info
          const response = await apiClient.getCurrentUser();
          if (response.data) {
            setUser(response.data);
            // Store tenant_id for API requests
            localStorage.setItem('tenant_id', response.data.tenant_id);
          } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('tenant_id');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('tenant_id');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      
      if (response.data) {
        const { user: userData, token } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('tenant_id', userData.tenant_id);
        setUser(userData);
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await apiClient.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_id');
      setUser(null);
    }
  };

  const signup = async (email: string, password: string, name: string, tenantId?: string) => {
    try {
      const response = await apiClient.register({
        email,
        password,
        name,
        ...(tenantId && { tenant_id: tenantId })
      });
      
      if (response.data) {
        const { user: userData, token } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('tenant_id', userData.tenant_id);
        setUser(userData);
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    try {
      const response = await apiClient.updateProfile(data);
      if (response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error?.message || 'Profile update failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiClient.changePassword(currentPassword, newPassword);
      if (!response.data?.success) {
        throw new Error(response.error?.message || 'Password change failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    signup,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}