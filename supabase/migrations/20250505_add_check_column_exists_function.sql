
-- Create a function to check if a column exists in a table
CREATE OR REPLACE FUNCTION public.check_column_exists(p_table_name text, p_column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_name
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

-- Add employment_start_date column if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'employment_start_date'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN employment_start_date text;
    RAISE NOTICE 'Added employment_start_date column to profiles table';
  END IF;
END $$;
