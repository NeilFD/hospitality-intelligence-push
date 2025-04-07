
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
  return (
    <div className={cn('flex items-center', className)}>
      {/* Logo has been removed as requested */}
    </div>
  );
};
