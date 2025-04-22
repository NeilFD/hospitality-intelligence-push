
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './auth-service';

export const sendWebhookRequest = async (url: string, payload: any) => {
  try {
    console.log("Preparing to send webhook request with payload:", payload);
    
    // Add additional context data for the AI to use
    const enhancedPayload = {
      ...payload,
      // Include proper column names to ensure SQL queries work correctly
      DatabaseStructure: {
        daily_performance_summary: {
          revenue_columns: {
            food: "food_revenue",
            beverage: "beverage_revenue",
            total: "total_revenue"
          },
          wage_columns: {
            kitchen: "kitchen_wages",
            foh: "foh_wages",
            total: "total_wages" 
          },
          cover_columns: {
            lunch: "lunch_covers",
            dinner: "dinner_covers",
            total: "total_covers"
          }
        }
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedPayload),
    });

    if (!response.ok) {
      throw new Error(`Error sending webhook: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Webhook response received:", data);
    
    // Store conversation in database if user is logged in
    const { user } = useAuthStore.getState();
    if (user?.id) {
      await storeConversation(payload.Query, data?.response || JSON.stringify(data), user.id, data?.conversationId);
    }
    
    return data;
  } catch (error) {
    console.error('Error sending webhook request:', error);
    throw error;
  }
};

// Store conversation in database for future reference
const storeConversation = async (query: string, response: string, userId: string, conversationId?: string) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        query: query,
        response: response,
        user_id: userId,
        id: conversationId || undefined,
        timestamp: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error storing conversation:', error);
    }
    
    return data;
  } catch (error) {
    console.error('Error storing conversation:', error);
  }
};

// This function can be used to fetch conversation history for a user
export const getConversationHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
};

// Share a conversation with others
export const shareConversation = async (conversationId: string, shared: boolean = true) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .update({ shared })
      .eq('id', conversationId);
      
    if (error) {
      console.error('Error updating conversation share status:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating conversation share status:', error);
    return null;
  }
};
