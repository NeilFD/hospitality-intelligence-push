
-- Create optimized analytical views for AI chatbot queries
-- This migration adds several views that consolidate data from multiple tables
-- to make querying performance data more efficient and reliable

-- Daily Performance Summary View - consolidates daily metrics in one place
CREATE OR REPLACE VIEW daily_performance_summary AS
SELECT
  mdr.id,
  mdr.date,
  mdr.day_of_week,
  mdr.year,
  mdr.month,
  mdr.week_number,
  mdr.food_revenue,
  mdr.beverage_revenue,
  mdr.total_revenue,
  mdr.lunch_covers,
  mdr.dinner_covers,
  mdr.total_covers,
  CASE 
    WHEN mdr.total_covers > 0 THEN mdr.total_revenue / mdr.total_covers 
    ELSE 0 
  END AS average_spend_per_cover,
  mdr.temperature,
  mdr.precipitation,
  mdr.wind_speed,
  mdr.weather_description,
  mdr.local_events,
  COALESCE(w.kitchen_wages, 0) AS kitchen_wages,
  COALESCE(w.foh_wages, 0) AS foh_wages,
  COALESCE(w.kitchen_wages, 0) + COALESCE(w.foh_wages, 0) AS total_wages,
  CASE 
    WHEN mdr.total_revenue > 0 THEN 
      (COALESCE(w.kitchen_wages, 0) + COALESCE(w.foh_wages, 0)) / mdr.total_revenue * 100 
    ELSE 0 
  END AS wage_percentage
FROM 
  master_daily_records mdr
LEFT JOIN 
  wages w ON mdr.date = w.date
ORDER BY 
  mdr.date DESC;

-- Monthly Performance Summary - aggregates data by month
CREATE OR REPLACE VIEW monthly_performance_summary AS
SELECT
  year,
  month,
  SUM(food_revenue) AS total_food_revenue,
  SUM(beverage_revenue) AS total_beverage_revenue,
  SUM(total_revenue) AS total_revenue,
  SUM(lunch_covers) AS total_lunch_covers,
  SUM(dinner_covers) AS total_dinner_covers,
  SUM(total_covers) AS total_covers,
  CASE 
    WHEN SUM(total_covers) > 0 THEN SUM(total_revenue) / SUM(total_covers) 
    ELSE 0 
  END AS average_spend_per_cover,
  COUNT(DISTINCT date) AS days_with_records
FROM 
  master_daily_records
GROUP BY 
  year, month
ORDER BY 
  year DESC, month DESC;

-- Weekly Performance Summary - aggregates data by week
CREATE OR REPLACE VIEW weekly_performance_summary AS
SELECT
  year,
  month,
  week_number,
  MIN(date) AS week_start_date,
  MAX(date) AS week_end_date,
  SUM(food_revenue) AS total_food_revenue,
  SUM(beverage_revenue) AS total_beverage_revenue,
  SUM(total_revenue) AS total_revenue,
  SUM(lunch_covers) AS total_lunch_covers,
  SUM(dinner_covers) AS total_dinner_covers,
  SUM(total_covers) AS total_covers,
  CASE 
    WHEN SUM(total_covers) > 0 THEN SUM(total_revenue) / SUM(total_covers) 
    ELSE 0 
  END AS average_spend_per_cover
FROM 
  master_daily_records
GROUP BY 
  year, month, week_number
ORDER BY 
  year DESC, month DESC, week_number DESC;

-- Food Performance View - specific to food revenues and costs
CREATE OR REPLACE VIEW food_performance_analysis AS
SELECT
  td.date,
  td.year,
  td.month,
  td.week_number,
  td.day_of_week,
  td.revenue AS food_revenue,
  COALESCE(mdr.total_covers, 0) AS covers,
  COALESCE(SUM(tp.amount), 0) AS total_purchases,
  COALESCE(SUM(tcn.amount), 0) AS total_credit_notes,
  COALESCE(td.staff_food_allowance, 0) AS staff_food_allowance,
  COALESCE(SUM(tp.amount), 0) - COALESCE(SUM(tcn.amount), 0) + COALESCE(td.staff_food_allowance, 0) AS total_cost,
  CASE 
    WHEN td.revenue > 0 THEN 
      (td.revenue - (COALESCE(SUM(tp.amount), 0) - COALESCE(SUM(tcn.amount), 0) + COALESCE(td.staff_food_allowance, 0))) / td.revenue * 100 
    ELSE 0 
  END AS gross_profit_percentage
