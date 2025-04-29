
import React, { useEffect, useState } from 'react';
import NavItem from './NavItem';
import { useCurrentModule } from '@/lib/store';
import { getUserAccessibleModules } from '@/services/permissions-service';
import { ModuleType } from '@/types/kitchen-ledger';

interface MainNavProps {
  className?: string;
}

const MainNav: React.FC<MainNavProps> = ({ className }) => {
  const currentModule = useCurrentModule();
  const [accessibleModules, setAccessibleModules] = useState<ModuleType[]>([]);

  useEffect(() => {
    // Get the user role from localStorage
    const userRole = localStorage.getItem('user-role') || 'GOD';
    
    // Get the accessible modules for the user
    getUserAccessibleModules(userRole)
      .then(modules => {
        console.log('Accessible modules:', modules);
        setAccessibleModules(modules);
      })
      .catch(error => {
        console.error('Error fetching accessible modules:', error);
        // Fallback to showing all modules if there's an error
        setAccessibleModules(['home', 'food', 'beverage', 'pl', 'wages', 'team', 'hiq']);
      });
  }, []);

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
        
        {/* Explicitly add HiQ */}
        {accessibleModules.includes('hiq') && (
          <NavItem to="/hiq/dashboard" label="HiQ" icon="hiq" active={currentModule === 'hiq'} />
        )}
        
        <NavItem to="/control-centre" label="Control Centre" icon="performance" />
      </div>
    </nav>
  );
};

export default MainNav;
