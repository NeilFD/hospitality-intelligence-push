
-- Create a simplified password update function with proper validation
CREATE OR REPLACE FUNCTION public.simple_password_update(user_id uuid, password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- First check if the user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id
  ) INTO user_exists;
  
  -- Log the validation result
  RAISE LOG 'Checking if user exists: % (User ID: %)', user_exists, user_id;
  
  IF NOT user_exists THEN
    RAISE LOG 'User not found with ID: %', user_id;
    RETURN FALSE;
  END IF;
  
  -- Update the password with a simple approach
  BEGIN
    UPDATE auth.users
    SET 
      encrypted_password = crypt(password, gen_salt('bf')),
      updated_at = NOW()
    WHERE id = user_id;
    
    RAISE LOG 'Password updated for user ID: %', user_id;
    RETURN TRUE;
  EXCEPTION
    WHEN others THEN
      RAISE LOG 'Error updating password: %', SQLERRM;
      RETURN FALSE;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.simple_password_update TO authenticated;
GRANT EXECUTE ON FUNCTION public.simple_password_update TO anon;
GRANT EXECUTE ON FUNCTION public.simple_password_update TO service_role;
