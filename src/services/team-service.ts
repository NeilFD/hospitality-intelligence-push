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

// Function to mark a message as read
export const markMessageAsRead = async (messageId: string, userId: string): Promise<void> => {
  try {
    const { data: message, error: fetchError } = await supabase
      .from('team_messages')
      .select('read_by')
      .eq('id', messageId)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (message && !message.read_by.includes(userId)) {
      const updatedReadBy = [...message.read_by, userId];
      
      const { error: updateError } = await supabase
        .from('team_messages')
        .update({ read_by: updatedReadBy })
        .eq('id', messageId);
        
      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Function to add a reaction to a message
export const addMessageReaction = async (
  messageId: string, 
  userId: string, 
  emoji: string
): Promise<void> => {
  try {
    const { data: message, error: fetchError } = await supabase
      .from('team_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();
      
    if (fetchError) throw fetchError;
    
    let updatedReactions = message?.reactions || [];
    
    const existingReactionIndex = updatedReactions.findIndex(r => r.emoji === emoji);
    
    if (existingReactionIndex >= 0) {
      // If user hasn't reacted with this emoji yet, add their ID
      if (!updatedReactions[existingReactionIndex].user_ids.includes(userId)) {
        updatedReactions[existingReactionIndex].user_ids.push(userId);
      } else {
        // If user already reacted, remove their ID (toggle reaction)
        updatedReactions[existingReactionIndex].user_ids = 
          updatedReactions[existingReactionIndex].user_ids.filter(id => id !== userId);
        
        // Remove the reaction entirely if no users left
        if (updatedReactions[existingReactionIndex].user_ids.length === 0) {
          updatedReactions = updatedReactions.filter(r => r.emoji !== emoji);
        }
      }
    } else {
      // Add new reaction
      updatedReactions.push({
        emoji,
        user_ids: [userId]
      });
    }
    
    const { error: updateError } = await supabase
      .from('team_messages')
      .update({ reactions: updatedReactions })
      .eq('id', messageId);
      
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error adding message reaction:', error);
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

// Function to upload a file
export const uploadTeamFile = async (file: File, folder: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    console.log(`Uploading file to ${folder}_images bucket:`, filePath);
    
    const { error: uploadError, data } = await supabase.storage
      .from(`${folder}_images`)
      .upload(filePath, file);
      
    if (uploadError) {
      console.error(`Error uploading to ${folder}_images:`, uploadError);
      throw uploadError;
    }
    
    console.log('Upload successful, getting public URL');
    
    const { data: urlData } = supabase.storage
      .from(`${folder}_images`)
      .getPublicUrl(filePath);
      
    console.log('Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadTeamFile:', error);
    throw error;
  }
};

// Function to get team members
export const getTeamMembers = async (): Promise<UserProfile[]> => {
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

// Team Notes functions
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
      .select('*')
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

// Note replies
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

export const deleteNoteReply = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_note_replies')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting note reply:', error);
    throw error;
  }
};

// Team Polls
export const getPolls = async (): Promise<TeamPoll[]> => {
  try {
    const { data: polls, error: pollsError } = await supabase
      .from('team_polls')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (pollsError) throw pollsError;
    
    const pollsWithOptions = [];
    
    for (const poll of polls || []) {
      const { data: options, error: optionsError } = await supabase
        .from('team_poll_options')
        .select('*')
        .eq('poll_id', poll.id)
        .order('option_order', { ascending: true });
        
      if (optionsError) throw optionsError;
      
      const { data: votes, error: votesError } = await supabase
        .from('team_poll_votes')
        .select('*')
        .eq('poll_id', poll.id);
        
      if (votesError) throw votesError;
      
      // Add vote counts to options
      const optionsWithVotes = options?.map(option => {
        const optionVotes = votes?.filter(vote => vote.option_id === option.id) || [];
        return {
          ...option,
          vote_count: optionVotes.length,
          voters: [] // To be filled if needed
        };
      });
      
      pollsWithOptions.push({
        ...poll,
        options: optionsWithVotes,
        votes: votes
      });
    }
    
    return pollsWithOptions;
  } catch (error) {
    console.error('Error fetching polls:', error);
    throw error;
  }
};

export const createPoll = async (
  poll: Omit<TeamPoll, 'id' | 'created_at' | 'updated_at' | 'options' | 'votes'>,
  options: Array<{ option_text: string; option_type: 'text' | 'image'; option_order: number }>
): Promise<TeamPoll> => {
  try {
    // Insert the poll first
    const { data: pollData, error: pollError } = await supabase
      .from('team_polls')
      .insert(poll)
      .select('*')
      .single();
      
    if (pollError) throw pollError;
    
    // Then insert all options
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
      options: optionsData || []
    };
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

export const votePoll = async (vote: { poll_id: string; option_id: string; user_id: string }): Promise<void> => {
  try {
    const { data: poll, error: pollError } = await supabase
      .from('team_polls')
      .select('multiple_choice')
      .eq('id', vote.poll_id)
      .single();
      
    if (pollError) throw pollError;
    
    // If not multiple choice, remove any existing votes from this user for this poll
    if (!poll.multiple_choice) {
      const { error: deleteError } = await supabase
        .from('team_poll_votes')
        .delete()
        .eq('poll_id', vote.poll_id)
        .eq('user_id', vote.user_id);
        
      if (deleteError) throw deleteError;
    } else {
      // If multiple choice, check if user already voted for this option
      const { data: existingVote, error: checkError } = await supabase
        .from('team_poll_votes')
        .select('*')
        .eq('poll_id', vote.poll_id)
        .eq('option_id', vote.option_id)
        .eq('user_id', vote.user_id);
        
      if (checkError) throw checkError;
      
      // If already voted for this option, remove the vote (toggle)
      if (existingVote && existingVote.length > 0) {
        const { error: deleteError } = await supabase
          .from('team_poll_votes')
          .delete()
          .eq('id', existingVote[0].id);
          
        if (deleteError) throw deleteError;
        return;
      }
    }
    
    // Insert the new vote
    const { error: insertError } = await supabase
      .from('team_poll_votes')
      .insert(vote);
      
    if (insertError) throw insertError;
  } catch (error) {
    console.error('Error voting in poll:', error);
    throw error;
  }
};

export const updatePollStatus = async (id: string, active: boolean): Promise<void> => {
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

export const deletePoll = async (id: string): Promise<void> => {
  try {
    // Delete votes first (due to foreign key constraints)
    const { error: votesError } = await supabase
      .from('team_poll_votes')
      .delete()
      .eq('poll_id', id);
      
    if (votesError) throw votesError;
    
    // Delete options next
    const { error: optionsError } = await supabase
      .from('team_poll_options')
      .delete()
      .eq('poll_id', id);
      
    if (optionsError) throw optionsError;
    
    // Finally delete the poll
    const { error: pollError } = await supabase
      .from('team_polls')
      .delete()
      .eq('id', id);
      
    if (pollError) throw pollError;
  } catch (error) {
    console.error('Error deleting poll:', error);
    throw error;
  }
};

// Welcome Message functions
export interface WelcomeMessage {
  id: string;
  content: string;
  subject?: string; // Making this optional to handle existing data
  image_url?: string;
  created_at: string;
  author_id: string;
  author_first_name?: string;
  author_last_name?: string;
}

// To handle the absence of the subject column in the database
export const createWelcomeMessage = async (
  message: Pick<WelcomeMessage, 'content' | 'author_id' | 'image_url' | 'subject'>
): Promise<WelcomeMessage> => {
  try {
    // Filter out subject if the column doesn't exist
    const { subject, ...baseMessage } = message;
    
    // Check if the subject column exists in the table
    const { data: columnInfo, error: columnError } = await supabase
      .from('team_welcome_messages')
      .select()
      .limit(1);
    
    let dataToInsert: any = baseMessage;
    
    // If we get data back without error, try to include subject
    if (columnInfo && !columnError) {
      // Try to include subject in the insert if column exists
      try {
        dataToInsert = message; // Include subject
      } catch {
        console.warn('Subject column not available, skipping that field');
      }
    }
    
    const { data, error } = await supabase
      .from('team_welcome_messages')
      .insert(dataToInsert)
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating welcome message:', error);
    throw error;
  }
};

export const updateWelcomeMessage = async (
  id: string,
  updates: Partial<WelcomeMessage>
): Promise<void> => {
  try {
    // Remove subject if it's included but column doesn't exist
    const { subject, ...baseUpdates } = updates;
    
    // Check if the subject column exists in the table
    const { data: columnInfo, error: columnError } = await supabase
      .from('team_welcome_messages')
      .select()
      .limit(1);
    
    let dataToUpdate: any = baseUpdates;
    
    // If we get data back without error, try to include subject
    if (columnInfo && !columnError) {
      // Try to include subject in the update if column exists
      try {
        dataToUpdate = updates; // Include subject
      } catch {
        console.warn('Subject column not available, skipping that field');
      }
    }
    
    const { error } = await supabase
      .from('team_welcome_messages')
      .update(dataToUpdate)
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
