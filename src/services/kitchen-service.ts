import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ModuleType, TrackerSummary } from '@/types/kitchen-ledger';

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

// Tracker Functions
export const fetchTrackerDataByMonth = async (year: number, month: number, moduleType: ModuleType = 'food') => {
  try {
    const { data, error } = await supabase
      .from('tracker_data')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .eq('module_type', moduleType)
      .order('date');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching tracker data for ${year}-${month}:`, error);
    return [];
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
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching tracker data for week ${weekNumber} in ${year}-${month}:`, error);
    return [];
  }
};

export const upsertTrackerData = async (trackerData: any) => {
  try {
    const { data, error } = await supabase
      .from('tracker_data')
      .upsert(trackerData, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting tracker data:', error);
    throw error;
  }
};

export const fetchTrackerPurchases = async (trackerDataId: string) => {
  try {
    const { data, error } = await supabase
      .from('tracker_purchases')
      .select('*, suppliers:supplier_id(*)')
      .eq('tracker_data_id', trackerDataId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching purchases for tracker ${trackerDataId}:`, error);
    return [];
  }
};

export const upsertTrackerPurchase = async (purchaseData: any) => {
  try {
    const { data, error } = await supabase
      .from('tracker_purchases')
      .upsert(purchaseData, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting tracker purchase:', error);
    throw error;
  }
};

export const fetchTrackerCreditNotes = async (trackerDataId: string) => {
  try {
    const { data, error } = await supabase
      .from('tracker_credit_notes')
      .select('*')
      .eq('tracker_data_id', trackerDataId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching credit notes for tracker ${trackerDataId}:`, error);
    return [];
  }
};

export const upsertTrackerCreditNote = async (creditNoteData: any) => {
  try {
    const { data, error } = await supabase
      .from('tracker_credit_notes')
      .upsert(creditNoteData, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting tracker credit note:', error);
    throw error;
  }
};

export const getTrackerSummaryByMonth = async (year: number, month: number, moduleType: ModuleType = 'food'): Promise<TrackerSummary> => {
  try {
    const trackerData = await fetchTrackerDataByMonth(year, month, moduleType);
    
    let totalRevenue = 0;
    let totalPurchases = 0;
    let totalCreditNotes = 0;
    let totalStaffAllowance = 0;
    
    for (const day of trackerData) {
      totalRevenue += Number(day.revenue) || 0;
      totalStaffAllowance += Number(day.staff_food_allowance) || 0;
      
      const purchases = await fetchTrackerPurchases(day.id);
      const purchasesAmount = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      totalPurchases += purchasesAmount;
      
      const creditNotes = await fetchTrackerCreditNotes(day.id);
      const creditNotesAmount = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
      totalCreditNotes += creditNotesAmount;
    }
    
    const totalCost = totalPurchases - totalCreditNotes + totalStaffAllowance;
    const gpAmount = totalRevenue - totalCost;
    const gpPercentage = totalRevenue > 0 ? (gpAmount / totalRevenue) * 100 : 0;
    
    return {
      year,
      month,
      moduleType,
      revenue: totalRevenue,
      cost: totalCost,
      purchases: totalPurchases,
      creditNotes: totalCreditNotes,
      staffAllowance: totalStaffAllowance,
      totalCost: totalCost,
      gpAmount,
      gpPercentage
    };
  } catch (error) {
    console.error(`Error getting tracker summary for ${year}-${month}:`, error);
    throw error;
  }
};

export const fetchPurchases = async (dailyRecordId: string) => {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, suppliers(*)')
      .eq('daily_record_id', dailyRecordId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching purchases for daily record ${dailyRecordId}:`, error);
    return [];
  }
};

export const fetchDailyRecords = async (weeklyRecordId: string) => {
  try {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('weekly_record_id', weeklyRecordId)
      .order('date');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching daily records for weekly record ${weeklyRecordId}:`, error);
    return [];
  }
};

// Sync functions (moved from supabase.ts)
export const syncTrackerPurchasesToPurchases = async (year: number, month: number, moduleType: ModuleType = 'food') => {
  console.log(`Synchronizing ${moduleType} tracker purchases for ${year}-${month} to purchases table...`);
  
  try {
    // Step 1: Get all tracker data for the specified month and year
    const { data: trackerData, error: trackerError } = await supabase
      .from('tracker_data')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .eq('module_type', moduleType);
    
    if (trackerError) {
      console.error('Error fetching tracker data:', trackerError);
      throw trackerError;
    }
    
    console.log(`Found ${trackerData?.length || 0} tracker data entries`);
    
    // Step 2: For each tracker data entry, get the related purchases
    for (const tracker of trackerData || []) {
      // Get daily record for this date (create if doesn't exist)
      let dailyRecordId = '';
      
      // First check if a daily record already exists for this date
      const { data: existingDailyRecords, error: dailyRecordError } = await supabase
        .from('daily_records')
        .select('id')
        .eq('date', tracker.date)
        .eq('module_type', moduleType)
        .maybeSingle();
      
      if (dailyRecordError) {
        console.error('Error checking for existing daily record:', dailyRecordError);
        continue;
      }
      
      if (existingDailyRecords) {
        dailyRecordId = existingDailyRecords.id;
        console.log(`Found existing daily record for ${tracker.date}: ${dailyRecordId}`);
      } else {
        // Find the weekly record for this date
        const { data: weeklyRecord, error: weeklyError } = await supabase
          .from('weekly_records')
          .select('id')
          .eq('year', year)
          .eq('month', month)
          .eq('week_number', tracker.week_number)
          .eq('module_type', moduleType)
          .maybeSingle();
          
        if (weeklyError) {
          console.error('Error finding weekly record:', weeklyError);
          continue;
        }
        
        let weeklyRecordId = '';
        
        if (weeklyRecord) {
          weeklyRecordId = weeklyRecord.id;
        } else {
          // Create weekly record if it doesn't exist
          const weekStart = new Date(tracker.date);
          const weekEnd = new Date(tracker.date);
          weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay())); // Set to end of week
          
          const { data: newWeeklyRecord, error: newWeeklyError } = await supabase
            .from('weekly_records')
            .insert({
              year: year,
              month: month,
              week_number: tracker.week_number,
              start_date: tracker.date,
              end_date: weekEnd.toISOString().split('T')[0],
              module_type: moduleType
            })
            .select()
            .single();
          
          if (newWeeklyError) {
            console.error('Error creating weekly record:', newWeeklyError);
            continue;
          }
          
          weeklyRecordId = newWeeklyRecord.id;
          console.log(`Created new weekly record for ${tracker.date}: ${weeklyRecordId}`);
        }
        
        // Create daily record
        const { data: newDailyRecord, error: newDailyError } = await supabase
          .from('daily_records')
          .insert({
            date: tracker.date,
            day_of_week: tracker.day_of_week,
            weekly_record_id: weeklyRecordId,
            revenue: tracker.revenue || 0,
            staff_food_allowance: tracker.staff_food_allowance || 0,
            module_type: moduleType
          })
          .select()
          .single();
          
        if (newDailyError) {
          console.error('Error creating daily record:', newDailyError);
          continue;
        }
        
        dailyRecordId = newDailyRecord.id;
        console.log(`Created new daily record for ${tracker.date}: ${dailyRecordId}`);
      }
      
      // Step 3: Get tracker purchases for this tracker data entry
      const { data: trackerPurchases, error: purchasesError } = await supabase
        .from('tracker_purchases')
        .select('*, suppliers:supplier_id(*)')
        .eq('tracker_data_id', tracker.id);
        
      if (purchasesError) {
        console.error(`Error fetching purchases for tracker ${tracker.id}:`, purchasesError);
        continue;
      }
      
      console.log(`Processing ${trackerPurchases?.length || 0} purchases for ${tracker.date}`);
      
      // Step 4: For each purchase, sync with the purchases table
      for (const purchase of trackerPurchases || []) {
        // Check if purchase already exists in purchases table
        const { data: existingPurchase, error: existingError } = await supabase
          .from('purchases')
          .select('id')
          .eq('daily_record_id', dailyRecordId)
          .eq('supplier_id', purchase.supplier_id)
          .maybeSingle();
          
        if (existingError) {
          console.error('Error checking for existing purchase:', existingError);
          continue;
        }
        
        if (existingPurchase) {
          // Update existing purchase
          const { error: updateError } = await supabase
            .from('purchases')
            .update({ amount: purchase.amount })
            .eq('id', existingPurchase.id);
            
          if (updateError) {
            console.error(`Error updating purchase ${existingPurchase.id}:`, updateError);
          } else {
            console.log(`Updated purchase ${existingPurchase.id} with amount ${purchase.amount}`);
          }
        } else {
          // Create new purchase
          const { error: insertError } = await supabase
            .from('purchases')
            .insert({
              daily_record_id: dailyRecordId,
              supplier_id: purchase.supplier_id,
              amount: purchase.amount,
              module_type: moduleType
            });
            
          if (insertError) {
            console.error('Error creating purchase:', insertError);
          } else {
            console.log(`Created purchase for ${purchase.supplier_id} with amount ${purchase.amount}`);
          }
        }
      }
    }
    
    console.log(`Completed synchronization for ${moduleType} tracker purchases for ${year}-${month}`);
    return { success: true };
  } catch (error) {
    console.error('Error in syncTrackerPurchasesToPurchases:', error);
    return { success: false, error };
  }
};

