
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signUp, checkInvitationToken } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

interface RegisterFormProps {
  initialData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    jobTitle?: string;
  };
  onRegistrationComplete?: (userId: string, userData: any) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  initialData,
  onRegistrationComplete,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  const [invitationData, setInvitationData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      password: '',
    },
  });

  // Check for invitation token and pre-fill form
  useEffect(() => {
    const fetchInvitationData = async () => {
      if (!invitationToken) return;
      
      try {
        setIsLoading(true);
        const invData = await checkInvitationToken(invitationToken);
        
        if (invData) {
          setInvitationData(invData);
          form.setValue('email', invData.email || '');
          form.setValue('firstName', invData.first_name || '');
          form.setValue('lastName', invData.last_name || '');
          
          // Disable the email field if it came from invitation
          if (invData.email) {
            const emailField = document.getElementById('email');
            if (emailField) {
              (emailField as HTMLInputElement).readOnly = true;
            }
          }
        } else {
          toast.error('Invalid or expired invitation token');
        }
      } catch (err) {
        console.error('Error fetching invitation data:', err);
        toast.error('Error loading invitation data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvitationData();
  }, [invitationToken, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      console.log("Registration form submitted with values:", {
        ...values,
        password: '[REDACTED]'
      });
      
      const metadata = {
        first_name: values.firstName,
        last_name: values.lastName,
        role: initialData?.role || (invitationData?.role || 'Team Member'),
        job_title: initialData?.jobTitle || (invitationData?.job_title || ''),
        email: values.email
      };
      
      console.log("Registration metadata:", metadata);
      
      // Perform signup through Supabase
      const { data, error } = await signUp(values.email, values.password, metadata);
      
      if (error) {
        console.error('Error during registration:', error);
        
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please log in instead.');
          navigate('/login');
          return;
        }
        
        toast.error(`Registration failed: ${error.message}`);
        return;
      }
      
      if (!data.user) {
        toast.error('Failed to create user account');
        return;
      }
      
      console.log("User registered successfully, user ID:", data.user.id);
      
      // If there was an invitation token, mark it as claimed
      if (invitationToken) {
        try {
          await supabase
            .from('user_invitations')
            .update({ is_claimed: true })
            .eq('invitation_token', invitationToken);
            
          console.log("Invitation marked as claimed");
        } catch (updateErr) {
          console.error("Error marking invitation as claimed:", updateErr);
        }
      }
      
      if (onRegistrationComplete) {
        onRegistrationComplete(data.user.id, metadata);
      }
      
      toast.success('Account created successfully! Please check your email for confirmation link and then log in.');
      navigate('/login');
      
    } catch (err: any) {
      console.error('Unexpected registration error:', err);
      toast.error(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="First Name" 
                    {...field} 
                    disabled={isLoading || !!initialData?.firstName}
                  />
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
                  <Input 
                    placeholder="Last Name" 
                    {...field} 
                    disabled={isLoading || !!initialData?.lastName}
                  />
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
                <Input 
                  id="email"
                  type="email" 
                  placeholder="Email" 
                  {...field} 
                  disabled={isLoading || !!initialData?.email}
                  readOnly={!!invitationData?.email}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Password" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
