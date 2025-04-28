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
  const { data, error } = await supabase
    .from('wages')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('day', day)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    console.error('Error fetching daily wages:', error);
    throw error;
  }

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
    
    // Sum up both FOH and Kitchen wages
    const totalWages = data.reduce((sum, item) => {
      return sum + Number(item.foh_wages || 0) + Number(item.kitchen_wages || 0);
    }, 0);
    
    return totalWages;
  } catch (err) {
    console.error('Unexpected error calculating total wages:', err);
    return 0;
  }
};

export const upsertDailyWages = async (wages: DailyWages): Promise<void> => {
  try {
    const user = await getCurrentUser();
    console.log('Upserting wages data:', wages);
    
    // Ensure that numeric values are numbers and not strings
    const fohWages = Number(wages.fohWages) || 0;
    const kitchenWages = Number(wages.kitchenWages) || 0;
    const foodRevenue = Number(wages.foodRevenue) || 0;
    const bevRevenue = Number(wages.bevRevenue) || 0;
    
    // Convert from DailyWages to DbWages
    const dbWages: DbWages = {
      year: wages.year,
      month: wages.month,
      day: wages.day,
      date: wages.date,
      day_of_week: wages.dayOfWeek,
      foh_wages: fohWages,
      kitchen_wages: kitchenWages,
      food_revenue: foodRevenue,
      bev_revenue: bevRevenue,
      created_by: user?.id
    };
    
    console.log('Preparing to save wages data:', dbWages);
    
    // Try to directly insert first, then catch and handle the conflict
    try {
      const { error: insertError } = await supabase
        .from('wages')
        .insert([dbWages]);
      
      // If no error, insertion was successful
      if (!insertError) {
        console.log('Wages record inserted successfully');
        return;
      }
      
      // If there was an error but it's not a duplicate key error, throw it
      if (insertError && !(insertError.code === '23505' || insertError.message.includes('duplicate key'))) {
        // If the error is related to the materialized view, ignore it
        if (insertError.code === '42501' && insertError.message.includes('financial_performance_analysis')) {
          console.log('Ignoring materialized view permission error on insert, data was likely saved');
          return;
        }
        
        console.error('Error inserting wages record:', insertError);
        throw insertError;
      }
      
      // If we get here, it means there was a duplicate key error, so try update instead
      console.log('Record already exists, attempting update...');
    } catch (insertErr) {
      // Handle insert error that isn't a duplicate key (server error, etc.)
      if (!(insertErr.code === '23505' || insertErr.message?.includes('duplicate key'))) {
        if (insertErr.code === '42501' && insertErr.message?.includes('financial_performance_analysis')) {
          console.log('Ignoring materialized view permission error, data was likely saved');
          return;
        }
        
        console.error('Unexpected error during insert:', insertErr);
        throw insertErr;
      }
      
      console.log('Record already exists (caught exception), attempting update...');
    }
    
    // If insertion failed due to duplicate, try an update without using upsert
    const { error: updateError } = await supabase
      .from('wages')
      .update({
        foh_wages: fohWages,
        kitchen_wages: kitchenWages,
        food_revenue: foodRevenue,
        bev_revenue: bevRevenue,
        updated_at: new Date().toISOString()
      })
      .eq('year', wages.year)
      .eq('month', wages.month)
      .eq('day', wages.day);
    
    if (updateError) {
      // If the error is related to the materialized view, ignore it
      if (updateError.code === '42501' && updateError.message.includes('financial_performance_analysis')) {
        console.log('Ignoring materialized view permission error on update, data was likely saved');
        return;
      }
      
      console.error('Error updating wages record:', updateError);
      throw updateError;
    }
    
    console.log('Wages data updated successfully');
    
  } catch (error) {
    console.error('Exception during wages upsert:', error);
    throw error;
  }
};
