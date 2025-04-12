
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

  return (
    <div 
      className={cn(
        sizeClasses[size], 
        'flex flex-col items-center justify-center relative', 
        className
      )}
    >
      <img 
        src="/lovable-uploads/961a56b6-b951-4f59-b386-636a8d01fb1c.png" 
        alt="Hi" 
        className="w-3/4 h-3/4 object-contain"
      />
    </div>
  );
};
