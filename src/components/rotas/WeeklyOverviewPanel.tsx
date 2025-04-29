
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTime } from '@/lib/date-utils';
import StaffingGanttChart from './StaffingGanttChart';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WeeklyOverviewPanelProps {
  location: any;
  jobRoles: any[];
}

export default function WeeklyOverviewPanel({ location, jobRoles }: WeeklyOverviewPanelProps) {
  const [shiftRules, setShiftRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'table' | 'gantt'>('gantt');
  const [selectedDay, setSelectedDay] = useState<string>('none');
  
  useEffect(() => {
    if (location?.id) {
      fetchShiftRules();
    }
  }, [location]);

  const fetchShiftRules = async () => {
    setIsLoading(true);
    try {
      const { data: rules, error } = await supabase
        .from('shift_rules')
        .select(`
          *,
          job_roles (*)
        `)
        .eq('location_id', location.id)
        .eq('archived', false) // Only fetch active shifts
        .order('day_of_week');
      
      if (error) {
        throw error;
      }
      
      setShiftRules(rules || []);
    } catch (error) {
      console.error('Error fetching shift rules:', error);
      toast.error("Error loading shift rules", {
        description: "There was a problem loading the shift rules."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  // Group shifts by day
  const shiftsByDay = dayOrder.reduce<Record<string, any[]>>((acc, day) => {
    acc[day] = shiftRules.filter(rule => rule.day_of_week === day);
    return acc;
  }, {});

  // Get day name
  const getDayName = (dayCode: string) => {
    const days: Record<string, string> = {
      'mon': 'Monday',
      'tue': 'Tuesday',
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday',
      'all': 'All Days',
      'none': 'No view selected'
    };
    return days[dayCode] || dayCode;
  };

  // Filter shifts by selected day
  const filteredShiftRules = selectedDay === 'none' 
    ? [] 
    : selectedDay === 'all' 
      ? shiftRules 
      : shiftRules.filter(rule => rule.day_of_week === selectedDay);

  // Get days to display based on filter
  const getDaysToDisplay = () => {
    if (selectedDay === 'none') return [];
    return selectedDay === 'all' ? dayOrder : [selectedDay];
  };

  // Determine opening hours for the Gantt chart
  const getOpeningHours = () => {
    // Default opening hours if none are specified
    const defaultOpeningHours = { start: "09:00", end: "23:00" };
    
    // Get opening hours from location if available
    if (location?.opening_hours) {
      try {
        // Find the earliest start time and latest end time across all days
        let earliestStart = "23:59";
        let latestEnd = "00:00";
        
        Object.values(location.opening_hours).forEach((hours: any) => {
          if (hours.is_open) {
            if (hours.open < earliestStart) earliestStart = hours.open;
            if (hours.close > latestEnd) latestEnd = hours.close;
          }
        });
        
        // If valid hours were found, return them
        if (earliestStart !== "23:59" && latestEnd !== "00:00") {
          return { start: earliestStart, end: latestEnd };
        }
      } catch (error) {
        console.error("Error parsing opening hours:", error);
      }
    }
    
    return defaultOpeningHours;
  };

  const openingHours = getOpeningHours();

  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Weekly Staffing Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="gantt" 
          value={activeView} 
          onValueChange={(value) => setActiveView(value as 'table' | 'gantt')}
          className="mb-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="gantt">Schedule View</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="mb-4">
          <Select
            value={selectedDay}
            onValueChange={setSelectedDay}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No view selected</SelectItem>
              <SelectItem value="all">All Days</SelectItem>
              {dayOrder.map(day => (
                <SelectItem key={day} value={day}>{getDayName(day)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedDay === 'none' ? (
          <div className="p-8 text-center border rounded-md bg-slate-50 dark:bg-slate-900">
            <p className="text-muted-foreground">Please select a day to view the schedule</p>
          </div>
        ) : activeView === 'table' ? (
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-4 text-center">Loading shift rules...</div>
            ) : (
              <>                
                {getDaysToDisplay().map(day => (
                  <div key={day} className="border rounded-md overflow-hidden">
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-medium">
                      {getDayName(day)} ({shiftsByDay[day].length})
                    </div>
                    {shiftsByDay[day].length > 0 ? (
                      <div className="divide-y">
                        {shiftsByDay[day].map(rule => {
                          const role = jobRoles.find(r => r.id === rule.job_role_id);
                          return (
                            <div key={rule.id} className="px-4 py-2 flex flex-wrap justify-between items-center">
                              <div className="flex-grow mr-4 min-w-[200px]">
                                <div className="font-medium">{rule.name || role?.title || 'Unnamed Shift'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatTime(rule.start_time)} - {formatTime(rule.end_time)}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-right">
                                  <div className="text-muted-foreground">Role</div>
                                  <div>{role?.title || 'Unknown'}</div>
                                </div>
                                <div className="text-sm text-right">
                                  <div className="text-muted-foreground">Staff</div>
                                  <div>
                                    {rule.min_staff === rule.max_staff
                                      ? rule.min_staff
                                      : `${rule.min_staff}-${rule.max_staff}`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-muted-foreground italic">
                        No shifts scheduled
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <StaffingGanttChart
            rules={filteredShiftRules}
            jobRoles={jobRoles}
            openingHours={openingHours}
          />
        )}
      </CardContent>
    </Card>
  );
}
