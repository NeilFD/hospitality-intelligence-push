
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';

const Index = () => {
  const currentModule = useCurrentModule();
  
  // Force a re-evaluation of the module name
  useEffect(() => {
    console.log('Current module:', currentModule);
  }, [currentModule]);
  
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
};

export default Index;
