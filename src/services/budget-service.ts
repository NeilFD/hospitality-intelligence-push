
import { supabase } from '@/lib/supabase';
import { DayInput } from '@/pages/pl/components/types/PLTrackerTypes';

// Fetch daily values for a budget item
export const fetchDailyValues = async (
  budgetItemId: string, 
  month: number, 
  year: number
): Promise<{day: number, value: number | null}[]> => {
  try {
    console.log(`Fetching daily values for budget item: ${budgetItemId}, month: ${month}, year: ${year}`);
    const { data, error } = await supabase
      .from('budget_item_daily_values')
      .select('day, value')
      .eq('budget_item_id', budgetItemId)
      .eq('month', month)
      .eq('year', year);
    
    if (error) {
      console.error('Error fetching daily values:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} daily values:`, data);
    return data || [];
  } catch (error) {
    console.error('Error fetching daily values:', error);
    return [];
  }
};

// Save daily values for a budget item
export const saveDailyValues = async (
  budgetItemId: string, 
  dailyValues: DayInput[], 
  month: number, 
  year: number
): Promise<boolean> => {
  try {
    // Convert DayInput array to the format expected by the database
    const valuesToUpsert = dailyValues.map(dayInput => ({
      budget_item_id: budgetItemId,
      day: dayInput.date.getDate(),
      month: month,
      year: year,
      value: dayInput.value
    }));
    
    // Filter out null values to avoid unnecessary database entries
    const filteredValues = valuesToUpsert.filter(item => item.value !== null);
    
    if (filteredValues.length === 0) {
      console.log('No non-null values to save');
      return true;
    }
    
    console.log(`Saving ${filteredValues.length} daily values for budget item: ${budgetItemId}`);
    
    // Upsert values to handle both inserts and updates
    const { error } = await supabase
      .from('budget_item_daily_values')
      .upsert(filteredValues, {
        onConflict: 'budget_item_id,day,month,year',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Error saving daily values:', error);
      throw error;
    }
    
    console.log('Daily values saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving daily values:', error);
    return false;
  }
};

// Delete all daily values for a budget item
export const deleteDailyValues = async (
  budgetItemId: string, 
  month: number, 
  year: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('budget_item_daily_values')
      .delete()
      .eq('budget_item_id', budgetItemId)
      .eq('month', month)
      .eq('year', year);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting daily values:', error);
    return false;
  }
};
