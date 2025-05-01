
import React, { useEffect, useState } from 'react';
import { format, parse } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StaffingGanttChartProps {
  rules: any[];
  jobRoles: any[];
  openingHours: { start: string; end: string };
}

export default function StaffingGanttChart({ rules, jobRoles, openingHours }: StaffingGanttChartProps) {
  const [troughData, setTroughData] = useState<Record<string, any[]>>({});
  const [isLoadingTroughs, setIsLoadingTroughs] = useState(false);
  
  // Generate time slots based on opening hours
  const startTime = openingHours.start.substring(0, 5);
  const endTime = openingHours.end.substring(0, 5);
  
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  
  // Create array of hour slots
  const hourSlots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    hourSlots.push(hour);
  }
  
  // Load troughs data for the displayed shift rules
  useEffect(() => {
    const loadTroughData = async () => {
      // Only fetch if we have rules
      if (rules.length === 0) return;
      
      setIsLoadingTroughs(true);
      try {
        // Get all shift rule IDs
        const shiftRuleIds = rules.map(rule => rule.id);
        
        // Fetch trough data for these shifts
        const { data: troughs, error } = await supabase
          .from('shift_troughs')
          .select('*')
          .in('shift_rule_id', shiftRuleIds);
          
        if (error) {
          console.error('Error fetching trough data:', error);
          return;
        }
        
        // Organize troughs by shift rule ID
        const troughsByShiftId: Record<string, any[]> = {};
        troughs?.forEach(trough => {
          if (!troughsByShiftId[trough.shift_rule_id]) {
            troughsByShiftId[trough.shift_rule_id] = [];
          }
          troughsByShiftId[trough.shift_rule_id].push(trough);
        });
        
        setTroughData(troughsByShiftId);
      } catch (error) {
        console.error('Error in loadTroughData:', error);
      } finally {
        setIsLoadingTroughs(false);
      }
    };
    
    loadTroughData();
  }, [rules]);
  
  // Format time for display (e.g., "9:00" -> "09:00")
  const formatDisplayTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  };
  
  // Parse time to get hour as number (e.g., "09:30" -> 9.5)
  const parseTimeToHourDecimal = (timeStr: string) => {
    // Assume timeStr is in "HH:MM:SS" format
    const [hours, minutes] = timeStr.split(':');
    return parseInt(hours) + parseInt(minutes) / 60;
  };
  
  // Check if a given hour (like 9) is contained within a time range ("09:00" - "17:00")
  const isHourInTimeRange = (hour: number, startTimeStr: string, endTimeStr: string) => {
    const startHour = parseTimeToHourDecimal(startTimeStr);
    const endHour = parseTimeToHourDecimal(endTimeStr);
    return hour >= startHour && hour < endHour;
  };
  
  // Check if an hour falls within a trough period
  const isHourInTroughPeriod = (hour: number, shiftRuleId: string) => {
    if (!troughData[shiftRuleId]) return false;
    
    for (const trough of troughData[shiftRuleId]) {
      if (isHourInTimeRange(hour, trough.start_time, trough.end_time)) {
        return true;
      }
    }
    return false;
  };
  
  // Get max staff override for an hour if it falls in a trough
  const getMaxStaffOverride = (hour: number, shiftRuleId: string, defaultMaxStaff: number) => {
    if (!troughData[shiftRuleId]) return defaultMaxStaff;
    
    for (const trough of troughData[shiftRuleId]) {
      if (isHourInTimeRange(hour, trough.start_time, trough.end_time)) {
        return trough.max_staff_override;
      }
    }
    return defaultMaxStaff;
  };

  // Sort rules by job role and start time
  const sortedRules = [...rules].sort((a, b) => {
    // First by job role
    const roleA = jobRoles.find(role => role.id === a.job_role_id)?.title || '';
    const roleB = jobRoles.find(role => role.id === b.job_role_id)?.title || '';
    const roleComparison = roleA.localeCompare(roleB);
    
    // Then by start time
    if (roleComparison === 0) {
      return a.start_time.localeCompare(b.start_time);
    }
    return roleComparison;
  });

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No shift rules found for the selected day.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header row with hour markers */}
            <div className="flex border-b">
              <div className="w-48 p-2 font-medium bg-muted/30">Role / Time</div>
              {hourSlots.map(hour => (
                <div 
                  key={hour} 
                  className="flex-1 p-2 text-center border-l font-medium bg-muted/30"
                >
                  {hour}:00
                </div>
              ))}
            </div>
            
            {/* Shift rules rows */}
            <div>
              {isLoadingTroughs ? (
                <div className="p-4">
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                sortedRules.map((rule, ruleIndex) => {
                  const jobRole = jobRoles.find(role => role.id === rule.job_role_id);
                  const ruleTroughs = troughData[rule.id] || [];
                  
                  return (
                    <div key={ruleIndex} className="flex border-b hover:bg-muted/10">
                      {/* Left column with rule info */}
                      <div className="w-48 p-2 flex flex-col justify-center">
                        <div className="font-medium">
                          {rule.name || jobRole?.title || 'Unnamed Shift'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDisplayTime(rule.start_time)} - {formatDisplayTime(rule.end_time)}
                        </div>
                      </div>
                      
                      {/* Hours grid */}
                      {hourSlots.map(hour => {
                        const isInShift = isHourInTimeRange(hour, rule.start_time, rule.end_time);
                        const isInTrough = isInShift && isHourInTroughPeriod(hour, rule.id);
                        const maxStaff = isInTrough 
                          ? getMaxStaffOverride(hour, rule.id, rule.max_staff)
                          : rule.max_staff;
                        
                        // Don't show anything if the hour is not in the shift
                        if (!isInShift) {
                          return (
                            <div 
                              key={hour} 
                              className="flex-1 border-l"
                            />
                          );
                        }
                        
                        return (
                          <TooltipProvider key={hour}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={`
                                    flex-1 p-2 border-l flex items-center justify-center
                                    ${isInShift ? 'bg-blue-100 dark:bg-blue-950/30' : ''}
                                    ${isInTrough ? 'bg-blue-50 dark:bg-blue-950/20 border border-dashed border-blue-300 dark:border-blue-800' : ''}
                                  `}
                                >
                                  <span className="font-medium">
                                    {rule.min_staff === maxStaff 
                                      ? maxStaff 
                                      : `${rule.min_staff}-${maxStaff}`}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium">{rule.name || jobRole?.title}</p>
                                  <p>Time: {hour}:00 - {hour + 1}:00</p>
                                  <p>Staff Required: {rule.min_staff} - {maxStaff}</p>
                                  {isInTrough && (
                                    <p className="text-blue-600 dark:text-blue-400">
                                      Trough period (reduced staffing)
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
