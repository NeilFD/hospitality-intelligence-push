
import { supabase } from '@/lib/supabase';
import { updateAllForecasts } from '@/pages/pl/components/tracker/TrackerCalculations';

/**
 * Fetch budget items for a specific year and month
 * @param year The budget year
 * @param month The budget month 
 * @returns Promise that resolves to an array of budget items
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
