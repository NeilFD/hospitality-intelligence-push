
-- Function to regenerate default job role mappings for a location
CREATE OR REPLACE FUNCTION public.regenerate_default_job_role_mappings(location_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete existing mappings for the location
  DELETE FROM public.job_role_mappings 
  WHERE location_id = location_id_param;
  
  -- Insert default mappings based on the hierarchy
  INSERT INTO public.job_role_mappings (job_role_id, job_title, priority, location_id)
  SELECT
    jr.id AS job_role_id,
    jt.job_title,
    jt.priority,
    jr.location_id
  FROM 
    job_roles jr,
    (VALUES 
      -- Manager role mappings
      ('Manager', 'General Manager', 1),
      ('Manager', 'Assistant Manager', 2),
      ('Manager', 'Bar Supervisor', 3),
      ('Manager', 'FOH Supervisor', 4),
      ('Manager', 'Owner', 5),
      
      -- Bartender role mappings
      ('Bartender', 'Bar Supervisor', 1),
      ('Bartender', 'Bar Team', 2),
      ('Bartender', 'FOH Supervisor', 3),
      ('Bartender', 'FOH Team', 4),
      ('Bartender', 'Assistant Manager', 5),
      ('Bartender', 'General Manager', 6),
      
      -- FOH role mappings
      ('FOH', 'FOH Supervisor', 1),
      ('FOH', 'FOH Team', 2),
      ('FOH', 'Runner', 3),
      ('FOH', 'Assistant Manager', 4),
      ('FOH', 'General Manager', 5),
      ('FOH', 'Owner', 6),
      ('FOH', 'Bar Team', 7),
      ('FOH', 'Bar Supervisor', 8),
      
      -- Chef Manager role mappings
      ('Chef Manager', 'Head Chef', 1),
      ('Chef Manager', 'Sous Chef', 2),
      
      -- Chef role mappings
      ('Chef', 'Head Chef', 1),
      ('Chef', 'Sous Chef', 2),
      ('Chef', 'Chef de Partie', 3),
      ('Chef', 'Commis Chef', 4),
      
      -- Kitchen Porter role mappings
      ('Kitchen Porter', 'KP', 1),
      ('Kitchen Porter', 'Runner', 2),
      ('Kitchen Porter', 'Commis Chef', 3),
      ('Kitchen Porter', 'Chef de Partie', 4)
    ) AS jt(role_title, job_title, priority)
  WHERE jr.title = jt.role_title
  AND jr.location_id = location_id_param;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.regenerate_default_job_role_mappings(UUID) IS 'Regenerates default job role mappings for a location';
