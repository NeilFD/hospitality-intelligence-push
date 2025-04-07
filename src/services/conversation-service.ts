
import { supabase } from '@/lib/supabase';

export interface Conversation {
  id: string;
  user_id: string;
  query: string;
  response: string;
  timestamp: string;
  payload: any;
  shared: boolean;
  created_at: string;
  updated_at: string;
}

// Get conversations for the current user
export const getUserConversations = async (): Promise<Conversation[]> => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user || !user.user) {
    console.error('No authenticated user found');
    return [];
  }
  
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', user.user.id)
    .order('timestamp', { ascending: false });
    
  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
  
  return data || [];
};

// Get a specific conversation by ID
export const getConversationById = async (id: string): Promise<Conversation> => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error(`Error fetching conversation with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

// Update the shared status of a conversation
export const updateConversationSharedStatus = async (id: string, shared: boolean): Promise<void> => {
  const { error } = await supabase
    .from('ai_conversations')
    .update({ shared })
    .eq('id', id);
    
  if (error) {
    console.error(`Error updating shared status for conversation ${id}:`, error);
    throw error;
  }
};

// Delete a conversation
export const deleteConversation = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error(`Error deleting conversation ${id}:`, error);
    throw error;
  }
};

// Send webhook request (will be used for debugging)
export const sendWebhookRequest = async (webhookUrl: string, payload: any): Promise<any> => {
  try {
    // In a production environment, this would be handled by a server-side proxy
    // For the demo, we'll simulate a response
    console.log(`[DEBUG] Would send payload to ${webhookUrl}:`, payload);
    
    // Store the test webhook attempt
    const { data: user } = await supabase.auth.getUser();
    
    if (user && user.user) {
      await supabase.from('ai_conversations').insert({
        user_id: user.user.id,
        query: `Test webhook to ${webhookUrl}`,
        response: "Webhook test completed",
        payload: payload,
        timestamp: new Date().toISOString(),
        shared: false
      });
    }
    
    // Return a simulated successful response
    return {
      success: true,
      message: "Webhook test completed successfully (simulated in demo)",
      data: {
        processed: true,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error sending webhook request:', error);
    return {
      success: false,
      message: "Error sending webhook request",
      error: String(error)
    };
  }
};

