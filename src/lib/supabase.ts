
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser as getUser } from '@/services/auth-service';

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

// Update the adminUpdateUserPassword function to use the new extremely_basic_password_update function
export const adminUpdateUserPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    console.log(`Attempting to update password for user ${userId}`);
    
    if (!password || password.length < 8) {
      console.error('Password must be at least 8 characters');
      return false;
    }
    
    // Use the new extremely_basic_password_update function
    const { data, error } = await supabase.rpc('extremely_basic_password_update', {
      user_id_input: userId,
      password_input: password
    });
    
    if (error) {
      console.error('Error updating password:', error);
      return false;
    }
    
    console.log('Password updated successfully');
    return data === true;
    
  } catch (e) {
    console.error('Exception in adminUpdateUserPassword:', e);
    return false;
  }
};
