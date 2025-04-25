import { supabase } from '@/lib/supabase';
import { updateAllForecasts } from '@/pages/pl/components/tracker/TrackerCalculations';

/**
 * Fetch budget items for a specific year and month
 */
export const fetchBudgetItems = async (year: number, month: number) => {
  console.log(`Fetching budget items for ${year}-${month}`);
  
  // First ensure forecasts are up to date
  try {
    console.log('Pre-updating forecasts before fetching budget items');
    await updateAllForecasts(year, month);
  } catch (err) {
    console.warn('Failed to update forecasts before fetch:', err);
  }
  
  // Now fetch the data
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('year', year)
    .eq('month', month);
    
  if (error) throw error;
  
  console.log(`Fetched ${data?.length || 0} budget items`);
  
  // Ensure special items like revenue, COS, wages, and GP have proper forecasts based on MTD projection
  if (data && data.length > 0) {
    // Get current date info for projection
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const isCurrentMonth = (year === currentYear && month === currentMonth);
    
    // Only apply special handling if we're looking at the current month
    if (isCurrentMonth) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const dayOfMonth = yesterday.getDate(); // Use yesterday's date
      
      console.log('Using MTD projection with:', {
        year,
        month,
        daysInMonth,
        dayOfMonth: dayOfMonth,
        yesterday: yesterday.toISOString()
      });
      
      // Process each item that needs special forecast calculation
      return data.map(item => {
        const itemName = (item.name || '').toLowerCase();
        
        // Special handling for revenue, COS, GP, and wages items
        if (
          itemName.includes('revenue') || 
          itemName.includes('sales') || 
          itemName === 'turnover' ||
          itemName.includes('turnover') ||
          itemName.includes('cost of sales') ||
          itemName.includes('cos') ||
          itemName.includes('gross profit') ||
          itemName.includes('wages') ||
          itemName.includes('salaries')
        ) {
          // If we have actual data, use it for MTD projection
          if (item.actual_amount && item.actual_amount !== 0) {
            // Calculate the daily average and project for the full month
            const projection = (item.actual_amount / dayOfMonth) * daysInMonth;
            
            console.log(`Applying MTD projection for ${item.name}:`, {
              actual: item.actual_amount,
              dayOfMonth,
              daysInMonth,
              projection
            });
            
            return {
              ...item,
              forecast_amount: projection
            };
          }
        }
        
        return item;
      });
    }
  }
  
  return data;
};

/**
 * Create or update a direct forecast setting in the database
 * @param itemName The name of the budget item
 * @param year The budget year
 * @param month The budget month
 * @param method The forecast method to use
 * @param discreteValues Optional discrete values for the forecast
 */
export const saveForecastSettings = async (
  itemName: string,
  year: number,
  month: number,
  method: string,
  discreteValues?: Record<string, any>
) => {
  console.log(`Saving forecast settings for ${itemName} (${year}-${month})`, { method, discreteValues });
  
  const { data, error } = await supabase
    .from('cost_item_forecast_settings')
    .upsert({
      item_name: itemName,
      year,
      month,
      method,
      discrete_values: discreteValues || {}
    }, {
      onConflict: 'item_name,year,month'
    });
    
  if (error) {
    console.error('Error saving forecast settings:', error);
    throw error;
  }
  
  // After saving settings, update the forecasts
  await updateAllForecasts(year, month);
  
  return data;
};

/**
 * Create or update a view refreshing function in the database
 */
export const ensureBudgetViewRefreshFunction = async () => {
  try {
    // Check if the function exists already
    const { count, error: countError } = await supabase
      .rpc('check_function_exists', { function_name: 'refresh_budget_vs_actual' });
      
    if (countError) {
      console.log('Error checking for function existence:', countError);
      // Function to check existence probably doesn't exist either
      return;
    }
    
    if (count === 0) {
      // Function doesn't exist, create it
      const { error } = await supabase.rpc('create_refresh_budget_vs_actual_function');
      
      if (error) {
        console.error('Error creating refresh function:', error);
      } else {
        console.log('Successfully created refresh_budget_vs_actual function');
      }
    }
  } catch (err) {
    console.error('Error ensuring budget view refresh function:', err);
  }
};
