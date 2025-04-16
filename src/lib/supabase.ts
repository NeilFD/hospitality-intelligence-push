
// Password update function in the Supabase service
export const adminUpdateUserPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    // Log the attempt for debugging
    console.log(`Attempting to update password for user ${userId}`);
    
    if (!password || password.length < 8) {
      console.error('Password must be at least 8 characters');
      return false;
    }
    
    // Call the primary RPC function first
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
