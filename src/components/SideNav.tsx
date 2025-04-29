
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
  
  // Aggressively enforce current module based on URL path
  useEffect(() => {
    const path = location.pathname;
    console.log('SideNav: Current path:', path, 'Current module:', currentModule, 'Is HiQ path:', isHiqPath);
    
    // HiQ path detection - highest priority
    if (path.includes('/hiq')) {
      console.log('SideNav: HiQ path detected, forcing currentModule to hiq');
      
      // Always set to HiQ when on HiQ pages, regardless of current state
      if (currentModule !== 'hiq') {
        console.log('SideNav: Updating module from', currentModule, 'to hiq');
        setCurrentModule('hiq');
        
        // Force update localStorage directly for maximum compatibility
        try {
          const storeData = localStorage.getItem('tavern-kitchen-ledger');
          if (storeData) {
            const parsedData = JSON.parse(storeData);
            if (parsedData.state) {
              parsedData.state.currentModule = 'hiq';
              localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
              console.log('SideNav: Directly updated localStorage currentModule to hiq');
            }
          }
          
          // Also update the hospitality-intelligence store for redundancy
          const hiData = localStorage.getItem('hospitality-intelligence');
          if (hiData) {
            const parsedData = JSON.parse(hiData);
            if (parsedData.state) {
              parsedData.state.currentModule = 'hiq';
              localStorage.setItem('hospitality-intelligence', JSON.stringify(parsedData));
              console.log('SideNav: Updated hospitality-intelligence localStorage');
            }
          }
        } catch (e) {
          console.error('SideNav: Error updating localStorage:', e);
        }
      }
    }
    // Handle other module paths
    else if (path.startsWith('/food')) {
      currentModule !== 'food' && setCurrentModule('food');
    }
    else if (path.startsWith('/beverage')) {
      currentModule !== 'beverage' && setCurrentModule('beverage');
    }
    // Add other module paths as needed
    
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
      className={cn("w-[250px] border-r", className)} 
      data-hiq-path={isHiqPath}
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
