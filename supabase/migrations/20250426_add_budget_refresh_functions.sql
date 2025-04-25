
-- Function to check if another function exists
CREATE OR REPLACE FUNCTION public.check_function_exists(function_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) 
  INTO func_count
  FROM pg_proc 
  WHERE proname = function_name;
  
  RETURN func_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to refresh the budget_vs_actual view
CREATE OR REPLACE FUNCTION public.refresh_budget_vs_actual()
RETURNS void AS $$
BEGIN
  -- Refresh the view with the latest data
  EXECUTE 'REFRESH MATERIALIZED VIEW budget_vs_actual;';
  EXCEPTION 
    WHEN undefined_table THEN
      -- If it's not a materialized view, try to recreate it
      EXECUTE 'DROP VIEW IF EXISTS budget_vs_actual;';
      
      -- Create view that will pull together budget, actual and forecast data
      EXECUTE '
      CREATE VIEW budget_vs_actual AS
      SELECT 
        name, 
        category, 
        year, 
        month, 
        budget_amount,
        actual_amount,
        forecast_amount,
        (forecast_amount - budget_amount) AS forecast_variance,
        (actual_amount - budget_amount) AS budget_variance,
        CASE 
          WHEN budget_amount = 0 THEN 0
          ELSE (actual_amount / budget_amount) * 100 
        END AS budget_achievement_percentage,
        CASE 
          WHEN budget_amount = 0 THEN 0
          ELSE (forecast_amount / budget_amount) * 100 
        END AS forecast_achievement_percentage
      FROM 
        budget_items;';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to create the refresh function
CREATE OR REPLACE FUNCTION public.create_refresh_budget_vs_actual_function()
RETURNS boolean AS $$
BEGIN
  -- Create the function content
  EXECUTE '
  CREATE OR REPLACE FUNCTION public.refresh_budget_vs_actual()
  RETURNS void AS $func$
  BEGIN
    -- Refresh the view with the latest data
    EXECUTE ''REFRESH MATERIALIZED VIEW budget_vs_actual;'';
    EXCEPTION 
      WHEN undefined_table THEN
        -- If it''s not a materialized view, try to recreate it
        EXECUTE ''DROP VIEW IF EXISTS budget_vs_actual;'';
        
        -- Create view that will pull together budget, actual and forecast data
        EXECUTE ''
        CREATE VIEW budget_vs_actual AS
        SELECT 
          name, 
          category, 
          year, 
          month, 
          budget_amount,
          actual_amount,
          forecast_amount,
          (forecast_amount - budget_amount) AS forecast_variance,
          (actual_amount - budget_amount) AS budget_variance,
          CASE 
            WHEN budget_amount = 0 THEN 0
            ELSE (actual_amount / budget_amount) * 100 
          END AS budget_achievement_percentage,
          CASE 
            WHEN budget_amount = 0 THEN 0
            ELSE (forecast_amount / budget_amount) * 100 
          END AS forecast_achievement_percentage
        FROM 
          budget_items;'';
  END;
  $func$ LANGUAGE plpgsql SECURITY DEFINER;';
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update budget_vs_actual when budget_items changes
DROP TRIGGER IF EXISTS budget_items_changes ON budget_items;
CREATE TRIGGER budget_items_changes
AFTER INSERT OR UPDATE OR DELETE ON budget_items
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_budget_vs_actual();
