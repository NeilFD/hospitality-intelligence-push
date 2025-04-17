
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';
import FoodDashboard from '@/pages/food/Dashboard';
import BeverageDashboard from '@/pages/beverage/Dashboard';
import HomeDashboard from '@/pages/home/Dashboard';

export default function Dashboard() {
  const currentModule = useCurrentModule();
  const location = useLocation();
  
  // Determine which dashboard to display based on the URL
  const path = location.pathname;
  
  useEffect(() => {
    console.log(`Dashboard: Current path is ${path}, module is ${currentModule}`);
  }, [path, currentModule]);
  
  // Route to the specific dashboard component based on the path
  if (path.includes('/home/dashboard')) {
    return <HomeDashboard />;
  } else if (path.includes('/beverage/dashboard')) {
    return <BeverageDashboard />;
  } else if (path.includes('/food/dashboard')) {
    return <FoodDashboard />;
  }
  
  // If we're on the generic dashboard, redirect to the appropriate one
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
}
