import { supabase } from '@/lib/supabase';
import { 
  DbSupplier, 
  DbWeeklyRecord, 
  DbDailyRecord, 
  DbPurchase,
  DbCreditNote,
  DbMonthlySettings,
  DbBudgetItem,
  DbBudgetItemTracking,
  DbTrackerData,
  DbTrackerPurchase,
  DbTrackerCreditNote
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
export const fetchMonthlySettings = async (year: number, month: number, moduleType: ModuleType = 'food') => {
  const { data, error } = await supabase
    .from('monthly_settings')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('module_type', moduleType)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    return createMonthlySettings({
      year,
      month,
      gp_target: 68.00,
      cost_target: 32.00,
      staff_food_allowance: 0,
      module_type: moduleType
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

// Tracker Data
export const fetchTrackerDataByWeek = async (year: number, month: number, weekNumber: number, moduleType: ModuleType = 'food') => {
  const { data, error } = await supabase
    .from('tracker_data')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('week_number', weekNumber)
    .eq('module_type', moduleType)
    .order('date');
  
  if (error) throw error;
  return data;
};

export const fetchTrackerDataByMonth = async (year: number, month: number, moduleType: ModuleType = 'food') => {
  console.log(`Fetching tracker data for ${year}-${month} (${moduleType})`);
  
  const { data, error } = await supabase
    .from('tracker_data')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('module_type', moduleType)
    .order('date');
  
  if (error) {
    console.error('Error fetching tracker data:', error);
    throw error;
  }
  
  console.log(`Found ${data.length} records for ${year}-${month}`);
  data.forEach(record => {
    console.log(`Date: ${record.date}, Week: ${record.week_number}, Revenue: ${record.revenue}`);
  });
  
  return data;
};

export const upsertTrackerData = async (trackerData: Omit<DbTrackerData, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('tracker_data')
    .upsert(trackerData, { 
      onConflict: 'year,month,week_number,date,module_type',
      ignoreDuplicates: false 
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Tracker Purchases
export const fetchTrackerPurchases = async (trackerDataId: string) => {
  const { data, error } = await supabase
    .from('tracker_purchases')
    .select('*')
    .eq('tracker_data_id', trackerDataId);
  
  if (error) throw error;
  return data;
};

export const upsertTrackerPurchase = async (purchase: Omit<DbTrackerPurchase, 'id' | 'created_at' | 'updated_at'>) => {
  const { data: existingPurchase, error: fetchError } = await supabase
    .from('tracker_purchases')
    .select('id')
    .eq('tracker_data_id', purchase.tracker_data_id)
    .eq('supplier_id', purchase.supplier_id)
    .maybeSingle();
  
  if (fetchError) throw fetchError;
  
  if (existingPurchase) {
    const { data, error } = await supabase
      .from('tracker_purchases')
      .update({ amount: purchase.amount })
      .eq('id', existingPurchase.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('tracker_purchases')
      .insert(purchase)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Tracker Credit Notes
export const fetchTrackerCreditNotes = async (trackerDataId: string) => {
  const { data, error } = await supabase
    .from('tracker_credit_notes')
    .select('*')
    .eq('tracker_data_id', trackerDataId);
  
  if (error) throw error;
  return data;
};

export const upsertTrackerCreditNote = async (creditNote: Omit<DbTrackerCreditNote, 'id' | 'created_at' | 'updated_at'>) => {
  const { data: existingCreditNote, error: fetchError } = await supabase
    .from('tracker_credit_notes')
    .select('id')
    .eq('tracker_data_id', creditNote.tracker_data_id)
    .eq('credit_index', creditNote.credit_index)
    .maybeSingle();
  
  if (fetchError) throw fetchError;
  
  if (existingCreditNote) {
    const { data, error } = await supabase
      .from('tracker_credit_notes')
      .update({ amount: creditNote.amount })
      .eq('id', existingCreditNote.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('tracker_credit_notes')
      .insert(creditNote)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// New function to get summarized data for a tracker by month
export const getTrackerSummaryByMonth = async (
  year: number,
  month: number,
  moduleType: 'food' | 'beverage'
): Promise<{
  revenue: number;
  cost: number;
  gpPercentage: number;
}> => {
  try {
    // Fetch tracker data for the month
    const trackerData = await fetchTrackerDataByMonth(year, month, moduleType);
    
    console.log(`Processing ${trackerData.length} tracker records for summary calculation`);
    
    let totalRevenue = 0;
    let totalCost = 0;
    
    // Process each day in the tracker
    for (const day of trackerData) {
      // Add revenue - ensure we're using the correct numeric value
      const dayRevenue = Number(day.revenue) || 0;
      totalRevenue += dayRevenue;
      
      // Fetch purchases for this day
      const purchases = await fetchTrackerPurchases(day.id);
      const creditNotes = await fetchTrackerCreditNotes(day.id);
      
      const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const creditNotesTotal = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
      const staffFoodAllowance = Number(day.staff_food_allowance) || 0;
      
      const dayCost = purchasesTotal - creditNotesTotal + staffFoodAllowance;
      totalCost += dayCost;
      
      console.log(`Day ${day.date}: Revenue=${dayRevenue}, Purchases=${purchasesTotal}, Credits=${creditNotesTotal}, Cost=${dayCost}`);
    }
    
    // Calculate GP percentage
    let gpPercentage = 0;
    if (totalRevenue > 0) {
      gpPercentage = (totalRevenue - totalCost) / totalRevenue;
    }
    
    console.log(`Month summary for ${moduleType}: Revenue=${totalRevenue}, Cost=${totalCost}, GP%=${gpPercentage}`);
    
    return {
      revenue: totalRevenue,
      cost: totalCost,
      gpPercentage
    };
  } catch (error) {
    console.error(`Error fetching ${moduleType} tracker summary:`, error);
    return {
      revenue: 0,
      cost: 0,
      gpPercentage: 0
    };
  }
};
