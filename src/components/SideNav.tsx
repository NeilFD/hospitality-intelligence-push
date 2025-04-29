
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
  
  // Add effect to handle HiQ module specifically
  useEffect(() => {
    // Check if we're on an HiQ page and set the current module
    if (location.pathname.includes('/hiq')) {
      console.log('SideNav: HiQ path detected, setting currentModule to hiq');
      
      if (currentModule !== 'hiq') {
        setCurrentModule('hiq');
      }
      
      // Update localStorage to persist the HiQ module settings
      try {
        const storeData = localStorage.getItem('tavern-kitchen-ledger');
        if (storeData) {
          const parsedData = JSON.parse(storeData);
          
          if (parsedData.state) {
            // Ensure HiQ is in the modules list
            if (parsedData.state.modules) {
              let hasHiq = false;
              
              for (const module of parsedData.state.modules) {
                if (module.type === 'hiq') {
                  hasHiq = true;
                  break;
                }
              }
              
              if (!hasHiq) {
                parsedData.state.modules.push({
                  id: 'hiq',
                  type: 'hiq',
                  name: 'HiQ',
                  displayOrder: 900
                });
              }
            }
            
            // Set current module to hiq
            parsedData.state.currentModule = 'hiq';
            
            localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
            console.log('SideNav: Updated localStorage to force HiQ module');
          }
        }
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
    }
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
