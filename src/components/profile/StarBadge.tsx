
import React from 'react';
import { Star } from 'lucide-react';

interface StarBadgeProps {
  className?: string;
}

export function StarBadge({ className = '' }: StarBadgeProps) {
  return (
    <div className={`absolute z-20 ${className}`}>
      <div className="relative">
        {/* Enhanced glow effect behind the star */}
        <div className="absolute inset-0 blur-md text-yellow-300 scale-125">
          <Star className="h-6 w-6 fill-yellow-300 text-yellow-400" />
        </div>
        
        {/* Second glow layer for stronger effect */}
        <div className="absolute inset-0 blur-[2px] text-yellow-400 scale-110">
          <Star className="h-6 w-6 fill-yellow-400 text-yellow-500" />
        </div>
        
        {/* Main star */}
        <Star className="h-6 w-6 fill-yellow-400 text-yellow-500 relative drop-shadow-md" />
      </div>
    </div>
  );
}

export default StarBadge;
