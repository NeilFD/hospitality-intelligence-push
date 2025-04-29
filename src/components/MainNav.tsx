
import React from 'react';
import NavItem from './NavItem';
import { useCurrentModule } from '@/lib/store';

interface MainNavProps {
  className?: string;
}

const MainNav: React.FC<MainNavProps> = ({ className }) => {
  const currentModule = useCurrentModule();

  return (
    <nav className={className}>
      <div className="space-y-1">
        <NavItem to="/home/dashboard" label="Home" icon="home" active={currentModule === 'home'} />
        <NavItem to="/food/dashboard" label="Food" icon="food" active={currentModule === 'food'} />
        <NavItem to="/beverage/dashboard" label="Beverage" icon="beverage" active={currentModule === 'beverage'} />
        <NavItem to="/pl/dashboard" label="P&L" icon="pl" active={currentModule === 'pl'} />
        <NavItem to="/wages/dashboard" label="Wages" icon="wages" active={currentModule === 'wages'} />
        <NavItem to="/team/dashboard" label="Team" icon="team" active={currentModule === 'team'} />
        <NavItem to="/hiq/dashboard" label="HiQ" icon="hiq" active={currentModule === 'hiq'} />
        <NavItem to="/control-centre" label="Control Centre" icon="performance" />
      </div>
    </nav>
  );
};

export default MainNav;
