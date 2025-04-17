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
export const createMessage = async (message: Omit<TeamMessage, 'id' | 'created_at' | 'updated_at' | 'deleted' | 'notification_state'>): Promise<TeamMessage> => {
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .insert({
        ...message,
        deleted: false,
        notification_state: 'live'
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

// Function to mark a message as read
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

// Function to upload a file for team use
export const uploadTeamFile = async (file: File, folder: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('team_files')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from('team_files')
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Function to get team members
export const getTeamMembers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

// Function to add a reaction to a message
export const addMessageReaction = async (messageId: string, userId: string, emoji: string): Promise<MessageReaction> => {
  try {
    // Check if the reaction already exists
    const { data: existingReactions, error: checkError } = await supabase
      .from('team_message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji);
      
    if (checkError) throw checkError;
    
    // If the reaction already exists, return it
    if (existingReactions && existingReactions.length > 0) {
      return existingReactions[0];
    }
    
    // Otherwise, create a new reaction
    const { data, error } = await supabase
      .from('team_message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji: emoji
      })
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

// Function to delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_messages')
      .update({ deleted: true })
      .eq('id', messageId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Function to get notes
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

// Function to create a note
export const createNote = async (note: Omit<TeamNote, 'id' | 'created_at' | 'updated_at'>): Promise<TeamNote> => {
  try {
    const { data, error } = await supabase
      .from('team_notes')
      .insert(note)
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

// Function to update a note
export const updateNote = async (noteId: string, updates: Partial<TeamNote>): Promise<TeamNote> => {
  try {
    const { data, error } = await supabase
      .from('team_notes')
      .update(updates)
      .eq('id', noteId)
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Function to delete a note
export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_notes')
      .delete()
      .eq('id', noteId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Function to create a note reply
export const createNoteReply = async (reply: Omit<NoteReply, 'id' | 'created_at'>): Promise<NoteReply> => {
  try {
    const { data, error } = await supabase
      .from('team_note_replies')
      .insert(reply)
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating note reply:', error);
    throw error;
  }
};

// Function to get note replies
export const getNoteReplies = async (noteId: string): Promise<NoteReply[]> => {
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

// Function to delete a note reply
export const deleteNoteReply = async (replyId: string): Promise<void> => {
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

// Function to get polls
export const getPolls = async (): Promise<TeamPoll[]> => {
  try {
    const { data: pollsData, error: pollsError } = await supabase
      .from('team_polls')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (pollsError) throw pollsError;
    
    const polls = pollsData || [];
    
    // Get options for each poll
    const enrichedPolls = await Promise.all(polls.map(async (poll) => {
      const { data: optionsData, error: optionsError } = await supabase
        .from('team_poll_options')
        .select('*, team_poll_votes(user_id, option_id)')
        .eq('poll_id', poll.id)
        .order('option_order', { ascending: true });
        
      if (optionsError) throw optionsError;
      
      // Get votes for this poll
      const { data: votesData, error: votesError } = await supabase
        .from('team_poll_votes')
        .select('*')
        .eq('poll_id', poll.id);
        
      if (votesError) throw votesError;
      
      // Get users who voted for each option
      const optionsWithVoters = await Promise.all((optionsData || []).map(async (option) => {
        const { data: votersData, error: votersError } = await supabase
          .from('profiles')
          .select('*')
          .in(
            'id', 
            votesData
              ?.filter(vote => vote.option_id === option.id)
              .map(vote => vote.user_id) || []
          );
          
        if (votersError) throw votersError;
        
        return {
          ...option,
          vote_count: votesData?.filter(vote => vote.option_id === option.id).length || 0,
          voters: votersData || []
        };
      }));
      
      return {
        ...poll,
        options: optionsWithVoters,
        votes: votesData || []
      };
    }));
    
    return enrichedPolls;
  } catch (error) {
    console.error('Error fetching polls:', error);
    throw error;
  }
};

// Function to create a poll
export const createPoll = async (
  poll: Omit<TeamPoll, 'id' | 'created_at' | 'updated_at' | 'options' | 'votes'>,
  options: Array<Omit<TeamPollOption, 'id' | 'poll_id'>>
): Promise<TeamPoll> => {
  try {
    // Create the poll
    const { data: pollData, error: pollError } = await supabase
      .from('team_polls')
      .insert({
        ...poll,
        active: true
      })
      .select('*')
      .single();
      
    if (pollError) throw pollError;
    
    // Create options for the poll
    const optionsWithPollId = options.map(option => ({
      ...option,
      poll_id: pollData.id
    }));
    
    const { data: optionsData, error: optionsError } = await supabase
      .from('team_poll_options')
      .insert(optionsWithPollId)
      .select('*');
      
    if (optionsError) throw optionsError;
    
    return {
      ...pollData,
      options: optionsData
    };
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

// Function to vote on a poll
export const votePoll = async ({
  poll_id,
  option_id,
  user_id
}: {
  poll_id: string;
  option_id: string;
  user_id: string;
}): Promise<PollVote> => {
  try {
    // Get the poll to check if multiple voting is allowed
    const { data: pollData, error: pollError } = await supabase
      .from('team_polls')
      .select('multiple_choice, active')
      .eq('id', poll_id)
      .single();
      
    if (pollError) throw pollError;
    
    if (!pollData.active) {
      throw new Error('This poll is closed');
    }
    
    // Check if the user has already voted for this option
    const { data: existingVotes, error: checkError } = await supabase
      .from('team_poll_votes')
      .select('*')
      .eq('poll_id', poll_id)
      .eq('user_id', user_id);
      
    if (checkError) throw checkError;
    
    // If the user has already voted for this option, do nothing
    if (existingVotes?.some(vote => vote.option_id === option_id)) {
      // Remove the vote (toggle)
      const { data, error } = await supabase
        .from('team_poll_votes')
        .delete()
        .eq('poll_id', poll_id)
        .eq('user_id', user_id)
        .eq('option_id', option_id)
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    }
    
    // If multiple choice is not allowed, remove any existing votes
    if (!pollData.multiple_choice && existingVotes && existingVotes.length > 0) {
      const { error: deleteError } = await supabase
        .from('team_poll_votes')
        .delete()
        .eq('poll_id', poll_id)
        .eq('user_id', user_id);
        
      if (deleteError) throw deleteError;
    }
    
    // Create new vote
    const { data, error } = await supabase
      .from('team_poll_votes')
      .insert({
        poll_id,
        option_id,
        user_id
      })
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error voting on poll:', error);
    throw error;
  }
};

// Function to update poll status
export const updatePollStatus = async (id: string, active: boolean): Promise<TeamPoll> => {
  try {
    const { data, error } = await supabase
      .from('team_polls')
      .update({ active })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating poll status:', error);
    throw error;
  }
};

// Function to delete a poll
export const deletePoll = async (id: string): Promise<void> => {
  try {
    // Delete all votes for this poll
    const { error: votesError } = await supabase
      .from('team_poll_votes')
      .delete()
      .eq('poll_id', id);
      
    if (votesError) throw votesError;
    
    // Delete all options for this poll
    const { error: optionsError } = await supabase
      .from('team_poll_options')
      .delete()
      .eq('poll_id', id);
      
    if (optionsError) throw optionsError;
    
    // Delete the poll
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
