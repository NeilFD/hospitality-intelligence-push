import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/supabase-types';

// Type definitions
export interface ChatRoom {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  is_announcement_only: boolean;
}

export interface TeamMessage {
  id: string;
  content: string;
  author_id: string;
  room_id: string;
  created_at: string;
  updated_at: string;
  type: 'text' | 'image' | 'gif' | 'voice' | 'file';
  attachment_url?: string;
  read_by: string[];
  mentioned_users: string[];
  notification_state: 'live' | 'dismissed' | 'archived';
  deleted: boolean;
  reactions?: {
    emoji: string;
    user_ids: string[];
  }[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface TeamNote {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  type: 'text' | 'image' | 'voice' | 'gif';
  attachment_url?: string;
  pinned: boolean;
  color: string;
}

export interface NoteReply {
  id: string;
  content: string;
  note_id: string;
  author_id: string;
  created_at: string;
}

export interface TeamPoll {
  id: string;
  question: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  multiple_choice: boolean;
  color: string;
  options?: TeamPollOption[];
  votes?: PollVote[];
}

export interface TeamPollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_type: 'text' | 'image';
  option_order: number;
  vote_count?: number;
  voters?: UserProfile[];
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

// Function to get chat rooms
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const { data, error } = await supabase
    .from('team_chat_rooms')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
  
  // Custom ordering logic for chat rooms
  const roomOrder = {
    'General': 1,
    'Team': 1, // Same priority for "General Team"
    'Important': 2, // For "Important Announcements"
    'Announcements': 2,
    'Food': 3,
    'Beverage': 4
  };
  
  // Sort the rooms based on the custom order
  const sortedRooms = data?.sort((a, b) => {
    // Extract the first word from each room name for comparison
    const aFirstWord = a.name.split(' ')[0];
    const bFirstWord = b.name.split(' ')[0];
    
    // Get the order values, defaulting to a high number if not found
    const aOrder = roomOrder[aFirstWord] || 999;
    const bOrder = roomOrder[bFirstWord] || 999;
    
    return aOrder - bOrder;
  }) || [];
  
  return sortedRooms;
};

// Function to get messages for a specific room
export const getMessages = async (roomId: string): Promise<TeamMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('deleted', false)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Function to create a new message
export const createMessage = async (message: Omit<TeamMessage, 'id' | 'created_at' | 'updated_at' | 'deleted' | 'notification_state' | 'reactions'>): Promise<TeamMessage> => {
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .insert({
        ...message,
        deleted: false,
        notification_state: 'live',
        mentioned_users: message.mentioned_users || []
      })
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

// ... keep existing code (remaining functions)
