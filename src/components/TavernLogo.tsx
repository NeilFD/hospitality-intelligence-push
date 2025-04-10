
import React from 'react';
import { cn } from '@/lib/utils';

interface TavernLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const TavernLogo: React.FC<TavernLogoProps> = ({
  className,
  size = 'lg' // Changed default size from 'md' to 'lg'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
    xl: 'h-24 w-24',
    '2xl': 'h-40 w-40',
    '3xl': 'h-64 w-64',
    '4xl': 'h-96 w-96' // Added even larger size for flexibility
  };

  return <div className={cn('flex items-center justify-center', className)}>
      <div className={`${sizeClasses[size]} bg-tavern-blue text-white flex items-center justify-center rounded-full overflow-hidden`}>
        <img src="/lovable-uploads/e551531e-e30f-49d3-8197-b94fe8312491.png" alt="The Tavern Logo" className="w-full h-full object-contain" />
      </div>
    </div>;
};

