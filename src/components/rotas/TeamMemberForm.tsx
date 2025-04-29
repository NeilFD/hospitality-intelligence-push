
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { supabase } from '@/lib/supabase';

const defaultLocationId = '08949a02-9400-4503-8a78-109458dc9c4d';

const defaultAvailability = {
  mon: { start: '09:00', end: '17:00' },
  tue: { start: '09:00', end: '17:00' },
  wed: { start: '09:00', end: '17:00' },
  thu: { start: '09:00', end: '17:00' },
  fri: { start: '09:00', end: '17:00' },
  sat: { start: null, end: null },
  sun: { start: null, end: null },
};

export default function TeamMemberForm({ isOpen, onClose, onSubmitComplete, locationId, jobRoles, teamMember, isEditing }) {
  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    job_role_id: '',
    location_id: locationId || defaultLocationId,
    employment_type: 'hourly',
    min_hours_per_day: 0,
    max_hours_per_day: 8,
    min_hours_per_week: 0,
    max_hours_per_week: 40,
    wage_rate: 0,
    annual_salary: 0,
    contractor_rate: 0,
    performance_score: 0,
    photo_url: '',
    availability: defaultAvailability,
    available_for_rota: true,
    employment_start_date: null,
    employment_status: '',
    in_ft_education: false
  });
  const [availability, setAvailability] = useState(defaultAvailability);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [startDate, setStartDate] = useState(null);

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const handleAvailabilityChange = (day, time, type) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: time
      }
    }));
  };

  // Initialize form with member data when editing
  useEffect(() => {
    if (teamMember) {
      // Parse employment start date if it exists
      let parsedStartDate = null;
      if (teamMember.employment_start_date) {
        try {
          parsedStartDate = new Date(teamMember.employment_start_date);
          setStartDate(parsedStartDate);
        } catch (e) {
          console.error("Error parsing employment start date:", e);
        }
      }

      setFormData({
        id: teamMember.id,
        full_name: teamMember.full_name,
        job_role_id: teamMember.job_role_id,
        location_id: teamMember.location_id || locationId || defaultLocationId,
        employment_type: teamMember.employment_type || 'hourly',
        min_hours_per_day: teamMember.min_hours_per_day || 0,
        max_hours_per_day: teamMember.max_hours_per_day || 8,
        min_hours_per_week: teamMember.min_hours_per_week || 0,
        max_hours_per_week: teamMember.max_hours_per_week || 40,
        wage_rate: teamMember.wage_rate || 0,
        annual_salary: teamMember.annual_salary || 0,
        contractor_rate: teamMember.contractor_rate || 0,
        performance_score: teamMember.performance_score || 0,
        photo_url: teamMember.photo_url || '',
        availability: teamMember.availability || defaultAvailability,
        available_for_rota: teamMember.available_for_rota !== false, // Default to true if undefined
        employment_start_date: parsedStartDate ? format(parsedStartDate, 'yyyy-MM-dd') : null,
        employment_status: teamMember.employment_status || '',
        in_ft_education: teamMember.in_ft_education || false
      });
      
      setLoadingAvailability(true);
      if (teamMember.availability) {
        setAvailability(teamMember.availability);
      } else {
        setAvailability(defaultAvailability);
      }
      setLoadingAvailability(false);
    }
  }, [teamMember, locationId, defaultLocationId]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
    setFormData({
      ...formData,
      employment_start_date: date ? format(date, 'yyyy-MM-dd') : null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.full_name.trim()) {
      toast.error("Please enter the team member's name");
      return;
    }
    
    // Convert numeric fields from string to number
    const processedData = {
      ...formData,
      min_hours_per_day: parseFloat(formData.min_hours_per_day.toString() || '0'),
      max_hours_per_day: parseFloat(formData.max_hours_per_day.toString() || '8'),
      min_hours_per_week: parseFloat(formData.min_hours_per_week.toString() || '0'),
      max_hours_per_week: parseFloat(formData.max_hours_per_week.toString() || '40'),
      wage_rate: parseFloat(formData.wage_rate.toString() || '0'),
      annual_salary: parseFloat(formData.annual_salary.toString() || '0'),
      contractor_rate: parseFloat(formData.contractor_rate.toString() || '0'),
      available_for_rota: formData.available_for_rota === true, // Make sure it's a boolean
      in_ft_education: formData.in_ft_education === true,
      availability: availability
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('team_members')
          .update(processedData)
          .eq('id', teamMember.id);

        if (error) throw error;
        toast("Team member updated", {
          description: `${formData.full_name} has been updated.`
        });
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert([processedData]);

        if (error) throw error;
        toast("Team member added", {
          description: `${formData.full_name} has been added to the team.`
        });
      }
      
      // Close dialog and refresh data
      onClose();
      if (onSubmitComplete) {
        onSubmitComplete();
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error("Error saving team member", {
        description: error.message
      });
    }
  };

  const renderTimeSelect = (day, type) => (
    <Select onValueChange={(time) => handleAvailabilityChange(day, time, type)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a time" defaultValue={availability[day]?.[type] || null} />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 24 }, (_, i) => i).map(hour => (
          Array.from({ length: 4 }, (_, j) => {
            const minute = j * 15;
            const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            return <SelectItem key={time} value={time}>{time}</SelectItem>;
          })
        )).reduce((acc, val) => acc.concat(val), [])}
        <SelectItem value={null}>Not Available</SelectItem>
      </SelectContent>
    </Select>
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teamMember ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input 
                type="text" 
                id="full_name" 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            
            {/* Job Role */}
            <div>
              <Label htmlFor="job_role">Job Role</Label>
              <Select 
                value={formData.job_role_id} 
                onValueChange={(value) => setFormData({...formData, job_role_id: value})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a job role" />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles?.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employment Type */}
            <div>
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select 
                value={formData.employment_type} 
                onValueChange={(value) => setFormData({...formData, employment_type: value})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Employment Status */}
            <div>
              <Label htmlFor="employment_status">Employment Status</Label>
              <Select 
                value={formData.employment_status || ""} 
                onValueChange={(value) => setFormData({...formData, employment_status: value})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Payment section - changes based on employment type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formData.employment_type === 'hourly' && (
              <div>
                <Label htmlFor="wage_rate">Hourly Rate (£)</Label>
                <Input 
                  type="number" 
                  id="wage_rate" 
                  value={formData.wage_rate}
                  onChange={(e) => setFormData({...formData, wage_rate: Number(e.target.value)})}
                />
              </div>
            )}
            
            {formData.employment_type === 'salary' && (
              <div>
                <Label htmlFor="annual_salary">Annual Salary (£)</Label>
                <Input 
                  type="number" 
                  id="annual_salary" 
                  value={formData.annual_salary}
                  onChange={(e) => setFormData({...formData, annual_salary: Number(e.target.value)})}
                />
              </div>
            )}
            
            {formData.employment_type === 'contractor' && (
              <div>
                <Label htmlFor="contractor_rate">Contractor Rate (£)</Label>
                <Input 
                  type="number" 
                  id="contractor_rate" 
                  value={formData.contractor_rate}
                  onChange={(e) => setFormData({...formData, contractor_rate: Number(e.target.value)})}
                />
              </div>
            )}
            
            {/* Employment Start Date - for all types */}
            <div>
              <Label htmlFor="employment_start_date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Min Hours Per Day */}
            <div>
              <Label htmlFor="min_hours_per_day">Min Hours Per Day</Label>
              <Input 
                type="number" 
                id="min_hours_per_day" 
                value={formData.min_hours_per_day}
                onChange={(e) => setFormData({...formData, min_hours_per_day: Number(e.target.value)})}
              />
            </div>
            
            {/* Max Hours Per Day */}
            <div>
              <Label htmlFor="max_hours_per_day">Max Hours Per Day</Label>
              <Input 
                type="number" 
                id="max_hours_per_day" 
                value={formData.max_hours_per_day}
                onChange={(e) => setFormData({...formData, max_hours_per_day: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Min Hours Per Week */}
            <div>
              <Label htmlFor="min_hours_per_week">Min Hours Per Week</Label>
              <Input 
                type="number" 
                id="min_hours_per_week" 
                value={formData.min_hours_per_week}
                onChange={(e) => setFormData({...formData, min_hours_per_week: Number(e.target.value)})}
              />
            </div>
            
            {/* Max Hours Per Week */}
            <div>
              <Label htmlFor="max_hours_per_week">Max Hours Per Week</Label>
              <Input 
                type="number" 
                id="max_hours_per_week" 
                value={formData.max_hours_per_week}
                onChange={(e) => setFormData({...formData, max_hours_per_week: Number(e.target.value)})}
              />
            </div>
          </div>
          
          {/* Available for rota and In Full-time Education toggles */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="available-for-rota" className="text-base">Available for Rota</Label>
                <p className="text-sm text-muted-foreground">
                  Whether this team member is available for scheduling
                </p>
              </div>
              <Switch 
                id="available-for-rota"
                checked={formData.available_for_rota}
                onCheckedChange={(checked) => setFormData({...formData, available_for_rota: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="in-ft-education" className="text-base">In Full-time Education</Label>
                <p className="text-sm text-muted-foreground">
                  Whether this team member is currently in full-time education
                </p>
              </div>
              <Switch 
                id="in-ft-education"
                checked={formData.in_ft_education}
                onCheckedChange={(checked) => setFormData({...formData, in_ft_education: checked})}
              />
            </div>
          </div>
              
          {/* Availability */}
          <div>
            <Label>Weekly Availability</Label>
            {loadingAvailability ? (
              <div>Loading availability...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(availability).map(([day, times]) => (
                  <div key={day} className="space-y-2">
                    <h4 className="font-medium capitalize">{day}</h4>
                    <div className="flex items-center space-x-2">
                      <div>
                        <Label htmlFor={`${day}-start`}>Start Time:</Label>
                        {renderTimeSelect(day, 'start')}
                      </div>
                      <div>
                        <Label htmlFor={`${day}-end`}>End Time:</Label>
                        {renderTimeSelect(day, 'end')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        
        <DialogFooter>
          <Button type="submit">
            {teamMember ? 'Update Team Member' : 'Add Team Member'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
