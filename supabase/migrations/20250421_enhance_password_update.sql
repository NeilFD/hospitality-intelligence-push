
-- Add a more robust and secure password update function
-- This implementation uses direct access to auth.users to update passwords
CREATE OR REPLACE FUNCTION public.direct_update_user_password(user_id_val uuid, password_val text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  success BOOLEAN := FALSE;
  hashed_password TEXT;
BEGIN
  -- Log the attempt for debugging
  RAISE LOG 'Attempting direct password update for user: %', user_id_val;
  
  -- Generate a secure hash for the password
  hashed_password := crypt(password_val, gen_salt('bf'));
  
  -- Update the user's password directly
  UPDATE auth.users
  SET 
    encrypted_password = hashed_password,
    updated_at = now()
  WHERE id = user_id_val;
  
  -- Check if update was successful
  GET DIAGNOSTICS success = ROW_COUNT;
  
  IF success THEN
    RAISE LOG 'Password updated directly for user ID: %', user_id_val;
    RETURN TRUE;
  ELSE
    RAISE LOG 'User not found for direct password update: %', user_id_val;
    RETURN FALSE;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in direct_update_user_password: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.direct_update_user_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.direct_update_user_password TO anon;
