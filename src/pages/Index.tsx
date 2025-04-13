
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';

const Index = () => {
  const currentModule = useCurrentModule();
  
  // Force a re-evaluation of the module name and log it
  useEffect(() => {
    console.log('Current module in Index:', currentModule);
  }, [currentModule]);
  
  // Create a direct path to the dashboard based on the current module
  const dashboardPath = currentModule ? `/${currentModule}/dashboard` : '/food/dashboard';
  
  return <Navigate to={dashboardPath} replace />;
};

export default Index;
