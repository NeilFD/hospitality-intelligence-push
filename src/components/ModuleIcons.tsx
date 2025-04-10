
import React from 'react';
import { ModuleType } from '@/types/kitchen-ledger';
import { Sandwich, Wine, Clock, ChartBar, BarChart, Users } from 'lucide-react';

interface ModuleIconProps {
  type: ModuleType;
  className?: string;
}

export const ModuleIcon: React.FC<ModuleIconProps> = ({ type, className }) => {
  switch (type) {
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
    default:
      return <ChartBar className={className} />;
  }
};

export default ModuleIcon;