export const syncTrackerCreditNotesToCreditNotes = async (year: number, month: number, moduleType: ModuleType = 'food') => {
  console.log(`Synchronizing ${moduleType} tracker credit notes for ${year}-${month}...`);
  
  try {
    // Similar pattern to the purchases sync function, but for credit notes
    const { data: trackerData, error: trackerError } = await supabase
      .from('tracker_data')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .eq('module_type', moduleType);
    
    if (trackerError) {
      console.error('Error fetching tracker data:', trackerError);
      throw trackerError;
    }
    
    for (const tracker of trackerData || []) {
      // Find or create daily record similar to above function
      // (Same logic as syncTrackerPurchasesToPurchases)
      let dailyRecordId = '';
      
      const { data: existingDailyRecords } = await supabase
        .from('daily_records')
        .select('id')
        .eq('date', tracker.date)
        .eq('module_type', moduleType)
        .maybeSingle();
      
      if (existingDailyRecords) {
        dailyRecordId = existingDailyRecords.id;
      } else {
        // Skip if can't find daily record (should be created by the purchases sync)
        console.log(`No daily record found for ${tracker.date}, skipping credit notes sync`);
        continue;
      }
      
      // Get tracker credit notes
      const { data: trackerCreditNotes, error: creditNotesError } = await supabase
        .from('tracker_credit_notes')
        .select('*')
        .eq('tracker_data_id', tracker.id);
        
      if (creditNotesError) {
        console.error(`Error fetching credit notes for tracker ${tracker.id}:`, creditNotesError);
        continue;
      }
      
      console.log(`Processing ${trackerCreditNotes?.length || 0} credit notes for ${tracker.date}`);
      
      // Delete existing credit notes for this daily record to avoid duplicates
      // (Credit notes don't have a natural identifying key like purchases do with supplier_id)
      const { error: deleteError } = await supabase
        .from('credit_notes')
        .delete()
        .eq('daily_record_id', dailyRecordId);
        
      if (deleteError) {
        console.error(`Error deleting existing credit notes for daily record ${dailyRecordId}:`, deleteError);
        continue;
      }
      
      // Create new credit notes
      for (const creditNote of trackerCreditNotes || []) {
        const { error: insertError } = await supabase
          .from('credit_notes')
          .insert({
            daily_record_id: dailyRecordId,
            amount: creditNote.amount,
            description: `Credit note ${creditNote.credit_index + 1}`,
            module_type: moduleType
          });
          
        if (insertError) {
          console.error('Error creating credit note:', insertError);
        } else {
          console.log(`Created credit note with amount ${creditNote.amount}`);
        }
      }
    }
    
    console.log(`Completed synchronization for ${moduleType} tracker credit notes for ${year}-${month}`);
    return { success: true };
  } catch (error) {
    console.error('Error in syncTrackerCreditNotesToCreditNotes:', error);
    return { success: false, error };
  }
};

// Budget Item Tracking Functions
export const fetchBudgetItemTracking = async (budgetItemIds: string[]) => {
  try {
    const { data, error } = await supabase
      .from('budget_item_tracking')
      .select('*')
      .in('budget_item_id', budgetItemIds);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching budget item tracking:', error);
    return [];
  }
};

export const upsertBudgetItemTracking = async (trackingData: any[]) => {
  try {
    const { data, error } = await supabase
      .from('budget_item_tracking')
      .upsert(trackingData, { onConflict: 'budget_item_id' });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting budget item tracking:', error);
    throw error;
  }
};
