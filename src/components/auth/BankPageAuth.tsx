
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/services/auth-service';

interface BankPageAuthProps {
  children: React.ReactNode;
}

/**
 * Authorization component that only allows access to the Bank page for a specific user.
 * All other users will be redirected to the dashboard.
 */
const BankPageAuth: React.FC<BankPageAuthProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  
  // While loading, show nothing or a loading indicator
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // List of authorized email addresses that can access the Bank page
  const authorizedEmails = ['neil@thetaverncheltenham.com'];
  
  // Check if the current user's email is in the authorized list
  const isAuthorized = user && authorizedEmails.includes(user.email || '');
  
  // If not authorized, redirect to the dashboard
  if (!isAuthorized) {
    return <Navigate to="/pl/dashboard" replace />;
  }
  
  // If authorized, show the Bank page
  return <>{children}</>;
};

export default BankPageAuth;
