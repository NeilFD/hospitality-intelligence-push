
import { supabase } from '@/lib/supabase';
import { DailyWages } from '@/components/wages/WagesStore';
import { getCurrentUser } from '@/lib/supabase';

export interface DbWages {
  id?: string;
  year: number;
  month: number;
  day: number;
  date: string;
  day_of_week: string;
  foh_wages: number;
  kitchen_wages: number;
  food_revenue: number;
  bev_revenue: number;
  created_by?: string | null;
}

export const fetchWagesByMonth = async (year: number, month: number): Promise<DailyWages[]> => {
  console.log(`Fetching wages data from Supabase for ${year}-${month}`);
  
  const { data, error } = await supabase
    .from('wages')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('day');

  if (error) {
    console.error('Error fetching wages:', error);
    throw error;
  }

  console.log(`Received ${data.length} wage records from Supabase`);
  
  return data.map((wage) => ({
    year: wage.year,
    month: wage.month,
    day: wage.day,
    date: wage.date,
    dayOfWeek: wage.day_of_week,
    fohWages: Number(wage.foh_wages),
    kitchenWages: Number(wage.kitchen_wages),
    foodRevenue: Number(wage.food_revenue),
    bevRevenue: Number(wage.bev_revenue)
  }));
};

export const fetchWagesByDay = async (year: number, month: number, day: number): Promise<DailyWages | null> => {
  console.log(`Fetching wages for specific day: ${year}-${month}-${day}`);
  
  const { data, error } = await supabase
    .from('wages')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('day', day)
    .maybeSingle();

  if (error) {
    console.error('Error fetching daily wages:', error);
    throw error;
  }

  if (!data) return null;

  console.log(`Found wage record for ${year}-${month}-${day}:`, data);
  
  return {
    year: data.year,
    month: data.month,
    day: data.day,
    date: data.date,
    dayOfWeek: data.day_of_week,
    fohWages: Number(data.foh_wages),
    kitchenWages: Number(data.kitchen_wages),
    foodRevenue: Number(data.food_revenue),
    bevRevenue: Number(data.bev_revenue)
  };
};

export const fetchTotalWagesForMonth = async (year: number, month: number): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('wages')
      .select('foh_wages, kitchen_wages')
      .eq('year', year)
      .eq('month', month);
    
    if (error) {
      console.error('Error fetching wages for month:', error);
      return 0;
    }
    
    if (!data || data.length === 0) {
      return 0;
    }
    
    const totalWages = data.reduce((sum, item) => {
      return sum + Number(item.foh_wages || 0) + Number(item.kitchen_wages || 0);
    }, 0);
    
    return totalWages;
  } catch (err) {
    console.error('Unexpected error calculating total wages:', err);
    return 0;
  }
};

// Simplified upsert function - focus only on saving to wages table
export const upsertDailyWages = async (wages: DailyWages) => {
  try {
    // Format date properly as a string in YYYY-MM-DD format for PostgreSQL
    const formattedMonth = String(wages.month).padStart(2, '0');
    const formattedDay = String(wages.day).padStart(2, '0');
    const formattedDate = `${wages.year}-${formattedMonth}-${formattedDay}`;
    
    console.log(`Saving wages for ${formattedDate}`);
    
    // Use the direct_upsert_wages RPC function
    const { data, error } = await supabase.rpc('direct_upsert_wages', {
      p_year: wages.year,
      p_month: wages.month,
      p_day: wages.day,
      p_date: formattedDate,
      p_day_of_week: wages.dayOfWeek,
      p_foh_wages: Number(wages.fohWages) || 0,
      p_kitchen_wages: Number(wages.kitchenWages) || 0,
      p_food_revenue: Number(wages.foodRevenue) || 0,
      p_bev_revenue: Number(wages.bevRevenue) || 0
    });
    
    if (error) {
      console.error('Error saving wages data:', error);
      throw error;
    }
    
    console.log('Wages saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to save wages:', error);
    throw error;
  }
};

// Function to manually refresh the financial performance analysis view
export const refreshFinancialPerformanceAnalysis = async (): Promise<boolean> => {
  try {
    console.log('Manually triggering refresh of financial_performance_analysis materialized view');
    
    const { error } = await supabase.rpc('refresh_financial_performance_analysis');
    
    if (error) {
      console.error('Error refreshing financial performance analysis:', error);
      return false;
    }
    
    console.log('Successfully refreshed financial_performance_analysis view');
    return true;
  } catch (err) {
    console.error('Unexpected error refreshing financial performance analysis:', err);
    return false;
  }
};
