
import { supabase } from '@/lib/supabase';
import { ProcessedBudgetItem } from '@/pages/pl/hooks/useBudgetData';

/**
 * Fetch budget items for a specific year and month
 * @param year The budget year
 * @param month The budget month 
 * @returns Promise that resolves to an array of budget items
 */
export const fetchBudgetItems = async (year: number, month: number): Promise<ProcessedBudgetItem[]> => {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('year', year)
    .eq('month', month);
    
  if (error) throw error;
  
  // Transform the data into ProcessedBudgetItem format
  const processedData: ProcessedBudgetItem[] = data.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    budget_amount: item.budget_amount,
    actual_amount: item.actual_amount,
    forecast_amount: item.forecast_amount,
    budget_percentage: item.budget_percentage,
    isHeader: item.is_header,
    isHighlighted: item.is_highlighted,
    isGrossProfit: item.is_gross_profit,
    isOperatingProfit: item.is_operating_profit,
    tracking_type: item.tracking_type
  }));
  
  return processedData;
};

/**
 * Updates or inserts budget items
 * @param items Array of budget items to update or insert
 * @returns Promise that resolves to the updated data
 */
export const upsertBudgetItems = async (items: Partial<ProcessedBudgetItem>[]) => {
  // Transform the ProcessedBudgetItem to match the database schema
  const dbItems = items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    budget_amount: item.budget_amount,
    actual_amount: item.actual_amount,
    forecast_amount: item.forecast_amount,
    budget_percentage: item.budget_percentage,
    is_header: item.isHeader,
    is_highlighted: item.isHighlighted,
    is_gross_profit: item.isGrossProfit,
    is_operating_profit: item.isOperatingProfit,
    tracking_type: item.tracking_type
  }));
  
  const { data, error } = await supabase
    .from('budget_items')
    .upsert(dbItems)
    .select();
    
  if (error) throw error;
  return data;
};
