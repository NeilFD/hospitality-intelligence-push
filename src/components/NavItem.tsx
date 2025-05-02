
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ModuleIcon from './ModuleIcons';
import { ModuleType } from '@/types/kitchen-ledger';

interface NavItemProps {
  to: string;
  label: string;
  icon: ModuleType | 'hospitality' | 'message-square' | 'calendar';
  active?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon, active }) => {
  console.log(`NavItem rendering: ${label}, active: ${active}`);
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-white",
          isActive || active ? "text-white" : "text-white/70 hover:bg-white/10"
        )
      }
    >
      <ModuleIcon type={icon} className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
};

export default NavItem;
