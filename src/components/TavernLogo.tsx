
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

  return (
    <div 
      className={cn(
        sizeClasses[size], 
        'flex items-center justify-center', 
        className
      )}
    >
      <img 
        src="/lovable-uploads/b92ba31a-a7de-4208-9fb9-2a5db82c5729.png" 
        alt="Hi" 
        className="w-3/4 h-3/4 object-contain"
      />
    </div>
  );
};
