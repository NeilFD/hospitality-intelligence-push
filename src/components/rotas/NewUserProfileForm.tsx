
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase, directSignUp } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

// Define the form validation schema
const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['GOD', 'Super User', 'Manager', 'Team Member', 'Owner']),
  jobTitle: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  jobRoleId: z.string().optional(),
  employmentType: z.enum(['hourly', 'salaried', 'contract']),
  wageRate: z.number().min(0).optional(),
  annualSalary: z.number().min(0).optional(),
  contractorRate: z.number().min(0).optional(),
  inFtEducation: z.boolean().default(false)
});

export default function NewUserProfileForm({ isOpen, onClose, onComplete, jobRoles, locationId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [sendInvitation, setSendInvitation] = useState(true);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'Team Member',
      jobTitle: '',
      password: '',
      jobRoleId: '',
      employmentType: 'hourly',
      wageRate: 0,
      annualSalary: 0,
      contractorRate: 0,
      inFtEducation: false
    }
  });
  
  const watchEmploymentType = form.watch('employmentType');

  const createNewUserProfile = async (formData) => {
    setIsLoading(true);
    try {
      // 1. Create the auth user and profile
      const { firstName, lastName, email, role, jobTitle, password } = formData;
      
      // Use directSignUp to create the user in auth.users and profiles table
      const { user, profile } = await directSignUp(
        email,
        firstName,
        lastName,
        role,
        jobTitle
      );
      
      if (!user || !user.id) {
        throw new Error('Failed to create user account');
      }
      
      // Update password for user
      const { error: passwordError } = await supabase.rpc('extremely_basic_password_update', {
        user_id_input: user.id,
        password_input: password
      });
      
      if (passwordError) {
        console.error('Error setting password:', passwordError);
        toast.error('Failed to set user password');
      }
      
      // 2. Create a team member record linked to the user
      const { employmentType, wageRate, annualSalary, contractorRate, inFtEducation, jobRoleId } = formData;
      
      // Create full name from first name and last name
      const fullName = `${firstName} ${lastName}`;
      
      const { error: teamMemberError } = await supabase
        .from('team_members')
        .insert({
          user_id: user.id,
          full_name: fullName,
          employment_type: employmentType,
          wage_rate: employmentType === 'hourly' ? wageRate : 0,
          annual_salary: employmentType === 'salaried' ? annualSalary : 0,
          contractor_rate: employmentType === 'contract' ? contractorRate : 0,
          in_ft_education: inFtEducation,
          job_role_id: jobRoleId || null,
          location_id: locationId,
        });
        
      if (teamMemberError) {
        throw teamMemberError;
      }

      // 3. Send invitation if requested
      if (sendInvitation) {
        // Generate invitation token
        const invitationToken = uuidv4();
        
        // Call the send-user-invitation function to send the invitation email
        const invitationResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kfiergoryrnjkewmeriy.supabase.co'}/functions/v1/send-user-invitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWVyZ29yeXJuamtld21lcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDk0NDMsImV4cCI6MjA1OTQyNTQ0M30.FJ2lWSSJBfGy3rUUmIYZwPMd6fFlBTO1xHjZrMwT_wY'}`
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            role,
            jobTitle,
            invitationToken
          })
        });
        
        const inviteResult = await invitationResponse.json();
        
        if (invitationResponse.ok) {
          toast.success("Invitation sent successfully", {
            description: `An invitation has been sent to ${email}`
          });
        } else {
          console.error('Error sending invitation:', inviteResult);
          toast.error("Failed to send invitation", {
            description: inviteResult.error || "There was a problem sending the invitation."
          });
        }
      }
      
      toast.success("User profile created successfully");
      onComplete(); // Refresh team members list
      onClose(); // Close the dialog
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      toast.error("Failed to create user profile", {
        description: error.message || "There was a problem creating the user profile."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data) => {
    // Convert string values to numbers where needed
    const formattedData = {
      ...data,
      wageRate: data.wageRate ? parseFloat(data.wageRate) : 0,
      annualSalary: data.annualSalary ? parseFloat(data.annualSalary) : 0,
      contractorRate: data.contractorRate ? parseFloat(data.contractorRate) : 0
    };
    
    createNewUserProfile(formattedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New User Profile</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="employment">Employment Details</TabsTrigger>
                <TabsTrigger value="account">Account Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="First name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Last name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Email address" type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GOD">GOD</SelectItem>
                              <SelectItem value="Super User">Super User</SelectItem>
                              <SelectItem value="Owner">Owner</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="Team Member">Team Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="jobRoleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Role</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select job role" />
                            </SelectTrigger>
                            <SelectContent>
                              {jobRoles?.map(role => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Job title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="button" onClick={() => setActiveTab('employment')} className="mt-2">
                  Next: Employment Details
                </Button>
              </TabsContent>
              
              <TabsContent value="employment" className="space-y-4">
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="salaried">Salaried</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {watchEmploymentType === 'hourly' && (
                  <FormField
                    control={form.control}
                    name="wageRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Wage Rate (£)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {watchEmploymentType === 'salaried' && (
                  <FormField
                    control={form.control}
                    name="annualSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Salary (£)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="100" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {watchEmploymentType === 'contract' && (
                  <FormField
                    control={form.control}
                    name="contractorRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contractor Rate (£)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="inFtEducation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">In full-time education</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between mt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('basic')}>
                    Previous
                  </Button>
                  <Button type="button" onClick={() => setActiveTab('account')}>
                    Next: Account Settings
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="account" className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="Min. 8 characters" />
                      </FormControl>
                      <FormDescription>
                        Set an initial password for the account. The user can change it later.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center space-x-2 mt-4">
                  <Input
                    type="checkbox"
                    checked={sendInvitation}
                    onChange={(e) => setSendInvitation(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label>Send invitation email</Label>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('employment')}>
                    Previous
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Profile'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
