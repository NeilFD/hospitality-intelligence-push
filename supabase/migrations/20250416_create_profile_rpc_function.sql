
-- Function to create a profile for a user when direct insert/upsert fails
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id UUID,
  first_name_val TEXT,
  last_name_val TEXT,
  role_val TEXT,
  job_title_val TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Log the attempt for debugging
  RAISE LOG 'RPC Create profile for user ID: %', user_id;
  
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
    job_title_val
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    first_name = first_name_val,
    last_name = last_name_val,
    role = role_val::user_role,
    job_title = job_title_val,
    updated_at = now();
    
  success := TRUE;
  RAISE LOG 'RPC Profile created successfully for user ID: %', user_id;
  
  RETURN success;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in create_profile_for_user function: %', SQLERRM;
    RETURN FALSE;
END;
$$;
