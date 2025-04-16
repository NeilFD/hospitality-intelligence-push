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
  const { login } = useAuthStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      password: '',
    },
  });

  const createProfileDirectly = async (userId: string, userData: any) => {
    try {
      console.log(`Creating profile directly for user ${userId}`);
      
      // Wait longer before trying to create the profile - this is key
      // The foreign key constraint needs the auth.users record to be fully available
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Attempt 1: Direct insert into profiles table
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role || 'Team Member',
          job_title: userData.job_title || '',
          email: userData.email
        });
        
      if (!insertError) {
        console.log('Profile created successfully via direct insert');
        return true;
      }
      
      console.error('Direct profile insert failed:', insertError);
      
      // Wait a bit more before trying the next method
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Attempt 2: RPC method
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'create_profile_for_user',
        {
          user_id: userId,
          first_name_val: userData.first_name,
          last_name_val: userData.last_name,
          role_val: userData.role || 'Team Member',
          job_title_val: userData.job_title || '',
          email_val: userData.email
        }
      );
      
      if (!rpcError && rpcResult) {
        console.log('Profile created successfully via create_profile_for_user RPC');
        return true;
      }
      
      console.error('RPC create_profile_for_user failed:', rpcError);
      
      // Wait a bit more before trying the next method
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Attempt 3: Manual method
      const { data: manualResult, error: manualError } = await supabase.rpc(
        'handle_new_user_manual',
        {
          user_id: userId,
          first_name_val: userData.first_name,
          last_name_val: userData.last_name,
          role_val: userData.role || 'Team Member',
          email_val: userData.email
        }
      );
      
      if (!manualError && manualResult) {
        console.log('Profile created successfully via handle_new_user_manual RPC');
        return true;
      }
      
      console.error('handle_new_user_manual failed:', manualError);
      
      // Wait a bit more before trying the next method
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Attempt 4: Final upsert method
      const { error: finalError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          role: userData.role || 'Team Member',
          job_title: userData.job_title || ''
        }, { onConflict: 'id' });
        
      if (!finalError) {
        console.log('Profile created successfully via final upsert attempt');
        return true;
      }
      
      console.error('Final profile upsert failed:', finalError);
      return false;
    } catch (error) {
      console.error('Error in createProfileDirectly:', error);
      return false;
    }
  };

  const verifyProfileCreated = async (userId: string) => {
    try {
      // Wait for a moment to ensure any DB operations have completed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error verifying profile:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error in verifyProfileCreated:', error);
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
        role: initialData?.role || 'Team Member',
        job_title: initialData?.jobTitle || '',
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
      
      // Significantly longer wait time to ensure the database trigger has a chance to run
      // This allows auth.users record to be completely created and available for foreign key constraints
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if profile was created by the trigger
      let profileExists = await verifyProfileCreated(data.user.id);
      
      if (!profileExists) {
        console.log("Profile not created by trigger, attempting manual creation");
        // Try up to 3 times to create the profile with increasing delays
        for (let attempt = 1; attempt <= 3; attempt++) {
          console.log(`Manual profile creation attempt ${attempt} of 3`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Increasing delay
          
          const profileCreated = await createProfileDirectly(data.user.id, metadata);
          if (profileCreated) {
            console.log(`Profile created successfully on attempt ${attempt}`);
            profileExists = true;
            break;
          }
        }

        if (!profileExists) {
          console.warn("All direct profile creation attempts failed, trying final method");
          
          // One last attempt through the auth store's loadUser method
          try {
            // Wait a bit longer before trying to log in
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const { login } = useAuthStore.getState();
            await login(values.email, values.password);
            console.log("Attempted login to trigger profile creation through auth store");
            
            // Check one more time
            await new Promise(resolve => setTimeout(resolve, 1000));
            profileExists = await verifyProfileCreated(data.user.id);
          } catch (e) {
            console.error("Failed to auto-login for profile creation:", e);
          }
        }
      }
      
      if (onRegistrationComplete) {
        onRegistrationComplete(data.user.id, metadata);
      }
      
      if (profileExists) {
        toast.success('Account created successfully!');
      } else {
        toast.success('Account created, but profile setup may be incomplete.');
      }
      
      try {
        // Wait again before attempting to log in
        await new Promise(resolve => setTimeout(resolve, 2000));
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
                    disabled={!!initialData?.firstName}
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
                    disabled={!!initialData?.lastName}
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
                  disabled={!!initialData?.email}
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
