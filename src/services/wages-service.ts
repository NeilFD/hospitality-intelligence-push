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
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    console.error('Error fetching daily wages:', error);
    throw error;
  }

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

export const upsertDailyWages = async (wages: DailyWages): Promise<void> => {
  try {
    const user = await getCurrentUser();
    
    const dateKey = `${wages.year}-${wages.month}-${wages.day}`;
    console.log(`Attempting to save wages for ${dateKey}`);
    
    const fohWages = Number(wages.fohWages) || 0;
    const kitchenWages = Number(wages.kitchenWages) || 0;
    const foodRevenue = Number(wages.foodRevenue) || 0;
    const bevRevenue = Number(wages.bevRevenue) || 0;

    try {
      console.log('Attempting to save via Edge Function');
      
      const { data, error } = await supabase.functions.invoke('upsert_wages_record', {
        body: {
          p_year: wages.year,
          p_month: wages.month, 
          p_day: wages.day,
          p_date: wages.date,
          p_day_of_week: wages.dayOfWeek,
          p_foh_wages: fohWages,
          p_kitchen_wages: kitchenWages,
          p_food_revenue: foodRevenue,
          p_bev_revenue: bevRevenue
        }
      });
      
      if (error) {
        console.error('Error using Edge Function:', error);
        throw error;
      }
      
      console.log('Edge Function save result:', data);
      return;
    } catch (edgeFunctionError) {
      console.error('Edge Function failed, trying direct RPC call:', edgeFunctionError);
      
      try {
        const { data, error } = await supabase.rpc(
          'direct_upsert_wages',
          {
            p_year: wages.year,
            p_month: wages.month, 
            p_day: wages.day,
            p_date: wages.date,
            p_day_of_week: wages.dayOfWeek,
            p_foh_wages: fohWages,
            p_kitchen_wages: kitchenWages,
            p_food_revenue: foodRevenue,
            p_bev_revenue: bevRevenue
          }
        );
        
        if (error) {
          console.error('Direct RPC call failed:', error);
          throw error;
        }
        
        console.log('Direct RPC call succeeded:', data);
        return;
      } catch (rpcError) {
        console.error('Direct RPC call failed, falling back to direct database operations:', rpcError);
        // Continue with fallback approach
      }
    }
    
    const { data: existingRecord, error: fetchError } = await supabase
      .from('wages')
      .select('id')
      .eq('year', wages.year)
      .eq('month', wages.month)
      .eq('day', wages.day)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error checking for existing record:', fetchError);
      throw fetchError;
    }
    
    if (existingRecord?.id) {
      console.log(`Updating existing wages record with ID ${existingRecord.id}`);
      const { error } = await supabase
        .from('wages')
        .update({
          foh_wages: fohWages,
          kitchen_wages: kitchenWages,
          food_revenue: foodRevenue,
          bev_revenue: bevRevenue,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
        
      if (error) {
        console.error('Error updating wages record:', error);
        throw error;
      }
      
      console.log(`Successfully updated wages record for ${dateKey}`);
    } else {
      console.log(`Creating new wages record for ${dateKey}`);
      const { error } = await supabase
        .from('wages')
        .insert([{
          year: wages.year,
          month: wages.month,
          day: wages.day,
          date: wages.date,
          day_of_week: wages.dayOfWeek,
          foh_wages: fohWages,
          kitchen_wages: kitchenWages,
          food_revenue: foodRevenue,
          bev_revenue: bevRevenue,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (error) {
        console.error('Error inserting wages record:', error);
        throw error;
      }
      
      console.log(`Successfully inserted wages record for ${dateKey}`);
    }
  } catch (error) {
    console.error('Error saving wages data:', error);
    throw error;
  }
};
