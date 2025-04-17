
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Index = () => {
  const currentModule = useCurrentModule();
  const location = useLocation();
  const { profile, isAuthenticated, isLoading } = useAuthStore();
  const [accessibleModule, setAccessibleModule] = useState<string | null>(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);
  
  useEffect(() => {
    console.log('[Index] Rendering Index component');
    console.log('[Index] Current module:', currentModule);
    console.log('[Index] Authentication state:', isAuthenticated, 'Loading:', isLoading);
    console.log('[Index] User profile:', profile);
    
    // Check user permissions and find accessible module
    const checkUserPermissions = async () => {
      if (!isAuthenticated || isLoading || !profile?.role) {
        console.log('[Index] User not authenticated or still loading, skipping permission check');
        return;
      }
      
      setIsCheckingPermissions(true);
      
      try {
        // Skip for GOD and Super User roles
        if (profile.role === 'GOD' || profile.role === 'Super User') {
          console.log(`[Index] ${profile.role} user has full access to all modules`);
          if (currentModule) {
            setAccessibleModule(currentModule);
          } else {
            // Default module for admin users
            setAccessibleModule('team');
          }
          return;
        }
        
        // Get all modules the user has access to
        const { data: permittedModules, error } = await supabase
          .from('permission_access')
          .select('module_id')
          .eq('role_id', profile.role)
          .eq('has_access', true)
          .order('module_id');
          
        if (error) {
          console.error('[Index] Error fetching permitted modules:', error);
          // Default to team module on error
          setAccessibleModule('team');
          return;
        }
        
        if (!permittedModules || permittedModules.length === 0) {
          console.log('[Index] No permitted modules found for role:', profile.role);
          // User has no module access, default to team
          setAccessibleModule('team');
          return;
        }
        
        console.log('[Index] User has access to modules:', permittedModules);
        
        // Check if current module is in permitted modules
        if (currentModule && permittedModules.some(m => m.module_id === currentModule)) {
          console.log(`[Index] Current module ${currentModule} is accessible`);
          setAccessibleModule(currentModule);
        } else {
          // Use first permitted module
          console.log(`[Index] Using first permitted module: ${permittedModules[0].module_id}`);
          setAccessibleModule(permittedModules[0].module_id);
        }
      } catch (err) {
        console.error('[Index] Error checking permissions:', err);
        // Default to team module on error
        setAccessibleModule('team');
      } finally {
        setIsCheckingPermissions(false);
      }
    };
    
    checkUserPermissions();
  }, [currentModule, isAuthenticated, isLoading, profile]);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated && !isLoading) {
    console.log('[Index] User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Show loading while checking authentication or permissions
  if (isLoading || isCheckingPermissions) {
    console.log('[Index] Still loading or checking permissions');
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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
      return <Navigate to="/team/dashboard" replace />;
    }
  }
  
  // Navigate to the accessible module's dashboard
  if (accessibleModule) {
    const dashboardPath = `/${accessibleModule}/dashboard`;
    console.log(`[Index] Redirecting to module: ${dashboardPath}`);
    return <Navigate to={dashboardPath} replace />;
  }
  
  // Default fallback while permission check is in progress
  console.log('[Index] Using fallback path: /team/dashboard');
  return <Navigate to="/team/dashboard" replace />;
};

export default Index;
