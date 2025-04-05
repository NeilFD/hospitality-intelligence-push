import React from 'react';
import { cn } from '@/lib/utils';
interface TavernLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
export const TavernLogo: React.FC<TavernLogoProps> = ({
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-12 w-auto',
    md: 'h-20 w-auto',
    lg: 'h-32 w-auto'
  };
  return <div className={cn('flex items-center', className)}>
      
    </div>;
};