
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, AuthServiceRole } from '@/services/auth-service';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: AuthServiceRole;
}

const RequireAuth = ({ children, requiredRole }: RequireAuthProps) => {
  const { isAuthenticated, isLoading, loadUser, profile } = useAuthStore();
  const location = useLocation();
  
  useEffect(() => {
    // If we're not authenticated and not already loading, try to load the user
    if (!isAuthenticated && !isLoading) {
      loadUser();
    }
  }, [isAuthenticated, isLoading, loadUser]);
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If a specific role is required, check if the user has it
  if (requiredRole && profile) {
    const roleHierarchy = { 'GOD': 4, 'Super User': 3, 'Manager': 2, 'Team Member': 1 };
    const userRoleValue = profile.role ? roleHierarchy[profile.role as AuthServiceRole] || 0 : 0;
    const requiredRoleValue = roleHierarchy[requiredRole] || 0;
    
    // If user's role value is less than required role value, they don't have permission
    if (userRoleValue < requiredRoleValue) {
      return <Navigate to="/" replace />;
    }
  }
  
  return <>{children}</>;
};

export default RequireAuth;
