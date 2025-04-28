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

    // Simple insert/update approach based on existence check
    try {
      // First try insert - if it fails due to conflict, we know the record exists
      const { error: insertError } = await supabase
        .from('wages')
        .insert(dbWages);
      
      // If there's a duplicate key violation, update the record instead
      if (insertError && (insertError.code === '23505' || insertError.message.includes('duplicate'))) {
        console.log('Record exists, updating instead');
        
        const { error: updateError } = await supabase
          .from('wages')
          .update({
            foh_wages: fohWages,
            kitchen_wages: kitchenWages, 
            food_revenue: foodRevenue,
            bev_revenue: bevRevenue,
            updated_at: new Date().toISOString()
          })
          .eq('year', dbWages.year)
          .eq('month', dbWages.month)
          .eq('day', dbWages.day);
          
        if (updateError) {
          throw updateError;
        }
      } else if (insertError) {
        // If it's any other error on insert, throw it
        throw insertError;
      }
      
      console.log('Wages data saved successfully');
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception during wages upsert:', error);
    throw error;
  }
};
