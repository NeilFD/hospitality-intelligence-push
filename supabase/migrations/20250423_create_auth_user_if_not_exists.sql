
-- Create a function that creates an auth user if one doesn't exist, or updates password if it does
CREATE OR REPLACE FUNCTION public.create_auth_user_if_not_exists(user_id_val uuid, email_val text, password_val text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_exists BOOLEAN;
  instance_id uuid;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id_val
  ) INTO user_exists;
  
  RAISE LOG 'Checking if auth user exists for ID %: %', user_id_val, user_exists;
  
  -- Get the current instance ID
  SELECT i.id INTO instance_id FROM auth.instances i LIMIT 1;
  
  IF NOT user_exists THEN
    -- Create the auth user if it doesn't exist
    RAISE LOG 'Creating new auth user for ID % with email %', user_id_val, email_val;
    
    -- Insert directly into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      instance_id,
      user_id_val,
      'authenticated',
      'authenticated',
      email_val,
      crypt(password_val, gen_salt('bf')),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{}'::jsonb,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Auth user created successfully for ID: %', user_id_val;
    RETURN TRUE;
  ELSE
    -- Update password for existing user
    RAISE LOG 'Updating password for existing auth user ID: %', user_id_val;
    
    UPDATE auth.users
    SET 
      encrypted_password = crypt(password_val, gen_salt('bf')),
      updated_at = NOW()
    WHERE id = user_id_val;
    
    RAISE LOG 'Password updated for auth user ID: %', user_id_val;
    RETURN TRUE;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in create_auth_user_if_not_exists: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant permissions to make the function accessible
GRANT EXECUTE ON FUNCTION public.create_auth_user_if_not_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_auth_user_if_not_exists TO anon;
GRANT EXECUTE ON FUNCTION public.create_auth_user_if_not_exists TO service_role;
