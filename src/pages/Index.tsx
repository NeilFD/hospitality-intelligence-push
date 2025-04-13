
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
  
  // If the URL contains "control-centre", don't redirect
  if (location.pathname.includes("control-centre")) {
    return null;
  }
  
  // Create a direct path to the dashboard based on the current module
  const dashboardPath = currentModule ? `/${currentModule}/dashboard` : '/food/dashboard';
  
  return <Navigate to={dashboardPath} replace />;
};

export default Index;
