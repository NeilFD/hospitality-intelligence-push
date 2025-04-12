
import React from 'react';
import { cn } from '@/lib/utils';
interface SidebarLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}
export const SidebarLogo: React.FC<SidebarLogoProps> = ({
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
    '2xl': 'h-24 w-24'
  };
  return <div className={cn(sizeClasses[size], 'flex flex-col items-center justify-center', className)}>
      <img alt="Hi" className="w-full h-full object-cover" src="/lovable-uploads/4234e734-6ccc-48b7-8f35-d14a78ef4afc.png" />
    </div>;
};
