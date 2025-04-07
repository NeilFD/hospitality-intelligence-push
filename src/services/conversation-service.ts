
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

// Send webhook request to n8n with enhanced debugging
export const sendWebhookRequest = async (webhookUrl: string, payload: any): Promise<any> => {
  try {
    console.log(`Sending payload to webhook URL: ${webhookUrl}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
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
        console.log(`Created conversation with ID: ${conversationId}`);
      }
    }
    
    // Update conversation with attempt status
    if (conversationId) {
      await supabase
        .from('ai_conversations')
        .update({ 
          response: "Sending request to webhook...",
        })
        .eq('id', conversationId);
    }
    
    // Send the request to n8n with enhanced error handling
    console.log('Sending fetch request to:', webhookUrl);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    // Comprehensive response parsing
    let responseData;
    let statusCode = response.status;
    let responseText = '';
    
    try {
      responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      try {
        responseData = JSON.parse(responseText);
        console.log('Parsed JSON response:', responseData);
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        responseData = { 
          message: responseText || "Non-JSON response received",
          status: statusCode,
          rawResponse: responseText
        };
      }
    } catch (textError) {
      console.error('Error reading response text:', textError);
      responseData = { 
        message: "Failed to read response",
        status: statusCode,
        error: String(textError)
      };
    }
    
    // Update conversation with response
    if (conversationId) {
      const responseForStorage = typeof responseData === 'object' 
        ? JSON.stringify(responseData)
        : String(responseData);
        
      await supabase
        .from('ai_conversations')
        .update({ 
          response: responseForStorage.substring(0, 1000), // Limit the size for storage
          payload: {
            ...payload,
            responseStatus: statusCode,
            responseTimestamp: new Date().toISOString()
          }
        })
        .eq('id', conversationId);
    }
    
    return {
      success: statusCode >= 200 && statusCode < 300,
      data: responseData,
      status: statusCode,
      message: responseData?.message || `Request processed with status: ${statusCode}`,
      rawResponse: responseText
    };
  } catch (error) {
    console.error('Webhook request failed:', error);
    
    // Log detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    };
    
    console.error('Error details:', errorDetails);
    
    return {
      success: false,
      message: "Webhook request failed",
      error: String(error),
      errorDetails
    };
  }
};
