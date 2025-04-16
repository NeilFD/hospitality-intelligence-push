
// Import necessary dependencies
import { supabase } from '@/lib/supabase';
import { PLTrackerBudgetItem, DayInput } from '@/pages/pl/components/types/PLTrackerTypes';

// Export these functions to be used in useBudgetData hook
export const fetchBudgetDailyValues = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('budget_item_daily_values')
    .select('*')
    .eq('year', year)
    .eq('month', month);
    
  if (error) throw error;
  return data;
};

export const upsertBudgetDailyValues = async (items: PLTrackerBudgetItem[]) => {
  const dailyValues = items
    .filter(item => item.id && item.daily_values)
    .flatMap(item => 
      (item.daily_values || []).map(dayValue => ({
        budget_item_id: item.id,
        day: dayValue.day,
        value: dayValue.value,
        year: item.year,
        month: item.month
      }))
    );
    
  if (dailyValues.length === 0) return [];
  
  const { data, error } = await supabase
    .from('budget_item_daily_values')
    .upsert(dailyValues)
    .select();
    
  if (error) throw error;
  return data;
};
