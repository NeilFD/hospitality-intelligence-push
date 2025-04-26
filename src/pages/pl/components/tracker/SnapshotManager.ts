
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
    
    // Remove any existing Operating Profit entries to prevent duplicates
    const filteredItems = itemsToStore.filter(item => 
      !item.name.toLowerCase().includes('operating profit') && 
      !item.isOperatingProfit
    );
    
    console.log(`After removing existing OP entries, items count: ${filteredItems.length}`);
    
    // Add Operating Profit if provided
    if (calculatedOperatingProfit) {
      // Ensure these values are properly formatted numbers
      const budget = parseFloat(calculatedOperatingProfit.budget.toFixed(2));
      const actual = parseFloat(calculatedOperatingProfit.actual.toFixed(2));  
      const forecast = parseFloat(calculatedOperatingProfit.forecast.toFixed(2));
      
      console.log(`Adding Operating Profit with explicit values:`, {
        budget,
        actual,
        forecast
      });
      
      filteredItems.push({
        name: "Operating Profit/(Loss)",
        category: "Operating Performance",
        budget_amount: budget,
        actual_amount: actual,
        forecast_amount: forecast,
        isHeader: false,
        isOperatingProfit: true
      } as PLTrackerBudgetItem);
    }
    
    console.log(`Final items to store: ${filteredItems.length}`);
    
    if (calculatedOperatingProfit) {
      // Log the operating profit entry to verify it's being included correctly
      const opItem = filteredItems.find(item => 
        item.name.toLowerCase().includes('operating profit') || 
        item.isOperatingProfit
      );
      
      console.log('Operating Profit entry to be stored:', opItem);
    }

    // Store each item as a snapshot
    const promises = filteredItems.map(item => {
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
    
    console.log(`Successfully stored ${filteredItems.length} items in snapshot for ${year}-${month}`);
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
