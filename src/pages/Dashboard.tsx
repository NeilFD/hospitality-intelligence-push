
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
      
      // Force update localStorage too
      try {
        const storeData = localStorage.getItem('tavern-kitchen-ledger');
        if (storeData) {
          const parsedData = JSON.parse(storeData);
          if (parsedData.state) {
            parsedData.state.currentModule = 'hiq';
            localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
            console.log('Dashboard: Forced update of localStorage to set currentModule to hiq');
          }
        }
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
    } else if (path.includes('/wages/dashboard') && currentModule !== 'wages') {
      console.log('Dashboard: Setting current module to wages');
      setCurrentModule('wages');
    }
  }, [path, currentModule, setCurrentModule]);
  
  // Add this effect to clear localStorage cache if needed
  useEffect(() => {
    // Special case for HiQ - force clear any cached state
    if (path.includes('/hiq')) {
      console.log('Dashboard: HiQ path detected, checking localStorage cache');
      
      try {
        const storeData = localStorage.getItem('tavern-kitchen-ledger');
        if (storeData) {
          const parsedData = JSON.parse(storeData);
          
          // Check if the HiQ module exists in the state
          if (parsedData.state && parsedData.state.modules) {
            const hiqModule = parsedData.state.modules.find((m: any) => m.type === 'hiq');
            
            if (!hiqModule) {
              console.log('Dashboard: HiQ module missing from localStorage, adding it');
              parsedData.state.modules.push({
                id: 'hiq',
                type: 'hiq',
                name: 'HiQ',
                displayOrder: 900
              });
              localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
            }
            
            // Force current module to be hiq
            if (parsedData.state.currentModule !== 'hiq') {
              console.log('Dashboard: Current module in localStorage is not hiq, forcing update');
              parsedData.state.currentModule = 'hiq';
              localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
            }
          }
        }
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
    }
  }, [path]);
  
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
  } else if (path.includes('/wages/dashboard')) {
    // Let the wages dashboard component handle its own rendering
    return null;
  }
  
  // If we're on the generic dashboard, redirect to the appropriate one
  console.log('Dashboard: No specific path match, redirecting to', `/${currentModule}/dashboard`);
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
}
