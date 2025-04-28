
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
    
    const dateKey = `${wages.year}-${wages.month}-${wages.day}`;
    console.log(`Attempting to save wages for ${dateKey}`);
    
    // First check if record already exists
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
    
    // Ensure numeric values
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
    
    let saveError = null;
    
    if (existingRecord?.id) {
      console.log(`Updating existing wages record with ID ${existingRecord.id}`);
      // Update existing record by ID
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
        
      saveError = error;
      
      if (!error) {
        console.log(`Successfully updated wages record for ${dateKey} with ID ${existingRecord.id}`);
      } else {
        console.error(`Error updating wages record:`, error);
      }
    } else {
      console.log(`Creating new wages record for ${dateKey}`);
      // Insert new record
      const { error } = await supabase
        .from('wages')
        .insert([dbWages]);
        
      saveError = error;
      
      if (!error) {
        console.log(`Successfully inserted wages record for ${dateKey}`);
      } else {
        console.error(`Error inserting wages record:`, error);
      }
    }
    
    if (saveError) {
      // Special handling for materialized view errors (ignore them)
      if (saveError.code === '42501' && saveError.message.includes('financial_performance_analysis')) {
        console.log('Ignoring materialized view permission error, data should be saved');
        return;
      } else if (saveError.code === '23505') {  // Duplicate key error
        console.log('Duplicate record detected, trying emergency direct save...');
        await emergencyDirectSave(wages);
      } else {
        // For other types of errors, try the emergency direct save
        console.log('Error during save, trying emergency direct save:', saveError);
        await emergencyDirectSave(wages);
      }
    }
  } catch (error) {
    console.error('Primary save method failed:', error);
    // Last resort fallback - try emergency direct save
    await emergencyDirectSave(wages);
  }
};

// Separated this out for cleaner code and reusability
async function emergencyDirectSave(wages: DailyWages): Promise<void> {
  try {
    console.log('Attempting emergency direct save via RPC...');
    
    // Use the Supabase RPC function for the emergency save
    const { data, error } = await supabase
      .rpc('upsert_wages_record', {
        p_year: wages.year,
        p_month: wages.month, 
        p_day: wages.day,
        p_date: wages.date,
        p_day_of_week: wages.dayOfWeek,
        p_foh_wages: Number(wages.fohWages) || 0,
        p_kitchen_wages: Number(wages.kitchenWages) || 0,
        p_food_revenue: Number(wages.foodRevenue) || 0,
        p_bev_revenue: Number(wages.bevRevenue) || 0
      });
      
    if (error) {
      // If RPC fails, try final direct approach
      console.error('Exception in emergency RPC wages save:', error);
      await finalEmergencyDirectSave(wages);
    } else {
      console.log('Emergency direct save successful via RPC');
    }
  } catch (finalError) {
    console.error('Emergency RPC save failed, trying final direct save method:', finalError);
    await finalEmergencyDirectSave(wages);
  }
}

// Final fallback that does direct SQL-like operations
async function finalEmergencyDirectSave(wages: DailyWages): Promise<void> {
  try {
    console.log('Attempting final emergency direct save...');
    
    // First try to delete any existing record to avoid conflicts
    const { error: deleteError } = await supabase
      .from('wages')
      .delete()
      .eq('year', wages.year)
      .eq('month', wages.month)
      .eq('day', wages.day);
      
    if (deleteError) {
      console.warn('Could not delete existing record:', deleteError);
    }
    
    // Then insert a new clean record
    const { error: insertError } = await supabase
      .from('wages')
      .insert([{
        year: wages.year,
        month: wages.month,
        day: wages.day,
        date: wages.date,
        day_of_week: wages.dayOfWeek,
        foh_wages: Number(wages.fohWages) || 0,
        kitchen_wages: Number(wages.kitchenWages) || 0,
        food_revenue: Number(wages.foodRevenue) || 0,
        bev_revenue: Number(wages.bevRevenue) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
      
    if (insertError) {
      console.error('Final emergency insert failed:', insertError);
      throw insertError;
    }
    
    console.log('Final emergency direct save successful');
  } catch (ultimateError) {
    console.error('All attempts to save wages failed:', ultimateError);
    throw ultimateError;
  }
}
