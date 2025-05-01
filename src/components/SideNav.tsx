
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/ui/sidebar';
import SidebarLogo from './SidebarLogo';
import MainNav from './MainNav';
import { useLocation } from 'react-router-dom';
import { useCurrentModule, useSetCurrentModule } from '@/lib/store';

interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
  const location = useLocation();
  const currentModule = useCurrentModule();
  const setCurrentModule = useSetCurrentModule();
  
  // Immediately determine if we're on a HiQ path
  const isHiqPath = location.pathname.includes('/hiq');
  const isMasterPath = location.pathname.includes('/master');
  const isFoodPath = location.pathname.includes('/food');
  const isBeveragePath = location.pathname.includes('/beverage');
  const isTeamPath = location.pathname.includes('/team');
  const isWagesPath = location.pathname.includes('/wages');
  const isPLPath = location.pathname.includes('/pl');
  
  // Aggressively enforce current module based on URL path
  useEffect(() => {
    const path = location.pathname;
    console.log('SideNav: Current path:', path, 'Current module:', currentModule, 'Is HiQ path:', isHiqPath);
    
    // Module path detection - set currentModule based on path
    if (path.includes('/hiq') && currentModule !== 'hiq') {
      console.log('SideNav: HiQ path detected, forcing currentModule to hiq');
      setCurrentModule('hiq');
    } else if (path.includes('/master') && currentModule !== 'master') {
      console.log('SideNav: Master path detected, setting currentModule to master');
      setCurrentModule('master');
    } else if (path.includes('/home/dashboard') && currentModule !== 'home') {
      console.log('SideNav: Setting current module to home');
      setCurrentModule('home');
    } else if (path.includes('/beverage') && currentModule !== 'beverage') {
      console.log('SideNav: Setting current module to beverage');
      setCurrentModule('beverage');
    } else if (path.includes('/food') && currentModule !== 'food') {
      console.log('SideNav: Setting current module to food');
      setCurrentModule('food');
    } else if (path.includes('/team') && currentModule !== 'team') {
      console.log('SideNav: Setting current module to team');
      setCurrentModule('team');
    } else if (path.includes('/wages') && currentModule !== 'wages') {
      console.log('SideNav: Setting current module to wages');
      setCurrentModule('wages');
    } else if (path.includes('/pl') && currentModule !== 'pl') {
      console.log('SideNav: Setting current module to pl');
      setCurrentModule('pl');
    }
    
    // Ensure localStorage is updated for the current module
    try {
      const storeData = localStorage.getItem('tavern-kitchen-ledger');
      if (storeData) {
        const parsedData = JSON.parse(storeData);
        if (parsedData.state && parsedData.state.currentModule !== currentModule) {
          parsedData.state.currentModule = currentModule;
          localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
          console.log('SideNav: Updated localStorage currentModule to', currentModule);
        }
      }
    } catch (e) {
      console.error('SideNav: Error updating localStorage:', e);
    }
  }, [location.pathname, currentModule, setCurrentModule]);
  
  // Add an additional effect to double-check that HiQ submenu is properly handled
  useEffect(() => {
    // Only run this effect if we're on an HiQ page
    if (!isHiqPath) return;
    
    // Ensure the module is set correctly even if the path changes within HiQ pages
    console.log('SideNav: On HiQ page, ensuring module is set correctly');
    
    // Force module to HiQ immediately 
    if (currentModule !== 'hiq') {
      setCurrentModule('hiq');
    }
    
    // Double check multiple times to handle race conditions
    const timers = [
      setTimeout(() => {
        if (!document.querySelector('[data-hiq-submenu="true"]')) {
          console.log('SideNav: HiQ submenu not found in DOM after 50ms, forcing re-render');
          setCurrentModule('hiq'); // Force re-render
          
          // Try to force the sidebar to update
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) {
            sidebar.setAttribute('data-force-update', Date.now().toString());
          }
        }
      }, 50),
      setTimeout(() => {
        if (!document.querySelector('[data-hiq-submenu="true"]')) {
          console.log('SideNav: HiQ submenu not found in DOM after 200ms, forcing re-render');
          setCurrentModule('hiq'); // Force re-render
        }
      }, 200)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [isHiqPath, currentModule, setCurrentModule]);
  
  return (
    <Sidebar 
      className={cn("w-[250px] border-r flex-shrink-0", className)} 
      data-hiq-path={isHiqPath}
      data-master-path={isMasterPath}
      data-food-path={isFoodPath}
      data-beverage-path={isBeveragePath}
      data-team-path={isTeamPath}
      data-wages-path={isWagesPath}
      data-pl-path={isPLPath}
      data-current-module={currentModule}
    >
      <div className="flex h-full flex-col">
        <div className="p-6">
          <SidebarLogo />
        </div>
        <div className="flex-1 overflow-auto py-2">
          <MainNav className="px-4" />
        </div>
      </div>
    </Sidebar>
  );
}

export default SideNav;
