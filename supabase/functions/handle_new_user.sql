
-- Function to manually create a profile (for testing and fallback)
CREATE OR REPLACE FUNCTION public.handle_new_user_manual(
  user_id UUID,
  first_name_val TEXT,
  last_name_val TEXT,
  role_val TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    (role_val)::user_role,
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

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log the attempt to create a profile for debugging
  RAISE LOG 'Creating profile for user ID: %, with metadata: %', new.id, new.raw_user_meta_data;
  
  -- Insert user profile with explicit type casting for the role
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name,
    role,
    job_title
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'first_name', ''), 
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    (COALESCE(new.raw_user_meta_data->>'role', 'Team Member'))::user_role,
    COALESCE(new.raw_user_meta_data->>'job_title', '')
  );
  
  RAISE LOG 'Profile created successfully for user ID: %', new.id;
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user function: %', SQLERRM;
    RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
