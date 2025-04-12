
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

  return <div className={cn('flex items-center justify-center', className)}>
      <div className={`${sizeClasses[size]} overflow-hidden`}>
        <img src="/lovable-uploads/69a5215d-88c2-4e73-880a-f0820234832d.png" alt="Hi Logo" className="w-full h-full object-contain" />
      </div>
    </div>;
};
