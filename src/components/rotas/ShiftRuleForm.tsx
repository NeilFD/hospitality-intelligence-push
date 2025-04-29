import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

export default function ShiftRuleForm({ isOpen, onClose, onSubmitComplete, locationId, jobRoles, day }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    job_role_id: '',
    start_time: '09:00',
    end_time: '17:00',
    min_staff: 1,
    max_staff: 1,
    revenue_to_staff_ratio: null,
    priority: 3,
    required_skill_level: null
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.job_role_id) {
      toast("Please select a job role", {
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('shift_rules')
        .insert({
          location_id: locationId,
          day_of_week: day,
          ...formData
        });
        
      if (error) throw error;
      
      toast("Shift rule created", {
        description: "The shift rule has been added successfully.",
      });
      
      onSubmitComplete();
      onClose();
    } catch (error) {
      console.error('Error creating shift rule:', error);
      toast("Error creating shift rule", {
        description: error.message || "There was a problem creating the shift rule.",
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format day for display
  const formatDay = (dayId) => {
    const days = {
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
      sun: 'Sunday'
    };
    return days[dayId] || dayId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Shift Rule for {formatDay(day)}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="role">Job Role</Label>
            <Select 
              value={formData.job_role_id} 
              onValueChange={(value) => handleChange('job_role_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {jobRoles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_staff">Minimum Staff</Label>
              <Input
                id="min_staff"
                type="number"
                min="1"
                value={formData.min_staff}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  handleChange('min_staff', value);
                  if (value > formData.max_staff) {
                    handleChange('max_staff', value);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_staff">Maximum Staff</Label>
              <Input
                id="max_staff"
                type="number"
                min={formData.min_staff}
                value={formData.max_staff}
                onChange={(e) => handleChange('max_staff', parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="priority">Priority (1-5)</Label>
              <span className="text-sm text-muted-foreground">{formData.priority}/5</span>
            </div>
            <Slider
              id="priority"
              min={1}
              max={5}
              step={1}
              value={[formData.priority]}
              onValueChange={(value) => handleChange('priority', value[0])}
              className="pt-2"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="revenue_ratio">
              Revenue to Staff Ratio (£ per staff member, optional)
            </Label>
            <Input
              id="revenue_ratio"
              type="number"
              placeholder="Optional"
              min="0"
              step="0.01"
              value={formData.revenue_to_staff_ratio || ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : null;
                handleChange('revenue_to_staff_ratio', value);
              }}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Shift Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