FROM 
  tracker_data td
LEFT JOIN 
  master_daily_records mdr ON td.date = mdr.date
LEFT JOIN 
  tracker_purchases tp ON tp.tracker_data_id = td.id
LEFT JOIN 
  tracker_credit_notes tcn ON tcn.tracker_data_id = td.id
WHERE 
  td.module_type = 'food'
GROUP BY 
  td.date, td.year, td.month, td.week_number, td.day_of_week, td.revenue, mdr.total_covers, td.staff_food_allowance
ORDER BY 
  td.date DESC;

-- Beverage Performance View - specific to beverage revenues and costs
CREATE OR REPLACE VIEW beverage_performance_analysis AS
SELECT
  td.date,
  td.year,
  td.month,
  td.week_number,
  td.day_of_week,
  td.revenue AS beverage_revenue,
  COALESCE(mdr.total_covers, 0) AS covers,
  COALESCE(SUM(tp.amount), 0) AS total_purchases,
  COALESCE(SUM(tcn.amount), 0) AS total_credit_notes,
  COALESCE(td.staff_food_allowance, 0) AS staff_beverage_allowance,
  COALESCE(SUM(tp.amount), 0) - COALESCE(SUM(tcn.amount), 0) + COALESCE(td.staff_food_allowance, 0) AS total_cost,
  CASE 
    WHEN td.revenue > 0 THEN 
      (td.revenue - (COALESCE(SUM(tp.amount), 0) - COALESCE(SUM(tcn.amount), 0) + COALESCE(td.staff_food_allowance, 0))) / td.revenue * 100 
    ELSE 0 
  END AS gross_profit_percentage
FROM 
  tracker_data td
LEFT JOIN 
  master_daily_records mdr ON td.date = mdr.date
LEFT JOIN 
  tracker_purchases tp ON tp.tracker_data_id = td.id
LEFT JOIN 
  tracker_credit_notes tcn ON tcn.tracker_data_id = td.id
WHERE 
  td.module_type = 'beverage'
GROUP BY 
  td.date, td.year, td.month, td.week_number, td.day_of_week, td.revenue, mdr.total_covers, td.staff_food_allowance
ORDER BY 
  td.date DESC;

-- Budget vs Actual View - for comparing budgeted vs actual performance
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

-- Weather Impact Analysis View - to analyze weather impact on business
CREATE OR REPLACE VIEW weather_impact_analysis AS
SELECT
  mdr.date,
  mdr.year,
  mdr.month,
  mdr.day_of_week,
  mdr.weather_description,
  mdr.temperature,
  mdr.precipitation,
  mdr.wind_speed,
  mdr.total_revenue,
  mdr.total_covers,
  mdr.lunch_covers,
  mdr.dinner_covers,
  CASE 
    WHEN mdr.total_covers > 0 THEN mdr.total_revenue / mdr.total_covers 
    ELSE 0 
  END AS average_spend_per_cover
FROM 
  master_daily_records mdr
WHERE 
  mdr.weather_description IS NOT NULL
ORDER BY 
  mdr.date DESC;

-- Revenue Tag Analysis View - for analyzing event impacts
CREATE OR REPLACE VIEW revenue_tag_analysis AS
SELECT
  td.date,
  rt.name AS tag_name,
  rt.description AS tag_description,
  td.manual_food_revenue_impact,
  td.manual_beverage_revenue_impact,
  COALESCE(td.manual_food_revenue_impact, 0) + COALESCE(td.manual_beverage_revenue_impact, 0) AS total_revenue_impact,
  mdr.total_revenue,
  CASE 
    WHEN mdr.total_revenue > 0 THEN 
      (COALESCE(td.manual_food_revenue_impact, 0) + COALESCE(td.manual_beverage_revenue_impact, 0)) / mdr.total_revenue * 100 
    ELSE 0 
  END AS percentage_of_total_revenue
FROM 
  tagged_dates td
JOIN 
  revenue_tags rt ON td.tag_id = rt.id
LEFT JOIN 
  master_daily_records mdr ON td.date = mdr.date
ORDER BY 
  td.date DESC;
