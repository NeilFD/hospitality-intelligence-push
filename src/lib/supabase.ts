
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase-types';
import { UserProfile } from '@/types/supabase-types';

// Create a single supabase client for the entire app
const supabaseUrl = 'https://kfiergoryrnjkewmeriy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWVyZ29yeXJuamtld21lcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDk0NDMsImV4cCI6MjA1OTQyNTQ0M30.FJ2lWSSJBfGy3rUUmIYZwPMd6fFlBTO1xHjZrMwT_wY';

// Configure the Supabase client with proper auth settings
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});

// Add extra logging to troubleshoot connection issues
console.log('Supabase client initialized with URL:', supabaseUrl);

// Authentication helpers
export const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string; role?: string, job_title?: string }) => {
  console.log("Signing up with email and metadata:", email, metadata);
  
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
};

// Update the admin password update function wrapper for better error handling
export const adminUpdateUserPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    // Log the attempt for debugging
    console.log(`Attempting to update password for user ${userId}`);
    
    if (!password || password.length < 8) {
      console.error('Password must be at least 8 characters');
      return false;
    }
    
    // Call the RPC function with explicit type annotation for the response
    const { data, error } = await supabase.rpc<boolean>(
      'admin_update_user_password',
      {
        user_id: userId,
        password: password
      }
    );
    
    if (error) {
      console.error('Error in adminUpdateUserPassword:', error);
      throw error;
    }
    
    // Log the result for debugging
    console.log('Password update result:', data);
    
    // The RPC returns a boolean indicating success
    return data === true;
  } catch (e) {
    console.error('Exception in adminUpdateUserPassword:', e);
    throw e;
  }
};

// Improved checkProfilesCount function with more detailed diagnostics
export const checkProfilesCount = async () => {
  try {
    console.log('Checking profiles count and diagnosing issues...');
    
    // First try a count query
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error counting profiles:', countError);
      throw countError;
    }
    
    console.log('Profile count from count query:', count);
    
    // Check auth session
    const { data: authData } = await supabase.auth.getSession();
    console.log('Current auth session:', authData?.session ? 'Authenticated' : 'Not authenticated');
    
    // Now try fetching all profiles to compare
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) {
      console.error('Error fetching all profiles:', error);
      throw error;
    }
    
    console.log('Profile count from fetch all:', data?.length || 0);
    
    // Check if the database trigger is active
    let triggerStatus = 'Unknown';
    try {
      const { data: triggerData, error: triggerError } = await supabase.rpc('check_trigger_exists', {
        trigger_name: 'on_auth_user_created'
      });
      
      if (triggerError) {
        console.error('Error checking trigger:', triggerError);
        triggerStatus = 'Error checking';
      } else {
        triggerStatus = triggerData ? 'Active' : 'Not found';
      }
    } catch (e) {
      console.error('Exception checking trigger:', e);
      triggerStatus = 'RPC not available';
    }
    
    return {
      countQuery: count,
      fetchedCount: data?.length || 0,
      profiles: data || [],
      isAuthenticated: !!authData?.session,
      authUserId: authData?.session?.user?.id || null,
      triggerStatus
    };
  } catch (e) {
    console.error('Exception in checkProfilesCount:', e);
    return {
      error: e instanceof Error ? e.message : 'Unknown error',
      countQuery: 0,
      fetchedCount: 0,
      profiles: [],
      isAuthenticated: false,
      triggerStatus: 'Error'
    };
  }
};

export const getProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: { first_name?: string; last_name?: string; avatar_url?: string }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
};

// Create a direct signup function without using RPC
export const directSignUp = async (
  email: string, 
  firstName: string, 
  lastName: string, 
  role: string,
  jobTitle: string
) => {
  console.log("Creating user with direct signup:", email, firstName, lastName, role);
  
  try {
    // First check if user with this email exists
    const { data: existingUser, error: checkError } = await supabase
      .rpc('check_and_clean_auth_user', {
        email_val: email,
        should_delete: true
      });
      
    if (checkError) {
      console.error('Error checking existing user:', checkError);
    }
    
    // Create a new user with explicit password in auth.users
    const defaultPassword = 'Hi2025!';
    console.log(`Creating user with email ${email} and default password`);
    
    // Try creating the user with the auth API first
    const { data, error } = await supabase.auth.signUp({
      email,
      password: defaultPassword,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          job_title: jobTitle,
          email: email
        }
      }
    });
    
    if (error) {
      console.error("Error creating user with auth API:", error);
      
      // If that fails, try using the create_profile_with_auth RPC function
      // which directly creates both auth user and profile records
      console.log("Attempting to create user with RPC function instead");
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'create_profile_with_auth',
        {
          first_name_val: firstName,
          last_name_val: lastName,
          role_val: role,
          job_title_val: jobTitle,
          email_val: email
        }
      );
      
      if (rpcError) {
        console.error("Error creating user with RPC:", rpcError);
        throw rpcError;
      }
      
      console.log("User created with RPC:", rpcData);
      
      // Fetch the newly created profile
      if (rpcData) {
        const { data: newProfile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', rpcData)
          .single();
          
        if (profileFetchError) {
          console.error("Error fetching newly created profile:", profileFetchError);
        }
        
        return { user: { id: rpcData }, profile: newProfile };
      }
      
      throw new Error("Failed to create user through both methods");
    }
    
    console.log("User created with auth:", data);
    
    if (!data.user?.id) {
      throw new Error("No user ID returned from signup");
    }
    
    // Create the profile for this user if it doesn't exist yet
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
      
    if (existingProfile) {
      console.log("Profile already exists, returning existing profile");
      return { user: data.user, profile: existingProfile };
    }
    
    // Profile doesn't exist, create it
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        role: role,
        job_title: jobTitle,
        email: email
      })
      .select()
      .single();
      
    if (profileError) {
      console.error("Error creating profile:", profileError);
      
      // Try one more time to fetch the profile in case it was created by a trigger
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (fetchError) {
        throw profileError; // If we can't find an existing profile, throw the original error
      }
      
      return { user: data.user, profile: existingProfile };
    }
    
    return { user: data.user, profile };
  } catch (error) {
    console.error("Error in directSignUp:", error);
    throw error;
  }
};

// New function to synchronize tracker_purchases with purchases table
export const syncTrackerPurchasesToPurchases = async (year: number, month: number, moduleType: 'food' | 'beverage' = 'food') => {
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

// New function to sync credit notes as well
export const syncTrackerCreditNotesToCreditNotes = async (year: number, month: number, moduleType: 'food' | 'beverage' = 'food') => {
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
