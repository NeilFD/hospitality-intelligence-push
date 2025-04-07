
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
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div 
        className={`${sizeClasses[size]} bg-tavern-blue text-white flex items-center justify-center rounded-full`}
      >
        <span className="font-bold text-xl">T</span>
      </div>
    </div>
  );
};
