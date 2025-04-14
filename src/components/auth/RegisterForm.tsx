
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUp } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  jobTitle: string;
}

interface RegisterFormProps {
  invitationData?: InvitationData | null;
  onRegistrationComplete?: () => void;
}

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof formSchema>;

const RegisterForm: React.FC<RegisterFormProps> = ({ invitationData, onRegistrationComplete }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: invitationData?.firstName || '',
      lastName: invitationData?.lastName || '',
      email: invitationData?.email || '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName,
        job_title: invitationData?.jobTitle,
        role: invitationData?.role
      });

      if (error) {
        throw error;
      }

      // If this is from an invitation, mark it as claimed
      if (onRegistrationComplete) {
        await onRegistrationComplete();
      }

      toast({
        title: "Registration successful",
        description: "Please check your email to confirm your account.",
      });

      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
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
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="First name" 
                    {...field} 
                    disabled={!!invitationData}
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
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Last name" 
                    {...field} 
                    disabled={!!invitationData}
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
                  placeholder="name@example.com" 
                  type="email" 
                  {...field} 
                  disabled={!!invitationData}
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
                <Input placeholder="******" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {invitationData && (
          <div className="bg-blue-50 text-blue-600 p-3 rounded-md text-sm">
            You've been invited with the role: <strong>{invitationData.role}</strong>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Register'}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
