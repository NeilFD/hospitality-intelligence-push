
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface DashboardDateDisplayProps {
  date?: Date;
  showDayOfWeek?: boolean;
  className?: string;
}

export function DashboardDateDisplay({ 
  date = new Date(), 
  showDayOfWeek = true,
  className = ""
}: DashboardDateDisplayProps) {
  const formattedDate = showDayOfWeek
    ? format(date, "EEEE, d MMM yyyy")
    : format(date, "d MMM yyyy");
    
  return (
    <div className={`flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg border ${className}`}>
      <Calendar className="h-5 w-5 text-purple-700" />
      <span className="font-medium">{formattedDate}</span>
    </div>
  );
}
