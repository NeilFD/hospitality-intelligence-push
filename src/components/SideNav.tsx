
import React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/ui/sidebar';
import SidebarLogo from './SidebarLogo';
import MainNav from './MainNav';

interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
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
