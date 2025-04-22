
-- Create functions for easier analytics data retrieval

-- Function to get daily performance for a date range
CREATE OR REPLACE FUNCTION get_daily_performance(start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  day_of_week TEXT,
  food_revenue NUMERIC,
  beverage_revenue NUMERIC,
  total_revenue NUMERIC,
  lunch_covers INTEGER,
  dinner_covers INTEGER,
  total_covers INTEGER,
  average_spend_per_cover NUMERIC,
  kitchen_wages NUMERIC,
  foh_wages NUMERIC,
  total_wages NUMERIC,
  wage_percentage NUMERIC
) LANGUAGE SQL AS $$
  SELECT 
    date, 
    day_of_week, 
    food_revenue, 
    beverage_revenue, 
    total_revenue, 
    lunch_covers, 
    dinner_covers, 
    total_covers, 
    average_spend_per_cover, 
    kitchen_wages, 
    foh_wages, 
    total_wages, 
    wage_percentage
  FROM 
    daily_performance_summary
  WHERE 
    date BETWEEN start_date AND end_date
  ORDER BY 
    date;
$$;

-- Function to get monthly performance for a specific year
CREATE OR REPLACE FUNCTION get_monthly_performance(year_param INTEGER)
RETURNS TABLE (
  month INTEGER,
  total_food_revenue NUMERIC,
  total_beverage_revenue NUMERIC,
  total_revenue NUMERIC,
  total_lunch_covers BIGINT,
  total_dinner_covers BIGINT,
  total_covers BIGINT,
  average_spend_per_cover NUMERIC,
  days_with_records BIGINT
) LANGUAGE SQL AS $$
  SELECT 
    month,
    total_food_revenue,
    total_beverage_revenue,
    total_revenue,
    total_lunch_covers,
    total_dinner_covers,
    total_covers,
    average_spend_per_cover,
    days_with_records
  FROM 
    monthly_performance_summary
  WHERE 
    year = year_param
  ORDER BY 
    month;
$$;

-- Function to get budget vs actual for a specific year and month
CREATE OR REPLACE FUNCTION get_budget_vs_actual(year_param INTEGER, month_param INTEGER)
RETURNS TABLE (
  name TEXT,
  category TEXT,
  budget_amount NUMERIC,
  actual_amount NUMERIC,
  forecast_amount NUMERIC,
  budget_achievement_percentage NUMERIC,
  forecast_achievement_percentage NUMERIC,
  budget_variance NUMERIC,
  forecast_variance NUMERIC
) LANGUAGE SQL AS $$
  SELECT 
    name,
    category,
    budget_amount,
    actual_amount,
    forecast_amount,
    budget_achievement_percentage,
    forecast_achievement_percentage,
    budget_variance,
    forecast_variance
  FROM 
    budget_vs_actual
  WHERE 
    year = year_param AND month = month_param
  ORDER BY 
    category, name;
$$;

-- Function to get food performance for a date range
CREATE OR REPLACE FUNCTION get_food_performance(start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  day_of_week TEXT,
  food_revenue NUMERIC,
  covers BIGINT,
  total_purchases NUMERIC,
  total_credit_notes NUMERIC,
  staff_food_allowance NUMERIC,
  total_cost NUMERIC,
  gross_profit_percentage NUMERIC
) LANGUAGE SQL AS $$
  SELECT 
    date,
    day_of_week,
    food_revenue,
    covers,
    total_purchases,
    total_credit_notes,
    staff_food_allowance,
    total_cost,
    gross_profit_percentage
  FROM 
    food_performance_analysis
  WHERE 
    date BETWEEN start_date AND end_date
  ORDER BY 
    date;
$$;

-- Function to get beverage performance for a date range
CREATE OR REPLACE FUNCTION get_beverage_performance(start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  day_of_week TEXT,
  beverage_revenue NUMERIC,
  covers BIGINT,
  total_purchases NUMERIC,
  total_credit_notes NUMERIC,
  staff_beverage_allowance NUMERIC,
  total_cost NUMERIC,
  gross_profit_percentage NUMERIC
) LANGUAGE SQL AS $$
  SELECT 
    date,
    day_of_week,
    beverage_revenue,
    covers,
    total_purchases,
    total_credit_notes,
    staff_beverage_allowance,
    total_cost,
    gross_profit_percentage
  FROM 
    beverage_performance_analysis
  WHERE 
    date BETWEEN start_date AND end_date
  ORDER BY 
    date;
$$;

-- Function to get weather impact analysis for a date range
CREATE OR REPLACE FUNCTION get_weather_impact(start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  day_of_week TEXT,
  weather_description TEXT,
  temperature NUMERIC,
  precipitation NUMERIC,
  wind_speed NUMERIC,
  total_revenue NUMERIC,
  total_covers INTEGER,
  average_spend_per_cover NUMERIC
) LANGUAGE SQL AS $$
  SELECT 
    date,
    day_of_week,
    weather_description,
    temperature,
    precipitation,
    wind_speed,
    total_revenue,
    total_covers,
    average_spend_per_cover
  FROM 
    weather_impact_analysis
  WHERE 
    date BETWEEN start_date AND end_date
  ORDER BY 
    date;
$$;
