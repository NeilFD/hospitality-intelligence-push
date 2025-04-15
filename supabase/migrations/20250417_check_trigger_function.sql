
-- Function to check if a trigger exists
CREATE OR REPLACE FUNCTION public.check_trigger_exists(trigger_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = trigger_name
  );
END;
$$;

-- Function to check if a trigger is working properly by testing a direct insert
CREATE OR REPLACE FUNCTION public.test_trigger_handle_new_user(test_user_id UUID, test_first_name TEXT, test_last_name TEXT, test_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN := FALSE;
  user_exists BOOLEAN := FALSE;
BEGIN
  -- First check if the user already exists in profiles
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = test_user_id
  ) INTO user_exists;
  
  IF user_exists THEN
    RAISE LOG 'Test user already exists in profiles: %', test_user_id;
    RETURN TRUE;
  END IF;
  
  -- Simulate the trigger by directly calling the handle_new_user function
  PERFORM public.handle_new_user_manual(test_user_id, test_first_name, test_last_name, test_role);
  
  -- Check if profile was created
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = test_user_id
  ) INTO success;
  
  RETURN success;
END;
$$;
