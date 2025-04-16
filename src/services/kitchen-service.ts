
// Import necessary dependencies
import { supabase } from '@/lib/supabase';
import { PLTrackerBudgetItem, DayInput } from '@/pages/pl/components/types/PLTrackerTypes';
import { ModuleType, TrackerSummary, Supplier } from '@/types/kitchen-ledger';
import { DbTrackerData, DbTrackerPurchase, DbTrackerCreditNote, DbMonthlySettings, DbSupplier } from '@/types/supabase-types';

// Budget item functions
export const fetchBudgetDailyValues = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('budget_item_daily_values')
    .select('*')
    .eq('year', year)
    .eq('month', month);
    
  if (error) throw error;
  return data;
};

export const upsertBudgetDailyValues = async (items: PLTrackerBudgetItem[]) => {
  const dailyValues = items
    .filter(item => item.id && item.daily_values)
    .flatMap(item => 
      (item.daily_values || []).map(dayValue => ({
        budget_item_id: item.id,
        day: dayValue.day,
        value: dayValue.value,
        year: item.year,
        month: item.month
      }))
    );
    
  if (dailyValues.length === 0) return [];
  
  const { data, error } = await supabase
    .from('budget_item_daily_values')
    .upsert(dailyValues)
    .select();
    
  if (error) throw error;
  return data;
};

// Tracker data functions
export const fetchTrackerDataByWeek = async (
  year: number, 
  month: number, 
  weekNumber: number, 
  moduleType: ModuleType
): Promise<DbTrackerData[]> => {
  const { data, error } = await supabase
    .from('tracker_data')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('week_number', weekNumber)
    .eq('module_type', moduleType)
    .order('date');
    
  if (error) throw error;
  return data || [];
};

export const fetchTrackerDataByMonth = async (
  year: number, 
  month: number, 
  moduleType: ModuleType
): Promise<DbTrackerData[]> => {
  const { data, error } = await supabase
    .from('tracker_data')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('module_type', moduleType)
    .order('date');
    
  if (error) throw error;
  return data || [];
};

