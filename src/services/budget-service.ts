
import { supabase } from '@/lib/supabase';
import { DayInput } from '@/pages/pl/components/types/PLTrackerTypes';

export interface DailyValueData {
  day: number;
  value: number;
}

export const fetchDailyValues = async (
  budgetItemId: string,
  year: number,
  month: number
): Promise<DailyValueData[]> => {
  console.log(`Fetching daily values for budget item: ${budgetItemId}, month: ${month}, year: ${year}`);
  
  try {
    const { data, error } = await supabase
      .from('budget_item_daily_values')
      .select('day, value')
      .eq('budget_item_id', budgetItemId)
      .eq('year', year)
      .eq('month', month)
      .order('day');
    
    if (error) {
      console.error('Error fetching daily values:', error);
      return [];
    }
    
    console.log(`Retrieved ${data.length} daily values:`, data);
    return data;
  } catch (err) {
    console.error('Unexpected error fetching daily values:', err);
    return [];
  }
};

export const upsertDailyValue = async (
  budgetItemId: string,
  year: number,
  month: number,
  day: number,
  value: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('budget_item_daily_values')
      .upsert({
        budget_item_id: budgetItemId,
        year,
        month,
        day,
        value
      }, {
        onConflict: 'budget_item_id,year,month,day'
      });
    
    if (error) {
      console.error('Error upserting daily value:', error);
      throw error;
    }
  } catch (err) {
    console.error('Unexpected error upserting daily value:', err);
    throw err;
  }
};

export const saveDailyValues = async (
  budgetItemId: string,
  dailyValues: DayInput[],
  month: number,
  year: number
): Promise<boolean> => {
  try {
    console.log(`Saving ${dailyValues.length} daily values for item: ${budgetItemId}, month: ${month}, year: ${year}`);
    
    // Process all daily values
    for (const dayInput of dailyValues) {
      // Skip if the value is null
      if (dayInput.value === null) {
        continue;
      }
      
      // Get day from either day property or date property
      const day = dayInput.day || (dayInput.date ? dayInput.date.getDate() : null);
      
      if (day === null) {
        console.error('Could not determine day value for input:', dayInput);
        continue;
      }
      
      // Upsert each daily value
      await upsertDailyValue(budgetItemId, year, month, day, dayInput.value);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving daily values:', error);
    return false;
  }
};

export const fetchFoodCOSForMonth = async (year: number, month: number): Promise<number> => {
  try {
    // Fetch all tracker_data entries for the given month and year for food module
    const { data: trackerData, error } = await supabase
      .from('tracker_data')
      .select('id')
      .eq('year', year)
      .eq('month', month)
      .eq('module_type', 'food');
    
    if (error) {
      console.error('Error fetching food tracker data:', error);
      return 0;
    }
    
    if (!trackerData || trackerData.length === 0) {
      return 0;
    }
    
    // Get all tracker_data ids for this month
    const trackerIds = trackerData.map(item => item.id);
    
    // Fetch all purchases associated with these tracker_data records
    const { data: purchases, error: purchasesError } = await supabase
      .from('tracker_purchases')
      .select('amount')
      .in('tracker_data_id', trackerIds);
    
    if (purchasesError) {
      console.error('Error fetching food purchases:', purchasesError);
      return 0;
    }
    
    // Fetch all credit notes associated with these tracker_data records
    const { data: credits, error: creditsError } = await supabase
      .from('tracker_credit_notes')
      .select('amount')
      .in('tracker_data_id', trackerIds);
    
    if (creditsError) {
      console.error('Error fetching food credit notes:', creditsError);
      return 0;
    }
    
    // Calculate total purchases
    const totalPurchases = purchases ? purchases.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    
    // Calculate total credits
    const totalCredits = credits ? credits.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    
    // COS = Purchases - Credits
    const totalCOS = totalPurchases - totalCredits;
    
    return totalCOS;
  } catch (err) {
    console.error('Unexpected error calculating food COS:', err);
    return 0;
  }
};

export const fetchBeverageCOSForMonth = async (year: number, month: number): Promise<number> => {
  try {
    // Fetch all tracker_data entries for the given month and year for beverage module
    const { data: trackerData, error } = await supabase
      .from('tracker_data')
      .select('id')
      .eq('year', year)
      .eq('month', month)
      .eq('module_type', 'beverage');
    
    if (error) {
      console.error('Error fetching beverage tracker data:', error);
      return 0;
    }
    
    if (!trackerData || trackerData.length === 0) {
      return 0;
    }
    
    // Get all tracker_data ids for this month
    const trackerIds = trackerData.map(item => item.id);
    
    // Fetch all purchases associated with these tracker_data records
    const { data: purchases, error: purchasesError } = await supabase
      .from('tracker_purchases')
      .select('amount')
      .in('tracker_data_id', trackerIds);
    
    if (purchasesError) {
      console.error('Error fetching beverage purchases:', purchasesError);
      return 0;
    }
    
    // Fetch all credit notes associated with these tracker_data records
    const { data: credits, error: creditsError } = await supabase
      .from('tracker_credit_notes')
      .select('amount')
      .in('tracker_data_id', trackerIds);
    
    if (creditsError) {
      console.error('Error fetching beverage credit notes:', creditsError);
      return 0;
    }
    
    // Calculate total purchases
    const totalPurchases = purchases ? purchases.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    
    // Calculate total credits
    const totalCredits = credits ? credits.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    
    // COS = Purchases - Credits
    const totalCOS = totalPurchases - totalCredits;
    
    return totalCOS;
  } catch (err) {
    console.error('Unexpected error calculating beverage COS:', err);
    return 0;
  }
};
