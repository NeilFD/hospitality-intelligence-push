import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const SUPABASE_URL = "https://kfiergoryrnjkewmeriy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWVyZ29yeXJuamtld21lcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDk0NDMsImV4cCI6MjA1OTQyNTQ0M30.FJ2lWSSJBfGy3rUUmIYZwPMd6fFlBTO1xHjZrMwT_wY";

// Export the supabase client to be used across the application
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the Supabase URL so it can be used in other parts of the application
export { SUPABASE_URL };

// Helper function to ensure storage buckets exist
export const ensureStorageBuckets = async () => {
  try {
    // Check if the profiles bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Check for team_files bucket
    const teamFilesBucketExists = buckets?.some(bucket => bucket.name === 'team_files');
    
    if (!teamFilesBucketExists) {
      console.log('Creating team_files storage bucket...');
      try {
        // Create the team_files bucket with explicit public access
        const { error } = await supabase.storage.createBucket('team_files', {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        });
        
        if (error) {
          console.error('Error creating team_files bucket:', error);
        } else {
          console.log('Team files bucket created successfully');
          
          // Set public bucket policy if bucket was created successfully
          try {
            const { error: policyError } = await supabase.storage.from('team_files')
              .createSignedUrl('test.txt', 60);
              
            if (policyError && policyError.message.includes('The resource was not found')) {
              console.log('Bucket appears to be working, signed URLs available');
            }
          } catch (policyErr) {
            console.log('Policy check error:', policyErr);
          }
        }
      } catch (bucketErr) {
        console.error('Error in bucket creation process:', bucketErr);
      }
    } else {
      console.log('Team files bucket already exists');
    }
  } catch (error) {
    console.error('Error checking/creating storage buckets:', error);
  }
};

// Call this function on app initialization - moved earlier in the file
// for more predictable initialization
ensureStorageBuckets();

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
        data: metadata,
        emailRedirectTo: `${window.location.origin}/login`
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
    console.log(`Creating user for ${email} with role ${role}`);
    
    // Use the new create_auth_user_and_profile function
    const { data: userId, error: createError } = await supabase.rpc('create_auth_user_and_profile', {
      first_name_val: firstName,
      last_name_val: lastName,
      role_val: role,
      job_title_val: jobTitle,
      email_val: email
    });
    
    if (createError) {
      console.error('Error creating user with RPC:', createError);
      throw createError;
    }
    
    if (!userId) {
      throw new Error('No user ID returned from user creation');
    }
    
    console.log("User created successfully with new RPC function, ID:", userId);
    
    // Wait a moment to ensure database consistency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch the newly created profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching new profile:', profileError);
      // Still return the user ID since the user was created
    }
    
    return {
      user: { id: userId },
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
    
    // First, try to clean up any potential plaintext password in the profiles table
    // This is just to fix any previous bad data
    try {
      await supabase
        .from('profiles')
        .update({ 
          password_hash: null,  // Set to null to remove any plaintext password
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
        
      console.log('Cleaned up profiles table password data');
    } catch (cleanupErr) {
      // Just log, don't fail the whole operation
      console.log('Note: Error during profiles cleanup:', cleanupErr);
    }
    
    // Now use the RPC function to update the password in auth.users
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
    
    return data === true;
    
  } catch (e) {
    console.error('Exception in adminUpdateUserPassword:', e);
    return false;
  }
};

// Check if an invitation token is valid
export const checkInvitationToken = async (token: string) => {
  try {
    console.log("Checking invitation token:", token);
    
    const { data, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single();
      
    if (error) {
      console.error('Error checking invitation token:', error);
      return null;
    }
    
    // Check if the invitation has expired
    if (data && new Date(data.expires_at) < new Date()) {
      console.error('Invitation token has expired');
      return null;
    }
    
    console.log("Invitation token data:", data);
    return data;
  } catch (err) {
    console.error('Exception checking invitation token:', err);
    return null;
  }
};

// New function to check if a column exists in Supabase
export const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('check_column_exists', { 
        p_table_name: tableName, 
        p_column_name: columnName 
      });
    
    if (error) {
      console.error('Error checking column existence:', error);
      return false;
    }
    
    return data || false;
  } catch (e) {
    console.error('Exception checking column existence:', e);
    return false;
  }
};
