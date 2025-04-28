
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

    console.log('Sending to database:', dbWages);

    // First check if the record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('wages')
      .select('id')
      .eq('year', dbWages.year)
      .eq('month', dbWages.month)
      .eq('day', dbWages.day)
      .maybeSingle();
    
    // Handle check errors, but ignore specific materialized view errors
    if (checkError && checkError.code !== 'PGRST116') { // 'PGRST116' is "no rows returned"
      if (!(checkError.code === '42501' && checkError.message.includes('financial_performance_analysis'))) {
        console.error('Error checking for existing record:', checkError);
        throw checkError;
      } else {
        console.log('Ignoring materialized view permission error during check');
      }
    }
    
    let success = false;
    
    if (existingRecord?.id) {
      // Record exists, update it
      console.log('Record exists with ID:', existingRecord.id, 'updating...');
      const { error: updateError } = await supabase
        .from('wages')
        .update({
          foh_wages: fohWages,
          kitchen_wages: kitchenWages,
          food_revenue: foodRevenue,
          bev_revenue: bevRevenue
        })
        .eq('id', existingRecord.id);
        
      if (updateError) {
        if (updateError.code === '42501' && updateError.message.includes('financial_performance_analysis')) {
          console.log('Ignoring materialized view permission error during update');
          success = true; // Consider it a success despite the permission error
        } else {
          console.error('Error updating record:', updateError);
          throw updateError;
        }
      } else {
        success = true;
      }
    } else {
      // Record doesn't exist, insert it
      console.log('Record does not exist, inserting new record');
      const { data: insertData, error: insertError } = await supabase
        .from('wages')
        .insert(dbWages)
        .select('id')
        .single();
        
      if (insertError) {
        if (insertError.code === '42501' && insertError.message.includes('financial_performance_analysis')) {
          console.log('Ignoring materialized view permission error during insert');
          success = true; // Consider it a success despite the permission error
        } else if (insertError.code === '23505') { // Duplicate key error
          console.log('Duplicate key detected on insert, trying update instead');
          
          // Try an update as a fallback
          const { error: fallbackUpdateError } = await supabase
            .from('wages')
            .update({
              foh_wages: fohWages,
              kitchen_wages: kitchenWages,
              food_revenue: foodRevenue,
              bev_revenue: bevRevenue
            })
            .eq('year', dbWages.year)
            .eq('month', dbWages.month)
            .eq('day', dbWages.day);
            
          if (fallbackUpdateError) {
            if (fallbackUpdateError.code === '42501' && fallbackUpdateError.message.includes('financial_performance_analysis')) {
              console.log('Ignoring materialized view permission error during fallback update');
              success = true;
            } else {
              console.error('Error during fallback update:', fallbackUpdateError);
              throw fallbackUpdateError;
            }
          } else {
            success = true;
          }
        } else {
          console.error('Error inserting record:', insertError);
          throw insertError;
        }
      } else {
        success = true;
        console.log('Successfully inserted new record with ID:', insertData?.id);
      }
    }
    
    if (success) {
      console.log('Wages data processed successfully');
    } else {
      console.error('Failed to save wages data without a specific error');
      throw new Error('Failed to save wages data');
    }
  } catch (error) {
    console.error('Exception during wages upsert:', error);
    throw error;
  }
};
