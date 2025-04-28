
-- Create a function to upsert wages records directly
CREATE OR REPLACE FUNCTION public.upsert_wages_record(
  p_year INTEGER,
  p_month INTEGER,
  p_day INTEGER,
  p_date TEXT,
  p_day_of_week TEXT,
  p_foh_wages NUMERIC,
  p_kitchen_wages NUMERIC,
  p_food_revenue NUMERIC,
  p_bev_revenue NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_id UUID;
BEGIN
  -- First check if record exists
  SELECT id INTO target_id 
  FROM public.wages 
  WHERE year = p_year AND month = p_month AND day = p_day;
  
  IF target_id IS NOT NULL THEN
    -- Update existing record
    UPDATE public.wages
    SET 
      foh_wages = p_foh_wages,
      kitchen_wages = p_kitchen_wages,
      food_revenue = p_food_revenue,
      bev_revenue = p_bev_revenue,
      updated_at = NOW()
    WHERE id = target_id;
  ELSE
    -- Insert new record
    INSERT INTO public.wages (
      year,
      month,
      day,
      date,
      day_of_week,
      foh_wages,
      kitchen_wages,
      food_revenue,
      bev_revenue,
      created_by
    ) VALUES (
      p_year,
      p_month,
      p_day,
      p_date,
      p_day_of_week,
      p_foh_wages,
      p_kitchen_wages,
      p_food_revenue,
      p_bev_revenue,
      auth.uid()
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Explicitly ignore permission errors related to the materialized view
    IF SQLSTATE = '42501' AND SQLERRM LIKE '%financial_performance_analysis%' THEN
      RETURN TRUE;
    ELSE
      RAISE;
    END IF;
END;
$$;

-- Give proper permissions
GRANT EXECUTE ON FUNCTION public.upsert_wages_record TO authenticated;
