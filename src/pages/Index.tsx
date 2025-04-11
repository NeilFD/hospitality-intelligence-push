
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
  
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
};

export default Index;
