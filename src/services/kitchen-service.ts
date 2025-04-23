
import { ModuleType, TrackerSummary } from '@/types/kitchen-ledger';
import { supabase } from '@/lib/supabase';

export const fetchTrackerDataByMonth = async (year: number, month: number, moduleType: ModuleType = 'food') => {
  try {
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

    return data || [];
  } catch (error) {
    console.error(`Error in fetchTrackerDataByMonth for ${year}-${month}:`, error);
    throw error;
  }
};

export const fetchTrackerDataByWeek = async (year: number, month: number, weekNumber: number, moduleType: ModuleType = 'food') => {
  try {
    const { data, error } = await supabase
      .from('tracker_data')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .eq('week_number', weekNumber)
      .eq('module_type', moduleType)
      .order('date');

    if (error) {
      console.error('Error fetching tracker data by week:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchTrackerDataByWeek for ${year}-${month} week ${weekNumber}:`, error);
    throw error;
  }
};

export const fetchTrackerPurchases = async (trackerId: string) => {
  try {
    const { data, error } = await supabase
      .from('tracker_purchases')
      .select('*')
      .eq('tracker_data_id', trackerId);

    if (error) {
      console.error('Error fetching tracker purchases:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchTrackerPurchases for tracker ${trackerId}:`, error);
    throw error;
  }
};

export const fetchTrackerCreditNotes = async (trackerId: string) => {
  try {
    const { data, error } = await supabase
      .from('tracker_credit_notes')
      .select('*')
      .eq('tracker_data_id', trackerId);

    if (error) {
      console.error('Error fetching tracker credit notes:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchTrackerCreditNotes for tracker ${trackerId}:`, error);
    throw error;
  }
};

export const fetchPurchases = async (dailyRecordId: string) => {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('daily_record_id', dailyRecordId);

    if (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchPurchases for daily record ${dailyRecordId}:`, error);
    throw error;
  }
};

export const fetchDailyRecords = async (year: number, month: number, moduleType: ModuleType) => {
  try {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .eq('module_type', moduleType)
      .order('date');

    if (error) {
      console.error('Error fetching daily records:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchDailyRecords for ${year}-${month}:`, error);
    throw error;
  }
};

export const upsertTrackerData = async (trackerData: {
  year: number;
  month: number;
  week_number: number;
  date: string;
  day_of_week: string;
  module_type: ModuleType;
  revenue: number;
  staff_food_allowance: number;
}) => {
  try {
    const { data: existingData, error: fetchError } = await supabase
      .from('tracker_data')
      .select('id')
      .eq('date', trackerData.date)
      .eq('module_type', trackerData.module_type)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing tracker data:', fetchError);
      throw fetchError;
    }

    if (existingData?.id) {
      const { data, error } = await supabase
        .from('tracker_data')
        .update(trackerData)
        .eq('id', existingData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating tracker data:', error);
        throw error;
      }

      return data;
    } else {
      const { data, error } = await supabase
        .from('tracker_data')
        .insert(trackerData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting tracker data:', error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error('Error in upsertTrackerData:', error);
    throw error;
  }
};

export const upsertTrackerPurchase = async (purchase: {
  tracker_data_id: string;
  supplier_id: string;
  amount: number;
}) => {
  try {
    const { data: existingData, error: fetchError } = await supabase
      .from('tracker_purchases')
      .select('id')
      .eq('tracker_data_id', purchase.tracker_data_id)
      .eq('supplier_id', purchase.supplier_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing tracker purchase:', fetchError);
      throw fetchError;
    }

    if (existingData?.id) {
      const { data, error } = await supabase
        .from('tracker_purchases')
        .update({ amount: purchase.amount })
        .eq('id', existingData.id)
        .select();

      if (error) {
        console.error('Error updating tracker purchase:', error);
        throw error;
      }

      return data[0];
    } else {
      const { data, error } = await supabase
        .from('tracker_purchases')
        .insert(purchase)
        .select();

      if (error) {
        console.error('Error inserting tracker purchase:', error);
        throw error;
      }

      return data[0];
    }
  } catch (error) {
    console.error('Error in upsertTrackerPurchase:', error);
    throw error;
  }
};

export const upsertTrackerCreditNote = async (creditNote: {
  tracker_data_id: string;
  credit_index: number;
  amount: number;
}) => {
  try {
    const { data: existingData, error: fetchError } = await supabase
      .from('tracker_credit_notes')
      .select('id')
      .eq('tracker_data_id', creditNote.tracker_data_id)
      .eq('credit_index', creditNote.credit_index)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing tracker credit note:', fetchError);
      throw fetchError;
    }

    if (existingData?.id) {
      const { data, error } = await supabase
        .from('tracker_credit_notes')
        .update({ amount: creditNote.amount })
        .eq('id', existingData.id)
        .select();

      if (error) {
        console.error('Error updating tracker credit note:', error);
        throw error;
      }

      return data[0];
    } else {
      const { data, error } = await supabase
        .from('tracker_credit_notes')
        .insert(creditNote)
        .select();

      if (error) {
        console.error('Error inserting tracker credit note:', error);
        throw error;
      }

      return data[0];
    }
  } catch (error) {
    console.error('Error in upsertTrackerCreditNote:', error);
    throw error;
  }
};

export const fetchSuppliers = async (moduleType: ModuleType = 'food') => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('module_type', moduleType)
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchSuppliers for ${moduleType}:`, error);
    throw error;
  }
};

export const createSupplier = async (supplier: {
  name: string;
  module_type: ModuleType;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createSupplier:', error);
    throw error;
  }
};

export const updateSupplier = async (
  id: string,
  updates: Partial<{
    name: string;
    module_type: ModuleType;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
  }>
) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in updateSupplier for supplier ${id}:`, error);
    throw error;
  }
};

export const deleteSupplier = async (id: string) => {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Error in deleteSupplier for supplier ${id}:`, error);
    throw error;
  }
};

export const fetchMonthlySettings = async (year: number, month: number, moduleType: ModuleType) => {
  try {
    const { data, error } = await supabase
      .from('monthly_settings')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .eq('module_type', moduleType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching monthly settings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in fetchMonthlySettings for ${year}-${month}:`, error);
    throw error;
  }
};

