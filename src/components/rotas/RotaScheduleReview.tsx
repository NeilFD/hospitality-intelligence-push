
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, ThumbsUp, Clock, Calendar, FileBarChart, AlertCircle, Send, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { RotaSchedulingAlgorithm } from '@/utils/rotaSchedulingAlgorithm';

type RotaScheduleReviewProps = {
  location: any;
  onApprovalRequest: () => void;
};

export default function RotaScheduleReview({ location, onApprovalRequest }: RotaScheduleReviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'staff'>('daily');

  useEffect(() => {
    if (location) {
      fetchRequests();
      fetchStaff();
      fetchJobRoles();
    }
  }, [location]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rota_requests')
        .select('*, profiles:requested_by(first_name, last_name)')
        .eq('location_id', location.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setRequests(data || []);
      
      // Select the most recent request by default
      if (data && data.length > 0) {
        setSelectedRequestId(data[0].id);
        checkExistingSchedule(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load rota requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('available_for_rota', true);
        
      if (error) throw error;
      
      // Get all hi score evaluations
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('hi_score_evaluations')
        .select('*');
        
      if (evaluationsError) throw evaluationsError;
      
      // Process and combine the data
      const staffWithScores = data?.map(profile => {
        const profileEvaluations = evaluationsData?.filter(eval => eval.profile_id === profile.id) || [];
        
        // Calculate average hi score
        let avgHiScore = 0;
        if (profileEvaluations.length > 0) {
          const sum = profileEvaluations.reduce((acc, eval) => acc + (eval.weighted_score || 0), 0);
          avgHiScore = sum / profileEvaluations.length;
        }
        
        return {
          ...profile,
          hi_score: avgHiScore
        };
      }) || [];
      
      setStaff(staffWithScores);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
    }
  };

  const fetchJobRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .eq('location_id', location.id);
        
      if (error) throw error;
      
      setJobRoles(data || []);
    } catch (error) {
      console.error('Error fetching job roles:', error);
    }
  };

  const checkExistingSchedule = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('rota_schedules')
        .select('*, rota_schedule_shifts(*)')
        .eq('request_id', requestId)
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        // We found an existing schedule
        setScheduleData(data);
      } else {
        setScheduleData(null);
      }
    } catch (error) {
      console.error('Error checking existing schedule:', error);
      setScheduleData(null);
    }
  };

  const handleRequestChange = (requestId: string) => {
    setSelectedRequestId(requestId);
    setScheduleData(null);
    checkExistingSchedule(requestId);
  };

  const generateSchedule = async () => {
    if (!selectedRequestId) return;
    
    setIsGenerating(true);
    
    try {
      const selectedRequest = requests.find(r => r.id === selectedRequestId);
      
      if (!selectedRequest) {
        throw new Error('Selected request not found');
      }
      
      // Fetch thresholds
      const { data: thresholds, error: thresholdsError } = await supabase
        .from('rota_revenue_thresholds')
        .select('*')
        .eq('location_id', location.id);
        
      if (thresholdsError) throw thresholdsError;
      
      // Create the scheduling algorithm instance
      const scheduler = new RotaSchedulingAlgorithm({
        request: selectedRequest,
        staff,
        jobRoles,
        thresholds: thresholds || [],
        location
      });
      
      // Run the algorithm to generate the schedule - simulation for now
      const generationResult = await simulateScheduleGeneration(selectedRequest);
      
      if (!generationResult.success) {
        throw new Error(generationResult.message || 'Failed to generate schedule');
      }
      
      // Save the generated schedule to the database
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('rota_schedules')
        .upsert({
          request_id: selectedRequestId,
          location_id: location.id,
          week_start_date: selectedRequest.week_start_date,
          week_end_date: selectedRequest.week_end_date,
          status: 'draft',
          total_cost: generationResult.data.total_cost,
          revenue_forecast: generationResult.data.revenue_forecast,
          cost_percentage: generationResult.data.cost_percentage,
          created_by: selectedRequest.requested_by
        })
        .select()
        .single();
        
      if (scheduleError) throw scheduleError;
      
      // Save the generated shifts to the database
      const shiftsToInsert = generationResult.data.shifts.map((shift: any) => ({
        schedule_id: scheduleData.id,
        profile_id: shift.profile_id,
        date: shift.date,
        day_of_week: shift.day_of_week,
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_minutes: shift.break_minutes,
        job_role_id: shift.job_role_id,
        is_secondary_role: shift.is_secondary_role,
        hi_score: shift.hi_score,
        shift_cost: shift.shift_cost,
        employer_ni_cost: shift.employer_ni_cost,
        employer_pension_cost: shift.employer_pension_cost,
        total_cost: shift.total_cost
      }));
      
      // Delete any existing shifts for this schedule
      await supabase
        .from('rota_schedule_shifts')
        .delete()
        .eq('schedule_id', scheduleData.id);
        
      // Insert the new shifts
      const { error: shiftsError } = await supabase
        .from('rota_schedule_shifts')
        .insert(shiftsToInsert);
        
      if (shiftsError) throw shiftsError;
      
      // Update the request's staffing cost information
      await supabase
        .from('rota_requests')
        .update({
          staffing_cost: generationResult.data.total_cost,
          staffing_cost_percentage: generationResult.data.cost_percentage
        })
        .eq('id', selectedRequestId);
        
      toast.success('Schedule generated successfully');
      
      // Update the UI with the new schedule
      checkExistingSchedule(selectedRequestId);
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast.error('Failed to generate schedule', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulates the schedule generation - in a real implementation this would be a complex algorithm
  const simulateScheduleGeneration = async (request: any): Promise<any> => {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Parse the week dates
    const weekStartDate = parseISO(request.week_start_date);
    const weekEndDate = parseISO(request.week_end_date);
    
    // Create an array of dates for the week
    const dates = [];
    let currentDate = weekStartDate;
    while (currentDate <= weekEndDate) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }
    
    // Get the revenue forecasts
    const revenueForecast = request.revenue_forecast || {};
    
    // Calculate total forecast revenue
    const totalRevenue = Object.values(revenueForecast).reduce((acc: number, val: any) => acc + (parseFloat(val) || 0), 0);
    
    // Generate shifts for each day
    const shifts: any[] = [];
    let totalCost = 0;
    
    // Sort staff by hi score (descending)
    const sortedStaff = [...staff].sort((a, b) => (b.hi_score || 0) - (a.hi_score || 0));
    
    dates.forEach((date, dateIndex) => {
      const dayOfWeek = format(new Date(date), 'EEEE').toLowerCase();
      const dayRevenue = revenueForecast[date] || 0;
      
      if (dayRevenue <= 0) return; // Skip days with no revenue forecast
      
      const isWeekend = dayOfWeek === 'saturday' || dayOfWeek === 'sunday';
      
      // Determine number of staff needed based on revenue
      // This would use the thresholds in a real implementation
      const fohStaffNeeded = Math.max(1, Math.floor(dayRevenue / 1000));
      const kitchenStaffNeeded = Math.max(1, Math.floor(dayRevenue / 1500));
      const kpStaffNeeded = Math.floor(dayRevenue / 2000);
      
      // Find FOH staff
      const fohJobRole = jobRoles.find(role => !role.is_kitchen && role.title.toLowerCase().includes('team'));
      const kitchenJobRole = jobRoles.find(role => role.is_kitchen && role.title.toLowerCase().includes('chef'));
      const kpJobRole = jobRoles.find(role => role.is_kitchen && role.title.toLowerCase().includes('porter'));
      
      // Filter staff by job roles
      const fohStaff = sortedStaff.filter(s => !s.job_title?.toLowerCase().includes('chef') && !s.job_title?.toLowerCase().includes('porter'));
      const kitchenStaff = sortedStaff.filter(s => s.job_title?.toLowerCase().includes('chef'));
      const kpStaff = sortedStaff.filter(s => s.job_title?.toLowerCase().includes('porter'));
      
      // Assign FOH shifts
      for (let i = 0; i < fohStaffNeeded && i < fohStaff.length; i++) {
        const person = fohStaff[i];
        
        // Calculate shift hours
        const startHour = isWeekend || dayRevenue > 3000 ? 16 : 17; // Earlier start on busy days
        const endHour = isWeekend || dayRevenue > 4000 ? 23 : 22; // Later finish on busy days
        const shiftHours = endHour - startHour;
        
        // Calculate costs
        const shiftCost = person.wage_rate * shiftHours;
        const niCost = person.wage_rate > 175/40 ? (person.wage_rate - 175/40) * 0.138 * shiftHours : 0;
        const pensionCost = person.wage_rate * 0.03 * shiftHours;
        const totalShiftCost = shiftCost + niCost + pensionCost;
        
        shifts.push({
          profile_id: person.id,
          date,
          day_of_week: dayOfWeek,
          start_time: `${startHour}:00:00`,
          end_time: `${endHour}:00:00`,
          break_minutes: 30,
          job_role_id: fohJobRole?.id,
          is_secondary_role: false,
          hi_score: person.hi_score || 0,
          shift_cost: shiftCost,
          employer_ni_cost: niCost,
          employer_pension_cost: pensionCost,
          total_cost: totalShiftCost
        });
        
        totalCost += totalShiftCost;
      }
      
      // Assign kitchen shifts
      for (let i = 0; i < kitchenStaffNeeded && i < kitchenStaff.length; i++) {
        const person = kitchenStaff[i];
        
        // Calculate shift hours - kitchen staff often start earlier
        const startHour = isWeekend || dayRevenue > 3000 ? 15 : 16; // Earlier start on busy days
        const endHour = isWeekend || dayRevenue > 4000 ? 23 : 22; // Later finish on busy days
        const shiftHours = endHour - startHour;
        
        // Calculate costs
        const shiftCost = person.wage_rate * shiftHours;
        const niCost = person.wage_rate > 175/40 ? (person.wage_rate - 175/40) * 0.138 * shiftHours : 0;
        const pensionCost = person.wage_rate * 0.03 * shiftHours;
        const totalShiftCost = shiftCost + niCost + pensionCost;
        
        shifts.push({
          profile_id: person.id,
          date,
          day_of_week: dayOfWeek,
          start_time: `${startHour}:00:00`,
          end_time: `${endHour}:00:00`,
          break_minutes: 30,
          job_role_id: kitchenJobRole?.id,
          is_secondary_role: false,
          hi_score: person.hi_score || 0,
          shift_cost: shiftCost,
          employer_ni_cost: niCost,
          employer_pension_cost: pensionCost,
          total_cost: totalShiftCost
        });
        
        totalCost += totalShiftCost;
      }
      
      // Assign KP shifts
      for (let i = 0; i < kpStaffNeeded && i < kpStaff.length; i++) {
        const person = kpStaff[i];
        
        // Calculate shift hours
        const startHour = 17;
        const endHour = 22;
        const shiftHours = endHour - startHour;
        
        // Calculate costs
        const shiftCost = person.wage_rate * shiftHours;
        const niCost = person.wage_rate > 175/40 ? (person.wage_rate - 175/40) * 0.138 * shiftHours : 0;
        const pensionCost = person.wage_rate * 0.03 * shiftHours;
        const totalShiftCost = shiftCost + niCost + pensionCost;
        
        shifts.push({
          profile_id: person.id,
          date,
          day_of_week: dayOfWeek,
          start_time: `${startHour}:00:00`,
          end_time: `${endHour}:00:00`,
          break_minutes: 30,
          job_role_id: kpJobRole?.id,
          is_secondary_role: false,
          hi_score: person.hi_score || 0,
          shift_cost: shiftCost,
          employer_ni_cost: niCost,
          employer_pension_cost: pensionCost,
          total_cost: totalShiftCost
        });
        
        totalCost += totalShiftCost;
      }
    });
    
    // Calculate cost percentage
    const costPercentage = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
    
    return {
      success: true,
      data: {
        shifts,
        total_cost: totalCost,
        revenue_forecast: totalRevenue,
        cost_percentage: costPercentage
      }
    };
  };

  const sendForApproval = async () => {
    if (!selectedRequestId || !scheduleData) return;
    
    try {
      // Update the request status
      await supabase
        .from('rota_requests')
        .update({
          status: 'pending_approval'
        })
        .eq('id', selectedRequestId);
      
      toast.success('Schedule sent for approval', {
        description: 'The manager will be notified to approve the schedule.'
      });
      
      onApprovalRequest();
    } catch (error) {
      console.error('Error sending for approval:', error);
      toast.error('Failed to send for approval');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // Convert from 24-hour format (e.g., "16:00:00") to 12-hour format (e.g., "4:00 PM")
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const calculateShiftHours = (startTime: string, endTime: string, breakMinutes: number) => {
    if (!startTime || !endTime) return 0;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = (startHours * 60) + startMinutes;
    const endTotalMinutes = (endHours * 60) + endMinutes;
    
    // Calculate difference in minutes
    let durationMinutes = endTotalMinutes - startTotalMinutes;
    
    // If end time is earlier than start time, add 24 hours (overnight shift)
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }
    
    // Subtract break time
    durationMinutes -= breakMinutes;
    
    // Convert to hours with decimal
    const hours = durationMinutes / 60;
    
    return hours;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Rota Draft Review</CardTitle>
              <CardDescription>Review and send draft rotas for approval</CardDescription>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="request-select">Select Rota Request</Label>
              <Select
                value={selectedRequestId || ''}
                onValueChange={handleRequestChange}
              >
                <SelectTrigger id="request-select" className="w-[260px]">
                  <SelectValue placeholder="Select a request" />
                </SelectTrigger>
                <SelectContent>
                  {requests.map((request) => {
                    const weekStart = format(parseISO(request.week_start_date), 'dd MMM yyyy');
                    const weekEnd = format(parseISO(request.week_end_date), 'dd MMM yyyy');
                    return (
                      <SelectItem key={request.id} value={request.id}>
                        {weekStart} - {weekEnd}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedRequestId ? (
            <>
              {scheduleData ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-medium">Schedule Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Week Period</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(scheduleData.week_start_date), 'dd MMM')} - {format(parseISO(scheduleData.week_end_date), 'dd MMM yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                          <FileBarChart className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Revenue Forecast</p>
                            <p className="text-xs text-muted-foreground">£{scheduleData.revenue_forecast.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Total Staff Cost</p>
                            <p className="text-xs text-muted-foreground">£{scheduleData.total_cost.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 p-4 rounded-md w-full md:w-auto">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Labour Cost %</p>
                          <p className="text-sm font-mono">
                            {scheduleData.cost_percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <Progress value={scheduleData.cost_percentage} className="h-2" />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: 28%</span>
                          <span>
                            {scheduleData.cost_percentage <= 28 ? (
                              <span className="text-green-500">Under Target</span>
                            ) : (
                              <span className="text-red-500">Over Target</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Shifts</h3>
                      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'daily' | 'staff')}>
                        <TabsList>
                          <TabsTrigger value="daily">Daily View</TabsTrigger>
                          <TabsTrigger value="staff">Staff View</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    
                    <ScrollArea className="h-[400px] border rounded-md p-4">
                      {viewMode === 'daily' ? (
                        <div className="space-y-6">
                          {/* Group shifts by date */}
                          {Object.entries(
                            scheduleData.rota_schedule_shifts.reduce((acc: any, shift: any) => {
                              if (!acc[shift.date]) {
                                acc[shift.date] = [];
                              }
                              acc[shift.date].push(shift);
                              return acc;
                            }, {})
                          ).sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                            .map(([date, shifts]: [string, any[]]) => (
                              <div key={date} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{format(parseISO(date), 'EEEE')}</Badge>
                                  <h4 className="font-medium">{format(parseISO(date), 'dd MMMM yyyy')}</h4>
                                </div>
                                
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[180px]">Staff</TableHead>
                                      <TableHead>Role</TableHead>
                                      <TableHead>Time</TableHead>
                                      <TableHead>Hours</TableHead>
                                      <TableHead>Cost</TableHead>
                                      <TableHead>Hi Score</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {shifts.map((shift: any) => {
                                      const staffMember = staff.find(s => s.id === shift.profile_id);
                                      const jobRole = jobRoles.find(r => r.id === shift.job_role_id);
                                      const shiftHours = calculateShiftHours(shift.start_time, shift.end_time, shift.break_minutes);
                                      
                                      return (
                                        <TableRow key={shift.id}>
                                          <TableCell>
                                            <div className="flex items-center space-x-2">
                                              <Avatar>
                                                <AvatarImage src={staffMember?.avatar_url} />
                                                <AvatarFallback>{getInitials(staffMember?.first_name, staffMember?.last_name)}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <p className="text-sm font-medium">{staffMember?.first_name} {staffMember?.last_name}</p>
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell>{jobRole?.title}</TableCell>
                                          <TableCell>
                                            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                            <div className="text-xs text-muted-foreground">
                                              ({shift.break_minutes}min break)
                                            </div>
                                          </TableCell>
                                          <TableCell>{shiftHours.toFixed(1)}</TableCell>
                                          <TableCell>£{shift.total_cost.toFixed(2)}</TableCell>
                                          <TableCell>
                                            {shift.hi_score > 0 ? shift.hi_score.toFixed(1) : 'N/A'}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Group shifts by staff member */}
                          {Object.entries(
                            scheduleData.rota_schedule_shifts.reduce((acc: any, shift: any) => {
                              if (!acc[shift.profile_id]) {
                                acc[shift.profile_id] = [];
                              }
                              acc[shift.profile_id].push(shift);
                              return acc;
                            }, {})
                          ).map(([profileId, shifts]: [string, any[]]) => {
                            const staffMember = staff.find(s => s.id === profileId);
                            
                            return (
                              <div key={profileId} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Avatar>
                                    <AvatarImage src={staffMember?.avatar_url} />
                                    <AvatarFallback>{getInitials(staffMember?.first_name, staffMember?.last_name)}</AvatarFallback>
                                  </Avatar>
                                  <h4 className="font-medium">{staffMember?.first_name} {staffMember?.last_name}</h4>
                                </div>
                                
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Day</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Role</TableHead>
                                      <TableHead>Time</TableHead>
                                      <TableHead>Hours</TableHead>
                                      <TableHead>Cost</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {shifts.sort((a: any, b: any) => a.date.localeCompare(b.date)).map((shift: any) => {
                                      const jobRole = jobRoles.find(r => r.id === shift.job_role_id);
                                      const shiftHours = calculateShiftHours(shift.start_time, shift.end_time, shift.break_minutes);
                                      
                                      return (
                                        <TableRow key={shift.id}>
                                          <TableCell>{format(parseISO(shift.date), 'EEEE')}</TableCell>
                                          <TableCell>{format(parseISO(shift.date), 'dd MMM')}</TableCell>
                                          <TableCell>{jobRole?.title}</TableCell>
                                          <TableCell>
                                            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                          </TableCell>
                                          <TableCell>{shiftHours.toFixed(1)}</TableCell>
                                          <TableCell>£{shift.total_cost.toFixed(2)}</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">No Schedule Generated</p>
                    <p className="text-muted-foreground mt-1">
                      You need to generate a schedule for this request first.
                    </p>
                  </div>
                  <Button 
                    onClick={generateSchedule} 
                    disabled={isGenerating}
                    className="mt-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Schedule...
                      </>
                    ) : (
                      'Generate AI Schedule'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                No rota requests found. Please create a request first.
              </p>
            </div>
          )}
        </CardContent>
        {scheduleData && (
          <CardFooter>
            <div className="flex justify-end w-full">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generateSchedule}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    'Regenerate Schedule'
                  )}
                </Button>
                <Button 
                  onClick={sendForApproval}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp className="h-4 w-4" /> Send for Approval
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
