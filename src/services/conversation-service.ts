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

// Send webhook request to n8n
export const sendWebhookRequest = async (webhookUrl: string, payload: any): Promise<any> => {
  try {
    console.log(`Sending payload to webhook URL: ${webhookUrl}`);
    
    // Store the conversation attempt in Supabase
    const { data: user } = await supabase.auth.getUser();
    let conversationId = null;
    
    if (user && user.user) {
      const { data, error } = await supabase.from('ai_conversations').insert({
        user_id: user.user.id,
        query: payload.query || `Webhook request to ${webhookUrl}`,
        response: "Waiting for response...",
        payload: payload,
        timestamp: new Date().toISOString(),
        shared: false
      }).select();
      
      if (error) {
        console.error('Error storing conversation:', error);
      } else if (data && data.length > 0) {
        conversationId = data[0].id;
      }
    }
    
    // Use no-cors mode to avoid CORS preflight issues
    // This is a workaround for situations where the server doesn't support CORS properly
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors', // Use no-cors mode to bypass CORS issues
      body: JSON.stringify(payload)
    });
    
    // When using no-cors, we won't get a proper response object we can work with
    // So we need to handle this case specially
    let responseData;
    
    // With no-cors mode, we can't actually read the response, so we'll create a placeholder
    responseData = {
      success: true, // Assume success since we can't determine otherwise
      message: "Webhook triggered. Check n8n for execution results.",
      status: "unknown"
    };
    
    // Update the conversation with a user-friendly message
    if (conversationId) {
      await supabase
        .from('ai_conversations')
        .update({ 
          response: "Webhook request sent to n8n. Please check your n8n dashboard for execution results." 
        })
        .eq('id', conversationId);
    }
    
    return {
      success: true,
      data: responseData,
      status: 'sent'
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
