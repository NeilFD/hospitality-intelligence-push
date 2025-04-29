
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentModule, useSetCurrentModule } from '@/lib/store';
import FoodDashboard from '@/pages/food/Dashboard';
import BeverageDashboard from '@/pages/beverage/Dashboard';
import HomeDashboard from '@/pages/home/Dashboard';
import HiQDashboard from '@/pages/hiq/Dashboard';

export default function Dashboard() {
  const currentModule = useCurrentModule();
  const setCurrentModule = useSetCurrentModule();
  const location = useLocation();
  
  // Determine which dashboard to display based on the URL
  const path = location.pathname;
  
  useEffect(() => {
    console.log(`Dashboard: Current path is ${path}, module is ${currentModule}`);
    
    // Update the current module based on the path
    if (path.includes('/home/dashboard') && currentModule !== 'home') {
      console.log('Setting current module to home');
      setCurrentModule('home');
    } else if (path.includes('/beverage/dashboard') && currentModule !== 'beverage') {
      console.log('Setting current module to beverage');
      setCurrentModule('beverage');
    } else if (path.includes('/food/dashboard') && currentModule !== 'food') {
      console.log('Setting current module to food');
      setCurrentModule('food');
    } else if (path.includes('/hiq/dashboard') && currentModule !== 'hiq') {
      console.log('Setting current module to hiq');
      setCurrentModule('hiq');
    } else if (path.includes('/wages/dashboard') && currentModule !== 'wages') {
      console.log('Setting current module to wages');
      setCurrentModule('wages');
    }
  }, [path, currentModule, setCurrentModule]);
  
  // Route to the specific dashboard component based on the path
  if (path.includes('/home/dashboard')) {
    return <HomeDashboard />;
  } else if (path.includes('/beverage/dashboard')) {
    return <BeverageDashboard />;
  } else if (path.includes('/food/dashboard')) {
    return <FoodDashboard />;
  } else if (path.includes('/hiq/dashboard')) {
    return <HiQDashboard />;
  } else if (path.includes('/wages/dashboard')) {
    // Let the wages dashboard component handle its own rendering
    return null;
  }
  
  // If we're on the generic dashboard, redirect to the appropriate one
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
}
