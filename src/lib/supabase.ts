
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
