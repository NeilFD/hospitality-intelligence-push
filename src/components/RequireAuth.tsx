
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

      // God mode - always has access to everything
      if (profile.role === 'GOD' || profile.role === 'Super User') {
        console.log(`${profile.role} detected - granting access to protected route`);
        setHasPermission(true);
        return;
      }

      // Skip permission check for non-protected routes
      if (['/login', '/register', '/'].includes(location.pathname)) {
        setHasPermission(true);
        return;
      }

      try {
        setPermissionLoading(true);
        
        // Extract the module and page from the current path
        const pathParts = location.pathname.split('/').filter(part => part !== '');
        const moduleId = pathParts[0] || '';
        
        console.log(`Checking permission for module: ${moduleId}, path: ${location.pathname}`);
        
        // Team Member specific protection - only allow team module
        if (profile.role === 'Team Member') {
          const hasAccess = moduleId === 'team';
          console.log(`Team Member access check for module ${moduleId}: ${hasAccess}`);
          setHasPermission(hasAccess);
          return;
        }
        
        // Get the module permission for the user's role
        const { data: moduleAccess, error: moduleError } = await supabase
          .from('permission_access')
          .select('has_access')
          .eq('role_id', profile.role)
          .eq('module_id', moduleId)
          .single();
          
        if (moduleError && moduleError.code !== 'PGRST116') {
          console.error('Error checking module permission:', moduleError);
          setHasPermission(false);
          return;
        }
        
        // If no module access, deny permission
        if (!moduleAccess || !moduleAccess.has_access) {
          console.log(`User with role ${profile.role} does not have access to module: ${moduleId}`);
          setHasPermission(false);
          return;
        }
        
        // Find the appropriate page_id for this path
        const currentPath = location.pathname;
        
        // Get all pages to match against
        const { data: pages, error: pagesError } = await supabase
          .from('permission_pages')
          .select('page_id, page_url')
          .eq('module_id', moduleId);
          
        if (pagesError) {
          console.error('Error fetching pages:', pagesError);
          setHasPermission(false);
          return;
        }
        
        // Find matching page (considering parameterized routes)
        let matchingPageId = null;
        if (pages) {
          // First try an exact match
          const exactMatch = pages.find(page => page.page_url === currentPath);
          if (exactMatch) {
            matchingPageId = exactMatch.page_id;
          } else {
            // Then try to match parameterized routes (replacing {param} parts with wildcards)
            for (const page of pages) {
              // Convert route patterns like '/food/month/{year}/{month}' to regex
              const pageUrlPattern = page.page_url.replace(/\{[^}]+\}/g, '[^/]+');
              const pageRegex = new RegExp(`^${pageUrlPattern}$`);
              
              if (pageRegex.test(currentPath)) {
                matchingPageId = page.page_id;
                break;
              }
            }
          }
        }
        
        // If we couldn't determine the page, default to allowing access since we already have module access
        if (!matchingPageId) {
          console.log(`No matching page found for path: ${currentPath}, defaulting to module permission`);
          setHasPermission(true);
          return;
        }
        
        // Check if the user's role has access to this page
        const { data: pageAccess, error: pageError } = await supabase
          .from('permission_page_access')
          .select('has_access')
          .eq('role_id', profile.role)
          .eq('page_id', matchingPageId)
          .single();
          
        if (pageError && pageError.code !== 'PGRST116') {
          console.error('Error checking page permission:', pageError);
          setHasPermission(false);
          return;
        }
        
        setHasPermission(pageAccess?.has_access || false);
        console.log(`Permission check for ${profile.role} on page ${matchingPageId}: ${pageAccess?.has_access}`);
        
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
      return <Navigate to="/team/dashboard" replace />;
    }
  }
  
  // Allow access to the page
  return <>{children}</>;
};

export default RequireAuth;
