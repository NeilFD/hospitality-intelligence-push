
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

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

export default function TeamMemberForm({ isOpen, onClose, member, onSave, jobRoles }) {
  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    job_role_id: '',
    location_id: defaultLocationId,
    employment_type: 'hourly',
    min_hours_per_day: 0,
    max_hours_per_day: 8,
    min_hours_per_week: 0,
    max_hours_per_week: 40,
    wage_rate: 0,
    performance_score: 0,
    photo_url: '',
    availability: defaultAvailability,
    available_for_rota: true
  });
  const [availability, setAvailability] = useState(defaultAvailability);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

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
    if (member) {
      setFormData({
        id: member.id,
        full_name: member.full_name,
        job_role_id: member.job_role_id,
        location_id: member.location_id || defaultLocationId,
        employment_type: member.employment_type || 'hourly',
        min_hours_per_day: member.min_hours_per_day || 0,
        max_hours_per_day: member.max_hours_per_day || 8,
        min_hours_per_week: member.min_hours_per_week || 0,
        max_hours_per_week: member.max_hours_per_week || 40,
        wage_rate: member.wage_rate || 0,
        performance_score: member.performance_score || 0,
        photo_url: member.photo_url || '',
        availability: member.availability || defaultAvailability,
        available_for_rota: member.available_for_rota !== false // Default to true if undefined
      });
      
      setLoadingAvailability(true);
      if (member.availability) {
        setAvailability(member.availability);
      } else {
        setAvailability(defaultAvailability);
      }
      setLoadingAvailability(false);
    }
  }, [member, defaultLocationId, defaultAvailability]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.full_name.trim()) {
      toast.error("Please enter the team member's name");
      return;
    }
    
    // Convert numeric fields from string to number
    const processedData = {
      ...formData,
      min_hours_per_day: parseFloat(formData.min_hours_per_day?.toString() || '0'),
      max_hours_per_day: parseFloat(formData.max_hours_per_day?.toString() || '8'),
      min_hours_per_week: parseFloat(formData.min_hours_per_week?.toString() || '0'),
      max_hours_per_week: parseFloat(formData.max_hours_per_week?.toString() || '40'),
      wage_rate: parseFloat(formData.wage_rate?.toString() || '0'),
      available_for_rota: formData.available_for_rota === true // Make sure it's a boolean
    };
    
    onSave(processedData);
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
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
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
              <Select onValueChange={(value) => setFormData({...formData, job_role_id: value})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a job role" defaultValue={formData.job_role_id} />
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
              <Select onValueChange={(value) => setFormData({...formData, employment_type: value})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employment type" defaultValue={formData.employment_type} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Wage Rate */}
            <div>
              <Label htmlFor="wage_rate">Wage Rate (£/hour)</Label>
              <Input 
                type="number" 
                id="wage_rate" 
                value={formData.wage_rate}
                onChange={(e) => setFormData({...formData, wage_rate: parseFloat(e.target.value) || 0})}
              />
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
                onChange={(e) => setFormData({...formData, min_hours_per_day: parseFloat(e.target.value) || 0})}
              />
            </div>
            
            {/* Max Hours Per Day */}
            <div>
              <Label htmlFor="max_hours_per_day">Max Hours Per Day</Label>
              <Input 
                type="number" 
                id="max_hours_per_day" 
                value={formData.max_hours_per_day}
                onChange={(e) => setFormData({...formData, max_hours_per_day: parseFloat(e.target.value) || 0})}
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
                onChange={(e) => setFormData({...formData, min_hours_per_week: parseFloat(e.target.value) || 0})}
              />
            </div>
            
            {/* Max Hours Per Week */}
            <div>
              <Label htmlFor="max_hours_per_week">Max Hours Per Week</Label>
              <Input 
                type="number" 
                id="max_hours_per_week" 
                value={formData.max_hours_per_week}
                onChange={(e) => setFormData({...formData, max_hours_per_week: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
              
              {/* Available for rota toggle */}
              <div className="flex items-center justify-between mb-4">
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
            {member ? 'Update Team Member' : 'Add Team Member'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
