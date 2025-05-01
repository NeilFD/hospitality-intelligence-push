import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { 
  Check, Loader2, Calendar, AlertCircle, CheckCircle, XCircle, 
  Download, Send, Users, FileBarChart 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/services/auth-service';
import StaffingGanttChart from './StaffingGanttChart';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type RotaScheduleApprovalProps = {
  location: any;
  roleMappings?: Record<string, any[]>;
};

export default function RotaScheduleApproval({ location, roleMappings = {} }: RotaScheduleApprovalProps) {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'staff'>('daily');
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    if (location) {
      fetchPendingRequests();
      fetchStaff();
      fetchJobRoles();
    }
  }, [location]);

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rota_requests')
        .select(`
          *,
          profiles:requested_by(first_name, last_name),
          approver:approved_by(first_name, last_name)
        `)
        .eq('location_id', location.id)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setPendingRequests(data || []);
      
      // Select the first request by default
      if (data && data.length > 0) {
        setSelectedRequest(data[0]);
        fetchScheduleData(data[0].id);
      } else {
        setSelectedRequest(null);
        setScheduleData(null);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScheduleData = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('rota_schedules')
        .select('*, rota_schedule_shifts(*)')
        .eq('request_id', requestId)
        .limit(1)
        .single();
        
      if (error) throw error;
      
      setScheduleData(data);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      setScheduleData(null);
      toast.error('Failed to load schedule data');
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) throw error;
      
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
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

  const handleRequestSelect = (request: any) => {
    setSelectedRequest(request);
    fetchScheduleData(request.id);
  };

  const approveAndPublish = async () => {
    if (!selectedRequest || !scheduleData || !profile) return;
    
    setIsPublishing(true);
    
    try {
      // Update the request status
      await supabase
        .from('rota_requests')
        .update({
          status: 'approved',
          approved_by: profile.id
        })
        .eq('id', selectedRequest.id);
      
      // Update the schedule status
      await supabase
        .from('rota_schedules')
        .update({
          status: 'published',
          published_by: profile.id,
          published_at: new Date().toISOString()
        })
        .eq('id', scheduleData.id);
      
      toast.success('Schedule approved and published', {
        description: 'The team can now view their schedule.'
      });
      
      // Refresh the pending requests
      setPublishDialogOpen(false);
      fetchPendingRequests();
    } catch (error) {
      console.error('Error approving schedule:', error);
      toast.error('Failed to approve and publish schedule');
    } finally {
      setIsPublishing(false);
    }
  };

  const rejectSchedule = async () => {
    if (!selectedRequest || !profile) return;
    
    setIsRejecting(true);
    
    try {
      // Update the request status
      await supabase
        .from('rota_requests')
        .update({
          status: 'rejected',
        })
        .eq('id', selectedRequest.id);
      
      toast.success('Schedule rejected', {
        description: 'The schedule has been rejected and sent back for revision.'
      });
      
      // Refresh the pending requests
      setRejectDialogOpen(false);
      fetchPendingRequests();
    } catch (error) {
      console.error('Error rejecting schedule:', error);
      toast.error('Failed to reject schedule');
    } finally {
      setIsRejecting(false);
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

  const generatePDF = () => {
    // This would be implemented with a real PDF generation library
    toast.info('PDF generation would go here', {
      description: 'This feature would generate a PDF version of the schedule for printing or sharing.'
    });
  };

  const emailSchedule = () => {
    // This would be implemented with a real email sending functionality
    toast.info('Email sending would go here', {
      description: 'This feature would email the schedule to all scheduled team members.'
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Approve Schedule</CardTitle>
              <CardDescription>Review and approve rotas before publishing</CardDescription>
            </div>
            
            <div>
              {pendingRequests.length > 0 && (
                <Select
                  value={selectedRequest?.id}
                  onValueChange={(value) => {
                    const request = pendingRequests.find(r => r.id === value);
                    if (request) handleRequestSelect(request);
                  }}
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Select a pending request" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingRequests.map((request) => {
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
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">No Pending Approvals</p>
                <p className="text-muted-foreground mt-1">
                  There are currently no schedules waiting for approval.
                </p>
              </div>
            </div>
          ) : selectedRequest && scheduleData ? (
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
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                Please select a pending request to review.
              </p>
            </div>
          )}
        </CardContent>
        {selectedRequest && scheduleData && (
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              onClick={generatePDF}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button
                onClick={() => setPublishDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" /> Approve & Publish
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve and Publish Schedule</DialogTitle>
            <DialogDescription>
              This will publish the schedule and make it visible to all team members.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approval-comment">Comment (optional)</Label>
              <Textarea
                id="approval-comment"
                placeholder="Add any additional notes for the team..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Publishing Options</Label>
              <div className="flex items-center gap-2">
                <Input type="checkbox" className="w-4 h-4" id="email-team" />
                <Label htmlFor="email-team">Email schedule to team members</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input type="checkbox" className="w-4 h-4" id="pin-noticeboard" />
                <Label htmlFor="pin-noticeboard">Pin to team noticeboard</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={approveAndPublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Approve & Publish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Schedule</DialogTitle>
            <DialogDescription>
              This will reject the schedule and send it back for revisions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-comment">Reason for Rejection</Label>
              <Textarea
                id="rejection-comment"
                placeholder="Please explain why this schedule needs to be revised..."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={rejectSchedule}
              disabled={isRejecting || !rejectionComment.trim()}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
