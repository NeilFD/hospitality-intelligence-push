
-- Create table for storing rota algorithm configuration
CREATE TABLE IF NOT EXISTS public.rota_algorithm_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  salaried_weight NUMERIC DEFAULT 100,
  manager_weight NUMERIC DEFAULT 50,
  hi_score_weight NUMERIC DEFAULT 1,
  enable_part_shifts BOOLEAN DEFAULT true,
  min_part_shift_hours NUMERIC DEFAULT 3,
  max_part_shift_hours NUMERIC DEFAULT 5,
  day_latest_start TIME DEFAULT '12:00:00',
  evening_latest_start TIME DEFAULT '18:00:00',
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE (location_id)
);

-- Initialize with default values for existing locations
INSERT INTO public.rota_algorithm_config (location_id, salaried_weight, manager_weight, hi_score_weight)
SELECT id, 100, 50, 1 FROM public.locations
ON CONFLICT (location_id) DO NOTHING;

-- Secure access with RLS policies
ALTER TABLE public.rota_algorithm_config ENABLE ROW LEVEL SECURITY;

-- Policy for reading config
CREATE POLICY "Allow read access to rota_algorithm_config" 
ON public.rota_algorithm_config
FOR SELECT 
TO authenticated 
USING (true);

-- Policy for updating config (owners and admins)
CREATE POLICY "Allow update access to rota_algorithm_config for owners and admins" 
ON public.rota_algorithm_config
FOR UPDATE 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Owner', 'Super User', 'GOD')
);

-- Policy for inserting config (owners and admins)
CREATE POLICY "Allow insert access to rota_algorithm_config for owners and admins" 
ON public.rota_algorithm_config
FOR INSERT 
TO authenticated 
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Owner', 'Super User', 'GOD')
);
