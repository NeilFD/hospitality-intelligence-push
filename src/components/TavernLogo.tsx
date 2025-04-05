
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

  return (
    <div className={cn('flex items-center', className)}>
      <img 
        src="/lovable-uploads/68465c1c-150f-4395-95ac-dd72d2fcf16b.png" 
        alt="The Tavern Logo" 
        className={cn(
          'object-contain transition-all duration-300 ease-in-out',
          sizeClasses[size]
        )}
      />
    </div>
  );
};
