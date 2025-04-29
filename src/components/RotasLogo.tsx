
import React from 'react';
import { cn } from '@/lib/utils';
import { ClipboardCheck, ClipboardList } from 'lucide-react';

interface RotasLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function RotasLogo({ size = 'md', className }: RotasLogoProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center rounded-full p-2 bg-gradient-to-br from-[#3a86ff]/30 to-[#0072ff]/50",
      className
    )}>
      <ClipboardList className={cn(
        "text-[#3a86ff] filter drop-shadow-md",
        sizeClasses[size]
      )} />
      <div className="absolute top-[6px] right-[6px] w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full shadow-md border border-white/20" />
    </div>
  );
}
