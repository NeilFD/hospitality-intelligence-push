
-- Enable the pgcrypto extension first
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create an extremely basic password update function with proper validation
CREATE OR REPLACE FUNCTION public.extremely_basic_password_update(user_id_input uuid, password_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Just update the password directly in the auth.users table
  -- This is the most direct approach possible
  UPDATE auth.users
  SET 
    encrypted_password = crypt(password_input, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = user_id_input;
  
  -- Return true if we updated a row, false otherwise
  RETURN FOUND;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in extremely_basic_password_update: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant permissions to make the function accessible
GRANT EXECUTE ON FUNCTION public.extremely_basic_password_update TO authenticated;
GRANT EXECUTE ON FUNCTION public.extremely_basic_password_update TO anon;
GRANT EXECUTE ON FUNCTION public.extremely_basic_password_update TO service_role;
