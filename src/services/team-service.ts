
// Update the createWelcomeMessage function to include subject
export const createWelcomeMessage = async (
  message: Pick<WelcomeMessage, 'content' | 'author_id' | 'image_url' | 'subject'>
): Promise<WelcomeMessage> => {
  try {
    const { data, error } = await supabase
      .from('team_welcome_messages')
      .insert({
        content: message.content,
        author_id: message.author_id,
        image_url: message.image_url,
        subject: message.subject  // Now explicitly including subject
      })
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating welcome message:', error);
    throw error;
  }
};

// Update the updateWelcomeMessage function to include subject
export const updateWelcomeMessage = async (
  id: string,
  updates: Partial<WelcomeMessage>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_welcome_messages')
      .update({
        content: updates.content,
        subject: updates.subject,  // Now explicitly including subject
        image_url: updates.image_url
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error details:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating welcome message:', error);
    throw error;
  }
};
