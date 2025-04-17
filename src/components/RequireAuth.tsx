
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
      
      console.log(`Checking module access for "${moduleId}" and role "${profile.role}"`);
      
      try {
        setPermissionLoading(true);
        
        // First, verify the role exists in permission_roles
        const { data: roleExists, error: roleError } = await supabase
          .from('permission_roles')
          .select('role_id')
          .eq('role_id', profile.role)
          .single();
          
        if (roleError) {
          console.error(`Role check error for "${profile.role}":`, roleError);
        } else {
          console.log(`Role "${profile.role}" exists in permission_roles:`, roleExists);
        }
        
        // Next, verify the module exists in permission_modules
        const { data: moduleExists, error: moduleExistsError } = await supabase
          .from('permission_modules')
          .select('module_id, module_name')
          .eq('module_id', moduleId)
          .single();
          
        if (moduleExistsError) {
          console.error(`Module check error for "${moduleId}":`, moduleExistsError);
        } else {
          console.log(`Module "${moduleId}" exists in permission_modules:`, moduleExists);
        }
        
        // Check if the user's role has access to this module
        const { data: moduleAccess, error: moduleError } = await supabase
          .from('permission_access')
          .select('has_access')
          .eq('role_id', profile.role)
          .eq('module_id', moduleId)
          .maybeSingle();
        
        if (moduleError) {
          console.error(`Permission check error for role "${profile.role}" and module "${moduleId}":`, moduleError);
          setHasPermission(false);
          return;
        }
        
        console.log(`Module access result for "${moduleId}":`, moduleAccess);
        
        // If no module access record or has_access is false, deny access
        if (!moduleAccess || !moduleAccess.has_access) {
          console.log(`User with role ${profile.role} does not have access to module: ${moduleId}`);
          setHasPermission(false);
          return;
        }
        
        // If we get here, user has access to the module
        console.log(`User with role ${profile.role} has access to module: ${moduleId}`);
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
    
    // Find an accessible module for the user
    const findAccessibleModule = async () => {
      try {
        const { data: permittedModules, error } = await supabase
          .from('permission_access')
          .select('module_id')
          .eq('role_id', profile?.role || '')
          .eq('has_access', true)
          .order('module_id');
          
        if (error || !permittedModules || permittedModules.length === 0) {
          console.error('Error finding permitted modules or none found:', error);
          return '/';
        }
        
        // Redirect to the first permitted module
        const firstModuleId = permittedModules[0].module_id;
        return `/${firstModuleId}/dashboard`;
      } catch (err) {
        console.error('Error finding accessible module:', err);
        return '/';
      }
    };
    
    // Use team dashboard as a fallback while finding an accessible module
    return <Navigate to="/team/dashboard" replace />;
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
