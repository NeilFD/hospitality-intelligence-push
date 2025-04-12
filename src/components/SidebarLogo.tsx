
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
        'flex flex-col items-center justify-center', 
        className
      )}
    >
      <img 
        src="/lovable-uploads/db99edaf-26df-47e0-9251-892661b64c7b.png" 
        alt="Hi" 
        className="w-full h-full"
      />
    </div>
  );
};
