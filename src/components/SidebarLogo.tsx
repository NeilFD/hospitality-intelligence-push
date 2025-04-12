
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
    <img 
      alt="Hi" 
      className={cn(sizeClasses[size], className)}
      src="/lovable-uploads/b92ba31a-a7de-4208-9fb9-2a5db82c5729.png" 
    />
  );
};
