
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { LayoutProps } from '@/types/layout-types';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  jobTitle: string;
}

const Register: React.FC<LayoutProps> = ({ showSidebar = false, showTopbar = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("Register page loaded with URL:", window.location.href);
  console.log("Register page query:", location.search);
  
  // Extract invitation token from URL if present
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    console.log("Token from URL:", token);
    
    if (token) {
      setInvitationToken(token);
      fetchInvitationData(token);
    }
  }, [location.search]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const fetchInvitationData = async (token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching invitation data for token:", token);
      
      // Validate token format to fail fast if clearly invalid
      if (!token || token.length < 10) {
        throw new Error('Invalid token format');
      }
      
      // Make direct database query with retry logic
      let data = null;
      let fetchError = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!data && retryCount < maxRetries) {
        const { data: invitationData, error: queryError } = await supabase
          .from('user_invitations')
          .select('*')
          .eq('invitation_token', token)
          .maybeSingle();
        
        if (invitationData) {
          data = invitationData;
          break;
        }
        
        if (queryError) {
          console.error(`Attempt ${retryCount + 1}: Error fetching invitation:`, queryError);
          fetchError = queryError;
        }
        
        // Wait before retry (exponential backoff)
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
        
        retryCount++;
      }
      
      if (!data) {
        console.error('Final error after retries:', fetchError);
        throw new Error('Could not validate invitation token after multiple attempts');
      }
      
      console.log("Invitation data retrieved:", data);
      
      // Check if invitation has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired. Please contact your administrator for a new invitation.');
        setLoading(false);
        return;
      }
      
      // Check if invitation has already been claimed
      if (data.is_claimed) {
        setError('This invitation has already been used. Please contact your administrator if you need to register.');
        setLoading(false);
        return;
      }
      
      // Set valid invitation data
      setInvitationData({
        email: data.email,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        role: data.role || 'Team Member',
        jobTitle: data.job_title || ''
      });
    } catch (err: any) {
      console.error('Error fetching invitation data:', err);
      setError('Invalid or expired invitation. Please contact your administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationClaimed = async () => {
    if (!invitationToken) return;
    
    try {
      console.log("Marking invitation as claimed:", invitationToken);
      
      // Mark invitation as claimed with retry logic
      let updateSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!updateSuccess && retryCount < maxRetries) {
        const { error: updateError } = await supabase
          .from('user_invitations')
          .update({ is_claimed: true })
          .eq('invitation_token', invitationToken);
          
        if (!updateError) {
          updateSuccess = true;
          console.log('Invitation successfully marked as claimed');
          break;
        }
        
        console.error(`Attempt ${retryCount + 1}: Error marking invitation as claimed:`, updateError);
        
        // Wait before retry
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
        
        retryCount++;
      }
      
      if (!updateSuccess) {
        console.error('Failed to mark invitation as claimed after multiple attempts');
      }
    } catch (error) {
      console.error('Error marking invitation as claimed:', error);
      // Continue anyway - this is not critical
    }
  };

  // Function to manually create a profile if it's missing after registration
  const ensureProfileExists = async (userId: string, firstName: string, lastName: string, 
    role: string = 'Team Member', jobTitle: string = '', email: string = '') => {
    try {
      console.log(`Ensuring profile exists for user ${userId} with name ${firstName} ${lastName}, role ${role}`);
      
      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (existingProfile) {
        console.log('Profile already exists:', existingProfile);
        return true;
      }
      
      if (checkError) {
        console.error('Error checking for existing profile:', checkError);
      }
      
      // Try multiple approaches to create the profile
      
      // Approach 1: Direct insert
      console.log('Creating profile using direct insert for user ID:', userId);
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          role: role,
          job_title: jobTitle || '',
          email: email
        });
        
      if (!insertError) {
        console.log('Profile created successfully with direct insert');
        return true;
      }
      
      console.error('Direct profile insert failed:', insertError);
      
      // Approach 2: Try RPC function
      console.log('Creating profile using RPC for user ID:', userId);
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'create_profile_for_user',
        {
          user_id: userId,
          first_name_val: firstName,
          last_name_val: lastName,
          role_val: role,
          job_title_val: jobTitle || '',
          email_val: email
        }
      );
      
      if (!rpcError) {
        console.log('Profile created successfully with RPC');
        return true;
      }
      
      console.error('Profile creation failed with RPC:', rpcError);
      
      // Approach 3: Try direct SQL
      console.log('Creating profile using SQL for user ID:', userId);
      try {
        // Use raw SQL as a last resort
        const { data: sqlResult, error: sqlError } = await supabase.rpc(
          'handle_new_user_manual',
          {
            user_id: userId,
            first_name_val: firstName,
            last_name_val: lastName,
            role_val: role
          }
        );
        
        if (!sqlError) {
          console.log('Profile created successfully with SQL');
          return true;
        }
        
        console.error('SQL profile creation failed:', sqlError);
      } catch (sqlException) {
        console.error('SQL profile creation exception:', sqlException);
      }
      
      // Final attempt: REST API directly to the profiles table
      try {
        const authUser = await supabase.auth.getUser();
        const token = authUser.data.user?.id ? 
          (await supabase.auth.getSession()).data.session?.access_token : 
          undefined;
        
        const response = await fetch('https://kfiergoryrnjkewmeriy.supabase.co/rest/v1/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWVyZ29yeXJuamtld21lcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDk0NDMsImV4cCI6MjA1OTQyNTQ0M30.FJ2lWSSJBfGy3rUUmIYZwPMd6fFlBTO1xHjZrMwT_wY',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            id: userId,
            first_name: firstName,
            last_name: lastName,
            role: role,
            job_title: jobTitle || '',
            email: email
          })
        });
        
        if (response.ok) {
          console.log('Profile created successfully with REST API');
          return true;
        } else {
          const errorText = await response.text();
          console.error('REST API profile creation failed:', errorText);
        }
      } catch (restException) {
        console.error('REST API profile creation exception:', restException);
      }
      
      // If we got here, all attempts failed
      toast.error('Failed to create user profile after multiple attempts');
      return false;
    } catch (error) {
      console.error('Error in ensureProfileExists:', error);
      return false;
    }
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:grid-cols-1 lg:px-0">
      <div className="lg:pt-20 md:p-8 sm:p-8 p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px] rounded-xl p-6 bg-white shadow-md">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <p>Loading invitation...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
              <Button asChild variant="outline">
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {invitationData ? 'Complete Your Registration' : 'Create an account'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {invitationData 
                    ? `Welcome ${invitationData.firstName}! Please set your password to complete your registration.` 
                    : 'Enter your details below to create your account'}
                </p>
              </div>
              <RegisterForm 
                invitationData={invitationData} 
                onRegistrationComplete={(userId, userData) => {
                  console.log("Registration complete callback received with userId:", userId);
                  console.log("User data:", userData);
                  
                  // When registration is complete, ensure profile exists and then mark invitation as claimed
                  if (userId) {
                    const firstName = invitationData?.firstName || userData?.first_name || '';
                    const lastName = invitationData?.lastName || userData?.last_name || '';
                    const role = invitationData?.role || userData?.role || 'Team Member';
                    const jobTitle = invitationData?.jobTitle || userData?.job_title || '';
                    const email = invitationData?.email || userData?.email || '';
                    
                    ensureProfileExists(
                      userId, 
                      firstName,
                      lastName,
                      role,
                      jobTitle,
                      email
                    ).then(success => {
                      if (success) {
                        console.log("Profile created successfully");
                        toast.success("Profile created successfully");
                        
                        // If using invitation, mark it as claimed
                        if (invitationToken) {
                          handleInvitationClaimed();
                        }
                      } else {
                        console.error("Failed to create profile");
                        toast.error("User created but profile verification failed");
                      }
                    });
                  } else {
                    console.error("Missing user ID in registration callback");
                    toast.error("Registration incomplete: missing user ID");
                  }
                }} 
              />
              <p className="px-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
