
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
  jobRoles // Add jobRoles prop
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    job_title: '',
    role: 'Team Member',
    sendInvitationNow: false // Add this line for the new toggle
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
          }
        });
        
        if (error) throw error;
        
        toast("User profile created with invitation", {
          description: `${formData.first_name} ${formData.last_name} has been created and an invitation email has been sent.`,
        });
      } else {
        // Create profile without sending invitation
        // Create a new UUID for the profile
        const profileId = crypto.randomUUID();
        
        // Create the profile directly in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: profileId,
            first_name: formData.first_name,
            last_name: formData.last_name,
            job_title: formData.job_title,
            role: formData.role,
            email: formData.email || null, // Store email if provided, otherwise null
            available_for_rota: true // Default to available for scheduling
          });
          
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="sendInvitationNow"
              checked={formData.sendInvitationNow}
              onCheckedChange={(checked) => handleChange('sendInvitationNow', checked)}
            />
            <Label htmlFor="sendInvitationNow">Send invitation email now</Label>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Team Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
