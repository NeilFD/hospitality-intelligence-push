
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { LayoutProps } from '@/types/layout-types';
import { useAuthStore } from '@/services/auth-service';
import { checkInvitationToken } from '@/lib/supabase';
import { toast } from 'sonner';

const Register: React.FC<LayoutProps> = ({ showSidebar = false, showTopbar = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Check if the invitation token is valid
    if (invitationToken) {
      const validateToken = async () => {
        setIsLoading(true);
        try {
          const data = await checkInvitationToken(invitationToken);
          
          if (!data) {
            setIsValidToken(false);
            toast.error('Invalid or expired invitation link');
          } else {
            setIsValidToken(true);
            
            // If the invitation is already claimed
            if (data.is_claimed) {
              toast.info('This invitation has already been claimed. Please log in instead.');
              navigate('/login');
            }
          }
        } catch (error) {
          console.error('Error validating invitation token:', error);
          setIsValidToken(false);
          toast.error('Error validating invitation link');
        } finally {
          setIsLoading(false);
        }
      };
      
      validateToken();
    } else {
      // No token means regular registration
      setIsValidToken(null);
    }
  }, [invitationToken, navigate]);

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:grid-cols-1 lg:px-0">
      <div className="lg:pt-20 md:p-8 sm:p-8 p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px] rounded-xl p-6 bg-white shadow-md">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your details below to create your account
            </p>
            {isLoading && (
              <p className="text-sm text-blue-600">
                Validating invitation...
              </p>
            )}
            {isValidToken === true && (
              <p className="text-sm text-blue-600">
                Using valid invitation link
              </p>
            )}
            {isValidToken === false && (
              <p className="text-sm text-red-600">
                Invalid or expired invitation link
              </p>
            )}
          </div>
          <RegisterForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
