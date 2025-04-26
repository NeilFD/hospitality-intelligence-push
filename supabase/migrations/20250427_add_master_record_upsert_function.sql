
-- Create an RPC function to handle master daily record upserts with better transaction handling
CREATE OR REPLACE FUNCTION public.upsert_master_daily_record(record_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_record_id UUID;
  result JSONB;
BEGIN
  -- Check if record already exists for this date
  SELECT id INTO existing_record_id
  FROM public.master_daily_records
  WHERE date = (record_data->>'date')::DATE;
  
  IF existing_record_id IS NOT NULL THEN
    -- Update existing record
    UPDATE public.master_daily_records
    SET 
      day_of_week = record_data->>'day_of_week',
      year = (record_data->>'year')::INTEGER,
      month = (record_data->>'month')::INTEGER,
      week_number = (record_data->>'week_number')::INTEGER,
      
      food_revenue = (record_data->>'food_revenue')::NUMERIC,
      beverage_revenue = (record_data->>'beverage_revenue')::NUMERIC,
      total_revenue = (record_data->>'total_revenue')::NUMERIC,
      
      lunch_covers = (record_data->>'lunch_covers')::INTEGER,
      dinner_covers = (record_data->>'dinner_covers')::INTEGER,
      total_covers = (record_data->>'total_covers')::INTEGER,
      average_cover_spend = (record_data->>'average_cover_spend')::NUMERIC,
      
      weather_description = record_data->>'weather_description',
      temperature = (record_data->>'temperature')::NUMERIC,
      precipitation = (record_data->>'precipitation')::NUMERIC,
      wind_speed = (record_data->>'wind_speed')::NUMERIC,
      
      day_foh_team = record_data->>'day_foh_team',
      day_foh_manager = record_data->>'day_foh_manager',
      day_kitchen_team = record_data->>'day_kitchen_team',
      day_kitchen_manager = record_data->>'day_kitchen_manager',
      evening_foh_team = record_data->>'evening_foh_team',
      evening_foh_manager = record_data->>'evening_foh_manager',
      evening_kitchen_team = record_data->>'evening_kitchen_team',
      evening_kitchen_manager = record_data->>'evening_kitchen_manager',
      
      local_events = record_data->>'local_events',
      operations_notes = record_data->>'operations_notes',
      
      updated_at = NOW()
    WHERE id = existing_record_id
    RETURNING to_jsonb(*) INTO result;
  ELSE
    -- Insert new record
    INSERT INTO public.master_daily_records (
      date,
      day_of_week,
      year,
      month,
      week_number,
      
      food_revenue,
      beverage_revenue,
      total_revenue,
      
      lunch_covers,
      dinner_covers,
      total_covers,
      average_cover_spend,
      
      weather_description,
      temperature,
      precipitation,
      wind_speed,
      
      day_foh_team,
      day_foh_manager,
      day_kitchen_team,
      day_kitchen_manager,
      evening_foh_team,
      evening_foh_manager,
      evening_kitchen_team,
      evening_kitchen_manager,
      
      local_events,
      operations_notes
    )
    VALUES (
      (record_data->>'date')::DATE,
      record_data->>'day_of_week',
      (record_data->>'year')::INTEGER,
      (record_data->>'month')::INTEGER,
      (record_data->>'week_number')::INTEGER,
      
      (record_data->>'food_revenue')::NUMERIC,
      (record_data->>'beverage_revenue')::NUMERIC,
      (record_data->>'total_revenue')::NUMERIC,
      
      (record_data->>'lunch_covers')::INTEGER,
      (record_data->>'dinner_covers')::INTEGER,
      (record_data->>'total_covers')::INTEGER,
      (record_data->>'average_cover_spend')::NUMERIC,
      
      record_data->>'weather_description',
      (record_data->>'temperature')::NUMERIC,
      (record_data->>'precipitation')::NUMERIC,
      (record_data->>'wind_speed')::NUMERIC,
      
      record_data->>'day_foh_team',
      record_data->>'day_foh_manager',
      record_data->>'day_kitchen_team',
      record_data->>'day_kitchen_manager',
      record_data->>'evening_foh_team',
      record_data->>'evening_foh_manager',
      record_data->>'evening_kitchen_team',
      record_data->>'evening_kitchen_manager',
      
      record_data->>'local_events',
      record_data->>'operations_notes'
    )
    RETURNING to_jsonb(*) INTO result;
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in upsert_master_daily_record: %', SQLERRM;
END;
$$;
