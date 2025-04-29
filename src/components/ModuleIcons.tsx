
import React from 'react';
import { ModuleType } from '@/types/kitchen-ledger';
import { Sandwich, Wine, Clock, ChartBar, BarChart, Users, ConciergeBell, Home, Brain } from 'lucide-react';

interface ModuleIconProps {
  type: ModuleType | 'hospitality';
  className?: string;
}

export const ModuleIcon: React.FC<ModuleIconProps> = ({ type, className }) => {
  switch (type) {
    case 'home':
      return <Home className={className} />;
    case 'food':
      return <Sandwich className={className} />;
    case 'beverage':
      return <Wine className={className} />;
    case 'pl':
      return <span className={className || "text-lg font-bold"}>£</span>;
    case 'wages':
      return <Clock className={className} />;
    case 'performance':
      return <BarChart className={className} />;
    case 'team':
      return <Users className={className} />;
    case 'hiq':
      return <Brain className={className} />;
    case 'hospitality':
      return <ConciergeBell className={className} />;
    default:
      return <ChartBar className={className} />;
  }
};

export default ModuleIcon;
