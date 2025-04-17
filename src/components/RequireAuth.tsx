
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, AuthServiceRole } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: AuthServiceRole;
}

const RequireAuth = ({ children, requiredRole }: RequireAuthProps) => {
  const { isAuthenticated, isLoading, loadUser, profile } = useAuthStore();
  const location = useLocation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  
  useEffect(() => {
    // If we're not authenticated and not already loading, try to load the user
    if (!isAuthenticated && !isLoading) {
      loadUser();
    }
  }, [isAuthenticated, isLoading, loadUser]);

  // Check permission based on the current path and user role
  useEffect(() => {
    const checkPermission = async () => {
      // Skip permission check if user is not authenticated yet or is currently loading
      if (!isAuthenticated || isLoading || !profile || !profile.role) {
        return;
      }

      // Role-based debug information
      console.log(`Checking permissions for user: ${profile.first_name} ${profile.last_name}, role: ${profile.role}`);
      console.log(`Current path: ${location.pathname}`);

      // GOD and Super User roles always have access to everything
      if (profile.role === 'GOD' || profile.role === 'Super User') {
        console.log(`${profile.role} user detected - granting access to protected route`);
        setHasPermission(true);
        return;
      }

      // Skip permission check for non-protected routes
      if (['/login', '/register', '/'].includes(location.pathname)) {
        setHasPermission(true);
        return;
      }

      // Parse the current path to get module and page
      const pathParts = location.pathname.split('/').filter(part => part !== '');
      const moduleId = pathParts[0] || '';
      
      // Special case for Team Members - they can only access team module
      if (profile.role === 'Team Member') {
        // Team Members can only access team module
        const hasAccess = moduleId === 'team';
        console.log(`Team Member access check for module ${moduleId}: ${hasAccess}`);
        setHasPermission(hasAccess);
        return;
      }
      
      try {
        setPermissionLoading(true);
        
        // First, check if the user's role has access to this module
        console.log(`Checking if role ${profile.role} has access to module ${moduleId}`);
        
        const { data: moduleAccess, error: moduleError } = await supabase
          .from('permission_access')
          .select('has_access')
          .eq('role_id', profile.role)
          .eq('module_id', moduleId)
          .maybeSingle();
        
        if (moduleError) {
          console.error('Error checking module permission:', moduleError);
          setHasPermission(false);
          return;
        }
        
        console.log('Module access check result:', moduleAccess);
        
        // If no module access record or has_access is false, deny access
        if (!moduleAccess || !moduleAccess.has_access) {
          console.log(`User with role ${profile.role} does not have access to module: ${moduleId}`);
          setHasPermission(false);
          return;
        }
        
        // Module access is granted, now check for specific page access if needed
        setHasPermission(true);
        
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      } finally {
        setPermissionLoading(false);
      }
    };

    checkPermission();
  }, [isAuthenticated, isLoading, profile, location.pathname]);
  
  // Show loading state while we check authentication
  if (isLoading || permissionLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If we've checked permissions and user doesn't have access
  if (hasPermission === false) {
    toast.error("You don't have permission to access this page");
    // For Team Members, always redirect to team dashboard
    if (profile?.role === 'Team Member') {
      return <Navigate to="/team/dashboard" replace />;
    }
    // For others, redirect to their default page
    return <Navigate to="/" replace />;
  }
  
  // If a specific role is required, check if the user has it
  if (requiredRole && profile) {
    const roleHierarchy = { 'GOD': 4, 'Super User': 3, 'Manager': 2, 'Team Member': 1 };
    const userRoleValue = profile.role ? roleHierarchy[profile.role as AuthServiceRole] || 0 : 0;
    const requiredRoleValue = roleHierarchy[requiredRole] || 0;
    
    // If user's role value is less than required role value, they don't have permission
    if (userRoleValue < requiredRoleValue) {
      toast.error(`You need ${requiredRole} permissions to access this page`);
      return <Navigate to="/" replace />;
    }
  }
  
  // Allow access to the page
  return <>{children}</>;
};

export default RequireAuth;
