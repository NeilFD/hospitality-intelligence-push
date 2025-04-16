
// Supabase client and utility functions
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Import the supabase client from the integrations folder
import { supabase as supabaseClient } from "@/integrations/supabase/client";

// Export the supabase client for use in other files
export const supabase = supabaseClient;

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

// Function to sign up a new user
export const signUp = async (email: string, password: string, metadata: any) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
};

// Function to check the number of profiles
export const checkProfilesCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error checking profiles count:', error);
    return 0;
  }
  
  return count || 0;
};

// Function to create a profile directly
export const directSignUp = async (
  email: string,
  firstName: string,
  lastName: string,
  role: string,
  jobTitle: string
) => {
  try {
    console.log('Creating new profile for:', email);
    
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-10);
    
    // Create the user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          job_title: jobTitle
        }
      }
    });
    
    if (authError) {
      console.error('Error creating auth user:', authError);
      return null;
    }
    
    console.log('Auth user created:', authData.user?.id);
    
    // The profile should be created automatically via a trigger
    // But we'll check and create it manually if needed
    const userId = authData.user?.id;
    
    if (!userId) {
      console.error('No user ID returned from auth signup');
      return null;
    }
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (!existingProfile) {
      console.log('Creating profile manually');
      
      // Create profile manually
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          first_name: firstName,
          last_name: lastName,
          role: role,
          job_title: jobTitle,
          email: email
        }])
        .select()
        .single();
        
      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
      
      return { user: authData.user, profile: profileData };
    }
    
    return { user: authData.user, profile: existingProfile };
  } catch (error) {
    console.error('Unexpected error in directSignUp:', error);
    return null;
  }
};

// Password update function in the Supabase service
export const adminUpdateUserPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    // Log the attempt for debugging
    console.log(`Attempting to update password for user ${userId}`);
    
    if (!password || password.length < 8) {
      console.error('Password must be at least 8 characters');
      return false;
    }
    
    // Call the admin_update_user_password RPC function directly
    const { data, error } = await supabase.rpc(
      'admin_update_user_password',
      {
        user_id: userId,
        password: password
      }
    );
    
    if (error) {
      console.error('Error in primary password update function:', error);
      console.log('Attempting fallback password update function...');
      
      // Try the fallback function
      const { data: fallbackData, error: fallbackError } = await supabase.rpc(
        'update_user_password_fallback',
        {
          user_id: userId,
          password: password
        }
      );
      
      if (fallbackError) {
        console.error('Error in fallback password update function:', fallbackError);
        return false;
      }
      
      console.log('Password update fallback result:', fallbackData);
      return !!fallbackData;
    }
    
    console.log('Password update result:', data);
    return !!data; // Convert to boolean
  } catch (e) {
    console.error('Exception in adminUpdateUserPassword:', e);
    return false;
  }
};
