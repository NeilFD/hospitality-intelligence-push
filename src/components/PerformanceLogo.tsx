
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
    <div 
      className={cn(
        sizeClasses[size], 
        'flex items-center justify-center relative animate-float', 
        className
      )}
    >
      <img 
        src="/lovable-uploads/b92ba31a-a7de-4208-9fb9-2a5db82c5729.png" 
        alt="Hi" 
        className="w-3/4 h-3/4 object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
};
