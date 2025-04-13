
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
  // For routes like /control-centre, they will now be handled directly by App.tsx
  const dashboardPath = currentModule ? `/${currentModule}/dashboard` : '/food/dashboard';
  console.log('Redirecting to dashboard path:', dashboardPath);
  
  return <Navigate to={dashboardPath} replace />;
};

export default Index;
