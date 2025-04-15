import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { signUp } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

interface RegisterFormProps {
  invitationData?: {
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
    jobTitle?: string;
  } | null;
  onRegistrationComplete?: (userId: string, userData: any) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  invitationData,
  onRegistrationComplete,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: invitationData?.firstName || '',
      lastName: invitationData?.lastName || '',
      email: invitationData?.email || '',
      password: '',
    },
  });

  const createProfile = async (userId: string, userData: any) => {
    try {
      console.log('Creating profile directly for user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role || 'Team Member',
          job_title: userData.job_title || ''
        });
      
      if (error) {
        console.error('Direct profile insertion failed:', error);
        
        const { error: funcError } = await supabase.rpc(
          'handle_new_user_manual',
          {
            user_id: userId,
            first_name_val: userData.first_name,
            last_name_val: userData.last_name,
            role_val: userData.role || 'Team Member'
          }
        );
        
        if (funcError) {
          console.error('Manual profile creation failed:', funcError);
          return false;
        }
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      return !!profile;
    } catch (err) {
      console.error('Error in createProfile:', err);
      return false;
    }
  };

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
        role: invitationData?.role || 'Team Member',
        job_title: invitationData?.jobTitle || '',
        email: values.email
      };
      
      console.log("Registration metadata:", metadata);
      
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
      
      const profileCreated = await createProfile(data.user.id, metadata);
      
      if (onRegistrationComplete) {
        onRegistrationComplete(data.user.id, metadata);
      }
      
      if (profileCreated) {
        console.log('Profile created successfully');
        toast.success('Account created successfully!');
      } else {
        console.warn('Profile may not have been created properly');
        toast.warning('Account created, but profile setup may be incomplete.');
      }
      
      try {
        await login(values.email, values.password);
        navigate('/');
      } catch (loginError) {
        console.error('Auto-login failed:', loginError);
        toast.info('Please log in with your new account');
        navigate('/login');
      }
      
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
                    disabled={!!invitationData?.firstName}
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
                    disabled={!!invitationData?.lastName}
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
                  type="email" 
                  placeholder="Email" 
                  {...field} 
                  disabled={!!invitationData?.email}
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
                <Input type="password" placeholder="Password" {...field} />
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
