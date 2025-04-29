
import React, { useMemo } from 'react';
import { formatTime } from '@/lib/date-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ShiftRule {
  id: string;
  name?: string;
  job_role_id: string;
  job_roles?: { title: string };
  start_time: string;
  end_time: string;
  min_staff: number;
  max_staff: number;
  day_of_week?: string;
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
  // Time conversion function - updated to handle shifts that extend past midnight
  const timeToDecimal = (time: string, isEnd = false): number => {
    if (isEnd && time === "00:00") return 24;
    const [h, m] = time.split(":").map(Number);
    return h + m / 60;
  };

  // Calculate chart boundaries - start from 8:00 and include hours past midnight
  const chartStart = 8; // Start at 8:00
  const chartEnd = 28; // End at 4:00 next day (24 + 4)
  const totalHours = chartEnd - chartStart;
  
  // Format hour for display - handles hours > 24 (next day)
  const formatHourDisplay = (hour: number) => {
    const adjustedHour = hour % 24;
    return adjustedHour === 0 ? "00" : adjustedHour < 10 ? `0${adjustedHour}` : `${adjustedHour}`;
  };

  // Group shifts by FOH and Kitchen
  const fohShifts = rules.filter(rule => {
    const role = jobRoles.find(r => r.id === rule.job_role_id);
    return role && !role.is_kitchen;
  });
  
  const kitchenShifts = rules.filter(rule => {
    const role = jobRoles.find(r => r.id === rule.job_role_id);
    return role && role.is_kitchen;
  });

  // Adjust time calculations to handle shifts extending past midnight
  const adjustTimeForDisplay = (time: number): number => {
    // Adjust the decimal time to fit our display grid
    // For example, if chartStart is 8:00, then 8:00 should be position 1 on the grid
    return time - chartStart + 1;
  };

  // Calculate staffing requirements for each hour - handling hours past midnight
  const staffingByHour = useMemo(() => {
    const hours: StaffingByHour[] = [];
    
    // Initialize the hours array with every hour slot we need
    for (let i = chartStart; i < chartEnd; i++) {
      const displayHour = i % 24; // Convert to 24-hour format for display
      hours.push({
        hour: displayHour,
        foh: { min: 0, max: 0 },
        kitchen: { min: 0, max: 0 },
        total: { min: 0, max: 0 }
      });
    }
    
    // Process each rule
    rules.forEach(rule => {
      let ruleStart = timeToDecimal(rule.start_time, false);
      let ruleEnd = timeToDecimal(rule.end_time, true);
      
      // Handle shifts that go past midnight
      if (ruleEnd < ruleStart) {
        ruleEnd += 24; // Add 24 hours to make it the next day
      }
      
      const role = jobRoles.find(r => r.id === rule.job_role_id);
      if (!role) return;
      
      const category = role.is_kitchen ? 'kitchen' : 'foh';
      
      // For each hour in our chart, add appropriate staffing
      hours.forEach((hourSlot, index) => {
        const absoluteHour = index + chartStart; // Adjust for our chart starting at 8:00
        
        // An hour is covered by this shift if it starts at or after the shift start
        // and before the shift end
        if (absoluteHour >= ruleStart && absoluteHour < ruleEnd) {
          hourSlot[category].min += rule.min_staff;
          hourSlot[category].max += rule.max_staff;
          hourSlot.total.min += rule.min_staff;
          hourSlot.total.max += rule.max_staff;
        }
      });
    });
    
    return hours;
  }, [rules, jobRoles, chartStart]);

  // Calculate totals across all hours
  const hourlyTotals = useMemo(() => {
    let fohMinTotal = 0;
    let fohMaxTotal = 0;
    let kitchenMinTotal = 0;
    let kitchenMaxTotal = 0;
    let totalMinHours = 0;
    let totalMaxHours = 0;

    staffingByHour.forEach(hour => {
      fohMinTotal += hour.foh.min;
      fohMaxTotal += hour.foh.max;
      kitchenMinTotal += hour.kitchen.min;
      kitchenMaxTotal += hour.kitchen.max;
      totalMinHours += hour.total.min;
      totalMaxHours += hour.total.max;
    });

    return {
      foh: { min: fohMinTotal, max: fohMaxTotal },
      kitchen: { min: kitchenMinTotal, max: kitchenMaxTotal },
      total: { min: totalMinHours, max: totalMaxHours }
    };
  }, [staffingByHour]);

  // Get role name
  const getRoleName = (rule: ShiftRule) => {
    const role = jobRoles.find(r => r.id === rule.job_role_id);
    return role?.title || 'Unknown Role';
  };
  
  // Format day name
  const formatDayName = (dayCode?: string) => {
    if (!dayCode) return '';
    
    const days: Record<string, string> = {
      'mon': 'Monday',
      'tue': 'Tuesday',
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday'
    };
    
    return days[dayCode] || dayCode;
  };

  return (
    <TooltipProvider>
      <div className="mt-2 space-y-6">
        <div className="border rounded-lg p-4 bg-white dark:bg-slate-900 shadow-sm">
          <h4 className="font-medium mb-3">Staffing Schedule</h4>
          
          <div className="flex flex-col">
            {/* Time scale header with grid layout */}
            <div className="flex">
              {/* Empty cell for shift names column */}
              <div className="w-40 flex-shrink-0"></div>
              
              {/* Time scale */}
              <div className="flex-1 overflow-x-auto">
                <div className="grid w-full border-b pb-2 text-xs text-muted-foreground"
                    style={{ gridTemplateColumns: `repeat(${totalHours}, 1fr)` }}>
                  {Array.from({ length: totalHours }).map((_, i) => {
                    const hourValue = i + chartStart;
                    return (
                      <div key={i} className="text-center">
                        {formatHourDisplay(hourValue)}:00
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* FOH section */}
            {fohShifts.length > 0 && (
              <div className="mb-2 mt-6">
                <h5 className="font-medium text-sm text-blue-600 dark:text-blue-400">
                  Front of House Shifts
                </h5>
              </div>
            )}
            
            {/* Individual FOH shifts with shift names on the left */}
            {fohShifts.map(rule => {
              let start = timeToDecimal(rule.start_time);
              let end = timeToDecimal(rule.end_time, true);
              
              // Handle shifts that cross midnight
              if (end < start) {
                end += 24; // Add 24 hours to make it the next day
              }
              
              // Skip shifts that end before our chart starts or start after our chart ends
              if (end <= chartStart || start >= chartEnd) {
                return null;
              }
              
              // Clamp times to our chart boundaries
              start = Math.max(start, chartStart);
              end = Math.min(end, chartEnd);
              
              // Adjust for grid positioning
              const gridStart = adjustTimeForDisplay(start);
              const span = end - start;
              
              return (
                <div key={rule.id} className="mb-3 flex">
                  {/* Shift name column */}
                  <div className="w-40 flex-shrink-0 flex flex-col mr-2 pr-2 border-r">
                    <span className="font-medium text-sm">{rule.name || getRoleName(rule)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDayName(rule.day_of_week)}
                    </span>
                  </div>
                  
                  {/* Gantt chart bars */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="grid w-full items-center" 
                         style={{ gridTemplateColumns: `repeat(${totalHours}, 1fr)` }}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="bg-blue-200 dark:bg-blue-700/40 border border-blue-300 dark:border-blue-600 rounded py-1 text-xs text-center flex items-center justify-center hover:bg-blue-300 dark:hover:bg-blue-700/60 transition-colors"
                            style={{
                              gridColumnStart: Math.floor(gridStart),
                              gridColumnEnd: `span ${Math.ceil(span)}`,
                            }}
                          >
                            {rule.min_staff === rule.max_staff ? 
                              `${rule.min_staff}` : 
                              `${rule.min_staff}-${rule.max_staff}`
                            }
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-bold">{rule.name || getRoleName(rule)}</div>
                            <div>{formatTime(rule.start_time)} - {formatTime(rule.end_time)}</div>
                            <div>Staff: {rule.min_staff === rule.max_staff ? 
                              rule.min_staff : 
                              `${rule.min_staff}-${rule.max_staff}`}
                            </div>
                            {rule.day_of_week && <div>{formatDayName(rule.day_of_week)}</div>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Kitchen section */}
            {kitchenShifts.length > 0 && (
              <div className="mb-2 mt-6">
                <h5 className="font-medium text-sm text-green-600 dark:text-green-400">
                  Kitchen Shifts
                </h5>
              </div>
            )}
            
            {/* Individual Kitchen shifts with shift names on the left */}
            {kitchenShifts.map(rule => {
              let start = timeToDecimal(rule.start_time);
              let end = timeToDecimal(rule.end_time, true);
              
              // Handle shifts that cross midnight
              if (end < start) {
                end += 24; // Add 24 hours to make it the next day
              }
              
              // Skip shifts that end before our chart starts or start after our chart ends
              if (end <= chartStart || start >= chartEnd) {
                return null;
              }
              
              // Clamp times to our chart boundaries
              start = Math.max(start, chartStart);
              end = Math.min(end, chartEnd);
              
              // Adjust for grid positioning
              const gridStart = adjustTimeForDisplay(start);
              const span = end - start;
              
              return (
                <div key={rule.id} className="mb-3 flex">
                  {/* Shift name column */}
                  <div className="w-40 flex-shrink-0 flex flex-col mr-2 pr-2 border-r">
                    <span className="font-medium text-sm">{rule.name || getRoleName(rule)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDayName(rule.day_of_week)}
                    </span>
                  </div>
                  
                  {/* Gantt chart bars */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="grid w-full items-center"
                         style={{ gridTemplateColumns: `repeat(${totalHours}, 1fr)` }}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="bg-green-200 dark:bg-green-700/40 border border-green-300 dark:border-green-600 rounded py-1 text-xs text-center flex items-center justify-center hover:bg-green-300 dark:hover:bg-green-700/60 transition-colors"
                            style={{
                              gridColumnStart: Math.floor(gridStart),
                              gridColumnEnd: `span ${Math.ceil(span)}`,
                            }}
                          >
                            {rule.min_staff === rule.max_staff ? 
                              `${rule.min_staff}` : 
                              `${rule.min_staff}-${rule.max_staff}`
                            }
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-bold">{rule.name || getRoleName(rule)}</div>
                            <div>{formatTime(rule.start_time)} - {formatTime(rule.end_time)}</div>
                            <div>Staff: {rule.min_staff === rule.max_staff ? 
                              rule.min_staff : 
                              `${rule.min_staff}-${rule.max_staff}`}
                            </div>
                            {rule.day_of_week && <div>{formatDayName(rule.day_of_week)}</div>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Hourly staffing totals */}
          <div className="mt-8 border-t pt-3">
            <h5 className="font-medium mb-3">Hourly Staff Totals</h5>
            <div className="overflow-x-auto">
              <Table className="min-w-full text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-1 px-2 text-left">Time</TableHead>
                    <TableHead className="py-1 px-2 text-right">FOH</TableHead>
                    <TableHead className="py-1 px-2 text-right">Kitchen</TableHead>
                    <TableHead className="py-1 px-2 text-right font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffingByHour.map((hour, index) => {
                    const displayHour = formatHourDisplay(hour.hour);
                    // Add "next day" indicator for hours past midnight
                    const nextDay = hour.hour < chartStart % 24 ? " (next day)" : "";
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="py-1 px-2 text-left">
                          {displayHour}:00{nextDay}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-right">
                          {hour.foh.min === hour.foh.max ? 
                            hour.foh.min : 
                            `${hour.foh.min}-${hour.foh.max}`}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-right">
                          {hour.kitchen.min === hour.kitchen.max ? 
                            hour.kitchen.min : 
                            `${hour.kitchen.min}-${hour.kitchen.max}`}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-right font-bold">
                          {hour.total.min === hour.total.max ? 
                            hour.total.min : 
                            `${hour.total.min}-${hour.total.max}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter className="bg-slate-100 dark:bg-slate-800 font-medium">
                  <TableRow>
                    <TableCell className="py-2 px-2 text-left">Total Hours</TableCell>
                    <TableCell className="py-2 px-2 text-right">
                      {hourlyTotals.foh.min === hourlyTotals.foh.max ? 
                        hourlyTotals.foh.min : 
                        `${hourlyTotals.foh.min}-${hourlyTotals.foh.max}`}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-right">
                      {hourlyTotals.kitchen.min === hourlyTotals.kitchen.max ? 
                        hourlyTotals.kitchen.min : 
                        `${hourlyTotals.kitchen.min}-${hourlyTotals.kitchen.max}`}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-right font-bold">
                      {hourlyTotals.total.min === hourlyTotals.total.max ? 
                        hourlyTotals.total.min : 
                        `${hourlyTotals.total.min}-${hourlyTotals.total.max}`}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default StaffingGanttChart;
