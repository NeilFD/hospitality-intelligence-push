import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotaSchedulingAlgorithm } from '@/utils/rotaSchedulingAlgorithm';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/services/auth-service';

type RotaRequestFormProps = {
  location: any;
  onRequestComplete: () => void;
  roleMappings?: Record<string, any[]>;
};

export default function RotaRequestForm({ location, onRequestComplete, roleMappings = {} }: RotaRequestFormProps) {
  const [weekStartDate, setWeekStartDate] = useState<Date | undefined>(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
  });
  const [weekEndDate, setWeekEndDate] = useState<Date | undefined>(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return addDays(start, 6); // Ends on Sunday
  });
  const [revenueForecasts, setRevenueForecasts] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const user = useAuthStore((state) => state.profile);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (weekStartDate) {
      const forecasts = {};
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStartDate, i);
        const formattedDate = format(date, 'yyyy-MM-dd');
        forecasts[formattedDate] = revenueForecasts[formattedDate] || '';
      }
      setRevenueForecasts(forecasts);
    }
  }, [weekStartDate]);
  
  const generateSchedule = async () => {
    if (!weekStartDate || !weekEndDate || !location?.id) {
      toast.error('Please select a valid week and ensure location is loaded');
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Format dates
      const formattedStartDate = format(weekStartDate, 'yyyy-MM-dd');
      const formattedEndDate = format(weekEndDate, 'yyyy-MM-dd');
      
      console.log(`Generating schedule for ${formattedStartDate} to ${formattedEndDate}`);
      
      // Create or update the rota request
      const { data: requestData, error: requestError } = await supabase
        .from('rota_requests')
        .upsert({
          location_id: location.id,
          week_start_date: formattedStartDate,
          week_end_date: formattedEndDate,
          status: 'draft',
          requested_by: user?.id,
          revenue_forecast: revenueForecasts
        })
        .select()
        .single();
      
      if (requestError) {
        throw new Error(`Failed to create rota request: ${requestError.message}`);
      }
      
      // Fetch staff data
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('*, hi_score_evaluations(weighted_score)')
        .eq('available_for_rota', true);
      
      if (staffError) {
        throw new Error(`Failed to fetch staff data: ${staffError.message}`);
      }
      
      // Process staff data to include hi_score
      const processedStaff = staffData.map(staff => {
        const evaluations = staff.hi_score_evaluations || [];
        // Use the most recent evaluation score if available
        const latestScore = evaluations.length > 0 
          ? Math.max(...evaluations.map((e: any) => e.weighted_score || 0))
          : 0;
          
        return {
          ...staff,
          hi_score: latestScore
        };
      });
      
      // Fetch job roles
      const { data: jobRolesData, error: jobRolesError } = await supabase
        .from('job_roles')
        .select('*')
        .eq('location_id', location.id);
      
      if (jobRolesError) {
        throw new Error(`Failed to fetch job roles: ${jobRolesError.message}`);
      }
      
      // Fetch thresholds
      const { data: thresholdsData, error: thresholdsError } = await supabase
        .from('rota_revenue_thresholds')
        .select('*')
        .eq('location_id', location.id);
      
      if (thresholdsError) {
        throw new Error(`Failed to fetch thresholds: ${thresholdsError.message}`);
      }
      
      // Fetch shift rules
      const { data: shiftRulesData, error: shiftRulesError } = await supabase
        .from('shift_rules')
        .select('*, job_roles(*)')
        .eq('location_id', location.id)
        .eq('archived', false);
      
      if (shiftRulesError) {
        throw new Error(`Failed to fetch shift rules: ${shiftRulesError.message}`);
      }
      
      // Fetch trough periods
      const { data: troughPeriodsData, error: troughPeriodsError } = await supabase
        .from('shift_troughs')
        .select('*');
      
      if (troughPeriodsError) {
        throw new Error(`Failed to fetch trough periods: ${troughPeriodsError.message}`);
      }
      
      // Initialize the scheduling algorithm
      const algorithm = new RotaSchedulingAlgorithm({
        request: requestData,
        staff: processedStaff,
        jobRoles: jobRolesData,
        thresholds: thresholdsData,
        location: location
      });
      
      // Set shift rules and trough periods
      algorithm.setShiftRules(shiftRulesData);
      algorithm.setTroughPeriods(troughPeriodsData);
      
      // Set role mappings
      if (roleMappings && Object.keys(roleMappings).length > 0) {
        algorithm.setRoleMappings(roleMappings);
        console.log(`Set ${Object.keys(roleMappings).length} role mappings for the algorithm`);
      } else {
        console.warn('No role mappings available, this may affect staff assignment accuracy');
      }
      
      // Run the algorithm
      const result = await algorithm.generateSchedule();
      
      console.log(`Schedule generated with ${result.shifts.length} shifts`);
      
      // Create a new schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('rota_schedules')
        .upsert({
          request_id: requestData.id,
          location_id: location.id,
          week_start_date: formattedStartDate,
          week_end_date: formattedEndDate,
          status: 'draft',
          total_cost: result.total_cost,
          revenue_forecast: result.revenue_forecast,
          cost_percentage: result.cost_percentage,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (scheduleError) {
        throw new Error(`Failed to create schedule: ${scheduleError.message}`);
      }
      
      // Create shifts
      if (result.shifts.length > 0) {
        // Add schedule_id to each shift
        const shiftsWithScheduleId = result.shifts.map((shift: any) => ({
          ...shift,
          schedule_id: scheduleData.id
        }));
        
        // Insert shifts
        const { error: shiftsError } = await supabase
          .from('rota_schedule_shifts')
          .upsert(shiftsWithScheduleId);
        
        if (shiftsError) {
          throw new Error(`Failed to create shifts: ${shiftsError.message}`);
        }
      }
      
      // Success
      toast.success('Rota schedule generated', {
        description: `Created ${result.shifts.length} shifts with ${result.cost_percentage.toFixed(2)}% cost`
      });
      
      // Signal completion to parent
      onRequestComplete();
      
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      toast.error('Failed to generate schedule', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevenueUpdate = (date: string, value: string) => {
    setRevenueForecasts(prev => ({
      ...prev,
      [date]: value
    }));
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-md rounded-none border-x-0 m-0 w-full">
        <CardHeader className="pb-3">
          <CardTitle>Rota Request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Select Week:</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={
                      'w-[240px] justify-start text-left font-normal' +
                      (weekStartDate ? ' text-foreground' : ' text-muted-foreground')
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {weekStartDate ? (
                      format(weekStartDate, 'MMMM d, yyyy') + ' - ' + format(weekEndDate as Date, 'MMMM d, yyyy')
                    ) : (
                      <span>Pick a week</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    required
                    initialFocus
                    onSelect={(date) => {
                      if (date) {
                        const start = startOfWeek(date, { weekStartsOn: 1 });
                        const end = addDays(start, 6);
                        setWeekStartDate(start);
                        setWeekEndDate(end);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="mb-4">
            <Alert className="border-gray-200">
              <AlertDescription>
                Enter the revenue forecast for each day of the week. This will be used to generate the rota schedule.
              </AlertDescription>
            </Alert>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {daysOfWeek.map((day, index) => {
              const date = addDays(weekStartDate as Date, index);
              const formattedDate = format(date, 'yyyy-MM-dd');
              return (
                <div key={day} className="space-y-2">
                  <label htmlFor={`revenue-${day}`} className="text-sm font-medium block">
                    {day} ({format(date, 'dd/MM')})
                  </label>
                  <Input
                    type="number"
                    id={`revenue-${day}`}
                    placeholder="Revenue Forecast"
                    value={revenueForecasts[formattedDate] || ''}
                    onChange={(e) => handleRevenueUpdate(formattedDate, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end items-center">
          <Button onClick={generateSchedule} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Schedule'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
