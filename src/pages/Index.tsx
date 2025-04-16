
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';

const Index = () => {
  const currentModule = useCurrentModule();
  const location = useLocation();
  const { profile } = useAuthStore();
  
  // Force a re-evaluation of the module name and log it
  useEffect(() => {
    console.log('Current module in Index:', currentModule);
  }, [currentModule]);
  
  // If the URL contains "control-centre", redirect to control-centre with proper auth
  if (location.pathname.includes("control-centre")) {
    // Check if the user has permission to access control-centre
    if (profile?.role === 'GOD' || profile?.role === 'Super User') {
      return <Navigate to="/control-centre" replace />;
    } else {
      // If not, redirect to a module they have access to
      return <Navigate to="/team/dashboard" replace />;
    }
  }
  
  const checkModuleAccess = async (moduleId: string) => {
    if (!profile || !profile.role) {
      return false;
    }
    
    if (profile.role === 'GOD' || profile.role === 'Super User') {
      return true; // GOD and Super User have access to everything
    }
    
    try {
      const { data, error } = await supabase
        .from('permission_access')
        .select('has_access')
        .eq('role_id', profile.role)
        .eq('module_id', moduleId)
        .single();
        
      if (error) {
        console.error('Error checking module access:', error);
        return false;
      }
      
      return data?.has_access || false;
    } catch (error) {
      console.error('Exception checking module access:', error);
      return false;
    }
  };
  
  // Team Members should always have access to the team module by default
  const fallbackPath = '/team/dashboard';
  
  // Create a direct path to the dashboard based on the current module
  const dashboardPath = currentModule ? `/${currentModule}/dashboard` : fallbackPath;
  
  // Redirect users to a module they have access to
  return <Navigate to={dashboardPath} replace />;
};

export default Index;
