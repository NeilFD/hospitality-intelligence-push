
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentModule, useSetCurrentModule } from '@/lib/store';
import FoodDashboard from '@/pages/food/Dashboard';
import BeverageDashboard from '@/pages/beverage/Dashboard';
import HomeDashboard from '@/pages/home/Dashboard';
import HiQDashboard from '@/pages/hiq/Dashboard';
import MasterDashboard from '@/pages/master/Dashboard';
import PLDashboard from '@/pages/pl/Dashboard';
import WagesDashboard from '@/pages/wages/Dashboard';
import TeamDashboard from '@/pages/team/Dashboard';

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
      console.log('Dashboard: Setting current module to home');
      setCurrentModule('home');
    } else if (path.includes('/beverage/dashboard') && currentModule !== 'beverage') {
      console.log('Dashboard: Setting current module to beverage');
      setCurrentModule('beverage');
    } else if (path.includes('/food/dashboard') && currentModule !== 'food') {
      console.log('Dashboard: Setting current module to food');
      setCurrentModule('food');
    } else if (path.includes('/hiq/dashboard') && currentModule !== 'hiq') {
      console.log('Dashboard: Setting current module to hiq');
      setCurrentModule('hiq');
    } else if (path.includes('/master/dashboard') && currentModule !== 'master') {
      console.log('Dashboard: Setting current module to master');
      setCurrentModule('master');
    } else if (path.includes('/pl/dashboard') && currentModule !== 'pl') {
      console.log('Dashboard: Setting current module to pl');
      setCurrentModule('pl');
    } else if (path.includes('/wages/dashboard') && currentModule !== 'wages') {
      console.log('Dashboard: Setting current module to wages');
      setCurrentModule('wages');
    } else if (path.includes('/team/dashboard') && currentModule !== 'team') {
      console.log('Dashboard: Setting current module to team');
      setCurrentModule('team');
    }
    
    // Update localStorage for persistence
    try {
      const storeData = localStorage.getItem('tavern-kitchen-ledger');
      if (storeData) {
        const parsedData = JSON.parse(storeData);
        if (parsedData.state) {
          parsedData.state.currentModule = currentModule;
          localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
          console.log('Dashboard: Updated localStorage currentModule to', currentModule);
        }
      }
    } catch (e) {
      console.error('Dashboard: Error updating localStorage:', e);
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
    console.log('Dashboard: Rendering HiQ dashboard component');
    return <HiQDashboard />;
  } else if (path.includes('/master/dashboard')) {
    console.log('Dashboard: Rendering Master dashboard component');
    return <MasterDashboard />;
  } else if (path.includes('/pl/dashboard')) {
    console.log('Dashboard: Rendering P&L dashboard component');
    return <PLDashboard />;
  } else if (path.includes('/wages/dashboard')) {
    console.log('Dashboard: Rendering Wages dashboard component');
    return <WagesDashboard />;
  } else if (path.includes('/team/dashboard')) {
    console.log('Dashboard: Rendering Team dashboard component');
    return <TeamDashboard />;
  }
  
  // If we're on the generic dashboard, redirect to the appropriate one
  console.log('Dashboard: No specific path match, redirecting to', `/${currentModule}/dashboard`);
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
}
