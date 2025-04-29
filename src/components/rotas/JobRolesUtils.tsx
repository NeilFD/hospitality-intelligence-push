
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';

export async function updateJobRole(id: string, title: string) {
  try {
    const { error } = await supabase
      .from('job_roles')
      .update({ title })
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success("Job role updated", {
      description: `Job role has been updated to ${title}`
    });
    
    return true;
  } catch (error) {
    console.error('Error updating job role:', error);
    toast.error("Error updating job role", {
      description: "There was a problem updating the job role."
    });
    return false;
  }
}

export async function addJobRole(locationId: string, title: string, isKitchen: boolean, defaultWageRate: number = 0) {
  try {
    const { data, error } = await supabase
      .from('job_roles')
      .insert({
        location_id: locationId,
        title,
        is_kitchen: isKitchen,
        default_wage_rate: defaultWageRate
      })
      .select();
    
    if (error) throw error;
    
    toast.success("Job role added", {
      description: `${title} has been added as a new job role`
    });
    
    return data?.[0];
  } catch (error) {
    console.error('Error adding job role:', error);
    toast.error("Error adding job role", {
      description: "There was a problem adding the new job role."
    });
    return null;
  }
}

export async function updateJobRoles(locationId: string) {
  try {
    // Get all job roles for this location
    const { data: jobRoles, error } = await supabase
      .from('job_roles')
      .select('*')
      .eq('location_id', locationId);
      
    if (error) throw error;
    
    // Find the Kitchen Assistant role to update
    const kitchenAssistantRole = jobRoles?.find(role => 
      role.title === 'Kitchen Assistant'
    );
    
    // Check if Chef Manager already exists
    const chefManagerExists = jobRoles?.some(role => 
      role.title === 'Chef Manager'
    );
    
    // Update Kitchen Assistant to Kitchen Porter if found
    if (kitchenAssistantRole) {
      await updateJobRole(kitchenAssistantRole.id, 'Kitchen Porter');
    }
    
    // Add Chef Manager role if it doesn't exist
    if (!chefManagerExists) {
      await addJobRole(locationId, 'Chef Manager', true, 12.50);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating job roles:', error);
    toast.error("Error updating job roles", {
      description: "There was a problem updating the job roles."
    });
    return false;
  }
}

export function JobRoleForm({ isOpen, onClose, onSubmitComplete, locationId, jobRole, isEditing }) {
  const [title, setTitle] = useState('');
  const [isKitchen, setIsKitchen] = useState(false);
  const [defaultWageRate, setDefaultWageRate] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (jobRole && isEditing) {
      setTitle(jobRole.title || '');
      setIsKitchen(jobRole.is_kitchen || false);
      setDefaultWageRate(jobRole.default_wage_rate || 0);
    } else {
      setTitle('');
      setIsKitchen(false);
      setDefaultWageRate(0);
    }
  }, [jobRole, isEditing]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      toast.error("Title is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && jobRole) {
        await updateJobRole(jobRole.id, title);
      } else {
        await addJobRole(locationId, title, isKitchen, defaultWageRate);
      }
      
      onSubmitComplete();
      onClose();
    } catch (error) {
      console.error('Error saving job role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Job Role</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Bartender, Chef"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_kitchen"
              checked={isKitchen}
              onCheckedChange={setIsKitchen}
            />
            <Label htmlFor="is_kitchen">Kitchen staff</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="wage_rate">Default Wage Rate (£/hr)</Label>
            <Input
              id="wage_rate"
              type="number"
              min="0"
              step="0.01"
              value={defaultWageRate}
              onChange={(e) => setDefaultWageRate(parseFloat(e.target.value))}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
