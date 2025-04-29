
import React, { useState } from 'react';
import { useAuthStore } from '@/services/auth-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BriefcaseBusiness, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';

interface JobDataSectionProps {
  profile: any;
  isEditing: boolean;
  editForm: any;
  setEditForm: (form: any) => void;
  onCancel: () => void;
  onEditJobDetails: () => void;
}

export default function JobDataSection({ 
  profile, 
  isEditing, 
  editForm, 
  setEditForm, 
  onCancel,
  onEditJobDetails
}: JobDataSectionProps) {
  const { profile: currentUserProfile } = useAuthStore();
  const isMobile = useIsMobile();
  
  // Check if the current user has manager permissions
  const hasManagerPermissions = currentUserProfile?.role && 
    ['GOD', 'Super User', 'Manager', 'Owner'].includes(currentUserProfile.role.toString());
  
  const handleChange = (field: string, value: any) => {
    setEditForm({ ...editForm, [field]: value });
  };
  
  // Function to get the wage display based on employment type
  const getWageDisplay = () => {
    if (profile.employment_type === 'hourly') {
      return `£${profile.wage_rate || 0}/hr`;
    } else if (profile.employment_type === 'salary') {
      return `£${profile.annual_salary?.toLocaleString() || 0}/year`;
    } else if (profile.employment_type === 'contractor') {
      return `£${profile.contractor_rate || 0}/hr (contractor)`;
    }
    return 'Not specified';
  };
  
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  // If editing job data, show the form
  if (isEditing) {
    return (
      <Card className="bg-white shadow-sm mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select 
                  value={editForm.employmentType} 
                  onValueChange={(value) => handleChange('employmentType', value)}
                >
                  <SelectTrigger id="employmentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {editForm.employmentType === 'hourly' && (
                <div className="space-y-2">
                  <Label htmlFor="wageRate">Hourly Rate (£)</Label>
                  <Input 
                    id="wageRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.wageRate}
                    onChange={(e) => handleChange('wageRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
              
              {editForm.employmentType === 'salary' && (
                <div className="space-y-2">
                  <Label htmlFor="annualSalary">Annual Salary (£)</Label>
                  <Input 
                    id="annualSalary"
                    type="number"
                    min="0"
                    step="100"
                    value={editForm.annualSalary}
                    onChange={(e) => handleChange('annualSalary', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
              
              {editForm.employmentType === 'contractor' && (
                <div className="space-y-2">
                  <Label htmlFor="contractorRate">Contractor Rate (£/hr)</Label>
                  <Input 
                    id="contractorRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.contractorRate}
                    onChange={(e) => handleChange('contractorRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentStartDate">Employment Start Date</Label>
                <Input
                  id="employmentStartDate"
                  type="date"
                  value={editForm.employmentStartDate}
                  onChange={(e) => handleChange('employmentStartDate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select 
                  value={editForm.employmentStatus} 
                  onValueChange={(value) => handleChange('employmentStatus', value)}
                >
                  <SelectTrigger id="employmentStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-Time</SelectItem>
                    <SelectItem value="part-time">Part-Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minHoursPerWeek">Min Hours/Week</Label>
                <Input
                  id="minHoursPerWeek"
                  type="number"
                  min="0"
                  value={editForm.minHoursPerWeek}
                  onChange={(e) => handleChange('minHoursPerWeek', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHoursPerWeek">Max Hours/Week</Label>
                <Input
                  id="maxHoursPerWeek"
                  type="number"
                  min={editForm.minHoursPerWeek}
                  value={editForm.maxHoursPerWeek}
                  onChange={(e) => handleChange('maxHoursPerWeek', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minHoursPerDay">Min Hours/Day</Label>
                <Input
                  id="minHoursPerDay"
                  type="number"
                  min="0"
                  value={editForm.minHoursPerDay}
                  onChange={(e) => handleChange('minHoursPerDay', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHoursPerDay">Max Hours/Day</Label>
                <Input
                  id="maxHoursPerDay"
                  type="number"
                  min={editForm.minHoursPerDay}
                  value={editForm.maxHoursPerDay}
                  onChange={(e) => handleChange('maxHoursPerDay', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="availableForRota"
                checked={editForm.availableForRota}
                onCheckedChange={(checked) => handleChange('availableForRota', checked)}
              />
              <Label htmlFor="availableForRota">Available for scheduling</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="inFtEducation"
                checked={editForm.inFtEducation}
                onCheckedChange={(checked) => handleChange('inFtEducation', checked)}
              />
              <Label htmlFor="inFtEducation">In Full-Time Education</Label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Regular view mode
  return (
    <Card className="bg-white shadow-sm mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BriefcaseBusiness className="h-5 w-5 mr-2 text-hi-purple" />
            Employment Details
          </h3>
          
          {hasManagerPermissions && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={onEditJobDetails}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit Job Details
            </Button>
          )}
        </div>
        
        <div className={`grid grid-cols-1 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-3'} gap-y-4`}>
          <div>
            <p className="text-sm text-gray-500">Employment Type</p>
            <p className="font-medium capitalize">{profile.employment_type || 'Not specified'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Compensation</p>
            <p className="font-medium">{getWageDisplay()}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium capitalize">{profile.employment_status || 'Not specified'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">{formatDate(profile.employment_start_date)}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Weekly Hours</p>
            <p className="font-medium">{profile.min_hours_per_week || 0} - {profile.max_hours_per_week || 40} hours</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Daily Hours</p>
            <p className="font-medium">{profile.min_hours_per_day || 0} - {profile.max_hours_per_day || 8} hours</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Staff Type</p>
            <p className="font-medium capitalize">{profile.role_type || 'Not specified'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Available for Scheduling</p>
            <p className="font-medium">{profile.available_for_rota !== false ? 'Yes' : 'No'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">In Full-Time Education</p>
            <p className="font-medium">{profile.in_ft_education === true ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
