
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Index = () => {
  const currentModule = useCurrentModule();
  const location = useLocation();
  const { profile, isAuthenticated, isLoading } = useAuthStore();
  
  useEffect(() => {
    console.log('[Index] Rendering Index component');
    console.log('[Index] Current module:', currentModule);
    console.log('[Index] Authentication state:', isAuthenticated, 'Loading:', isLoading);
    console.log('[Index] User profile:', profile);
  }, [currentModule, isAuthenticated, isLoading, profile]);
  
  // If at root path, redirect to login
  if (location.pathname === '/') {
    return <Navigate to="/login" replace />;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated && !isLoading) {
    console.log('[Index] User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Show loading while checking authentication
  if (isLoading) {
    console.log('[Index] Still loading authentication state');
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Handle control-centre separately - only for admins
  if (location.pathname.includes("control-centre")) {
    console.log('[Index] Control Centre path detected');
    // Only GOD and Super User can access control-centre
    if (profile?.role === 'GOD' || profile?.role === 'Super User') {
      console.log('[Index] User has permission for Control Centre, redirecting');
      return <Navigate to="/control-centre" replace />;
    } else {
      console.log('[Index] User does not have permission for Control Centre');
      toast.error('You do not have access to the Control Centre');
      return <Navigate to="/home/dashboard" replace />;
    }
  }
  
  // Always redirect to Home dashboard as default landing page
  console.log('[Index] Redirecting to home dashboard');
  return <Navigate to="/home/dashboard" replace />;
};

export default Index;
