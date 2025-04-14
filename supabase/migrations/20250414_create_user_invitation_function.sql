
-- Create a database function to bypass RLS policies when creating user invitations
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT DEFAULT 'Team Member',
  p_job_title TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_invitation_token TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_invitations (
    email,
    first_name,
    last_name,
    role,
    job_title,
    created_by,
    invitation_token
  ) VALUES (
    p_email,
    p_first_name,
    p_last_name,
    p_role,
    p_job_title,
    p_created_by,
    p_invitation_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function explaining its use
COMMENT ON FUNCTION public.create_user_invitation IS 'Creates a user invitation bypassing RLS policies';

-- Set proper search path to enhance security
ALTER FUNCTION public.create_user_invitation SET search_path = public;
