
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/services/auth-service';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole?: 'GOD' | 'Super User' | 'Manager' | 'Team Member' | 'Owner';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading, profile } = useAuthStore();

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading,
      userRole: profile?.role as 'GOD' | 'Super User' | 'Manager' | 'Team Member' | 'Owner' | undefined 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
