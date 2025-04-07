
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
        response: "Processing request...",
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
    
    // Send the request to n8n with proper headers
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify(payload)
    });
    
    // Process the response properly
    let responseData;
    let statusCode = response.status;
    
    try {
      // Try to parse JSON response if available
      const textResponse = await response.text();
      responseData = textResponse ? JSON.parse(textResponse) : { message: "No content returned" };
    } catch (parseError) {
      console.log('Response is not JSON, using raw response');
      responseData = { 
        message: "Received non-JSON response from webhook", 
        status: statusCode
      };
    }
    
    // Format a meaningful response message
    const responseMessage = responseData?.response || 
                           responseData?.message || 
                           responseData?.content ||
                           `Request processed with status: ${statusCode}`;
    
    // Update the stored conversation with the actual response
    if (conversationId) {
      await supabase
        .from('ai_conversations')
        .update({ response: responseMessage })
        .eq('id', conversationId);
    }
    
    return {
      success: statusCode >= 200 && statusCode < 300,
      data: responseData,
      status: statusCode,
      message: responseMessage
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
