import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, Calendar, ClipboardList } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RotaSchedulingAlgorithm } from '@/utils/rotaSchedulingAlgorithm';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

type RotaScheduleReviewProps = {
  location: any;
  onApprovalRequest: () => void;
};

export default function RotaScheduleReview({ location, onApprovalRequest }: RotaScheduleReviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [shiftRules, setShiftRules] = useState<any[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterStaff, setFilterStaff] = useState<string>('');
  const [activeTab, setActiveTab] = useState('staff');

  useEffect(() => {
    if (location) {
      fetchLatestRequest();
    }
  }, [location]);

  const fetchLatestRequest = async () => {
    setIsLoading(true);
    try {
      // Fetch the latest draft request
      const { data: requestData, error: requestError } = await supabase
        .from('rota_requests')
        .select('*')
        .eq('location_id', location.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (requestError) {
        if (requestError.code === 'PGRST116') {
          // No content found
          setError('No draft rota requests found. Please create a request first.');
          setIsLoading(false);
          return;
        }
        throw requestError;
      }

      setRequest(requestData);

      // Fetch staff, job roles, thresholds, and shift rules
      await Promise.all([
        fetchStaffMembers(),
        fetchJobRoles(),
        fetchThresholds(),
        fetchShiftRules()
      ]);

      // Check if we already have a generated schedule for this request
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('rota_schedules')
        .select('*, rota_schedule_shifts(*)')
        .eq('request_id', requestData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scheduleError) throw scheduleError;

      if (scheduleData) {
        // Calculate and update the correct total cost if needed
        const shifts = scheduleData.rota_schedule_shifts || [];
        const calculatedTotalCost = shifts.reduce((sum: number, shift: any) => sum + (shift.total_cost || 0), 0);
        
        // If there's a discrepancy between the stored total_cost and calculated value, update it
        if (Math.abs((scheduleData.total_cost || 0) - calculatedTotalCost) > 0.01) {
          console.log(`Updating total cost from ${scheduleData.total_cost} to ${calculatedTotalCost}`);
          
          // Update in the database
          const { error: updateError } = await supabase
            .from('rota_schedules')
            .update({ 
              total_cost: calculatedTotalCost,
              cost_percentage: scheduleData.revenue_forecast ? (calculatedTotalCost / scheduleData.revenue_forecast * 100) : 0
            })
            .eq('id', scheduleData.id);
            
          if (updateError) {
            console.error('Error updating schedule total cost:', updateError);
          } else {
            // Update in the local state too
            scheduleData.total_cost = calculatedTotalCost;
            scheduleData.cost_percentage = scheduleData.revenue_forecast ? 
              (calculatedTotalCost / scheduleData.revenue_forecast * 100) : 0;
          }
        }
        
        setGeneratedSchedule(scheduleData);
      }

    } catch (error) {
      console.error('Error fetching request data:', error);
      setError('Failed to load request data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('available_for_rota', true)
        .order('first_name');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    }
  };

  const fetchJobRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*');

      if (error) throw error;
      setJobRoles(data || []);
    } catch (error) {
      console.error('Error fetching job roles:', error);
    }
  };

  const fetchThresholds = async () => {
    try {
      const { data, error } = await supabase
        .from('rota_revenue_thresholds')
        .select('*')
        .eq('location_id', location.id);

      if (error) throw error;
      setThresholds(data || []);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    }
  };

  /**
   * Fetch all shift rules for the location
   */
  const fetchShiftRules = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_rules')
        .select(`
          *,
          job_roles (*)
        `)
        .eq('location_id', location.id)
        .order('priority', { ascending: false });

      if (error) throw error;
      console.log('Fetched shift rules:', data?.length);
      setShiftRules(data || []);
    } catch (error) {
      console.error('Error fetching shift rules:', error);
      toast.error("Error loading shift rules", {
        description: "Shift rules will not be used in scheduling."
      });
    }
  };

  const prepareShiftForDatabase = (shift: any) => {
    // Create a new object with only the fields that exist in the database
    const validFields = [
      'profile_id',
      'date',
      'day_of_week',
      'start_time',
      'end_time',
      'break_minutes',
      'job_role_id',
      'is_secondary_role',
      'hi_score',
      'shift_cost',
      'employer_ni_cost',
      'employer_pension_cost',
      'total_cost',
      'schedule_id' // This will be added later
    ];
    
    const cleanedShift: Record<string, any> = {};
    
    validFields.forEach(field => {
      if (shift[field] !== undefined) {
        cleanedShift[field] = shift[field];
      }
    });
    
    return cleanedShift;
  };

  const generateSchedule = async () => {
    if (!request || !staffMembers.length || !jobRoles.length) {
      toast.error('Missing required data to generate schedule');
      return;
    }

    setIsGenerating(true);
    try {
      // Create scheduling algorithm instance
      const scheduler = new RotaSchedulingAlgorithm({
        request,
        staff: staffMembers,
        jobRoles,
        thresholds,
        location
      });

      // Set the shift rules to use for scheduling
      scheduler.setShiftRules(shiftRules);
      
      console.log(`Using ${shiftRules.length} shift rules for scheduling`);
      
      // Generate the schedule
      const schedule = await scheduler.generateSchedule();
      console.log(`Generated schedule with ${schedule.shifts?.length || 0} shifts`);
      
      if (!schedule.shifts || schedule.shifts.length === 0) {
        toast.warning('No shifts were generated. Ensure staff and job roles are correctly configured.');
        setIsGenerating(false);
        return;
      }

      // Calculate the actual total cost for accuracy
      const calculatedTotalCost = schedule.shifts.reduce((sum: number, shift: any) => sum + (shift.total_cost || 0), 0);
      
      // Ensure we use the accurately calculated cost
      schedule.total_cost = calculatedTotalCost;
      schedule.cost_percentage = schedule.revenue_forecast ? 
        (calculatedTotalCost / schedule.revenue_forecast * 100) : 0;
      
      console.log(`Using calculated total cost: £${calculatedTotalCost.toFixed(2)} (${schedule.cost_percentage.toFixed(1)}%)`);

      // Create the schedule record in the database
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('rota_schedules')
        .insert({
          request_id: request.id,
          location_id: location.id,
          week_start_date: request.week_start_date,
          week_end_date: request.week_end_date,
          status: 'draft',
          total_cost: calculatedTotalCost, // Use the accurately calculated total cost
          revenue_forecast: schedule.revenue_forecast,
          cost_percentage: schedule.cost_percentage,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (scheduleError) {
        console.error('Error creating schedule:', scheduleError);
        toast.error('Failed to create schedule record');
        throw scheduleError;
      }

      console.log('Schedule record created:', scheduleData);

      // Prepare shifts for database insertion - remove fields that don't exist in the database
      if (schedule.shifts && schedule.shifts.length > 0) {
        const cleanShifts = schedule.shifts.map((shift: any) => {
          const cleanShift = prepareShiftForDatabase(shift);
          cleanShift.schedule_id = scheduleData.id;
          return cleanShift;
        });

        console.log(`Inserting ${cleanShifts.length} shifts into database`);
        console.log('First shift example:', cleanShifts[0]);

        const { error: shiftsError } = await supabase
          .from('rota_schedule_shifts')
          .insert(cleanShifts);

        if (shiftsError) {
          console.error('Error inserting shifts:', shiftsError);
          toast.error('Error saving shifts', {
            description: shiftsError.message || 'Database error occurred'
          });
          
          // Continue execution to fetch what we can, even if some shifts failed
        } else {
          console.log('Successfully inserted shifts');
        }
      }

      // Fetch the complete schedule with shifts
      const { data: completeSchedule, error: fetchError } = await supabase
        .from('rota_schedules')
        .select('*, rota_schedule_shifts(*)')
        .eq('id', scheduleData.id)
        .single();

      if (fetchError) {
        console.error('Error fetching complete schedule:', fetchError);
        toast.error('Error retrieving saved schedule');
        throw fetchError;
      }

      console.log(`Retrieved schedule with ${completeSchedule.rota_schedule_shifts?.length || 0} shifts`);
      
      // Verify total cost again after fetching
      const fetchedShifts = completeSchedule.rota_schedule_shifts || [];
      const verifiedTotalCost = fetchedShifts.reduce((sum: number, shift: any) => sum + (shift.total_cost || 0), 0);
      
      // If there's still a discrepancy, update the total cost
      if (Math.abs((completeSchedule.total_cost || 0) - verifiedTotalCost) > 0.01) {
        console.log(`Fixing final total cost from ${completeSchedule.total_cost} to ${verifiedTotalCost}`);
        
        // Update in the database
        const { error: updateError } = await supabase
          .from('rota_schedules')
          .update({ 
            total_cost: verifiedTotalCost,
            cost_percentage: completeSchedule.revenue_forecast ? (verifiedTotalCost / completeSchedule.revenue_forecast * 100) : 0
          })
          .eq('id', completeSchedule.id);
          
        if (updateError) {
          console.error('Error updating final schedule total cost:', updateError);
        } else {
          // Update in the local state too
          completeSchedule.total_cost = verifiedTotalCost;
          completeSchedule.cost_percentage = completeSchedule.revenue_forecast ? 
            (verifiedTotalCost / completeSchedule.revenue_forecast * 100) : 0;
        }
      }
      
      setGeneratedSchedule(completeSchedule);
      
      if (completeSchedule.rota_schedule_shifts?.length > 0) {
        toast.success(`Schedule generated with ${completeSchedule.rota_schedule_shifts.length} shifts`);
      } else {
        toast.warning('Schedule created, but no shifts were saved');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast.error('Failed to generate schedule', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprovalRequest = async () => {
    if (!generatedSchedule) return;

    try {
      // Update the request status
      const { error } = await supabase
        .from('rota_requests')
        .update({ status: 'pending_approval' })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Rota sent for approval');
      onApprovalRequest();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to send rota for approval');
    }
  };

  // Filter shifts by date and/or staff member
  const getFilteredShifts = () => {
    if (!generatedSchedule?.rota_schedule_shifts) return [];

    return generatedSchedule.rota_schedule_shifts.filter((shift: any) => {
      const matchesDate = !filterDate || shift.date === filterDate;
      const matchesStaff = !filterStaff || 
        staffMembers.find(s => s.id === shift.profile_id)?.first_name?.toLowerCase().includes(filterStaff.toLowerCase()) ||
        staffMembers.find(s => s.id === shift.profile_id)?.last_name?.toLowerCase().includes(filterStaff.toLowerCase());
      
      return matchesDate && matchesStaff;
    });
  };

  // Group shifts by date
  const shiftsByDate = () => {
    const shifts = getFilteredShifts();
    const grouped: {[key: string]: any[]} = {};
    
    shifts.forEach((shift: any) => {
      if (!grouped[shift.date]) {
        grouped[shift.date] = [];
      }
      grouped[shift.date].push(shift);
    });
    
    return grouped;
  };

  // Group shifts by staff
  const shiftsByStaff = () => {
    const shifts = getFilteredShifts();
    const grouped: {[key: string]: any[]} = {};
    
    shifts.forEach((shift: any) => {
      if (!grouped[shift.profile_id]) {
        grouped[shift.profile_id] = [];
      }
      grouped[shift.profile_id].push(shift);
    });
    
    return grouped;
  };

  const getDayOfWeek = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'EEEE');
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getStaffName = (profileId: string) => {
    const staff = staffMembers.find(s => s.id === profileId);
    return staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown Staff';
  };

  const getJobRoleTitle = (jobRoleId: string) => {
    const role = jobRoles.find(r => r.id === jobRoleId);
    return role ? role.title : 'Unknown Role';
  };

  const getTotalCostByDate = (date: string) => {
    const shifts = generatedSchedule?.rota_schedule_shifts.filter((s: any) => s.date === date) || [];
    return shifts.reduce((sum: number, shift: any) => sum + (shift.total_cost || 0), 0);
  };

  const getRevenueForecast = (date: string) => {
    return request?.revenue_forecast?.[date] || 0;
  };

  const getCostPercentage = (date: string) => {
    const cost = getTotalCostByDate(date);
    const revenue = getRevenueForecast(date);
    
    if (!revenue || revenue === 0) return 0;
    return (cost / Number(revenue)) * 100;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getShiftRuleName = (shift: any) => {
    if (shift.shift_rule_name) {
      return shift.shift_rule_name;
    }
    return getJobRoleTitle(shift.job_role_id);
  };

  const renderShiftCell = (shift: any) => {
    const isFromShiftRule = !!shift.shift_rule_id;
    
    return (
      <>
        <Badge variant={shift.is_secondary_role ? "outline" : "default"}>
          {getJobRoleTitle(shift.job_role_id)}
        </Badge>
        
        {isFromShiftRule && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            From rule: {shift.shift_rule_name || "Unnamed rule"}
          </div>
        )}
        
        {shift.is_secondary_role && (
          <div className="text-xs text-muted-foreground mt-1">
            Secondary role
          </div>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Review Draft Rota</CardTitle>
          {request && (
            <p className="text-sm text-muted-foreground">
              Week: {format(parseISO(request.week_start_date), 'dd MMM yyyy')} to {format(parseISO(request.week_end_date), 'dd MMM yyyy')}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {!generatedSchedule ? (
            <Button 
              onClick={generateSchedule} 
              disabled={isGenerating}
              className="flex items-center"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClipboardList className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Schedule'}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={generateSchedule} 
                disabled={isGenerating}
              >
                Regenerate
              </Button>
              <Button onClick={handleApprovalRequest}>
                Send for Approval
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {generatedSchedule ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Filter by Date</label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={filterDate || ''}
                  onChange={e => setFilterDate(e.target.value || null)}
                >
                  <option value="">All Dates</option>
                  {Object.keys(shiftsByDate()).map(date => (
                    <option key={date} value={date}>
                      {format(parseISO(date), 'EEE, dd MMM')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Filter by Staff</label>
                <Input
                  type="text"
                  placeholder="Search staff..."
                  value={filterStaff}
                  onChange={e => setFilterStaff(e.target.value)}
                />
              </div>
            </div>
            
            <div className="rounded-lg border bg-card overflow-hidden mb-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Total Cost</p>
                  <p className="text-2xl font-bold">£{(generatedSchedule.total_cost || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Revenue Forecast</p>
                  <p className="text-2xl font-bold">£{generatedSchedule.revenue_forecast?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cost %</p>
                  <p className={`text-2xl font-bold ${
                    ((generatedSchedule.cost_percentage || 0) > 30) ? 'text-destructive' : 'text-green-600'
                  }`}>
                    {(generatedSchedule.cost_percentage || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="date">View by Date</TabsTrigger>
                <TabsTrigger value="staff">View by Staff</TabsTrigger>
              </TabsList>

              <TabsContent value="date" className="mt-4">
                <div className="space-y-4">
                  {Object.entries(shiftsByDate()).map(([date, shifts]) => (
                    <Card key={date} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 py-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">
                              {format(parseISO(date), 'EEEE, dd MMM yyyy')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              Revenue: £{getRevenueForecast(date)}
                            </p>
                            <p className="text-sm">
                              Cost: £{getTotalCostByDate(date).toFixed(2)} 
                              ({getCostPercentage(date).toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <div className="px-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Staff</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead className="text-right">Cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shifts.map((shift: any) => (
                              <TableRow key={shift.id}>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage 
                                        src={staffMembers.find(s => s.id === shift.profile_id)?.avatar_url}
                                        alt={getStaffName(shift.profile_id)} 
                                      />
                                      <AvatarFallback>
                                        {getInitials(
                                          staffMembers.find(s => s.id === shift.profile_id)?.first_name || '',
                                          staffMembers.find(s => s.id === shift.profile_id)?.last_name || ''
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      {getStaffName(shift.profile_id)}
                                      {shift.hi_score > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                          HiQ: {shift.hi_score.toFixed(1)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {renderShiftCell(shift)}
                                </TableCell>
                                <TableCell>
                                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                  <div className="text-xs text-muted-foreground">
                                    {shift.break_minutes}min break
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  £{shift.total_cost.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="staff" className="mt-4">
                <div className="space-y-4">
                  {Object.entries(shiftsByStaff()).map(([staffId, shifts]) => (
                    <Card key={staffId} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 py-2">
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarImage 
                              src={staffMembers.find(s => s.id === staffId)?.avatar_url}
                              alt={getStaffName(staffId)} 
                            />
                            <AvatarFallback>
                              {getInitials(
                                staffMembers.find(s => s.id === staffId)?.first_name || '',
                                staffMembers.find(s => s.id === staffId)?.last_name || ''
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{getStaffName(staffId)}</h3>
                            <p className="text-sm text-muted-foreground">
                              {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <div className="px-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Day</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead className="text-right">Cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shifts.map((shift: any) => (
                              <TableRow key={shift.id}>
                                <TableCell>
                                  <div>
                                    {format(parseISO(shift.date), 'EEE, dd MMM')}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {renderShiftCell(shift)}
                                </TableCell>
                                <TableCell>
                                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                  <div className="text-xs text-muted-foreground">
                                    {shift.break_minutes}min break
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  £{shift.total_cost.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Schedule Generated</h3>
            <p className="text-muted-foreground max-w-md">
              Click the "Generate Schedule" button to create an optimized staff schedule based on 
              the revenue forecasts, staff Hi Scores, and configured thresholds.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
