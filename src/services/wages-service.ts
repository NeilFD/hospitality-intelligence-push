
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
    // Format date values correctly for logging
    const dateKey = `${wages.year}-${wages.month}-${wages.day}`;
    console.log(`Attempting to save wages for ${dateKey}:`, wages);
    
    // Make sure we have numeric values
    const fohWages = Number(wages.fohWages || 0);
    const kitchenWages = Number(wages.kitchenWages || 0);
    const foodRevenue = Number(wages.foodRevenue || 0);
    const bevRevenue = Number(wages.bevRevenue || 0);
    
    console.log(`Converted values: foh=${fohWages}, kitchen=${kitchenWages}, food=${foodRevenue}, bev=${bevRevenue}`);
    
    // Format date correctly as YYYY-MM-DD for PostgreSQL
    const month = String(wages.month).padStart(2, '0');
    const day = String(wages.day).padStart(2, '0');
    const formattedDate = `${wages.year}-${month}-${day}`;
    console.log(`Using formatted date: ${formattedDate}`);
    
    // Get the current user for tracking
    const user = await getCurrentUser();
    console.log('Current user:', user?.id || 'anonymous');

    // First check if a record exists
    const { data: existing, error: checkError } = await supabase
      .from('wages')
      .select('id')
      .eq('year', wages.year)
      .eq('month', wages.month)
      .eq('day', wages.day)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing record:', checkError);
      throw checkError;
    }

    let result;

    // Use different approaches based on whether record exists
    if (existing?.id) {
      // Update the existing record
      console.log(`Updating existing wages record with ID ${existing.id}`);
      
      const { data, error: updateError } = await supabase
        .from('wages')
        .update({
          foh_wages: fohWages,
          kitchen_wages: kitchenWages,
          food_revenue: foodRevenue,
          bev_revenue: bevRevenue,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select();

      if (updateError) {
        console.error('Error updating wages record:', updateError);
        throw updateError;
      }

      result = data;
      console.log(`Successfully updated wages record for ${dateKey}:`, data);
    } else {
      // Insert a new record
      console.log(`Creating new wages record for ${dateKey}`);
      
      const { data, error: insertError } = await supabase
        .from('wages')
        .insert([{
          year: wages.year,
          month: wages.month,
          day: wages.day,
          date: formattedDate,
          day_of_week: wages.dayOfWeek,
          foh_wages: fohWages,
          kitchen_wages: kitchenWages,
          food_revenue: foodRevenue,
          bev_revenue: bevRevenue,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (insertError) {
        console.error('Error inserting wages record:', insertError);
        throw insertError;
      }

      result = data;
      console.log(`Successfully inserted wages record for ${dateKey}:`, data);
    }

    return result;
  } catch (error) {
    console.error('Error saving wages data:', error);
    throw error;
  }
};
