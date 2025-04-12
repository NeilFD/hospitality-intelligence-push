
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
  
  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
    '2xl': 'text-6xl'
  };

  return (
    <div 
      className={cn(
        sizeClasses[size], 
        'bg-hi-purple flex items-center justify-center rounded-lg relative animate-float', 
        className
      )}
    >
      <span className={cn(
        "text-white font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2", 
        textSizeClasses[size]
      )}>Hi</span>
    </div>
  );
};