export const createMonthlySettings = async (settings: {
  year: number;
  month: number;
  gp_target: number;
  cost_target: number;
  staff_food_allowance: number;
  module_type: ModuleType;
}) => {
  try {
    const { data, error } = await supabase
      .from('monthly_settings')
      .insert(settings)
      .select()
      .single();

    if (error) {
      console.error('Error creating monthly settings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createMonthlySettings:', error);
    throw error;
  }
};

export const updateMonthlySettings = async (
  id: string,
  updates: Partial<{
    year: number;
    month: number;
    gp_target: number;
    cost_target: number;
    staff_food_allowance: number;
    module_type: ModuleType;
  }>
) => {
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

    return data;
  } catch (error) {
    console.error(`Error in updateMonthlySettings for settings ${id}:`, error);
    throw error;
  }
};

export const fetchBudgetItemTracking = async (budgetItemIds: string[]) => {
  try {
    const { data, error } = await supabase
      .from('budget_item_tracking')
      .select('*')
      .in('budget_item_id', budgetItemIds);

    if (error) {
      console.error('Error fetching budget item tracking:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchBudgetItemTracking:', error);
    throw error;
  }
};

export const upsertBudgetItemTracking = async (trackingData: Array<{
  budget_item_id: string;
  tracking_type: 'Discrete' | 'Pro-Rated';
}>) => {
  try {
    for (const item of trackingData) {
      const { data: existingData, error: fetchError } = await supabase
        .from('budget_item_tracking')
        .select('id')
        .eq('budget_item_id', item.budget_item_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing budget item tracking:', fetchError);
        throw fetchError;
      }

      if (existingData?.id) {
        const { error } = await supabase
          .from('budget_item_tracking')
          .update({ tracking_type: item.tracking_type })
          .eq('id', existingData.id);

        if (error) {
          console.error('Error updating budget item tracking:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('budget_item_tracking')
          .insert(item);

        if (error) {
          console.error('Error inserting budget item tracking:', error);
          throw error;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error in upsertBudgetItemTracking:', error);
    throw error;
  }
};

export const syncTrackerPurchasesToPurchases = async (year: number, month: number, moduleType: ModuleType) => {
  try {
    console.log(`Syncing tracker purchases to purchases for ${year}-${month} (${moduleType})`);
    return true;
  } catch (error) {
    console.error(`Error in syncTrackerPurchasesToPurchases for ${year}-${month}:`, error);
    throw error;
  }
};

export const syncTrackerCreditNotesToCreditNotes = async (year: number, month: number, moduleType: ModuleType) => {
  try {
    console.log(`Syncing tracker credit notes to credit notes for ${year}-${month} (${moduleType})`);
    return true;
  } catch (error) {
    console.error(`Error in syncTrackerCreditNotesToCreditNotes for ${year}-${month}:`, error);
    throw error;
  }
};

export const getMonthlyRevenueSummary = async (year: number, month: number, moduleType: ModuleType = 'food') => {
  try {
    console.log(`Getting monthly revenue summary for ${year}-${month} (${moduleType})`);
    
    // Try to get monthly performance summary from the database
    const { data, error } = await supabase
      .from('monthly_performance_summary')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .single();

    if (error) {
      console.error('Error fetching monthly revenue summary:', error);
      return null;
    }

    console.log(`Monthly performance summary for ${year}-${month}:`, data);
    
    // Return the data with the appropriate revenue field based on module type
    let moduleRevenue = 0;
    if (moduleType === 'food' && data?.total_food_revenue) {
      moduleRevenue = data.total_food_revenue;
    } else if (moduleType === 'beverage' && data?.total_beverage_revenue) {
      moduleRevenue = data.total_beverage_revenue;
    } else if (data?.total_revenue) {
      moduleRevenue = data.total_revenue;
    }
    
    console.log(`Revenue for ${moduleType}: ${moduleRevenue}`);
    
    return {
      ...data,
      moduleRevenue
    };
  } catch (error) {
    console.error(`Error in getMonthlyRevenueSummary for ${year}-${month}:`, error);
    return null;
  }
};

export const getTrackerSummaryByMonth = async (year: number, month: number, moduleType: ModuleType = 'food'): Promise<TrackerSummary> => {
  try {
    let gpTarget = moduleType === 'food' ? 68 : 72;

    try {
      const { data: businessTargets, error } = await supabase
        .from('business_targets')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (businessTargets && !error) {
        if (moduleType === 'food' && businessTargets.food_gp_target) {
          gpTarget = businessTargets.food_gp_target;
        } else if (moduleType === 'beverage' && businessTargets.beverage_gp_target) {
          gpTarget = businessTargets.beverage_gp_target;
        }
      }
    } catch (targetError) {
      console.error('Error fetching business targets:', targetError);
    }

    const trackerData = await fetchTrackerDataByMonth(year, month, moduleType);

    // First try to get the revenue from monthly_performance_summary
    let finalRevenue = 0;
    
    const revenueSummary = await getMonthlyRevenueSummary(year, month, moduleType);
    if (revenueSummary) {
      finalRevenue = revenueSummary.moduleRevenue || 0;
      console.log(`Using monthly_performance_summary revenue for ${year}-${month} (${moduleType}): ${finalRevenue}`);
    }

    let totalRevenue = 0;
    let totalPurchases = 0;
    let totalCreditNotes = 0;
    let totalStaffAllowance = 0;

    const processedDays = new Set();

    for (const day of trackerData) {
      if (processedDays.has(day.date)) {
        console.log(`Skipping duplicate day record for ${day.date}`);
        continue;
      }

      processedDays.add(day.date);

      totalRevenue += Number(day.revenue) || 0;
      totalStaffAllowance += Number(day.staff_food_allowance) || 0;

      const purchases = await fetchTrackerPurchases(day.id);
      const purchasesAmount = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      totalPurchases += purchasesAmount;

      const creditNotes = await fetchTrackerCreditNotes(day.id);
      const creditNotesAmount = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
      totalCreditNotes += creditNotesAmount;

      console.log(`Day ${day.date}: Revenue=${day.revenue}, Purchases=${purchasesAmount}, CreditNotes=${creditNotesAmount}, StaffFood=${day.staff_food_allowance}`);
    }

    // Prioritize using the revenue from monthly_performance_summary
    if (finalRevenue > 0) {
      console.log(`Using monthly summary revenue: ${finalRevenue} instead of tracker revenue: ${totalRevenue}`);
      totalRevenue = finalRevenue;
    }

    const totalCost = totalPurchases - totalCreditNotes + totalStaffAllowance;
    const gpAmount = totalRevenue - totalCost;

    let gpPercentage = totalRevenue > 0 ? (gpAmount / totalRevenue) * 100 : gpTarget;

    console.log(`Month summary for ${year}-${month} (${moduleType}): Revenue=${totalRevenue}, Purchases=${totalPurchases}, CreditNotes=${totalCreditNotes}, StaffFood=${totalStaffAllowance}, TotalCost=${totalCost}, GP=${gpPercentage}%`);

    return {
      year,
      month,
      moduleType,
      revenue: totalRevenue,
      cost: totalCost,
      purchases: totalPurchases,
      creditNotes: totalCreditNotes,
      staffAllowance: totalStaffAllowance,
      totalCost,
      gpAmount,
      gpPercentage
    };
  } catch (error) {
    console.error(`Error getting tracker summary for ${year}-${month}:`, error);
    throw error;
  }
};
