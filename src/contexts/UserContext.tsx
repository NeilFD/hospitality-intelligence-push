
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/services/auth-service';

interface UserContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextType>({
  isAuthenticated: false,
  isLoading: true,
  refreshUser: async () => {},
});

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  // Function to refresh the user data
  const refreshUser = async () => {
    await loadUser();
  };

  // Load user data on initial mount
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loadUser();
    }
  }, [isAuthenticated, isLoading, loadUser]);

  return (
    <UserContext.Provider value={{ 
      isAuthenticated, 
      isLoading,
      refreshUser
    }}>
      {children}
    </UserContext.Provider>
  );
};
