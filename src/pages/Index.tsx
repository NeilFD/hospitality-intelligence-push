
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
    console.log('Current module in Index:', currentModule);
    
    // Check user permissions and cache available modules
    const checkUserPermissions = async () => {
      if (!isAuthenticated || !profile?.role) return;
      
      try {
        // Skip for GOD and Super User roles
        if (profile.role === 'GOD' || profile.role === 'Super User') {
          console.log(`${profile.role} user has full access to all modules`);
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
          console.error('Error fetching permitted modules:', error);
          return;
        }
        
        console.log('User has access to modules:', permittedModules);
      } catch (err) {
        console.error('Error checking permissions:', err);
      }
    };
    
    checkUserPermissions();
  }, [currentModule, isAuthenticated, profile]);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Always direct Team Members to team dashboard
  if (profile?.role === 'Team Member') {
    console.log('Team Member detected - redirecting to team dashboard');
    return <Navigate to="/team/dashboard" replace />;
  }
  
  // Handle control-centre separately
  if (location.pathname.includes("control-centre")) {
    // Only GOD and Super User can access control-centre
    if (profile?.role === 'GOD' || profile?.role === 'Super User') {
      return <Navigate to="/control-centre" replace />;
    } else {
      toast.error('You do not have access to the Control Centre');
      return <Navigate to="/team/dashboard" replace />;
    }
  }
  
  // For other roles, use the current module if available
  const fallbackPath = '/team/dashboard';
  
  if (currentModule) {
    const dashboardPath = `/${currentModule}/dashboard`;
    console.log(`Redirecting to module: ${dashboardPath}`);
    return <Navigate to={dashboardPath} replace />;
  }
  
  // Default to team dashboard as fallback
  console.log('No current module, using fallback path:', fallbackPath);
  return <Navigate to={fallbackPath} replace />;
};

export default Index;
