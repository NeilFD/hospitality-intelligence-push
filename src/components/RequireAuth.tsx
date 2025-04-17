
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

      // Detailed role logging
      console.log(`Checking permissions for user: ${profile.first_name} ${profile.last_name}, role: ${profile.role}`);

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

      try {
        setPermissionLoading(true);
        
        // Extract the module from the current path
        const pathParts = location.pathname.split('/').filter(part => part !== '');
        const moduleId = pathParts[0] || '';
        
        console.log(`Checking permission for module: ${moduleId}, path: ${location.pathname}, role: ${profile.role}`);
        
        // Team Member specific protection - only allow team module
        if (profile.role === 'Team Member') {
          const hasAccess = moduleId === 'team';
          console.log(`Team Member access check for module ${moduleId}: ${hasAccess}`);
          setHasPermission(hasAccess);
          
          if (!hasAccess) {
            console.log(`Team Member attempt to access non-team module: ${moduleId}`);
          }
          return;
        }
        
        // First, check if this module exists in permission_modules
        const { data: moduleData, error: moduleDataError } = await supabase
          .from('permission_modules')
          .select('module_id, module_name')
          .eq('module_id', moduleId)
          .single();
          
        if (moduleDataError) {
          console.error('Error retrieving module data:', moduleDataError);
          // If module doesn't exist in permissions, deny access
          setHasPermission(false);
          return;
        }
        
        console.log('Found module in permission_modules:', moduleData);
        
        // Get the module permission for the user's role
        const { data: moduleAccess, error: moduleError } = await supabase
          .from('permission_access')
          .select('has_access')
          .eq('role_id', profile.role)
          .eq('module_id', moduleId)
          .single();
          
        if (moduleError) {
          console.error('Error checking module permission:', moduleError);
          // No access record found, deny permission
          setHasPermission(false);
          return;
        }
        
        console.log('Module access record:', moduleAccess);
        
        // If no module access or has_access is false, deny permission
        if (!moduleAccess || !moduleAccess.has_access) {
          console.log(`User with role ${profile.role} does not have access to module: ${moduleId}`);
          setHasPermission(false);
          return;
        }
        
        console.log(`Module permission check passed for ${profile.role} on module ${moduleId}`);
        
        // Find the appropriate page_id for this path
        const currentPath = location.pathname;
        
        // Get all pages to match against
        const { data: pages, error: pagesError } = await supabase
          .from('permission_pages')
          .select('page_id, page_url, page_name')
          .eq('module_id', moduleId);
          
        if (pagesError) {
          console.error('Error fetching pages:', pagesError);
          // If we can't get pages, use module level permission
          console.log('Defaulting to module level permission since pages could not be fetched');
          setHasPermission(true);
          return;
        }
        
        // Log all pages for debugging
        console.log('Available pages for module:', moduleId, pages);
        
        // If no pages defined for this module, allow access by default (module permission is already granted)
        if (!pages || pages.length === 0) {
          console.log(`No pages defined for module ${moduleId}, defaulting to allow access`);
          setHasPermission(true);
          return;
        }
        
        // Find matching page (considering parameterized routes)
        let matchingPageId = null;
        let matchedPage = null;
        
        // First try an exact match
        matchedPage = pages.find(page => page.page_url === currentPath);
        if (matchedPage) {
          matchingPageId = matchedPage.page_id;
          console.log(`Exact page match found: ${matchingPageId} (${matchedPage.page_name}) - ${matchedPage.page_url}`);
        } else {
          // Then try to match parameterized routes (replacing {param} parts with wildcards)
          for (const page of pages) {
            // Convert route patterns like '/food/month/{year}/{month}' to regex
            const pageUrlPattern = page.page_url.replace(/\{[^}]+\}/g, '[^/]+');
            const pageRegex = new RegExp(`^${pageUrlPattern}$`);
            
            // Log the matching attempt
            console.log(`Trying to match ${currentPath} against pattern: ${pageUrlPattern} from page ${page.page_id} (${page.page_name})`);
            
            if (pageRegex.test(currentPath)) {
              matchingPageId = page.page_id;
              matchedPage = page;
              console.log(`Parameterized page match found: ${matchingPageId} (${page.page_name})`);
              break;
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
          
        if (pageError) {
          console.error('Error checking page permission:', pageError);
          console.log('Page permission record not found, defaulting to allow since module access is granted');
          setHasPermission(true);
          return;
        }
        
        const hasPageAccess = pageAccess?.has_access || false;
        setHasPermission(hasPageAccess);
        console.log(`Page permission check for ${profile.role} on page ${matchingPageId} (${matchedPage?.page_name}): ${hasPageAccess}`);
        
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
