
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, AuthServiceRole } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getHasAccessToModule } from '@/services/permissions-service';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: AuthServiceRole;
}

const RequireAuth = ({ children, requiredRole }: RequireAuthProps) => {
  const { isAuthenticated, isLoading, loadUser, profile } = useAuthStore();
  const location = useLocation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  
  // Load user authentication state on component mount or route changes
  useEffect(() => {
    console.log('[RequireAuth] Component mounted or route changed, auth state:', 
      { isAuthenticated, isLoading, hasProfile: !!profile });
    
    const loadAuthState = async () => {
      if (!isAuthenticated && !isLoading) {
        console.log('[RequireAuth] Not authenticated and not loading, attempting to load user');
        await loadUser();
      } else if (isAuthenticated && profile) {
        console.log('[RequireAuth] User authenticated with profile, ready to check permissions');
        setPageReady(true);
      }
    };
    
    loadAuthState();
  }, [isAuthenticated, isLoading, loadUser, profile, location.pathname]);

  // Check permission based on the current path and user role
  useEffect(() => {
    // Skip permission check if user is not authenticated yet or is currently loading
    if (!isAuthenticated || isLoading || !profile || !profile.role) {
      console.log(`[RequireAuth] Skipping permission check - Auth state: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}, Loading: ${isLoading}, Profile exists: ${!!profile}`);
      return;
    }

    const checkPermission = async () => {
      // Extract the module from the current path
      const pathParts = location.pathname.split('/').filter(part => part !== '');
      const moduleId = pathParts[0] || '';
      
      console.log(`[RequireAuth] Checking module access for "${moduleId}" and role "${profile.role}"`);
      console.log(`[RequireAuth] User: ${profile.first_name} ${profile.last_name}, role: ${profile.role}`);
      console.log(`[RequireAuth] Current path: ${location.pathname}`);

      // GOD and Super User roles always have access to everything
      if (profile.role === 'GOD' || profile.role === 'Super User') {
        console.log(`[RequireAuth] ${profile.role} user detected - granting access to protected route`);
        setHasPermission(true);
        return;
      }

      // Skip permission check for non-protected routes
      if (['/login', '/register', '/'].includes(location.pathname)) {
        console.log('[RequireAuth] Non-protected route detected - granting access');
        setHasPermission(true);
        return;
      }
      
      // Special case for profile page - users should always be able to access their own profile
      if (location.pathname === '/profile') {
        console.log('[RequireAuth] Own profile page detected - granting access');
        setHasPermission(true);
        return;
      }
      
      try {
        setPermissionLoading(true);
        
        // Check if the user's role has access to this module using permissions service
        const hasAccess = await getHasAccessToModule(profile.role, moduleId as any);
        
        if (!hasAccess) {
          console.log(`[RequireAuth] User with role ${profile.role} does not have access to module: ${moduleId}`);
          setHasPermission(false);
          return;
        }
        
        // If we get here, user has access to the module
        console.log(`[RequireAuth] User with role ${profile.role} has access to module: ${moduleId}`);
        setHasPermission(true);
        
      } catch (error) {
        console.error('[RequireAuth] Error checking permissions:', error);
        setHasPermission(false);
      } finally {
        setPermissionLoading(false);
      }
    };

    // Run the permission check whenever the location changes
    checkPermission();
  }, [isAuthenticated, isLoading, profile, location.pathname]);
  
  // Show loading state while we check authentication
  if (isLoading || permissionLoading || (!pageReady && isAuthenticated)) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('[RequireAuth] User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If we've checked permissions and user doesn't have access
  if (hasPermission === false) {
    console.log('[RequireAuth] User does not have permission, redirecting to accessible module');
    toast.error("You don't have permission to access this page");
    
    // Redirect to home dashboard instead of team dashboard - this should be accessible for all including Team Members
    return <Navigate to="/home/dashboard" replace />;
  }
  
  // If a specific role is required, check if the user has it
  if (requiredRole && profile) {
    const roleHierarchy = { 'GOD': 4, 'Super User': 3, 'Manager': 2, 'Team Member': 1 };
    const userRoleValue = profile.role ? roleHierarchy[profile.role as AuthServiceRole] || 0 : 0;
    const requiredRoleValue = roleHierarchy[requiredRole] || 0;
    
    console.log(`[RequireAuth] Checking role requirement: User role value ${userRoleValue}, Required role value ${requiredRoleValue}`);
    
    // If user's role value is less than required role value, they don't have permission
    if (userRoleValue < requiredRoleValue) {
      console.log(`[RequireAuth] User does not have required role ${requiredRole}, redirecting to home`);
      toast.error(`You need ${requiredRole} permissions to access this page`);
      return <Navigate to="/home/dashboard" replace />;
    }
  }
  
  // Allow access to the page
  console.log('[RequireAuth] User has permission, allowing access to the page');
  return <>{children}</>;
};

export default RequireAuth;
