
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, Calendar, ClipboardList, Filter, RefreshCw, CloudLightning } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableStickyHeader } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type RotaScheduleReviewProps = {
  location: any;
  onApprovalRequest: () => void;
};

// Define job role priority for sorting
const JOB_ROLE_PRIORITY = {
  'Manager': 1,
  'Bartender': 2,
  'FOH': 3,
  'Runner': 4,
  'Chef Manager': 5,
  'Chef': 6,
  'KP': 7
};

export default function RotaScheduleReview({ location, onApprovalRequest }: RotaScheduleReviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterStaff, setFilterStaff] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('staff');

  useEffect(() => {
    if (location) {
      fetchLatestRequest();
    }
  }, [location]);

  const fetchLatestRequest = async () => {
    setIsLoading(true);
    try {
      // Fetch the latest request with status "processing" or "draft"
      const { data: requestData, error: requestError } = await supabase
        .from('rota_requests')
        .select('*')
        .eq('location_id', location.id)
        .in('status', ['processing', 'draft'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestError) {
        if (requestError.code === 'PGRST116') {
          // No content found
          setError('No draft or processing rota requests found. Please create a request first.');
          setIsLoading(false);
          return;
        }
        throw requestError;
      }

      setRequest(requestData);

      // Fetch staff, job roles
      await Promise.all([
        fetchStaffMembers(),
        fetchJobRoles(),
      ]);

      // Check if we already have a generated schedule for this request
      await checkForGeneratedSchedule(requestData?.id);

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

  const checkForGeneratedSchedule = async (requestId?: string) => {
    if (!requestId) {
      console.log('No request ID provided for schedule check');
      return;
    }
    
    setIsChecking(true);
    try {
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('rota_schedules')
        .select('*, rota_schedule_shifts(*)')
        .eq('request_id', requestId)
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
        
        // If we found a schedule and the request is still in 'processing' status, update to 'pending_approval'
        if (request?.status === 'processing') {
          await supabase
            .from('rota_requests')
            .update({ status: 'pending_approval' })
            .eq('id', requestId);
            
          // Update local state
          setRequest({...request, status: 'pending_approval'});
        }
        
        toast.success('Schedule found', {
          description: `Found a schedule with ${shifts.length} shifts`
        });
      } else {
        toast.info('No schedule found yet', {
          description: 'Check again in a moment or contact support if this persists'
        });
      }
    } catch (error) {
      console.error('Error checking for generated schedule:', error);
      toast.error('Error checking for schedule', {
        description: 'Could not retrieve schedule information'
      });
    } finally {
      setIsChecking(false);
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

  // Modified function to include sorting and additional filtering
  const getFilteredShifts = () => {
    if (!generatedSchedule?.rota_schedule_shifts) return [];

    // First, filter the shifts based on filters
    const filteredShifts = generatedSchedule.rota_schedule_shifts.filter((shift: any) => {
      const matchesDate = !filterDate || shift.date === filterDate;
      const matchesStaff = !filterStaff || 
        staffMembers.find(s => s.id === shift.profile_id)?.first_name?.toLowerCase().includes(filterStaff.toLowerCase()) ||
        staffMembers.find(s => s.id === shift.profile_id)?.last_name?.toLowerCase().includes(filterStaff.toLowerCase());
      
      // Additional department filter
      const role = jobRoles.find(r => r.id === shift.job_role_id);
      const isDepartmentMatch = filterDepartment === 'all' || 
        (filterDepartment === 'foh' && !role?.is_kitchen) ||
        (filterDepartment === 'kitchen' && role?.is_kitchen);

      // Additional role filter
      const isRoleMatch = filterRole === 'all' || role?.id === filterRole;
      
      return matchesDate && matchesStaff && isDepartmentMatch && isRoleMatch;
    });
    
    // Then sort the filtered shifts by department (FOH first, then Kitchen) and role priority
    return filteredShifts.sort((a: any, b: any) => {
      const roleA = jobRoles.find(r => r.id === a.job_role_id);
      const roleB = jobRoles.find(r => r.id === b.job_role_id);
      
      // First sort by department (FOH first)
      if ((roleA?.is_kitchen || false) !== (roleB?.is_kitchen || false)) {
        return (roleA?.is_kitchen || false) ? 1 : -1;
      }
      
      // Then sort by role priority
      const roleAPriority = JOB_ROLE_PRIORITY[roleA?.title] || 999;
      const roleBPriority = JOB_ROLE_PRIORITY[roleB?.title] || 999;
      
      return roleAPriority - roleBPriority;
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

  // Get unique job roles for filtering
  const uniqueJobRoles = jobRoles.sort((a: any, b: any) => {
    // Sort FOH first, then Kitchen
    if (a.is_kitchen !== b.is_kitchen) {
      return a.is_kitchen ? 1 : -1;
    }
    
    // Then by role priority
    const priorityA = JOB_ROLE_PRIORITY[a.title] || 999;
    const priorityB = JOB_ROLE_PRIORITY[b.title] || 999;
    return priorityA - priorityB;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            Review Draft Rota
            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
              <CloudLightning className="h-3 w-3 mr-1" />
              N8N Generated
            </Badge>
          </CardTitle>
          {request && (
            <p className="text-sm text-muted-foreground">
              Week: {format(parseISO(request.week_start_date), 'dd MMM yyyy')} to {format(parseISO(request.week_end_date), 'dd MMM yyyy')}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {!generatedSchedule ? (
            <Button 
              onClick={() => checkForGeneratedSchedule(request?.id)} 
              disabled={isChecking || !request}
              variant="outline"
              className="flex items-center"
            >
              {isChecking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {isChecking ? 'Checking...' : 'Check for Schedule'}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => checkForGeneratedSchedule(request?.id)} 
                disabled={isChecking}
              >
                {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
              <Button onClick={handleApprovalRequest}>
                Send for Approval
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {request?.status === 'processing' && !generatedSchedule && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <CloudLightning className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Schedule is being generated</AlertTitle>
            <AlertDescription className="text-blue-700">
              Your schedule request is being processed by N8N. Please check back in a few moments.
              Use the "Check for Schedule" button to refresh.
            </AlertDescription>
          </Alert>
        )}

        {generatedSchedule ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
              <div className="space-y-2 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Filter by Date</label>
                    <Select
                      value={filterDate || 'all'}
                      onValueChange={(value) => setFilterDate(value === 'all' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        {Object.keys(shiftsByDate()).map(date => (
                          <SelectItem key={date} value={date}>
                            {format(parseISO(date), 'EEE, dd MMM')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Filter by Staff</label>
                    <Input
                      type="text"
                      placeholder="Search staff..."
                      value={filterStaff}
                      onChange={e => setFilterStaff(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <Select
                      value={filterDepartment}
                      onValueChange={setFilterDepartment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="foh">FOH</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Job Role</label>
                    <Select 
                      value={filterRole} 
                      onValueChange={setFilterRole}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {uniqueJobRoles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.title} {role.is_kitchen ? '(Kitchen)' : '(FOH)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                          <TableStickyHeader>
                            <TableRow>
                              <TableHead>Staff</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead className="text-right">Cost</TableHead>
                            </TableRow>
                          </TableStickyHeader>
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
                          <TableStickyHeader>
                            <TableRow>
                              <TableHead>Day</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead className="text-right">Cost</TableHead>
                            </TableRow>
                          </TableStickyHeader>
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
            <CloudLightning className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Schedule Found</h3>
            <p className="text-muted-foreground max-w-md">
              {request ? (
                <>
                  Your schedule request has been sent to the N8N workflow for processing. 
                  Click the "Check for Schedule" button to see if it's ready.
                </>
              ) : (
                <>
                  No rota request found. Please create a new rota request first.
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
