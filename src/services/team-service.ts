import { supabase } from '@/lib/supabase';

// Define all the types that are being referenced
export interface WelcomeMessage {
  id: string;
  content: string;
  author_id: string;
  image_url?: string;
  subject?: string;
  created_at: string;
  updated_at: string;
  author_first_name?: string;
  author_last_name?: string;
}

export interface MessageReactionData {
  emoji: string;
  user_ids: string[];
}

export interface TeamMessage {
  id: string;
  content: string;
  author_id: string;
  room_id: string;
  created_at: string;
  type: string;
  attachment_url?: string;
  read_by: string[];
  mentioned_users?: string[];
  reactions?: MessageReactionData[];
}

export interface TeamNote {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  type: 'text' | 'image' | 'voice' | 'gif';
  color?: string;
  attachment_url?: string;
}

export interface TeamPoll {
  id: string;
  question: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  multiple_choice: boolean;
  color?: string;
  options?: TeamPollOption[];
  votes?: any[];
}

export interface TeamPollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_type: string;
  option_order: number;
  vote_count?: number;
  voters?: any[];
}

export interface ChatRoom {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_announcement_only: boolean;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

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
        subject: message.subject
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
        subject: updates.subject,
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

// Update the getChatRooms function to query the correct table
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  try {
    console.log('Fetching chat rooms from team_chat_rooms table');
    const { data, error } = await supabase
      .from('team_chat_rooms')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching chat rooms:', error);
      throw error;
    }
    
    console.log('Chat rooms retrieved:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
};

export const getMessages = async (roomId: string): Promise<TeamMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const createMessage = async (message: Omit<TeamMessage, 'id' | 'created_at'>): Promise<TeamMessage> => {
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .insert(message)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId: string, userId: string): Promise<void> => {
  try {
    const { data: message, error: fetchError } = await supabase
      .from('team_messages')
      .select('read_by')
      .eq('id', messageId)
      .single();
      
    if (fetchError) throw fetchError;
    
    const readBy = Array.isArray(message.read_by) ? message.read_by : [];
    if (!readBy.includes(userId)) {
      const { error: updateError } = await supabase
        .from('team_messages')
        .update({ read_by: [...readBy, userId] })
        .eq('id', messageId);
        
      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

export const uploadTeamFile = async (file: File, type: string): Promise<string> => {
  try {
    const fileName = `${type}/${Date.now()}-${file.name}`;
    const { error: uploadError, data } = await supabase.storage
      .from('team_files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
      
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('team_files')
      .getPublicUrl(fileName);
      
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const getTeamMembers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('first_name', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

export const addMessageReaction = async (
  messageId: string, 
  userId: string, 
  emoji: string
): Promise<void> => {
  try {
    console.log(`Adding reaction: ${emoji} to message ${messageId} by user ${userId}`);
    
    // Use Edge Function directly to add reaction - this bypasses any RPC issues
    const { data, error } = await supabase.functions.invoke('add_message_reaction', {
      body: {
        p_message_id: messageId,
        p_user_id: userId,
        p_emoji: emoji
      }
    });
    
    if (error) {
      console.error('Error invoking add_message_reaction function:', error);
      throw error;
    }
    
    console.log('Reaction added successfully:', data);
    return;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_messages')
      .delete()
      .eq('id', messageId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const getNotes = async (): Promise<TeamNote[]> => {
  try {
    const { data, error } = await supabase
      .from('team_notes')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

export const createNote = async (note: Omit<TeamNote, 'id' | 'created_at' | 'updated_at'>): Promise<TeamNote> => {
  try {
    const { data, error } = await supabase
      .from('team_notes')
      .insert(note)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

export const updateNote = async (id: string, updates: Partial<TeamNote>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_notes')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_notes')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

export const getPolls = async () => {
  try {
    const { data: polls, error: pollsError } = await supabase
      .from('team_polls')
      .select('*, options:team_poll_options(*), votes:team_poll_votes(*)')
      .order('created_at', { ascending: false });
      
    if (pollsError) throw pollsError;
    
    return polls || [];
  } catch (error) {
    console.error('Error fetching polls:', error);
    throw error;
  }
};

export const createPoll = async (
  poll: Omit<TeamPoll, 'id' | 'created_at' | 'updated_at' | 'options' | 'votes'>,
  options: Array<{ option_text: string; option_type: string; option_order: number }>
) => {
  try {
    const { data: pollData, error: pollError } = await supabase
      .from('team_polls')
      .insert(poll)
      .select()
      .single();
      
    if (pollError) throw pollError;
    
    const pollOptions = options.map(option => ({
      ...option,
      poll_id: pollData.id
    }));
    
    const { error: optionsError } = await supabase
      .from('team_poll_options')
      .insert(pollOptions);
      
    if (optionsError) throw optionsError;
    
    return pollData;
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

export const votePoll = async ({ poll_id, option_id, user_id }: { poll_id: string; option_id: string; user_id: string }) => {
  try {
    const { data: existingVotes, error: checkError } = await supabase
      .from('team_poll_votes')
      .select('*')
      .eq('poll_id', poll_id)
      .eq('user_id', user_id);
      
    if (checkError) throw checkError;
    
    const { data: poll, error: pollError } = await supabase
      .from('team_polls')
      .select('multiple_choice')
      .eq('id', poll_id)
      .single();
      
    if (pollError) throw pollError;
    
    if (!poll.multiple_choice && existingVotes && existingVotes.length > 0) {
      const { error: deleteError } = await supabase
        .from('team_poll_votes')
        .delete()
        .eq('poll_id', poll_id)
        .eq('user_id', user_id);
        
      if (deleteError) throw deleteError;
    }
    
    const alreadyVotedForOption = existingVotes?.some(vote => vote.option_id === option_id);
    
    if (alreadyVotedForOption) {
      const { error: removeError } = await supabase
        .from('team_poll_votes')
        .delete()
        .eq('poll_id', poll_id)
        .eq('user_id', user_id)
        .eq('option_id', option_id);
        
      if (removeError) throw removeError;
      
      return { action: 'removed' };
    } else {
      const { error: voteError } = await supabase
        .from('team_poll_votes')
        .insert({
          poll_id,
          option_id,
          user_id
        });
        
      if (voteError) throw voteError;
      
      return { action: 'added' };
    }
  } catch (error) {
    console.error('Error voting on poll:', error);
    throw error;
  }
};

export const updatePollStatus = async (id: string, active: boolean) => {
  try {
    const { error } = await supabase
      .from('team_polls')
      .update({ active })
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error updating poll status:', error);
    throw error;
  }
};

export const deletePoll = async (id: string) => {
  try {
    const { error } = await supabase
      .from('team_polls')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting poll:', error);
    throw error;
  }
};

export const createNoteReply = async (reply: { 
  content: string; 
  note_id: string; 
  author_id: string; 
}) => {
  try {
    const { data, error } = await supabase
      .from('team_note_replies')
      .insert(reply)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating note reply:', error);
    throw error;
  }
};

export const getNoteReplies = async (noteId: string) => {
  try {
    const { data, error } = await supabase
      .from('team_note_replies')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching note replies:', error);
    throw error;
  }
};

export const deleteNoteReply = async (replyId: string) => {
  try {
    const { error } = await supabase
      .from('team_note_replies')
      .delete()
      .eq('id', replyId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting note reply:', error);
    throw error;
  }
};
