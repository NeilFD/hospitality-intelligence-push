
import { supabase } from "@/lib/supabase";
import { PLTrackerBudgetItem } from "../types/PLTrackerTypes";

export const storeTrackerSnapshot = async (
  items: PLTrackerBudgetItem[],
  year: number,
  month: number,
  calculatedOperatingProfit?: { budget: number; actual: number; forecast: number }
): Promise<boolean> => {
  try {
    console.log(`Storing ${items.length} items in snapshot for ${year}-${month}`);
    console.log('Operating Profit values:', calculatedOperatingProfit);

    // Store items that have significant values
    const itemsToStore = items.filter(item => item.budget_amount || item.actual_amount || item.forecast_amount);
    
    // Add Operating Profit if provided
    if (calculatedOperatingProfit) {
      itemsToStore.push({
        name: "Operating Profit/(Loss)",
        category: "Operating Performance",
        budget_amount: calculatedOperatingProfit.budget,
        actual_amount: calculatedOperatingProfit.actual,
        forecast_amount: calculatedOperatingProfit.forecast,
        isHeader: false,
        isOperatingProfit: true
      } as PLTrackerBudgetItem);
    }
    
    console.log(`After filtering and adding OP, storing ${itemsToStore.length} items in snapshot`);

    // Store each item as a snapshot
    const promises = itemsToStore.map(item => {
      const budgetAmount = item.budget_amount || 0;
      const actualAmount = item.actual_amount || 0;
      const forecastAmount = item.forecast_amount || 0;
      
      console.log(`Storing snapshot for ${item.name}:`, {
        budget: budgetAmount,
        actual: actualAmount,
        forecast: forecastAmount
      });
      
      return supabase.rpc('store_pl_snapshot', {
        p_year: year,
        p_month: month,
        p_category: item.category,
        p_name: item.name,
        p_budget_amount: budgetAmount,
        p_actual_amount: actualAmount,
        p_forecast_amount: forecastAmount
      });
    });

    const results = await Promise.all(promises);
    const failures = results.filter(result => result.error);
    
    if (failures.length > 0) {
      console.error('Some snapshots failed to store:', failures);
      return false;
    }
    
    console.log(`Successfully stored ${itemsToStore.length} items in snapshot for ${year}-${month}`);
    return true;
  } catch (error) {
    console.error('Error storing snapshot:', error);
    return false;
  }
};

interface PLSnapshot {
  category: string;
  name: string;
  budget_amount: number;
  actual_amount: number | null;
  forecast_amount: number | null;
  budget_variance: number | null;
  forecast_variance: number | null;
  captured_at: string;
}

export const getLatestSnapshot = async (year: number, month: number): Promise<PLSnapshot[] | null> => {
  try {
    const { data, error } = await supabase.rpc('get_latest_pl_snapshots', {
      p_year: year,
      p_month: month
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching latest snapshot:', error);
    return null;
  }
};

