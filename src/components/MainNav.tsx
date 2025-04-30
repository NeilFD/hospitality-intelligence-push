
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
  
  // Always determine if we're on any HiQ page directly from path
  const isHiqPath = location.pathname.includes('/hiq');
  
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

  // When on a HiQ page, set current module to 'hiq'
  useEffect(() => {
    if (isHiqPath && currentModule !== 'hiq') {
      console.log('MainNav: Setting currentModule to hiq because we are on a HiQ path');
      setCurrentModule('hiq');
    }
  }, [isHiqPath, currentModule, setCurrentModule]);

  // Determine active HiQ section based on current path
  useEffect(() => {
    const path = location.pathname;
    
    console.log('MainNav: Current path:', path, 'Current module:', currentModule, 'Is HiQ path:', isHiqPath);
    
    if (path.includes('/hiq/')) {
      if (path.includes('/hiq/performance')) {
        setActiveHiqItem('performance');
      } else if (path.includes('/hiq/chat')) {
        setActiveHiqItem('chat');
      } else if (path.includes('/hiq/rotas')) {
        setActiveHiqItem('rotas');
      } else if (path.includes('/hiq/rota-scheduling')) {
        setActiveHiqItem('rota-scheduling');
      } else {
        setActiveHiqItem('dashboard');
      }
    }
    
    console.log('MainNav: Active HiQ item set to:', activeHiqItem);
  }, [location.pathname, currentModule]);

  // Force HiQ module visibility regardless of other settings
  useEffect(() => {
    if (!accessibleModules.includes('hiq')) {
      console.log('MainNav: Explicitly adding HiQ module to sidebar');
      setAccessibleModules(prev => [...prev, 'hiq']);
    }
  }, [accessibleModules]);
  
  // Debug function to help understand the current state
  const renderHiQSubmenu = () => {
    console.log('MainNav: Rendering HiQ submenu. Active item:', activeHiqItem, 'isHiqPath:', isHiqPath);
    return (
      <div className="pl-6 mt-1 space-y-1 border-l-2 border-white/20 ml-3" data-hiq-submenu="true">
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
        <NavItem 
          to="/hiq/chat" 
          label="Chat Assistant" 
          icon="message-square" 
          active={activeHiqItem === 'chat'} 
        />
        <NavItem 
          to="/hiq/rotas" 
          label="Staff Rotas" 
          icon="calendar" 
          active={activeHiqItem === 'rotas'} 
        />
        <NavItem 
          to="/hiq/rota-scheduling" 
          label="Rota Scheduling" 
          icon="calendar" 
          active={activeHiqItem === 'rota-scheduling'} 
        />
      </div>
    );
  };
  
  return (
    <nav className={className} data-current-module={currentModule} data-hiq-path={isHiqPath}>
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
        
        {/* HiQ submenu items - ALWAYS show when on any HiQ path */}
        {isHiqPath && renderHiQSubmenu()}
        
        <NavItem to="/control-centre" label="Control Centre" icon="performance" />
      </div>
    </nav>
  );
};

export default MainNav;
