
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
import { Switch } from '@/components/ui/switch';

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
    first_name: '',
    last_name: '',
    job_role_id: '',
    photo_url: '',
    employment_type: 'hourly',
    wage_rate: 0,
    annual_salary: 0,
    contractor_rate: 0,
    min_hours_per_week: 0,
    max_hours_per_week: 40,
    min_hours_per_day: 0,
    max_hours_per_day: 8,
    performance_score: 50,
    availability: [],
    employment_start_date: '',
    employment_status: 'full-time',
    in_ft_education: false,
    favourite_dish: '',
    favourite_drink: '',
    about_me: '',
    job_title: '',
    avatar_url: ''
  });

  // If editing, populate the form with the team member data
  useEffect(() => {
    console.log("TeamMemberForm received teamMember:", teamMember);
    if (teamMember && isEditing) {
      // Map fields from profiles table to formData
      setFormData({
        first_name: teamMember.first_name || '',
        last_name: teamMember.last_name || '',
        job_role_id: teamMember.job_role_id || '',
        photo_url: teamMember.photo_url || teamMember.avatar_url || '',
        employment_type: teamMember.employment_type || 'hourly',
        wage_rate: teamMember.wage_rate || 0,
        annual_salary: teamMember.annual_salary || 0,
        contractor_rate: teamMember.contractor_rate || 0,
        min_hours_per_week: teamMember.min_hours_per_week || 0,
        max_hours_per_week: teamMember.max_hours_per_week || 40,
        min_hours_per_day: teamMember.min_hours_per_day || 0,
        max_hours_per_day: teamMember.max_hours_per_day || 8,
        performance_score: teamMember.performance_score || 50,
        availability: teamMember.availability || teamMember.enhanced_availability || [],
        employment_start_date: teamMember.employment_start_date || '',
        employment_status: teamMember.employment_status || 'full-time',
        in_ft_education: teamMember.in_ft_education || false,
        favourite_dish: teamMember.favourite_dish || '',
        favourite_drink: teamMember.favourite_drink || '',
        about_me: teamMember.about_me || '',
        job_title: teamMember.job_title || '',
        avatar_url: teamMember.avatar_url || teamMember.photo_url || ''
      });
      console.log("Form data populated:", formData);
    } else {
      // Reset form when adding a new member
      setFormData({
        first_name: '',
        last_name: '',
        job_role_id: '',
        photo_url: '',
        employment_type: 'hourly',
        wage_rate: 0,
        annual_salary: 0,
        contractor_rate: 0,
        min_hours_per_week: 0,
        max_hours_per_week: 40,
        min_hours_per_day: 0,
        max_hours_per_day: 8,
        performance_score: 50,
        availability: [],
        employment_start_date: '',
        employment_status: 'full-time',
        in_ft_education: false,
        favourite_dish: '',
        favourite_drink: '',
        about_me: '',
        job_title: '',
        avatar_url: ''
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
    
    // Basic validation
    if (!formData.first_name && !formData.last_name) {
      toast("Name is required", {
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let result;
      
      // Create the data object to update/insert
      const profileData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        job_role_id: formData.job_role_id,
        avatar_url: formData.photo_url || formData.avatar_url,
        employment_type: formData.employment_type,
        wage_rate: formData.wage_rate,
        annual_salary: formData.annual_salary,
        contractor_rate: formData.contractor_rate,
        min_hours_per_week: formData.min_hours_per_week,
        max_hours_per_week: formData.max_hours_per_week,
        min_hours_per_day: formData.min_hours_per_day,
        max_hours_per_day: formData.max_hours_per_day,
        performance_score: formData.performance_score,
        enhanced_availability: formData.availability,
        employment_status: formData.employment_status,
        in_ft_education: formData.in_ft_education,
        favourite_dish: formData.favourite_dish,
        favourite_drink: formData.favourite_drink,
        about_me: formData.about_me,
        job_title: formData.job_title
      };
      
      console.log("Updating profile with data:", profileData);
      
      if (isEditing && teamMember) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', teamMember.id);
      } else {
        // This is a new profile with no auth record
        result = await supabase
          .from('profiles')
          .insert({
            ...profileData,
            id: crypto.randomUUID() // Generate a UUID for the new profile
          });
      }
      
      const { error } = result;
      if (error) throw error;
      
      toast(isEditing ? "Team member updated" : "Team member created", {
        description: `${formData.first_name} ${formData.last_name} has been ${isEditing ? 'updated' : 'added'} successfully.`,
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => handleChange('job_title', e.target.value)}
                  placeholder="Job Title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Photo URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url || formData.photo_url}
                  onChange={(e) => handleChange('avatar_url', e.target.value)}
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
                <Label htmlFor="employment_start_date">Employment Start Date</Label>
                <Input
                  id="employment_start_date"
                  type="date"
                  value={formData.employment_start_date}
                  onChange={(e) => handleChange('employment_start_date', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="employment_status">Employment Status</Label>
                  <Select 
                    value={formData.employment_status} 
                    onValueChange={(value) => handleChange('employment_status', value)}
                  >
                    <SelectTrigger id="employment_status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-Time</SelectItem>
                      <SelectItem value="part-time">Part-Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              
              {formData.employment_type === 'salary' && (
                <div className="space-y-2">
                  <Label htmlFor="annual_salary">Annual Salary (£)</Label>
                  <Input
                    id="annual_salary"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.annual_salary}
                    onChange={(e) => handleChange('annual_salary', parseFloat(e.target.value))}
                  />
                </div>
              )}
              
              {formData.employment_type === 'contractor' && (
                <div className="space-y-2">
                  <Label htmlFor="contractor_rate">Contractor Rate (£/hr)</Label>
                  <Input
                    id="contractor_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.contractor_rate}
                    onChange={(e) => handleChange('contractor_rate', parseFloat(e.target.value))}
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="in_ft_education"
                  checked={formData.in_ft_education}
                  onCheckedChange={(checked) => handleChange('in_ft_education', checked)}
                />
                <Label htmlFor="in_ft_education">In Full-Time Education</Label>
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

              <div className="space-y-2">
                <Label htmlFor="about_me">About Me</Label>
                <Input
                  id="about_me"
                  value={formData.about_me}
                  onChange={(e) => handleChange('about_me', e.target.value)}
                  placeholder="A short bio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="favourite_dish">Favourite Dish</Label>
                  <Input
                    id="favourite_dish"
                    value={formData.favourite_dish}
                    onChange={(e) => handleChange('favourite_dish', e.target.value)}
                    placeholder="Favourite dish"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favourite_drink">Favourite Drink</Label>
                  <Input
                    id="favourite_drink"
                    value={formData.favourite_drink}
                    onChange={(e) => handleChange('favourite_drink', e.target.value)}
                    placeholder="Favourite drink"
                  />
                </div>
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
