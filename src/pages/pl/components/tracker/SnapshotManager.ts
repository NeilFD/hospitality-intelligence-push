
import { supabase } from "@/integrations/supabase/client";
import { PLTrackerBudgetItem } from "../types/PLTrackerTypes";

export const storeTrackerSnapshot = async (
  items: PLTrackerBudgetItem[],
  year: number,
  month: number
): Promise<boolean> => {
  try {
    // Store each item as a snapshot
    const promises = items.map(item => 
      supabase.rpc('store_pl_snapshot', {
        p_year: year,
        p_month: month,
        p_category: item.category,
        p_name: item.name,
        p_budget_amount: item.budget_amount,
        p_actual_amount: item.actual_amount || null,
        p_forecast_amount: item.forecast_amount || null
      })
    );

    await Promise.all(promises);
    console.log(`Stored ${items.length} items in snapshot for ${year}-${month}`);
    return true;
  } catch (error) {
    console.error('Error storing snapshot:', error);
    return false;
  }
};

export const getLatestSnapshot = async (year: number, month: number) => {
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
