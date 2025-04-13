
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ModuleType } from '@/types/kitchen-ledger';

// Supplier Functions
export const fetchSuppliers = async (moduleType: ModuleType = 'food') => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('module_type', moduleType)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
};

export const createSupplier = async (supplierData: any) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

export const updateSupplier = async (id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

export const deleteSupplier = async (id: string) => {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};

// Monthly Settings Functions
export const fetchMonthlySettings = async (year: number, month: number, moduleType: ModuleType = 'food') => {
  console.log(`Fetching monthly settings for ${year}-${month} (${moduleType})`);
  try {
    const { data, error } = await supabase
      .from('monthly_settings')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .eq('module_type', moduleType)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected if no settings exist yet
      console.error('Error fetching monthly settings:', error);
      throw error;
    }
    
    console.log('Monthly settings result:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchMonthlySettings:', error);
    throw error;
  }
};

export const createMonthlySettings = async (settingsData: any) => {
  console.log('Creating monthly settings with data:', settingsData);
  try {
    const { data, error } = await supabase
      .from('monthly_settings')
      .insert(settingsData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating monthly settings:', error);
      throw error;
    }
    
    console.log('Monthly settings created:', data);
    return data;
  } catch (error) {
    console.error('Error in createMonthlySettings:', error);
    throw error;
  }
};

export const updateMonthlySettings = async (id: string, updates: any) => {
  console.log(`Updating monthly settings ${id} with:`, updates);
  try {
    const { data, error } = await supabase
      .from('monthly_settings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating monthly settings:', error);
      throw error;
    }
    
    console.log('Monthly settings updated:', data);
    return data;
  } catch (error) {
    console.error('Error in updateMonthlySettings:', error);
    throw error;
  }
};

// Function to fetch all information needed for a monthly summary
export const fetchMonthSummary = async (year: number, month: number, moduleType: ModuleType = 'food') => {
  try {
    // First get monthly settings
    const settings = await fetchMonthlySettings(year, month, moduleType);
    
    // Then get all daily records for this month
    const { data: weeklyRecords, error: weeklyError } = await supabase
      .from('weekly_records')
      .select('*, daily_records(*)')
      .eq('year', year)
      .eq('month', month)
      .eq('module_type', moduleType);
    
    if (weeklyError) throw weeklyError;
    
    // Get all purchases for this month
    const allDailyRecordIds = weeklyRecords
      ?.flatMap(week => week.daily_records || [])
      .map(record => record.id) || [];
    
    let purchases = [];
    if (allDailyRecordIds.length > 0) {
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('*, suppliers(*)')
        .in('daily_record_id', allDailyRecordIds)
        .eq('module_type', moduleType);
      
      if (purchaseError) throw purchaseError;
      purchases = purchaseData || [];
    }
    
    // Get all credit notes for this month
    let creditNotes = [];
    if (allDailyRecordIds.length > 0) {
      const { data: creditData, error: creditError } = await supabase
        .from('credit_notes')
        .select('*')
        .in('daily_record_id', allDailyRecordIds)
        .eq('module_type', moduleType);
      
      if (creditError) throw creditError;
      creditNotes = creditData || [];
    }
    
    return {
      settings,
      weeklyRecords: weeklyRecords || [],
      purchases,
      creditNotes
    };
  } catch (error) {
    console.error('Error fetching month summary:', error);
    throw error;
  }
};
