
-- Add a fallback password update function with a simpler approach
-- This can help in cases where the regular function fails
CREATE OR REPLACE FUNCTION public.update_user_password_fallback(user_id uuid, password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Use a simpler approach with a fixed salt as fallback
  UPDATE auth.users
  SET encrypted_password = crypt(password, '$2a$06$Nt1Prf2MLUKSsRxZwSHBOu')
  WHERE id = user_id;
  
  -- Check if the update was successful
  IF FOUND THEN
    success := TRUE;
    RAISE LOG 'Password updated via fallback for user ID: %', user_id;
  ELSE
    RAISE LOG 'No user found with ID (fallback): %', user_id;
  END IF;
  
  RETURN success;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in update_user_password_fallback function: %', SQLERRM;
    RETURN FALSE;
END;
$$;
