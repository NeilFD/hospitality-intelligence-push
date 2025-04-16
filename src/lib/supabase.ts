
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const SUPABASE_URL = "https://kfiergoryrnjkewmeriy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWVyZ29yeXJuamtld21lcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDk0NDMsImV4cCI6MjA1OTQyNTQ0M30.FJ2lWSSJBfGy3rUUmIYZwPMd6fFlBTO1xHjZrMwT_wY";

// Export the supabase client to be used across the application
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get the current user
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

// Add the signUp function for RegisterForm
export const signUp = async (email: string, password: string, metadata: any = {}) => {
  try {
    console.log("Signing up user with email:", email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    return { data, error };
  } catch (err) {
    console.error("Error during sign up:", err);
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error during signup') };
  }
};

// Add the checkProfilesCount function for TeamManagementPanel
export const checkProfilesCount = async () => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (error) throw error;
    
    return count || 0;
  } catch (err) {
    console.error("Error checking profiles count:", err);
    return 0;
  }
};

// Add the directSignUp function for TeamManagementPanel
export const directSignUp = async (
  email: string,
  firstName: string,
  lastName: string,
  role: string = 'Team Member',
  jobTitle: string = ''
) => {
  try {
    console.log(`Creating profile for ${email} with role ${role}`);
    
    // Generate a random password (that will need to be reset)
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role,
        job_title: jobTitle,
        email: email
      }
    });
    
    if (authError) {
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error('Failed to create user');
    }
    
    console.log("User created successfully:", authData.user.id);
    
    // Now wait a moment to ensure the trigger has time to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if the profile was created by the trigger
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
    }
    
    if (!profileData) {
      console.log('Profile not created by trigger, creating manually...');
      
      // If not, create it manually
      const { data: manualProfile, error: manualError } = await supabase.rpc('create_profile_for_user', {
        user_id: authData.user.id,
        first_name_val: firstName,
        last_name_val: lastName,
        role_val: role,
        job_title_val: jobTitle,
        email_val: email
      });
      
      if (manualError) {
        console.error('Error creating profile manually:', manualError);
        // We still return the user since they can log in
      }
    }
    
    return {
      user: authData.user,
      profile: profileData || null
    };
    
  } catch (err) {
    console.error("Error in directSignUp:", err);
    throw err;
  }
};

// Fixed adminUpdateUserPassword function to ensure it correctly updates the password
export const adminUpdateUserPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    console.log(`Attempting to update password for user ${userId}`);
    
    if (!password || password.length < 8) {
      console.error('Password must be at least 8 characters');
      return false;
    }
    
    // Directly update the password in auth.users using the PostgreSQL function
    // This approach bypasses any middleware and ensures the password is properly hashed
    const { data, error } = await supabase.rpc('extremely_basic_password_update', {
      user_id_input: userId,
      password_input: password
    });
    
    if (error) {
      console.error('Error updating password:', error);
      return false;
    }
    
    // Log the result for debugging
    console.log('Password update response:', data);
    
    // Update the timestamp in profiles to indicate password was updated
    await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    console.log('Password updated successfully in auth.users table');
    return data === true;
    
  } catch (e) {
    console.error('Exception in adminUpdateUserPassword:', e);
    return false;
  }
};
