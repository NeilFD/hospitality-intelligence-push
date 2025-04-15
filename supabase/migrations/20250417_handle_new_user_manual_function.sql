
-- Function to manually create a profile for a user when other methods fail
CREATE OR REPLACE FUNCTION public.handle_new_user_manual(
  user_id UUID,
  first_name_val TEXT,
  last_name_val TEXT,
  role_val TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Log the attempt to create a profile for debugging
  RAISE LOG 'Manually creating profile for user ID: %, with name: % %', user_id, first_name_val, last_name_val;
  
  -- Insert user profile with explicit type casting for the role
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name,
    role,
    job_title
  )
  VALUES (
    user_id, 
    first_name_val, 
    last_name_val,
    role_val::user_role,
    ''
  );
  
  RAISE LOG 'Profile manually created successfully for user ID: %', user_id;
  success := TRUE;
  RETURN success;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user_manual function: %', SQLERRM;
    RETURN FALSE;
END;
$$;
