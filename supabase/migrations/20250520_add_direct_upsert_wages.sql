
-- Function to directly upsert wages records, bypassing RLS
-- This is a backup method when the regular approach fails due to materialized view permissions
CREATE OR REPLACE FUNCTION public.direct_upsert_wages(
  p_year integer,
  p_month integer,
  p_day integer,
  p_date text,
  p_day_of_week text,
  p_foh_wages numeric,
  p_kitchen_wages numeric,
  p_food_revenue numeric,
  p_bev_revenue numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_record json;
BEGIN
  -- Check if record exists
  SELECT id INTO v_id
  FROM wages
  WHERE year = p_year AND month = p_month AND day = p_day;
  
  -- Update or insert as needed
  IF v_id IS NOT NULL THEN
    -- Update existing record
    UPDATE wages
    SET
      foh_wages = p_foh_wages,
      kitchen_wages = p_kitchen_wages,
      food_revenue = p_food_revenue,
      bev_revenue = p_bev_revenue,
      updated_at = NOW()
    WHERE id = v_id;
    
    -- Get updated record
    SELECT json_build_object(
      'id', id,
      'year', year,
      'month', month,
      'day', day,
      'date', date,
      'day_of_week', day_of_week,
      'foh_wages', foh_wages,
      'kitchen_wages', kitchen_wages,
      'food_revenue', food_revenue,
      'bev_revenue', bev_revenue
    )
    INTO v_record
    FROM wages
    WHERE id = v_id;
    
    RETURN v_record;
  ELSE
    -- Insert new record
    INSERT INTO wages (
      year,
      month,
      day,
      date,
      day_of_week,
      foh_wages,
      kitchen_wages,
      food_revenue,
      bev_revenue
    )
    VALUES (
      p_year,
      p_month,
      p_day,
      p_date,
      p_day_of_week,
      p_foh_wages,
      p_kitchen_wages,
      p_food_revenue,
      p_bev_revenue
    )
    RETURNING json_build_object(
      'id', id,
      'year', year,
      'month', month,
      'day', day,
      'date', date,
      'day_of_week', day_of_week,
      'foh_wages', foh_wages,
      'kitchen_wages', kitchen_wages,
      'food_revenue', food_revenue,
      'bev_revenue', bev_revenue
    ) INTO v_record;
    
    RETURN v_record;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in direct_upsert_wages: %', SQLERRM;
    RETURN json_build_object('error', SQLERRM);
END;
$$;
