
import React from 'react';
import { Star } from 'lucide-react';

interface StarBadgeProps {
  className?: string;
}

export function StarBadge({ className = '' }: StarBadgeProps) {
  return (
    <div className={`absolute z-10 ${className}`}>
      <div className="relative">
        {/* Glow effect behind the star */}
        <div className="absolute inset-0 blur-[2px] text-yellow-300 scale-110">
          <Star className="h-6 w-6 fill-yellow-300 text-yellow-400" />
        </div>
        
        {/* Main star */}
        <Star className="h-6 w-6 fill-yellow-400 text-yellow-500 relative drop-shadow-md" />
      </div>
    </div>
  );
}

export default StarBadge;
