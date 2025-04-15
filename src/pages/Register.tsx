
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { LayoutProps } from '@/types/layout-types';
import { useAuthStore } from '@/services/auth-service';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

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
      
      // First, validate that the token format is correct
      if (!token || token.length < 10) {
        throw new Error('Invalid token format');
      }
      
      // Make multiple attempts to fetch the invitation data with delays
      // to address potential race conditions or timing issues
      let data = null;
      let queryError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        console.log(`Attempt ${attempt + 1} to fetch invitation data`);
        
        const result = await supabase
          .from('user_invitations')
          .select('*')
          .eq('invitation_token', token)
          .maybeSingle();
        
        if (result.error) {
          console.error(`Attempt ${attempt + 1} failed:`, result.error);
          queryError = result.error;
        } else if (result.data) {
          console.log(`Attempt ${attempt + 1} succeeded:`, result.data);
          data = result.data;
          break;
        } else {
          console.log(`Attempt ${attempt + 1}: No data found for token`);
        }
        
        // Wait a bit before trying again
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (queryError) {
        console.error("All database query attempts failed:", queryError);
        throw new Error('Error retrieving invitation data');
      }
      
      if (!data) {
        console.log("No valid invitation found for token:", token);
        throw new Error('Invalid or expired invitation token');
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
      // Mark invitation as claimed
      const { error } = await supabase
        .from('user_invitations')
        .update({ is_claimed: true })
        .eq('invitation_token', invitationToken);
        
      if (error) {
        console.error('Error marking invitation as claimed:', error);
      } else {
        console.log('Invitation successfully marked as claimed');
      }
    } catch (error) {
      console.error('Error marking invitation as claimed:', error);
      // Continue anyway - this is not critical
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
                onRegistrationComplete={invitationToken ? handleInvitationClaimed : undefined} 
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
