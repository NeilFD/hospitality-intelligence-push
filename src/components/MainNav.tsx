
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
  const [activeMasterItem, setActiveMasterItem] = useState<string>('dashboard');
  const [activeTeamItem, setActiveTeamItem] = useState<string>('dashboard');
  
  // Always determine if we're on any path directly from the location
  const isHiqPath = location.pathname.includes('/hiq');
  const isMasterPath = location.pathname.includes('/master');
  const isTeamPath = location.pathname.includes('/team');
  
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
        setAccessibleModules(['home', 'food', 'beverage', 'pl', 'wages', 'team', 'hiq', 'master']);
      });
  }, []);

  // When on a specific page, set current module accordingly
  useEffect(() => {
    const path = location.pathname;
    
    if (isHiqPath && currentModule !== 'hiq') {
      console.log('MainNav: Setting currentModule to hiq');
      setCurrentModule('hiq');
    } else if (isMasterPath && currentModule !== 'master') {
      console.log('MainNav: Setting currentModule to master');
      setCurrentModule('master');
    } else if (path.includes('/team') && currentModule !== 'team') {
      console.log('MainNav: Setting currentModule to team');
      setCurrentModule('team');
    } else if (path.includes('/food') && currentModule !== 'food') {
      console.log('MainNav: Setting currentModule to food');
      setCurrentModule('food');
    } else if (path.includes('/beverage') && currentModule !== 'beverage') {
      console.log('MainNav: Setting currentModule to beverage');
      setCurrentModule('beverage');
    } else if (path.includes('/pl') && currentModule !== 'pl') {
      console.log('MainNav: Setting currentModule to pl');
      setCurrentModule('pl');
    } else if (path.includes('/wages') && currentModule !== 'wages') {
      console.log('MainNav: Setting currentModule to wages');
      setCurrentModule('wages');
    } else if (path.includes('/home') && currentModule !== 'home') {
      console.log('MainNav: Setting currentModule to home');
      setCurrentModule('home');
    }
  }, [location.pathname, currentModule, setCurrentModule]);

  // Determine active HiQ section based on current path
  useEffect(() => {
    const path = location.pathname;
    
    console.log('MainNav: Current path:', path, 'Current module:', currentModule);
    
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
    
    if (path.includes('/master/')) {
      if (path.includes('/master/weekly-input')) {
        setActiveMasterItem('weekly-input');
      } else if (path.includes('/master/month-summary')) {
        setActiveMasterItem('month-summary');
      } else {
        setActiveMasterItem('dashboard');
      }
    }
    
    if (path.includes('/team/')) {
      if (path.includes('/team/chat')) {
        setActiveTeamItem('chat');
      } else if (path.includes('/team/noticeboard')) {
        setActiveTeamItem('noticeboard');
      } else if (path.includes('/team/knowledge')) {
        setActiveTeamItem('knowledge');
      } else {
        setActiveTeamItem('dashboard');
      }
    }
    
  }, [location.pathname, currentModule]);

  // Force module visibility regardless of other settings
  useEffect(() => {
    const requiredModules = ['hiq', 'master', 'food', 'beverage', 'pl', 'wages', 'team'];
    
    requiredModules.forEach(module => {
      if (!accessibleModules.includes(module as ModuleType)) {
        console.log(`MainNav: Explicitly adding ${module} module to sidebar`);
        setAccessibleModules(prev => [...prev, module as ModuleType]);
      }
    });
  }, [accessibleModules]);
  
  // Debug function to help understand the current state
  const renderHiQSubmenu = () => {
    console.log('MainNav: Rendering HiQ submenu. Active item:', activeHiqItem);
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
  
  const renderMasterSubmenu = () => {
    console.log('MainNav: Rendering Master submenu. Active item:', activeMasterItem);
    return (
      <div className="pl-6 mt-1 space-y-1 border-l-2 border-white/20 ml-3" data-master-submenu="true">
        <NavItem 
          to="/master/dashboard" 
          label="Dashboard" 
          icon="hospitality" 
          active={activeMasterItem === 'dashboard'} 
        />
        <NavItem 
          to="/master/month-summary" 
          label="Month Summary" 
          icon="performance" 
          active={activeMasterItem === 'month-summary'} 
        />
      </div>
    );
  };
  
  const renderTeamSubmenu = () => {
    console.log('MainNav: Rendering Team submenu. Active item:', activeTeamItem);
    return (
      <div className="pl-6 mt-1 space-y-1 border-l-2 border-white/20 ml-3" data-team-submenu="true">
        <NavItem 
          to="/team/dashboard" 
          label="Dashboard" 
          icon="team" 
          active={activeTeamItem === 'dashboard'} 
        />
        <NavItem 
          to="/team/chat" 
          label="Team Chat" 
          icon="message-square" 
          active={activeTeamItem === 'chat'} 
        />
        <NavItem 
          to="/team/noticeboard" 
          label="Noticeboard" 
          icon="beverage" 
          active={activeTeamItem === 'noticeboard'} 
        />
        <NavItem 
          to="/team/knowledge" 
          label="Knowledge Base" 
          icon="food" 
          active={activeTeamItem === 'knowledge'} 
        />
      </div>
    );
  };
  
  return (
    <nav className={className} data-current-module={currentModule}>
      <div className="space-y-1">
        {/* Always show Home */}
        <NavItem to="/home/dashboard" label="Home" icon="home" active={currentModule === 'home'} />
        
        {/* Daily Info (Master) */}
        {accessibleModules.includes('master') && (
          <NavItem to="/master/dashboard" label="Daily Info" icon="master" active={currentModule === 'master'} />
        )}
        {isMasterPath && renderMasterSubmenu()}
        
        {/* Conditionally show other modules based on permissions */}
        {accessibleModules.includes('food') && (
          <NavItem to="/food/dashboard" label="Food Hub" icon="food" active={currentModule === 'food'} />
        )}
        
        {accessibleModules.includes('beverage') && (
          <NavItem to="/beverage/dashboard" label="Beverage Hub" icon="beverage" active={currentModule === 'beverage'} />
        )}
        
        {accessibleModules.includes('pl') && (
          <NavItem to="/pl/dashboard" label="P&L Tracker" icon="pl" active={currentModule === 'pl'} />
        )}
        
        {accessibleModules.includes('wages') && (
          <NavItem to="/wages/dashboard" label="Wages Tracker" icon="wages" active={currentModule === 'wages'} />
        )}
        
        {accessibleModules.includes('team') && (
          <NavItem to="/team/dashboard" label="Team" icon="team" active={currentModule === 'team'} />
        )}
        {isTeamPath && renderTeamSubmenu()}
        
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
