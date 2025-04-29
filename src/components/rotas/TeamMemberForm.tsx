import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import AvailabilityScheduler from './AvailabilityScheduler';

export default function TeamMemberForm({ 
  isOpen, 
  onClose, 
  onSubmitComplete, 
  locationId, 
  jobRoles,
  teamMember,
  isEditing
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState('basic');

  const [formData, setFormData] = useState({
    full_name: '',
    job_role_id: '',
    photo_url: '',
    employment_type: 'hourly',
    wage_rate: 0,
    min_hours_per_week: 0,
    max_hours_per_week: 40,
    min_hours_per_day: 0,
    max_hours_per_day: 8,
    performance_score: 50,
    availability: []
  });

  // If editing, populate the form with the team member data
  useEffect(() => {
    if (teamMember && isEditing) {
      setFormData({
        full_name: teamMember.full_name || '',
        job_role_id: teamMember.job_role_id || '',
        photo_url: teamMember.photo_url || '',
        employment_type: teamMember.employment_type || 'hourly',
        wage_rate: teamMember.wage_rate || 0,
        min_hours_per_week: teamMember.min_hours_per_week || 0,
        max_hours_per_week: teamMember.max_hours_per_week || 40,
        min_hours_per_day: teamMember.min_hours_per_day || 0,
        max_hours_per_day: teamMember.max_hours_per_day || 8,
        performance_score: teamMember.performance_score || 50,
        availability: teamMember.availability || []
      });
    } else {
      // Reset form when adding a new member
      setFormData({
        full_name: '',
        job_role_id: '',
        photo_url: '',
        employment_type: 'hourly',
        wage_rate: 0,
        min_hours_per_week: 0,
        max_hours_per_week: 40,
        min_hours_per_day: 0,
        max_hours_per_day: 8,
        performance_score: 50,
        availability: []
      });
    }
    
    // Reset to basic tab when opening
    setTab('basic');
  }, [teamMember, isEditing, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name) {
      toast("Name is required", {
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
      return;
    }
    
    if (!formData.job_role_id) {
      toast("Job role is required", {
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (isEditing) {
        result = await supabase
          .from('team_members')
          .update({
            ...formData,
            location_id: locationId,
          })
          .eq('id', teamMember.id);
      } else {
        result = await supabase
          .from('team_members')
          .insert({
            ...formData,
            location_id: locationId,
          });
      }
      
      const { error } = result;
      if (error) throw error;
      
      toast(isEditing ? "Team member updated" : "Team member created", {
        description: `${formData.full_name} has been ${isEditing ? 'updated' : 'added'} successfully.`,
      });
      
      onSubmitComplete();
      onClose();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast("Error saving team member", {
        description: error.message || "There was a problem saving the team member.",
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Team Member</DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo_url">Photo URL</Label>
                <Input
                  id="photo_url"
                  value={formData.photo_url}
                  onChange={(e) => handleChange('photo_url', e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="job_role">Job Role</Label>
                <Select 
                  value={formData.job_role_id} 
                  onValueChange={(value) => handleChange('job_role_id', value)}
                >
                  <SelectTrigger id="job_role">
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
              
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select 
                  value={formData.employment_type} 
                  onValueChange={(value) => handleChange('employment_type', value)}
                >
                  <SelectTrigger id="employment_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wage_rate">Wage Rate (£/hr)</Label>
                <Input
                  id="wage_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.wage_rate}
                  onChange={(e) => handleChange('wage_rate', parseFloat(e.target.value))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_hours_per_week">Min Hours/Week</Label>
                  <Input
                    id="min_hours_per_week"
                    type="number"
                    min="0"
                    value={formData.min_hours_per_week}
                    onChange={(e) => handleChange('min_hours_per_week', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_hours_per_week">Max Hours/Week</Label>
                  <Input
                    id="max_hours_per_week"
                    type="number"
                    min={formData.min_hours_per_week}
                    value={formData.max_hours_per_week}
                    onChange={(e) => handleChange('max_hours_per_week', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_hours_per_day">Min Hours/Day</Label>
                  <Input
                    id="min_hours_per_day"
                    type="number"
                    min="0"
                    value={formData.min_hours_per_day}
                    onChange={(e) => handleChange('min_hours_per_day', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_hours_per_day">Max Hours/Day</Label>
                  <Input
                    id="max_hours_per_day"
                    type="number"
                    min={formData.min_hours_per_day}
                    value={formData.max_hours_per_day}
                    onChange={(e) => handleChange('max_hours_per_day', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="performance_score">Performance Score</Label>
                  <span className="text-sm text-muted-foreground">{formData.performance_score}%</span>
                </div>
                <Slider
                  id="performance_score"
                  min={0}
                  max={100}
                  step={1}
                  value={[formData.performance_score]}
                  onValueChange={(value) => handleChange('performance_score', value[0])}
                  className="pt-2"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="availability" className="space-y-4">
              <Card className="p-4">
                <AvailabilityScheduler
                  value={formData.availability}
                  onChange={(availability) => handleChange('availability', availability)}
                />
              </Card>
            </TabsContent>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
