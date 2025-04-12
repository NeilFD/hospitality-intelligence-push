
import React from 'react';
import { cn } from '@/lib/utils';

interface TavernLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const TavernLogo: React.FC<TavernLogoProps> = ({
  className,
  size = 'lg'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-24 w-24',
    xl: 'h-24 w-24',
    '2xl': 'h-40 w-40',
    '3xl': 'h-64 w-64',
    '4xl': 'h-96 w-96'
  };
  
  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-6xl',
    xl: 'text-6xl',
    '2xl': 'text-7xl',
    '3xl': 'text-8xl',
    '4xl': 'text-9xl'
  };

  return (
    <div 
      className={cn(
        sizeClasses[size], 
        'bg-white flex items-center justify-center rounded-lg', 
        className
      )}
    >
      <span className={cn("text-hi-purple font-bold", textSizeClasses[size])}>Hi</span>
    </div>
  );
};

