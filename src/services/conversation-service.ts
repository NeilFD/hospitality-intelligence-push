
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
    console.log(`=========== WEBHOOK REQUEST DETAILS ===========`);
    console.log(`URL: ${webhookUrl}`);
    
    // Get the current user 
    const { data: user } = await supabase.auth.getUser();
    let recentConversations: { query: string; response: string }[] = [];
    
    if (user && user.user) {
      // Get the recent conversations with more details for better context
      const { data: conversations } = await supabase
        .from('ai_conversations')
        .select('query, response, created_at')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (conversations) {
        recentConversations = conversations.map(conv => ({
          query: conv.query,
          response: conv.response,
          timestamp: conv.created_at
        }));
        console.log('Retrieved conversation history:', recentConversations);
      }
    }
    
    // Enhance the payload with conversation history
    const enhancedPayload = {
      ...payload,
      conversationHistory: recentConversations,
      Query: payload.Query || payload.query,
    };
    
    console.log('Full Payload with Conversation History:', JSON.stringify(enhancedPayload, null, 2));
    console.log(`Origin: ${window.location.origin}`);
    console.log(`User Agent: ${navigator.userAgent}`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Store the conversation attempt in Supabase
    let conversationId = null;
    
    if (user && user.user) {
      console.log(`Authenticated user: ${user.user.id}`);
      const { data, error } = await supabase.from('ai_conversations').insert({
        user_id: user.user.id,
        query: enhancedPayload.Query,
        response: "Processing request...",
        payload: enhancedPayload,
        timestamp: new Date().toISOString(),
        shared: false
      }).select();
      
      if (error) {
        console.error('Error storing conversation:', error);
      } else if (data && data.length > 0) {
        conversationId = data[0].id;
        console.log(`Created conversation with ID: ${conversationId}`);
        
        enhancedPayload.conversationId = conversationId;
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
    
    // Try different fetch approaches
    console.log('Attempting fetch with standard approach...');
    
    // Headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': window.location.origin,
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache'
    };
    
    console.log('Request headers:', headers);
    
    // First attempt: Standard fetch
    let response;
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(enhancedPayload), // Send the enhanced payload with history
        credentials: 'omit'
      });
      
      console.log('Standard fetch response status:', response.status);
    } catch (fetchError) {
      console.error('Standard fetch failed:', fetchError);
      console.log('Attempting fetch with no-cors mode...');
      
      // Second attempt: no-cors mode (less information but might work)
      try {
        response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(enhancedPayload), // Send the enhanced payload with history
          mode: 'no-cors'
        });
        
        console.log('No-cors fetch completed (note: status will be 0 due to CORS limitations)');
      } catch (noCorsError) {
        console.error('No-cors fetch also failed:', noCorsError);
        throw new Error(`All fetch attempts failed: ${String(fetchError)} and ${String(noCorsError)}`);
      }
    }
    
    // Log response details
    console.log('Response obtained, status:', response.status);
    if (response.headers) {
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    }
    
    // Comprehensive response parsing
    let responseData;
    let statusCode = response.status;
    let responseText = '';
    
    // Check if we got a no-cors response (which has limited information)
    if (response.type === 'opaque') {
      console.log('Received opaque response due to no-cors mode');
      responseData = { 
        message: "Request sent in no-cors mode. Cannot access response details.", 
        status: "unknown", 
        success: true
      };
    } else {
      try {
        responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        try {
          responseData = JSON.parse(responseText);
          console.log('Parsed JSON response:', responseData);
          
          if (responseData.output) {
            console.log('Found output in response:', responseData.output);
          }
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
    }
    
    console.log('Final processed response:', responseData);
    console.log(`=========== END WEBHOOK REQUEST DETAILS ===========`);
    
    if (conversationId) {
      let responseForStorage = "";
      
      if (Array.isArray(responseData) && responseData.length > 0 && responseData[0]?.response) {
        responseForStorage = responseData[0].response;
      } else if (responseData?.output) {
        responseForStorage = responseData.output;
      } else if (responseData?.response) {
        responseForStorage = responseData.response;
      } else if (responseData?.message) {
        responseForStorage = responseData.message;
      } else if (typeof responseData === 'string') {
        responseForStorage = responseData;
      } else {
        responseForStorage = JSON.stringify(responseData);
      }
        
      await supabase
        .from('ai_conversations')
        .update({ 
          response: responseForStorage.substring(0, 1000),
          payload: {
            ...enhancedPayload,
            responseStatus: statusCode,
            responseTimestamp: new Date().toISOString()
          }
        })
        .eq('id', conversationId);
    }
    
    if (response.type === 'opaque') {
      return {
        success: true,
        data: { message: "Request sent, but no response details available due to CORS restrictions" },
        status: "unknown",
        message: "Request completed in no-cors mode. Check n8n for confirmation.",
        conversationId: conversationId
      };
    }
    
    return {
      success: statusCode >= 200 && statusCode < 300,
      data: responseData,
      status: statusCode,
      rawResponse: responseText,
      conversationId: conversationId
    };
  } catch (error) {
    console.error('Webhook request failed with critical error:', error);
    
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
