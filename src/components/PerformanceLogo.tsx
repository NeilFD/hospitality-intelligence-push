
import React from 'react';
import { cn } from '@/lib/utils';

interface PerformanceLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const PerformanceLogo: React.FC<PerformanceLogoProps> = ({
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
      src="/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png" 
      alt="Hi" 
      className={cn(
        sizeClasses[size], 
        'object-contain', 
        className
      )}
    />
  );
};
