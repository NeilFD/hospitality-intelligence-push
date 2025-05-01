
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { RotaSchedulingAlgorithm } from '@/utils/rotaSchedulingAlgorithm';
import { Loader2, RefreshCw, Check, X, Edit, Calendar } from 'lucide-react';
import StaffingGanttChart from './StaffingGanttChart';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { useAuthStore } from '@/services/auth-service';
import { Alert, AlertDescription } from '@/components/ui/alert';

type RotaScheduleReviewProps = {
  location: any;
  onApprovalRequest: () => void;
  roleMappings?: Record<string, any[]>;
};

// Let's also check and update the props for StaffingGanttChart
type StaffingGanttChartProps = {
  shifts: any[];
};

export default function RotaScheduleReview({ location, onApprovalRequest, roleMappings = {} }: RotaScheduleReviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<any>(null);
  const [currentRequest, setCurrentRequest] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (location?.id) {
      fetchLatestSchedule();
    }
  }, [location]);
  
  const fetchLatestSchedule = async () => {
    setIsLoading(true);
    try {
      // Fetch the latest rota request for this location
      const { data: requestData, error: requestError } = await supabase
        .from('rota_requests')
        .select('*')
        .eq('location_id', location.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (requestError) {
        throw new Error(`Failed to fetch rota request: ${requestError.message}`);
      }
      
      setCurrentRequest(requestData);
      
      // Fetch the latest rota schedule for this request
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('rota_schedules')
        .select('*')
        .eq('request_id', requestData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (scheduleError) {
        throw new Error(`Failed to fetch rota schedule: ${scheduleError.message}`);
      }
      
      setCurrentSchedule(scheduleData);
      
      // Fetch the shifts for this schedule
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('rota_schedule_shifts')
        .select('*')
        .eq('schedule_id', scheduleData.id);
      
      if (shiftsError) {
        throw new Error(`Failed to fetch shifts: ${shiftsError.message}`);
      }
      
      setShifts(shiftsData);
      
    } catch (error: any) {
      console.error('Error fetching latest schedule:', error);
      toast.error('Failed to load schedule', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const regenerateSchedule = async () => {
    if (!currentRequest || !location?.id || !currentSchedule) {
      toast.error('Please load a valid schedule before regenerating');
      return;
    }
    
    try {
      setIsRegenerating(true);
      
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
        request: currentRequest,
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
      
      console.log(`Schedule regenerated with ${result.shifts.length} shifts`);
      
      // Update current schedule
      const { error: scheduleError } = await supabase
        .from('rota_schedules')
        .update({
          total_cost: result.total_cost,
          revenue_forecast: result.revenue_forecast,
          cost_percentage: result.cost_percentage
        })
        .eq('id', currentSchedule.id);
      
      if (scheduleError) {
        throw new Error(`Failed to update schedule: ${scheduleError.message}`);
      }
      
      // Delete existing shifts
      const { error: deleteError } = await supabase
        .from('rota_schedule_shifts')
        .delete()
        .eq('schedule_id', currentSchedule.id);
      
      if (deleteError) {
        throw new Error(`Failed to delete existing shifts: ${deleteError.message}`);
      }
      
      // Create new shifts
      if (result.shifts.length > 0) {
        // Add schedule_id to each shift
        const shiftsWithScheduleId = result.shifts.map((shift: any) => ({
          ...shift,
          schedule_id: currentSchedule.id
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
      toast.success('Rota schedule regenerated', {
        description: `Created ${result.shifts.length} shifts with ${result.cost_percentage.toFixed(2)}% cost`
      });
      
      // Refresh data
      fetchLatestSchedule();
      
    } catch (error: any) {
      console.error('Error regenerating schedule:', error);
      toast.error('Failed to regenerate schedule', {
        description: error.message
      });
    } finally {
      setIsRegenerating(false);
    }
  };
  
  const handleApproval = () => {
    if (!currentSchedule) {
      toast.error('Please load a valid schedule before requesting approval');
      return;
    }
    
    // Signal completion to parent
    onApprovalRequest();
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-md rounded-none border-x-0 m-0 w-full">
        <CardHeader className="pb-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Review Rota Schedule</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={fetchLatestSchedule} 
                disabled={isLoading || isRegenerating}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh Data
              </Button>
              <Button 
                variant="outline" 
                onClick={regenerateSchedule} 
                disabled={isLoading || isRegenerating}
              >
                {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : currentSchedule ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 shadow-none">
                  <CardHeader>
                    <CardTitle>Schedule Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Week Start Date</TableCell>
                          <TableCell>{format(parseISO(currentSchedule.week_start_date), 'dd/MM/yyyy')}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Week End Date</TableCell>
                          <TableCell>{format(parseISO(currentSchedule.week_end_date), 'dd/MM/yyyy')}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Total Cost</TableCell>
                          <TableCell>{formatCurrency(currentSchedule.total_cost)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Revenue Forecast</TableCell>
                          <TableCell>{formatCurrency(currentSchedule.revenue_forecast)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Cost Percentage</TableCell>
                          <TableCell>{currentSchedule.cost_percentage.toFixed(2)}%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <Card className="border-2 shadow-none">
                  <CardHeader>
                    <CardTitle>Staffing Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StaffingGanttChart shifts={shifts} />
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Break (mins)</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell>{shift.profile_id}</TableCell>
                      <TableCell>{format(parseISO(shift.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{shift.start_time}</TableCell>
                      <TableCell>{shift.end_time}</TableCell>
                      <TableCell>{shift.break_minutes}</TableCell>
                      <TableCell>{shift.job_role_id}</TableCell>
                      <TableCell className="text-right">{formatCurrency(shift.total_cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No schedule available to review.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end items-center p-4">
          {currentSchedule?.status === 'approved' ? (
            <Alert variant="default" className="bg-[#F2FCE2] border-green-200">
              <Check className="h-4 w-4 text-green-500" />
              <AlertDescription>
                This schedule has already been approved.
              </AlertDescription>
            </Alert>
          ) : (
            <Button onClick={handleApproval} disabled={isLoading || isRegenerating}>
              Request Approval
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
