
import React from 'react';
import { cn } from '@/lib/utils';

const days = [
  { id: 'mon', name: 'Mon' },
  { id: 'tue', name: 'Tue' },
  { id: 'wed', name: 'Wed' },
  { id: 'thu', name: 'Thu' },
  { id: 'fri', name: 'Fri' },
  { id: 'sat', name: 'Sat' },
  { id: 'sun', name: 'Sun' }
];

export default function AvailabilityViewer({ availability = [] }) {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push(i);
  }
  
  // Convert the availability array to a format that's easier to work with
  const availableSlots = {};
  days.forEach(day => {
    availableSlots[day.id] = new Set();
  });
  
  // Parse the availability
  if (Array.isArray(availability)) {
    availability.forEach(slot => {
      if (slot.day && slot.start && slot.end) {
        const startHour = parseInt(slot.start.split(':')[0]);
        let endHour = parseInt(slot.end.split(':')[0]);
        
        // Handle time spans that cross midnight
        if (endHour <= startHour) {
          endHour = 24;
        }
        
        // Fill the hours
        for (let hour = startHour; hour < endHour; hour++) {
          availableSlots[slot.day].add(hour);
        }
      }
    });
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex">
          <div className="w-12 shrink-0"></div>
          <div className="flex-1 grid grid-cols-24 gap-0">
            {hours.map(hour => (
              <div 
                key={hour} 
                className={cn(
                  "h-6 text-xs flex items-center justify-center",
                  hour % 2 === 0 ? "text-muted-foreground" : "text-transparent"
                )}
              >
                {hour}
              </div>
            ))}
          </div>
        </div>
        
        {days.map(day => (
          <div key={day.id} className="flex">
            <div className="w-12 shrink-0 text-xs font-medium flex items-center">
              {day.name}
            </div>
            <div className="flex-1 grid grid-cols-24 gap-0">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className={cn(
                    "h-6 border-r border-t last:border-r-0",
                    availableSlots[day.id].has(hour) ? 
                      "bg-green-500/20 dark:bg-green-900/30" : 
                      "bg-slate-100 dark:bg-slate-800/50"
                  )}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <div>12 AM</div>
        <div>6 AM</div>
        <div>12 PM</div>
        <div>6 PM</div>
        <div>12 AM</div>
      </div>
    </div>
  );
}
