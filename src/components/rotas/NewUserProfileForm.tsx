
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import AvailabilityScheduler from './AvailabilityScheduler';
import HiScoreSection from '@/components/profile/HiScoreSection';

// Import the job titles from the same source as JobDataSection.tsx
const FOH_JOB_TITLES = [
  "Owner",
  "General Manager",
  "Assistant Manager",
  "Bar Supervisor",
  "FOH Supervisor",
  "FOH Team",
  "Bar Team",
  "Runner"
];

const BOH_JOB_TITLES = [
  "Head Chef",
  "Sous Chef",
  "Chef de Partie",
  "Commis Chef",
  "KP"
];

// All job titles combined
const JOB_TITLES = [...FOH_JOB_TITLES, ...BOH_JOB_TITLES];

export default function NewUserProfileForm({ 
  isOpen, 
  onClose, 
  onComplete,
  locationId,
  jobRoles
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState('basic');
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    job_title: '',
    role: 'Team Member',
    sendInvitationNow: false,
    photo_url: '',
    employment_type: 'hourly',
    wage_rate: 0,
    annual_salary: 0,
    contractor_rate: 0,
    min_hours_per_week: 0,
    max_hours_per_week: 40,
    min_hours_per_day: 0,
    max_hours_per_day: 8,
    availability: [],
    employment_start_date: '',
    employment_status: 'full-time',
    in_ft_education: false,
    favourite_dish: '',
    favourite_drink: '',
    about_me: '',
    avatar_url: '',
    available_for_rota: true,
    role_type: 'foh', // Default role type for Hi Score evaluations
    profileId: null // Will be set when profile is created
  });
  
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name) {
      toast("Please fill in name fields", {
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
      return;
    }
    
    // Email is only required if sending invitation now
    if (formData.sendInvitationNow && !formData.email) {
      toast("Email is required when sending invitation", {
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate a unique invitation token that can be used later
      const invitationToken = uuidv4();
      
      // Create a new UUID for the profile
      const profileId = crypto.randomUUID();
      
      // Save the profileId in the form data for use in the Hi Score tab after creation
      handleChange('profileId', profileId);
      
      // Prepare profile data
      const profileData = {
        id: profileId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        job_title: formData.job_title,
        role: formData.role,
        email: formData.email || null, // Store email if provided, otherwise null
        avatar_url: formData.photo_url || formData.avatar_url,
        employment_type: formData.employment_type,
        wage_rate: formData.wage_rate,
        annual_salary: formData.annual_salary,
        contractor_rate: formData.contractor_rate,
        min_hours_per_week: formData.min_hours_per_week,
        max_hours_per_week: formData.max_hours_per_week,
        min_hours_per_day: formData.min_hours_per_day,
        max_hours_per_day: formData.max_hours_per_day,
        enhanced_availability: formData.availability,
        employment_status: formData.employment_status,
        in_ft_education: formData.in_ft_education,
        favourite_dish: formData.favourite_dish,
        favourite_drink: formData.favourite_drink,
        about_me: formData.about_me,
        available_for_rota: true, // Default to available for scheduling
        role_type: formData.role_type // Add role type for Hi Score evaluations
      };
      
      if (formData.sendInvitationNow) {
        // Call the Supabase function to send the invitation
        const { data, error } = await supabase.functions.invoke('send-user-invitation', {
          body: {
            email: formData.email,
            firstName: formData.first_name,
            lastName: formData.last_name,
            invitationToken,
            role: formData.role,
            jobTitle: formData.job_title,
            profile_id: profileId // Include profile_id in the invitation
          }
        });
        
        if (error) throw error;
        
        // Create the profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);
          
        if (profileError) throw profileError;
        
        toast("User profile created with invitation", {
          description: `${formData.first_name} ${formData.last_name} has been created and an invitation email has been sent.`,
        });
      } else {
        // Create the profile directly in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);
          
        if (profileError) throw profileError;
        
        // Store invitation data for later use (if email was provided)
        if (formData.email) {
          const { error: invitationError } = await supabase
            .from('user_invitations')
            .insert({
              email: formData.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
              role: formData.role,
              job_title: formData.job_title,
              invitation_token: invitationToken,
              profile_id: profileId, // Reference to the created profile
              is_claimed: false
            });
            
          if (invitationError && !invitationError.message.includes('duplicate')) {
            console.error("Warning: Could not store invitation data:", invitationError);
          }
        }
        
        toast("Team member profile created", {
          description: `${formData.first_name} ${formData.last_name} has been added and is available for scheduling.`,
        });
      }
      
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast("Error creating profile", {
        description: error.message || "There was a problem creating the profile.",
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
          <DialogTitle>Create New Team Member</DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="hiscore">Hi Score Evaluation</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email {formData.sendInvitationNow && <span className="text-red-500">*</span>}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="user@example.com"
                  required={formData.sendInvitationNow}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Select 
                    value={formData.job_title} 
                    onValueChange={(value) => handleChange('job_title', value)}
                  >
                    <SelectTrigger id="job_title">
                      <SelectValue placeholder="Select a job title" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TITLES.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">System Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleChange('role', value)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Team Member">Team Member</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="available_for_rota"
                  checked={formData.available_for_rota}
                  onCheckedChange={(checked) => handleChange('available_for_rota', checked)}
                />
                <Label htmlFor="available_for_rota">Available for Scheduling</Label>
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
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="sendInvitationNow"
                  checked={formData.sendInvitationNow}
                  onCheckedChange={(checked) => handleChange('sendInvitationNow', checked)}
                />
                <Label htmlFor="sendInvitationNow">Send invitation email now</Label>
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
            
            <TabsContent value="hiscore" className="space-y-4">
              <div className="flex space-x-6 mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="foh-role"
                    name="role-type"
                    checked={formData.role_type === 'foh'}
                    onChange={() => handleChange('role_type', 'foh')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="foh-role" className="text-sm font-medium">Front of House</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="kitchen-role"
                    name="role-type"
                    checked={formData.role_type === 'kitchen'}
                    onChange={() => handleChange('role_type', 'kitchen')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="kitchen-role" className="text-sm font-medium">Kitchen</label>
                </div>
              </div>
              
              {formData.profileId ? (
                <Card className="p-4 bg-white shadow-sm">
                  <HiScoreSection profileId={formData.profileId} />
                </Card>
              ) : (
                <div className="flex items-center justify-center h-48 border border-dashed rounded-md">
                  <p className="text-gray-500">Hi Score evaluations are available after saving the team member.</p>
                </div>
              )}
            </TabsContent>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Team Member'}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
