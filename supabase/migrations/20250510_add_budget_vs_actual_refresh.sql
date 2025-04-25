
-- Create or replace the refresh_budget_vs_actual function
-- This function will refresh the budget_vs_actual view to ensure it's up-to-date
CREATE OR REPLACE FUNCTION public.refresh_budget_vs_actual()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE 'Refreshing budget_vs_actual view at %', NOW();
  
  -- If budget_vs_actual is a materialized view, refresh it
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY budget_vs_actual;
    RAISE NOTICE 'Successfully refreshed materialized view budget_vs_actual';
  EXCEPTION 
    WHEN undefined_object THEN
      -- If it's not a materialized view, then it's a regular view
      -- which is always up-to-date, so we don't need to do anything
      RAISE NOTICE 'budget_vs_actual is a regular view, no refresh needed';
    WHEN others THEN
      RAISE NOTICE 'Error refreshing budget_vs_actual view: %', SQLERRM;
  END;
END;
$$;

-- Create a trigger function that will be called whenever a budget_items record is updated
CREATE OR REPLACE FUNCTION public.trigger_refresh_budget_vs_actual()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the refresh function
  PERFORM public.refresh_budget_vs_actual();
  RETURN NULL;
END;
$$;

-- Create the trigger on the budget_items table
DO $$
BEGIN
  -- Check if the trigger already exists before creating it
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'budget_items_refresh_trigger'
  ) THEN
    CREATE TRIGGER budget_items_refresh_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.budget_items
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_budget_vs_actual();
    
    RAISE NOTICE 'Created budget_items_refresh_trigger';
  ELSE
    RAISE NOTICE 'budget_items_refresh_trigger already exists';
  END IF;
END
$$;

-- Also create a trigger on the cost_item_forecast_settings table
DO $$
BEGIN
  -- Check if the trigger already exists before creating it
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'forecast_settings_refresh_trigger'
  ) THEN
    CREATE TRIGGER forecast_settings_refresh_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cost_item_forecast_settings
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_budget_vs_actual();
    
    RAISE NOTICE 'Created forecast_settings_refresh_trigger';
  ELSE
    RAISE NOTICE 'forecast_settings_refresh_trigger already exists';
  END IF;
END
$$;

-- Update the budget_vs_actual view (if it's not a materialized view)
-- This ensures it has the same calculation logic as the UI
CREATE OR REPLACE VIEW budget_vs_actual AS
SELECT
  bi.year,
  bi.month,
  bi.name,
  bi.category,
  bi.budget_amount,
  bi.actual_amount,
  bi.forecast_amount,
  CASE 
    WHEN bi.budget_amount > 0 THEN COALESCE(bi.actual_amount, 0) / bi.budget_amount * 100 
    ELSE 0 
  END AS budget_achievement_percentage,
  CASE 
    WHEN bi.forecast_amount > 0 THEN COALESCE(bi.actual_amount, 0) / bi.forecast_amount * 100 
    ELSE 0 
  END AS forecast_achievement_percentage,
  COALESCE(bi.actual_amount, 0) - bi.budget_amount AS budget_variance,
  COALESCE(bi.actual_amount, 0) - COALESCE(bi.forecast_amount, 0) AS forecast_variance
FROM 
  budget_items bi
ORDER BY 
  bi.year DESC, bi.month DESC, bi.category, bi.name;