export const upsertTrackerData = async (trackerData: Partial<DbTrackerData>) => {
  const { data, error } = await supabase
    .from('tracker_data')
    .upsert(trackerData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Tracker purchase functions
export const fetchTrackerPurchases = async (trackerDataId: string): Promise<DbTrackerPurchase[]> => {
  const { data, error } = await supabase
    .from('tracker_purchases')
    .select('*')
    .eq('tracker_data_id', trackerDataId);
    
  if (error) throw error;
  return data || [];
};

export const upsertTrackerPurchase = async (purchase: Partial<DbTrackerPurchase>) => {
  const { data, error } = await supabase
    .from('tracker_purchases')
    .upsert({
      tracker_data_id: purchase.tracker_data_id,
      supplier_id: purchase.supplier_id,
      amount: purchase.amount || 0
    })
    .select();
    
  if (error) throw error;
  return data;
};

// Tracker credit note functions
export const fetchTrackerCreditNotes = async (trackerDataId: string): Promise<DbTrackerCreditNote[]> => {
  const { data, error } = await supabase
    .from('tracker_credit_notes')
    .select('*')
    .eq('tracker_data_id', trackerDataId)
    .order('credit_index');
    
  if (error) throw error;
  return data || [];
};

export const upsertTrackerCreditNote = async (creditNote: Partial<DbTrackerCreditNote>) => {
  const { data, error } = await supabase
    .from('tracker_credit_notes')
    .upsert({
      tracker_data_id: creditNote.tracker_data_id,
      credit_index: creditNote.credit_index || 0,
      amount: creditNote.amount || 0
    })
    .select();
    
  if (error) throw error;
  return data;
};

// Supplier functions
export const fetchSuppliers = async (moduleType: ModuleType): Promise<DbSupplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('module_type', moduleType)
    .order('name');
    
  if (error) throw error;
  return data || [];
};

export const createSupplier = async (supplier: Partial<DbSupplier>) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateSupplier = async (id: string, updates: Partial<DbSupplier>) => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteSupplier = async (id: string) => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

// Monthly settings functions
export const fetchMonthlySettings = async (
  year: number, 
  month: number, 
  moduleType: ModuleType
): Promise<DbMonthlySettings | null> => {
  const { data, error } = await supabase
    .from('monthly_settings')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('module_type', moduleType)
    .maybeSingle();
    
  if (error) throw error;
  return data;
};

export const createMonthlySettings = async (settings: Partial<DbMonthlySettings>) => {
  const { data, error } = await supabase
    .from('monthly_settings')
    .insert(settings)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateMonthlySettings = async (id: string, updates: Partial<DbMonthlySettings>) => {
  const { data, error } = await supabase
    .from('monthly_settings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Tracker summary functions
export const getTrackerSummaryByMonth = async (
  year: number, 
  month: number, 
  moduleType: ModuleType
): Promise<TrackerSummary> => {
  // Fetch all tracker data for the month
  const trackerData = await fetchTrackerDataByMonth(year, month, moduleType);
  
  // Initialize the summary object
  const summary: TrackerSummary = {
    year,
    month,
    moduleType,
    revenue: 0,
    purchases: 0,
    creditNotes: 0,
    staffAllowance: 0,
    totalCost: 0,
    cost: 0,
    gpAmount: 0,
    gpPercentage: 0
  };
  
  // Calculate revenue and staff allowance
  for (const day of trackerData) {
    summary.revenue += day.revenue || 0;
    summary.staffAllowance += day.staff_food_allowance || 0;
  }
  
  // Calculate purchases and credit notes
  for (const day of trackerData) {
    const purchases = await fetchTrackerPurchases(day.id);
    const creditNotes = await fetchTrackerCreditNotes(day.id);
    
    for (const purchase of purchases) {
      summary.purchases += purchase.amount || 0;
    }
    
    for (const creditNote of creditNotes) {
      summary.creditNotes += creditNote.amount || 0;
    }
  }
  
  // Calculate total cost, gross profit, and GP percentage
  summary.cost = summary.purchases - summary.creditNotes;
  summary.totalCost = summary.cost + summary.staffAllowance;
  summary.gpAmount = summary.revenue - summary.totalCost;
  summary.gpPercentage = summary.revenue > 0 ? (summary.gpAmount / summary.revenue) * 100 : 0;
  
  return summary;
};

// Utility function for syncing data between systems if needed
export const syncTrackerPurchasesToPurchases = async (
  year: number,
  month: number,
  moduleType: ModuleType
) => {
  // Implementation for syncing tracker purchases to purchases table
  // This would need to be implemented based on your application's needs
  console.log(`Syncing tracker purchases for ${moduleType} - ${month}/${year}`);
  return true;
};

export const syncTrackerCreditNotesToCreditNotes = async (
  year: number,
  month: number,
  moduleType: ModuleType
) => {
  // Implementation for syncing tracker credit notes to credit notes table
  // This would need to be implemented based on your application's needs
  console.log(`Syncing tracker credit notes for ${moduleType} - ${month}/${year}`);
  return true;
};

// Legacy compatibility functions if needed
export const fetchPurchases = async (dailyRecordId: string) => {
  // Implement based on your application's needs
  console.log(`Fetching purchases for daily record ${dailyRecordId}`);
  return [];
};

export const fetchDailyRecords = async (weeklyRecordId: string) => {
  // Implement based on your application's needs
  console.log(`Fetching daily records for weekly record ${weeklyRecordId}`);
  return [];
};

// Budget item tracking functions
export const fetchBudgetItemTracking = async (budgetItemId: string) => {
  const { data, error } = await supabase
    .from('budget_item_tracking')
    .select('*')
    .eq('budget_item_id', budgetItemId);
    
  if (error) throw error;
  return data || [];
};

export const upsertBudgetItemTracking = async (tracking: Partial<{
  id?: string;
  budget_item_id: string;
  tracking_type: string;
}>) => {
  const { data, error } = await supabase
    .from('budget_item_tracking')
    .upsert(tracking)
    .select();
    
  if (error) throw error;
  return data;
};

// Function to get budget items that we were missing from previous work
export const fetchBudgetItems = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('year', year)
    .eq('month', month);
    
  if (error) throw error;
  return data;
};

// Function to upsert budget items
export const upsertBudgetItems = async (items: Partial<{
  id?: string;
  year: number;
  month: number;
  category: string;
  name: string;
  budget_amount: number;
  actual_amount?: number | null;
  forecast_amount?: number | null;
  is_header?: boolean;
  is_highlighted?: boolean;
  is_gross_profit?: boolean;
  is_operating_profit?: boolean;
  tracking_type?: string;
}>[]) => {
  const { data, error } = await supabase
    .from('budget_items')
    .upsert(items)
    .select();
    
  if (error) throw error;
  return data;
};
