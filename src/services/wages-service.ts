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

export const upsertDailyWages = async (wages: DailyWages) => {
  try {
    console.log('============= WAGE SAVE OPERATION START =============');
    console.log('Wages data to be saved:', JSON.stringify(wages, null, 2));

    const formattedMonth = String(wages.month).padStart(2, '0');
    const formattedDay = String(wages.day).padStart(2, '0');
    const formattedDate = `${wages.year}-${formattedMonth}-${formattedDay}`;
    console.log('Formatted date for record:', formattedDate);

    // Check if a record exists for this date
    console.log(`Checking for existing record: year=${wages.year}, month=${wages.month}, day=${wages.day}`);
    const { data: existingRecord, error: selectError } = await supabase
      .from('wages')
      .select('id')
      .eq('year', wages.year)
      .eq('month', wages.month)
      .eq('day', wages.day)
      .maybeSingle();

    if (selectError) {
      console.error('ERROR checking for existing wage record:', selectError);
      console.error('Error details:', JSON.stringify(selectError, null, 2));
      throw selectError;
    }

    console.log('Existing record check result:', existingRecord);

    if (existingRecord) {
      // Update existing record
      console.log(`Updating existing record with ID: ${existingRecord.id}`);
      console.log('Update payload:', {
        foh_wages: wages.fohWages || 0,
        kitchen_wages: wages.kitchenWages || 0,
        food_revenue: wages.foodRevenue || 0,
        bev_revenue: wages.bevRevenue || 0,
        updated_at: new Date().toISOString()
      });
      
      const { data: updateData, error: updateError } = await supabase
        .from('wages')
        .update({
          foh_wages: wages.fohWages || 0,
          kitchen_wages: wages.kitchenWages || 0,
          food_revenue: wages.foodRevenue || 0,
          bev_revenue: wages.bevRevenue || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select();

      if (updateError) {
        console.error('ERROR updating wage record:', updateError);
        console.error('Error details:', JSON.stringify(updateError, null, 2));
        throw updateError;
      }

      console.log('UPDATE SUCCESSFUL. Response data:', JSON.stringify(updateData, null, 2));
      console.log('============= WAGE SAVE OPERATION END =============');
      return updateData;
    } else {
      // Insert new record
      console.log('No existing record found. Creating new wage record');
      const insertPayload = {
        year: wages.year,
        month: wages.month,
        day: wages.day,
        date: formattedDate,
        day_of_week: wages.dayOfWeek,
        foh_wages: wages.fohWages || 0,
        kitchen_wages: wages.kitchenWages || 0,
        food_revenue: wages.foodRevenue || 0,
        bev_revenue: wages.bevRevenue || 0
      };
      console.log('Insert payload:', insertPayload);
      
      const { data: insertData, error: insertError } = await supabase
        .from('wages')
        .insert(insertPayload)
        .select();

      if (insertError) {
        console.error('ERROR inserting wage record:', insertError);
        console.error('Error details:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }

      console.log('INSERT SUCCESSFUL. Response data:', JSON.stringify(insertData, null, 2));
      console.log('============= WAGE SAVE OPERATION END =============');
      return insertData;
    }
  } catch (error) {
    console.error('CRITICAL FAILURE in upsertDailyWages function:', error);
    console.error('Error object details:', JSON.stringify(error, null, 2));
    console.error('Original wages data:', JSON.stringify(wages, null, 2));
    console.error('============= WAGE SAVE OPERATION FAILED =============');
    throw error;
  }
};

// Function to manually refresh the financial performance analysis view
export const refreshFinancialPerformanceAnalysis = async (): Promise<boolean> => {
  try {
    console.log('Manually triggering refresh of financial_performance_analysis materialized view');
    
    // Use the security definer function we just created instead of direct RPC call
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
