
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';

const Index = () => {
  const currentModule = useCurrentModule();
  
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
};

export default Index;
