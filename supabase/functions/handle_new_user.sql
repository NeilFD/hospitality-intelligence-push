
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
    job_title,
    email
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'first_name', ''), 
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    (COALESCE(new.raw_user_meta_data->>'role', 'Team Member'))::user_role,
    COALESCE(new.raw_user_meta_data->>'job_title', ''),
    COALESCE(new.raw_user_meta_data->>'email', new.email)
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
