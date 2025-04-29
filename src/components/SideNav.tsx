
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
  
  // Force set current module based on URL path
  useEffect(() => {
    const path = location.pathname;
    
    // Check if we're on any HiQ page
    if (path.startsWith('/hiq')) {
      console.log('SideNav: HiQ path detected, setting currentModule to hiq');
      
      if (currentModule !== 'hiq') {
        setCurrentModule('hiq');
      }
    }
    // Handle other module paths similarly if needed
    else if (path.startsWith('/food')) {
      currentModule !== 'food' && setCurrentModule('food');
    }
    else if (path.startsWith('/beverage')) {
      currentModule !== 'beverage' && setCurrentModule('beverage');
    }
    // Add other module paths as needed
    
  }, [location.pathname, currentModule, setCurrentModule]);
  
  return (
    <Sidebar className={cn("w-[250px] border-r", className)}>
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
