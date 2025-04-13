
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';

const Index = () => {
  const currentModule = useCurrentModule();
  const location = useLocation();
  
  // Force a re-evaluation of the module name and log it
  useEffect(() => {
    console.log('Current module in Index:', currentModule);
  }, [currentModule]);
  
  // Special case handling for direct routes
  // We check if we're trying to go to Control Centre
  const path = location.pathname;
  if (path === '/control-centre' || path.includes('/control-centre/')) {
    return null; // Let the App router handle this directly
  }
  
  // Create a direct path to the dashboard based on the current module
  const dashboardPath = currentModule ? `/${currentModule}/dashboard` : '/food/dashboard';
  console.log('Redirecting to dashboard path:', dashboardPath);
  
  return <Navigate to={dashboardPath} replace />;
};

export default Index;
