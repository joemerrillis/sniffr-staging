'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}