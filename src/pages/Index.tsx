
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Index = () => {
  const currentModule = useCurrentModule();
  const location = useLocation();
  const { profile, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    console.log('[Index] Rendering Index component');
    console.log('[Index] Current module:', currentModule);
    console.log('[Index] Authentication state:', isAuthenticated);
    console.log('[Index] User profile:', profile);
    
    // Check user permissions and cache available modules
    const checkUserPermissions = async () => {
      if (!isAuthenticated || !profile?.role) {
        console.log('[Index] User not authenticated or no role defined, skipping permission check');
        return;
      }
      
      try {
        // Skip for GOD and Super User roles
        if (profile.role === 'GOD' || profile.role === 'Super User') {
          console.log(`[Index] ${profile.role} user has full access to all modules`);
          return;
        }
        
        // Get all modules the user has access to
        const { data: permittedModules, error } = await supabase
          .from('permission_access')
          .select('module_id, permission_modules(module_name)')
          .eq('role_id', profile.role)
          .eq('has_access', true)
          .order('module_id');
          
        if (error) {
          console.error('[Index] Error fetching permitted modules:', error);
          return;
        }
        
        console.log('[Index] User has access to modules:', permittedModules);
      } catch (err) {
        console.error('[Index] Error checking permissions:', err);
      }
    };
    
    checkUserPermissions();
  }, [currentModule, isAuthenticated, profile]);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('[Index] User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Handle control-centre separately
  if (location.pathname.includes("control-centre")) {
    console.log('[Index] Control Centre path detected');
    // Only GOD and Super User can access control-centre
    if (profile?.role === 'GOD' || profile?.role === 'Super User') {
      console.log('[Index] User has permission for Control Centre, redirecting');
      return <Navigate to="/control-centre" replace />;
    } else {
      console.log('[Index] User does not have permission for Control Centre');
      toast.error('You do not have access to the Control Centre');
      return <Navigate to="/" replace />;
    }
  }
  
  const findFirstAccessibleModule = async () => {
    console.log('[Index] Finding first accessible module for user role:', profile?.role);
    try {
      // Get modules the user has access to based on permission_access
      const { data: permittedModules, error } = await supabase
        .from('permission_access')
        .select('module_id')
        .eq('role_id', profile?.role || '')
        .eq('has_access', true)
        .order('module_id');
        
      if (error || !permittedModules || permittedModules.length === 0) {
        console.error('[Index] Error fetching permitted modules or no modules found:', error);
        console.log('[Index] Using team dashboard as fallback');
        // Default to team dashboard as fallback
        return '/team/dashboard';
      }
      
      // Use the first accessible module as default
      const firstModuleId = permittedModules[0].module_id;
      console.log(`[Index] User has access to first module: ${firstModuleId}`);
      return `/${firstModuleId}/dashboard`;
      
    } catch (err) {
      console.error('[Index] Exception finding accessible module:', err);
      console.log('[Index] Using team dashboard as fallback');
      return '/team/dashboard';
    }
  };
  
  // For all roles, use the current module if available
  const fallbackPath = '/team/dashboard';
  
  if (currentModule) {
    const dashboardPath = `/${currentModule}/dashboard`;
    console.log(`[Index] Redirecting to module: ${dashboardPath}`);
    return <Navigate to={dashboardPath} replace />;
  }
  
  // If no current module, find first accessible module based on permissions
  useEffect(() => {
    if (!currentModule && profile?.role) {
      console.log('[Index] No current module, finding first accessible module');
      findFirstAccessibleModule().then(path => {
        console.log(`[Index] No current module, redirecting to: ${path}`);
      });
    }
  }, [currentModule, profile]);
  
  // Default to team dashboard as fallback while permission check is in progress
  console.log('[Index] No current module, using fallback path:', fallbackPath);
  return <Navigate to={fallbackPath} replace />;
};

export default Index;
