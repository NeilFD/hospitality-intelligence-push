
import { supabase } from '@/lib/supabase';
import { 
  DbSupplier, 
  DbWeeklyRecord, 
  DbDailyRecord, 
  DbPurchase,
  DbCreditNote,
  DbMonthlySettings,
  DbBudgetItem,
  DbBudgetItemTracking
} from '@/types/supabase-types';
import { ModuleType } from '@/types/kitchen-ledger';

// Suppliers
export const fetchSuppliers = async (moduleType: ModuleType = 'food') => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('module_type', moduleType)
    .order('name');
  
  if (error) throw error;
  return data;
};

export const createSupplier = async (supplier: Omit<DbSupplier, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSupplier = async (params: { id: string, updates: Partial<DbSupplier> }) => {
  const { id, updates } = params;
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
};

// Budget Items
export const fetchBudgetItems = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('year', year)
    .eq('month', month);
  
  if (error) throw error;
  return data;
};

export const createBudgetItem = async (budgetItem: Omit<DbBudgetItem, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('budget_items')
    .insert(budgetItem)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateBudgetItem = async (id: string, updates: Partial<DbBudgetItem>) => {
  const { data, error } = await supabase
    .from('budget_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteBudgetItem = async (id: string) => {
  const { error } = await supabase
    .from('budget_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const deleteBudgetItemsByYearMonth = async (year: number, month: number) => {
  const { error } = await supabase
    .from('budget_items')
    .delete()
    .eq('year', year)
    .eq('month', month);
  
  if (error) throw error;
};

// Budget Item Tracking
export const fetchBudgetItemTracking = async (budgetItemIds: string[]) => {
  const { data, error } = await supabase
    .from('budget_item_tracking')
    .select('*')
    .in('budget_item_id', budgetItemIds);
  
  if (error) throw error;
  return data;
};

export const upsertBudgetItemTracking = async (tracking: Omit<DbBudgetItemTracking, 'id' | 'created_at' | 'updated_at'>[]) => {
  const { data, error } = await supabase
    .from('budget_item_tracking')
    .upsert(tracking, { onConflict: 'budget_item_id' })
    .select();
  
  if (error) throw error;
  return data;
};

// Monthly Settings
export const fetchMonthlySettings = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('monthly_settings')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    // PGRST116 is the error code for no rows returned by the query
    throw error;
  }

  if (!data) {
    // Create default settings if none exist
    return createMonthlySettings({
      year,
      month,
      gp_target: 68.00,
      cost_target: 32.00,
      staff_food_allowance: 0
    });
  }
  
  return data;
};

export const createMonthlySettings = async (settings: Omit<DbMonthlySettings, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
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

// Weekly Records
export const fetchWeeklyRecord = async (year: number, month: number, weekNumber: number) => {
  const { data, error } = await supabase
    .from('weekly_records')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('week_number', weekNumber)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data;
};

export const fetchWeeklyRecordsByMonth = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('weekly_records')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('week_number');
  
  if (error) throw error;
  return data;
};

export const createWeeklyRecord = async (record: Omit<DbWeeklyRecord, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('weekly_records')
    .insert(record)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Daily Records
export const fetchDailyRecords = async (weeklyRecordId: string) => {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('weekly_record_id', weeklyRecordId)
    .order('date');
  
  if (error) throw error;
  return data;
};

export const createDailyRecord = async (record: Omit<DbDailyRecord, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('daily_records')
    .insert(record)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateDailyRecord = async (id: string, updates: Partial<DbDailyRecord>) => {
  const { data, error } = await supabase
    .from('daily_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Purchases
export const fetchPurchases = async (dailyRecordId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('daily_record_id', dailyRecordId);
  
  if (error) throw error;
  return data;
};

export const createPurchase = async (purchase: Omit<DbPurchase, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('purchases')
    .insert(purchase)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updatePurchase = async (id: string, updates: Partial<DbPurchase>) => {
  const { data, error } = await supabase
    .from('purchases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deletePurchase = async (id: string) => {
  const { error } = await supabase
    .from('purchases')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Credit Notes
export const fetchCreditNotes = async (dailyRecordId: string) => {
  const { data, error } = await supabase
    .from('credit_notes')
    .select('*')
    .eq('daily_record_id', dailyRecordId);
  
  if (error) throw error;
  return data;
};

export const createCreditNote = async (creditNote: Omit<DbCreditNote, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('credit_notes')
    .insert(creditNote)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCreditNote = async (id: string, updates: Partial<DbCreditNote>) => {
  const { data, error } = await supabase
    .from('credit_notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteCreditNote = async (id: string) => {
  const { error } = await supabase
    .from('credit_notes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
