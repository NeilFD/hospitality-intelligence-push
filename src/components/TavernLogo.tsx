
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
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 240 120" 
        className={sizeClasses[size]}
      >
        <path 
          d="M30 60 L120 10 L210 60 L120 110 Z" 
          fill="#4B6584" 
        />
        <text 
          x="120" 
          y="75" 
          textAnchor="middle" 
          fontSize="20" 
          fontWeight="bold" 
          fill="white"
        >
          Tavern
        </text>
      </svg>
    </div>
  );
};
