
import React from 'react';
import { Star } from 'lucide-react';

interface StarBadgeProps {
  className?: string;
}

export function StarBadge({ className = '' }: StarBadgeProps) {
  return (
    <div className={`absolute -top-1 -right-1 ${className}`}>
      <Star className="h-6 w-6 fill-yellow-400 text-yellow-500" />
    </div>
  );
}

export default StarBadge;
