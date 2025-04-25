
import { supabase } from '@/lib/supabase';
import { updateAllForecasts } from '@/pages/pl/components/tracker/TrackerCalculations';

/**
 * Fetch budget items for a specific year and month
 * @param year The budget year
 * @param month The budget month 
 * @returns Promise that resolves to an array of budget items
 */
export const fetchBudgetItems = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('year', year)
    .eq('month', month);
    
  if (error) throw error;
  
  // After fetching, ensure forecasts are up to date
  try {
    await updateAllForecasts(year, month);
  } catch (err) {
    console.warn('Failed to update forecasts:', err);
  }
  
  return data;
};
