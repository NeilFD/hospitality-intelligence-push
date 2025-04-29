import React, { useEffect, useState } from 'react';
import NavItem from './NavItem';
import { useCurrentModule, useSetCurrentModule } from '@/lib/store';
import { getUserAccessibleModules } from '@/services/permissions-service';
import { ModuleType } from '@/types/kitchen-ledger';
import { useLocation } from 'react-router-dom';

interface MainNavProps {
  className?: string;
}

const MainNav: React.FC<MainNavProps> = ({ className }) => {
  const currentModule = useCurrentModule();
  const setCurrentModule = useSetCurrentModule();
  const [accessibleModules, setAccessibleModules] = useState<ModuleType[]>([]);
  const location = useLocation();
  const [activeHiqItem, setActiveHiqItem] = useState<string>('dashboard');

  useEffect(() => {
    // Get the user role from localStorage
    const userRole = localStorage.getItem('user-role') || 'GOD';
    
    // Get the accessible modules for the user
    getUserAccessibleModules(userRole)
      .then(modules => {
        console.log('MainNav: Accessible modules:', modules);
        setAccessibleModules(modules);
      })
      .catch(error => {
        console.error('Error fetching accessible modules:', error);
        // Fallback to showing all modules if there's an error
        setAccessibleModules(['home', 'food', 'beverage', 'pl', 'wages', 'team', 'hiq']);
      });
  }, []);

  // Determine active HiQ section based on current path
  useEffect(() => {
    if (location.pathname.includes('/hiq/')) {
      if (location.pathname.includes('/hiq/performance')) {
        setActiveHiqItem('performance');
      } else {
        setActiveHiqItem('dashboard');
      }
    }
  }, [location.pathname]);

  // Force HiQ module visibility regardless of other settings
  useEffect(() => {
    if (!accessibleModules.includes('hiq')) {
      console.log('MainNav: Explicitly adding HiQ module to sidebar');
      setAccessibleModules(prev => [...prev, 'hiq']);
    }
  }, [accessibleModules]);
  
  // Add a console log to track module state
  useEffect(() => {
    console.log('MainNav: Current module in state:', currentModule);
    console.log('MainNav: Current accessible modules:', accessibleModules);
  }, [currentModule, accessibleModules]);

  return (
    <nav className={className}>
      <div className="space-y-1">
        {/* Always show Home */}
        <NavItem to="/home/dashboard" label="Home" icon="home" active={currentModule === 'home'} />
        
        {/* Conditionally show other modules based on permissions */}
        {accessibleModules.includes('food') && (
          <NavItem to="/food/dashboard" label="Food" icon="food" active={currentModule === 'food'} />
        )}
        
        {accessibleModules.includes('beverage') && (
          <NavItem to="/beverage/dashboard" label="Beverage" icon="beverage" active={currentModule === 'beverage'} />
        )}
        
        {accessibleModules.includes('pl') && (
          <NavItem to="/pl/dashboard" label="P&L" icon="pl" active={currentModule === 'pl'} />
        )}
        
        {accessibleModules.includes('wages') && (
          <NavItem to="/wages/dashboard" label="Wages" icon="wages" active={currentModule === 'wages'} />
        )}
        
        {accessibleModules.includes('team') && (
          <NavItem to="/team/dashboard" label="Team" icon="team" active={currentModule === 'team'} />
        )}
        
        {/* ALWAYS show HiQ regardless of permissions */}
        <NavItem 
          to="/hiq/dashboard" 
          label="HiQ" 
          icon="hiq" 
          active={currentModule === 'hiq'} 
        />
        
        {/* EXPLICITLY only show Dashboard and Performance submenu items for HiQ */}
        {currentModule === 'hiq' && (
          <div className="pl-6 mt-1 space-y-1 border-l-2 border-white/20 ml-3">
            <NavItem 
              to="/hiq/dashboard" 
              label="Dashboard" 
              icon="hospitality" 
              active={activeHiqItem === 'dashboard'} 
            />
            <NavItem 
              to="/hiq/performance" 
              label="Performance and Analysis" 
              icon="performance" 
              active={activeHiqItem === 'performance'} 
            />
          </div>
        )}
        
        <NavItem to="/control-centre" label="Control Centre" icon="performance" />
      </div>
    </nav>
  );
};

export default MainNav;
