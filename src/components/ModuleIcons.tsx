
import React from 'react';
import { Calendar, BarChart, CheckCircle, Code, DollarSign, Home, Menu, MessageCircle, LineChart, PieChart, Settings, ShoppingCart, SprayCan, Users, Wallet } from 'lucide-react';
import { ModuleType } from '@/types/kitchen-ledger';

interface ModuleIconProps {
  type: ModuleType | 'hospitality' | 'message-square' | 'calendar';
  className?: string;
}

const ModuleIcon: React.FC<ModuleIconProps> = ({ type, className }) => {
  switch (type) {
    case 'food':
      return <ShoppingCart className={className} />;
    case 'beverage':
      return <SprayCan className={className} />;
    case 'pl':
      return <LineChart className={className} />;
    case 'wages':
      return <Wallet className={className} />;
    case 'team':
      return <Users className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'hiq':
      return <PieChart className={className} />;
    case 'performance':
      return <BarChart className={className} />;
    case 'hospitality':
      return <CheckCircle className={className} />;
    case 'message-square':
      return <MessageCircle className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    default:
      return <Settings className={className} />;
  }
};

export default ModuleIcon;
