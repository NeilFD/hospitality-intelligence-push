
import React from 'react';
import { cn } from '@/lib/utils';

interface PerformanceLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const PerformanceLogo: React.FC<PerformanceLogoProps> = ({
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40',
    '2xl': 'h-48 w-48',
    '3xl': 'h-64 w-64',
    '4xl': 'h-96 w-96'
  };
  
  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-6xl',
    lg: 'text-7xl',
    xl: 'text-8xl',
    '2xl': 'text-9xl',
    '3xl': 'text-[120px]',
    '4xl': 'text-[144px]'
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
