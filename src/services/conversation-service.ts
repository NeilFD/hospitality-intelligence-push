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
    
    // Send the request to n8n with comprehensive error handling
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Comprehensive response parsing
    let responseData;
    let statusCode = response.status;
    
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      
      // Fallback to text if JSON parsing fails
      try {
        const textResponse = await response.text();
        responseData = { 
          message: textResponse || "Non-JSON response received",
          status: statusCode
        };
      } catch (textError) {
        console.error('Error reading response text:', textError);
        responseData = { 
          message: "Failed to read response",
          status: statusCode
        };
      }
    }
    
    // Update conversation with response
    if (conversationId) {
      await supabase
        .from('ai_conversations')
        .update({ 
          response: JSON.stringify(responseData),
          payload: {
            ...payload,
            responseStatus: statusCode
          }
        })
        .eq('id', conversationId);
    }
    
    return {
      success: statusCode >= 200 && statusCode < 300,
      data: responseData,
      status: statusCode,
      message: responseData?.message || `Request processed with status: ${statusCode}`
    };
  } catch (error) {
    console.error('Webhook request failed:', error);
    return {
      success: false,
      message: "Webhook request failed",
      error: String(error)
    };
  }
};
