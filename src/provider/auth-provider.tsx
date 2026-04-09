'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('csms_access_token');
    const storedUser = localStorage.getItem('csms_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('csms_access_token');
        localStorage.removeItem('csms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, user: User) => {
    localStorage.setItem('csms_access_token', accessToken);
    localStorage.setItem('csms_refresh_token', refreshToken);
    localStorage.setItem('csms_user', JSON.stringify(user));
    setUser(user);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('csms_access_token');
    localStorage.removeItem('csms_refresh_token');
    localStorage.removeItem('csms_user');
    setUser(null);
    router.push('/login');
  };

  const hasPermission = (code: string) => {
    if (!user) return false;
    
    // Fallback cho phiên mượn cũ (cached in localStorage) nhưng chưa có mảng permissions
    if (!user.permissions) {
      if (user.role === 'ADMIN') return true;
      if (user.role === 'SALE') return ['dashboard.view', 'customers.view', 'orders.view'].includes(code);
      return false;
    }
    
    return user.permissions.includes(code);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
