
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
  
  // Aggressively enforce current module based on URL path
  useEffect(() => {
    const path = location.pathname;
    console.log('SideNav: Current path:', path, 'Current module:', currentModule);
    
    // HiQ path detection
    if (path.startsWith('/hiq') || path.includes('/hiq/')) {
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
    if (!location.pathname.includes('/hiq')) return;
    
    // Double check after a short delay to make sure the module is set correctly
    const timer = setTimeout(() => {
      if (currentModule !== 'hiq') {
        console.log('SideNav: Delayed check - forcing currentModule to hiq');
        setCurrentModule('hiq');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location, currentModule, setCurrentModule]);
  
  return (
    <Sidebar className={cn("w-[250px] border-r", className)} data-hiq-path={location.pathname.includes('/hiq')}>
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
