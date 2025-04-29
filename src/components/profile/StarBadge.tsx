
import React from 'react';
import { Star } from 'lucide-react';

interface StarBadgeProps {
  className?: string;
}

export function StarBadge({ className = '' }: StarBadgeProps) {
  return (
    <div className={`absolute ${className}`} style={{ zIndex: 100 }}>
      <div className="relative">
        {/* Outer glow - larger area */}
        <div className="absolute inset-0 blur-xl text-yellow-300 scale-150">
          <Star className="h-7 w-7 fill-yellow-300 text-yellow-400" />
        </div>
        
        {/* Middle glow layer */}
        <div className="absolute inset-0 blur-md text-yellow-400 scale-125">
          <Star className="h-6 w-6 fill-yellow-400 text-yellow-500" />
        </div>
        
        {/* Inner glow layer - more intense */}
        <div className="absolute inset-0 blur-[2px] text-yellow-500 scale-110">
          <Star className="h-6 w-6 fill-yellow-500 text-yellow-600" />
        </div>
        
        {/* Main star */}
        <Star className="h-6 w-6 fill-yellow-500 text-yellow-600 relative drop-shadow-lg" />
      </div>
    </div>
  );
}

export default StarBadge;
