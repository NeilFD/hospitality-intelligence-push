
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
      src="/lovable-uploads/4236b6e6-6214-4c69-b02c-62083db662f9.png" 
      alt="Hi" 
      className={cn(sizeClasses[size], className)}
    />
  );
};
