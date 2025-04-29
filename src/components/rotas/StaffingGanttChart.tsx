
import React, { useMemo } from 'react';
import { formatTime } from '@/lib/date-utils';

interface ShiftRule {
  id: string;
  name?: string;
  job_role_id: string;
  job_roles?: { title: string };
  start_time: string;
  end_time: string;
  min_staff: number;
  max_staff: number;
}

interface StaffingByHour {
  hour: number;
  foh: { min: number; max: number };
  kitchen: { min: number; max: number };
  total: { min: number; max: number };
}

interface StaffingGanttChartProps {
  rules: ShiftRule[];
  jobRoles: any[];
  openingHours: { start: string; end: string };
}

const StaffingGanttChart = ({ rules, jobRoles, openingHours }: StaffingGanttChartProps) => {
  // Convert time strings like "09:00" to decimal hours (9.0)
  const timeToDecimal = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + (minutes / 60);
  };

  // Determine chart boundaries from opening hours
  const startHour = Math.floor(timeToDecimal(openingHours.start));
  const endHour = Math.ceil(timeToDecimal(openingHours.end));
  const totalHours = endHour - startHour;
  
  // Calculate staffing requirements for each hour
  const staffingByHour = useMemo(() => {
    const hours: StaffingByHour[] = [];
    
    // Initialize each hour slot
    for (let hour = startHour; hour <= endHour; hour++) {
      hours.push({
        hour,
        foh: { min: 0, max: 0 },
        kitchen: { min: 0, max: 0 },
        total: { min: 0, max: 0 }
      });
    }
    
    // Process each rule and add to the appropriate hours
    rules.forEach(rule => {
      const ruleStart = timeToDecimal(rule.start_time);
      const ruleEnd = timeToDecimal(rule.end_time);
      const role = jobRoles.find(r => r.id === rule.job_role_id);
      
      if (!role) return;
      
      const isKitchen = role.is_kitchen;
      const category = isKitchen ? 'kitchen' : 'foh';
      
      hours.forEach(hourSlot => {
        const hour = hourSlot.hour;
        
        // Check if this rule applies to this hour
        if (hour >= ruleStart && hour < ruleEnd) {
          hourSlot[category].min += rule.min_staff;
          hourSlot[category].max += rule.max_staff;
          hourSlot.total.min += rule.min_staff;
          hourSlot.total.max += rule.max_staff;
        }
      });
    });
    
    return hours;
  }, [rules, jobRoles, startHour, endHour]);

  // Calculate position for a shift block
  const getShiftStyle = (rule: ShiftRule) => {
    const startDecimal = timeToDecimal(rule.start_time);
    const endDecimal = timeToDecimal(rule.end_time);
    
    const startPercent = ((startDecimal - startHour) / totalHours) * 100;
    const widthPercent = ((endDecimal - startDecimal) / totalHours) * 100;
    
    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`
    };
  };

  // Get role category (FOH or Kitchen) for a rule
  const getRoleCategory = (rule: ShiftRule) => {
    const role = jobRoles.find(r => r.id === rule.job_role_id);
    return role?.is_kitchen ? 'kitchen' : 'foh';
  };

  return (
    <div className="mt-2 space-y-6">
      <div className="border rounded-lg p-4 bg-white dark:bg-slate-900 shadow-sm">
        <h4 className="font-medium mb-3">Staffing Schedule</h4>
        
        {/* Time scale */}
        <div className="flex border-b mb-2">
          <div className="w-24 shrink-0"></div>
          <div className="flex-1 relative">
            {Array.from({length: totalHours + 1}).map((_, i) => (
              <div 
                key={i} 
                className="absolute top-0 bottom-0 border-l text-xs text-muted-foreground"
                style={{ left: `${(i / totalHours) * 100}%` }}
              >
                <span className="absolute -top-4 -ml-2">{startHour + i}:00</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* FOH section */}
        <div className="mb-4">
          <div className="flex items-center mb-1">
            <h5 className="w-24 font-medium text-sm">FOH</h5>
            <div className="flex-1 relative h-8 bg-slate-50 dark:bg-slate-800 rounded overflow-hidden">
              {rules
                .filter(rule => getRoleCategory(rule) === 'foh')
                .map(rule => (
                  <div
                    key={rule.id}
                    className="absolute h-full bg-blue-200 dark:bg-blue-700/40 border border-blue-300 dark:border-blue-600 rounded flex items-center justify-center hover:bg-blue-300 dark:hover:bg-blue-700/60 transition-colors group"
                    style={getShiftStyle(rule)}
                  >
                    <div className="px-1 text-xs truncate max-w-full">
                      {rule.min_staff === rule.max_staff ? 
                        `${rule.min_staff}` : 
                        `${rule.min_staff}-${rule.max_staff}`
                      }
                    </div>
                    <div className="absolute bg-white dark:bg-slate-800 border rounded p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs -top-8 whitespace-nowrap">
                      {rule.name || rule.job_roles?.title} ({formatTime(rule.start_time)}-{formatTime(rule.end_time)})
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Kitchen section */}
        <div className="mb-4">
          <div className="flex items-center mb-1">
            <h5 className="w-24 font-medium text-sm">Kitchen</h5>
            <div className="flex-1 relative h-8 bg-slate-50 dark:bg-slate-800 rounded overflow-hidden">
              {rules
                .filter(rule => getRoleCategory(rule) === 'kitchen')
                .map(rule => (
                  <div
                    key={rule.id}
                    className="absolute h-full bg-green-200 dark:bg-green-700/40 border border-green-300 dark:border-green-600 rounded flex items-center justify-center hover:bg-green-300 dark:hover:bg-green-700/60 transition-colors group"
                    style={getShiftStyle(rule)}
                  >
                    <div className="px-1 text-xs truncate max-w-full">
                      {rule.min_staff === rule.max_staff ? 
                        `${rule.min_staff}` : 
                        `${rule.min_staff}-${rule.max_staff}`
                      }
                    </div>
                    <div className="absolute bg-white dark:bg-slate-800 border rounded p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs -top-8 whitespace-nowrap">
                      {rule.name || rule.job_roles?.title} ({formatTime(rule.start_time)}-{formatTime(rule.end_time)})
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Hourly staffing totals */}
        <div className="mt-6 border-t pt-3">
          <h5 className="font-medium mb-3">Hourly Staff Totals</h5>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="py-1 px-2 text-left">Time</th>
                  <th className="py-1 px-2 text-right">FOH</th>
                  <th className="py-1 px-2 text-right">Kitchen</th>
                  <th className="py-1 px-2 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {staffingByHour.map((hour, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-1 px-2 text-left">{hour.hour}:00</td>
                    <td className="py-1 px-2 text-right">
                      {hour.foh.min === hour.foh.max ? 
                        hour.foh.min : 
                        `${hour.foh.min}-${hour.foh.max}`}
                    </td>
                    <td className="py-1 px-2 text-right">
                      {hour.kitchen.min === hour.kitchen.max ? 
                        hour.kitchen.min : 
                        `${hour.kitchen.min}-${hour.kitchen.max}`}
                    </td>
                    <td className="py-1 px-2 text-right font-bold">
                      {hour.total.min === hour.total.max ? 
                        hour.total.min : 
                        `${hour.total.min}-${hour.total.max}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffingGanttChart;
