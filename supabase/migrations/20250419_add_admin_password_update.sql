
-- Enable the pgcrypto extension first (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to allow administrators to update user passwords
-- This is a privileged operation that should be restricted by RLS and app-level permissions
CREATE OR REPLACE FUNCTION public.admin_update_user_password(user_id UUID, password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Update the user's password in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(password, gen_salt('bf'))
  WHERE id = user_id;
  
  -- Check if the update was successful
  IF FOUND THEN
    success := TRUE;
    RAISE LOG 'Password updated for user ID: %', user_id;
  ELSE
    RAISE LOG 'No user found with ID: %', user_id;
  END IF;
  
  RETURN success;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in admin_update_user_password function: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.admin_update_user_password IS 
'Updates a user''s password. This is a privileged operation that should only be available to administrators.';
