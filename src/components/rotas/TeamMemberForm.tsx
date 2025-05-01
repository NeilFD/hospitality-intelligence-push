
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TeamMemberForm({ 
  isOpen, 
  onClose, 
  onSubmitComplete, 
  locationId, 
  jobRoles, 
  teamMember, 
  isEditing
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState('Team Member');
  const [hourlyRate, setHourlyRate] = useState('10.50');
  const [salary, setSalary] = useState('0');
  const [isFullTimeStudent, setIsFullTimeStudent] = useState(false);
  const [maxDaysPerWeek, setMaxDaysPerWeek] = useState(5);
  const [employmentType, setEmploymentType] = useState('hourly');
  const [availableForRota, setAvailableForRota] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Reset form when opened with different team member
  useEffect(() => {
    if (teamMember) {
      setFirstName(teamMember.first_name || '');
      setLastName(teamMember.last_name || '');
      setEmail(teamMember.email || '');
      setJobTitle(teamMember.job_title || '');
      setRole(teamMember.role || 'Team Member');
      setHourlyRate(teamMember.wage_rate?.toString() || '10.50');
      setSalary(teamMember.annual_salary?.toString() || '0');
      setIsFullTimeStudent(teamMember.is_full_time_student || false);
      setMaxDaysPerWeek(teamMember.max_days_per_week || 5);
      setEmploymentType(teamMember.employment_type || 'hourly');
      setAvailableForRota(teamMember.available_for_rota !== false);
    } else {
      resetForm();
    }
  }, [teamMember, isOpen]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setJobTitle('');
    setRole('Team Member');
    setHourlyRate('10.50');
    setSalary('0');
    setIsFullTimeStudent(false);
    setMaxDaysPerWeek(5);
    setEmploymentType('hourly');
    setAvailableForRota(true);
    setValidationErrors([]);
  };
  
  // Handler functions for checkbox state changes
  const handleFullTimeStudentChange = (checked) => {
    setIsFullTimeStudent(checked === true);
  };
  
  const handleAvailableForRotaChange = (checked) => {
    setAvailableForRota(checked === true);
  };
  
  const validateForm = () => {
    const errors = [];
    
    if (!firstName.trim()) {
      errors.push('First name is required');
    }
    
    if (!lastName.trim()) {
      errors.push('Last name is required');
    }
    
    if (employmentType === 'hourly' && (!hourlyRate || parseFloat(hourlyRate) <= 0)) {
      errors.push('Please set a valid hourly rate for this team member');
    }
    
    if (employmentType === 'salaried' && (!salary || parseFloat(salary) <= 0)) {
      errors.push('Please set a valid annual salary for this team member');
    }
    
    if (employmentType === 'contractor' && (!hourlyRate || parseFloat(hourlyRate) <= 0)) {
      errors.push('Please set a valid contractor rate for this team member');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const memberData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        job_title: jobTitle.trim(),
        role,
        wage_rate: employmentType !== 'salaried' ? parseFloat(hourlyRate) || 0 : 0,
        annual_salary: employmentType === 'salaried' ? parseFloat(salary) || 0 : 0,
        is_full_time_student: isFullTimeStudent,
        max_days_per_week: maxDaysPerWeek,
        employment_type: employmentType,
        available_for_rota: availableForRota,
      };
      
      if (isEditing && teamMember) {
        // Update existing team member
        const { error } = await supabase
          .from('profiles')
          .update(memberData)
          .eq('id', teamMember.id);
        
        if (error) throw error;
        
        toast.success('Team member updated successfully');
      } else {
        // Create new team member
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            ...memberData,
            location_id: locationId
          })
          .select();
        
        if (error) throw error;
        
        toast.success('Team member added successfully');
      }
      
      onSubmitComplete();
      onClose();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error('Error saving team member', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Team Member' : 'Add Team Member'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input 
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Bar Manager, Chef, Server"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">System Role</Label>
              <Select 
                value={role} 
                onValueChange={setRole}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Team Member">Team Member</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Super User">Super User</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-md p-4 space-y-4">
            <h3 className="font-medium">Pay & Employment Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <RadioGroup 
                value={employmentType} 
                onValueChange={setEmploymentType}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hourly" id="hourly" />
                  <Label htmlFor="hourly">Hourly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="salaried" id="salaried" />
                  <Label htmlFor="salaried">Salaried</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contractor" id="contractor" />
                  <Label htmlFor="contractor">Contractor</Label>
                </div>
              </RadioGroup>
            </div>

            {employmentType === 'hourly' && (
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (£)</Label>
                <Input 
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className={parseFloat(hourlyRate) <= 0 ? "border-red-400" : ""}
                />
                {parseFloat(hourlyRate) <= 0 && (
                  <p className="text-xs text-red-500">This field is required for hourly staff</p>
                )}
              </div>
            )}
            
            {employmentType === 'salaried' && (
              <div className="space-y-2">
                <Label htmlFor="salary">Annual Salary (£)</Label>
                <Input 
                  id="salary"
                  type="number"
                  step="100"
                  min="0"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className={parseFloat(salary) <= 0 ? "border-red-400" : ""}
                />
                {parseFloat(salary) <= 0 && (
                  <p className="text-xs text-red-500">This field is required for salaried staff</p>
                )}
              </div>
            )}
            
            {employmentType === 'contractor' && (
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Contractor Rate (£)</Label>
                <Input 
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className={parseFloat(hourlyRate) <= 0 ? "border-red-400" : ""}
                />
                {parseFloat(hourlyRate) <= 0 && (
                  <p className="text-xs text-red-500">This field is required for contractors</p>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="fullTimeStudent" 
                checked={isFullTimeStudent}
                onCheckedChange={handleFullTimeStudentChange}
              />
              <Label htmlFor="fullTimeStudent" className="text-sm">
                Full-time student (exempt from NI and pension calculations)
              </Label>
            </div>
          </div>
          
          <div className="space-y-4 border rounded-md p-4">
            <h3 className="font-medium">Scheduling Preferences</h3>
            
            <div className="space-y-2">
              <Label htmlFor="maxDaysPerWeek" className="flex justify-between">
                <span>Maximum Days Per Week</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {maxDaysPerWeek} days
                </span>
              </Label>
              <Slider
                id="maxDaysPerWeek"
                min={1}
                max={7}
                step={1}
                value={[maxDaysPerWeek]}
                onValueChange={(values) => setMaxDaysPerWeek(values[0])}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="availableForRota" 
                checked={availableForRota}
                onCheckedChange={handleAvailableForRotaChange}
              />
              <Label htmlFor="availableForRota">
                Available for scheduling
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Team Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
