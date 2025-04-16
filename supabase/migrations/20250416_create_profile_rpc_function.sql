

-- Function to create a profile for a user when direct insert/upsert fails
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id UUID,
  first_name_val TEXT,
  last_name_val TEXT,
  role_val TEXT,
  job_title_val TEXT,
  email_val TEXT
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
  
  -- Insert user profile without relying on the foreign key constraint
  -- We're using the ON CONFLICT clause to handle cases where the profile might already exist
  BEGIN
    -- Use an explicit SET clause for ON CONFLICT to ensure we update properly
    INSERT INTO public.profiles (
      id, 
      first_name, 
      last_name,
      role,
      job_title,
      email
    )
    VALUES (
      user_id, 
      first_name_val, 
      last_name_val,
      role_val::user_role,
      job_title_val,
      email_val
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      first_name = first_name_val,
      last_name = last_name_val,
      role = role_val::user_role,
      job_title = job_title_val,
      email = email_val,
      updated_at = now();
      
    success := TRUE;
    RAISE LOG 'RPC Profile created successfully for user ID: %', user_id;
  EXCEPTION 
    WHEN foreign_key_violation THEN
      -- Create the auth user entry first if needed (this would typically be a separate flow)
      -- For now, we'll handle the situation where the auth user doesn't exist by returning false
      RAISE LOG 'Foreign key violation in create_profile_for_user function: user ID % does not exist in auth.users', user_id;
      success := FALSE;
    WHEN others THEN
      RAISE LOG 'Error in create_profile_for_user function: %', SQLERRM;
      success := FALSE;
  END;
  
  RETURN success;
END;
$$;

