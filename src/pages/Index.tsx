
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';

const Index = () => {
  const currentModule = useCurrentModule();
  
  // Force a re-evaluation of the module name and log it
  useEffect(() => {
    console.log('Current module in Index:', currentModule);
  }, [currentModule]);
  
  // Ensure we have a valid module before redirecting
  if (!currentModule) {
    console.log('No current module found, defaulting to food');
    return <Navigate to="/food/dashboard" replace />;
  }
  
  // Create a direct path to the dashboard based on the current module
  const dashboardPath = `/${currentModule}/dashboard`;
  console.log('Redirecting to dashboard path:', dashboardPath);
  
  return <Navigate to={dashboardPath} replace />;
};

export default Index;
