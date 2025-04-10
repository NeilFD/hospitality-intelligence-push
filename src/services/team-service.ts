import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/supabase-types';

export interface TeamNote {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  color: string;
  type: 'text' | 'image' | 'voice' | 'gif';
  attachment_url?: string;
  mentioned_users?: string[];
}

export interface MessageReaction {
  emoji: string;
  user_ids: string[];
}

export interface TeamMessage {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  type: 'text' | 'image' | 'voice' | 'gif' | 'file';
  attachment_url?: string;
  mentioned_users?: string[];
  read_by: string[];
  room_id: string;
  reactions?: MessageReaction[];
}

export interface TeamPoll {
  id: string;
  question: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  multiple_choice: boolean;
  active: boolean;
  color?: string;
  options?: TeamPollOption[];
  votes?: TeamPollVote[];
}

export interface TeamPollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_type: 'text' | 'image';
  attachment_url?: string;
  created_at: string;
  option_order: number;
  vote_count?: number;
  voters?: UserProfile[];
}

export interface TeamPollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_announcement_only: boolean;
}

// Get all team members (profiles)
export const getTeamMembers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
    
  if (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
  
  return data || [];
};

// Notes functions
export const getNotes = async (): Promise<TeamNote[]> => {
  try {
    const { data, error } = await supabase
      .from('team_notes')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching team notes:', error);
      throw error;
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception in getNotes:', e);
    return [];
  }
};

export const createNote = async (note: Omit<TeamNote, 'id' | 'created_at' | 'updated_at'>): Promise<TeamNote> => {
  const { data, error } = await supabase
    .from('team_notes')
    .insert(note)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating note:', error);
    throw error;
  }
  
  return data;
};

export const updateNote = async (id: string, updates: Partial<TeamNote>): Promise<TeamNote> => {
  const { data, error } = await supabase
    .from('team_notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating note:', error);
    throw error;
  }
  
  return data;
};

export const deleteNote = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('team_notes')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Messages functions
export const getMessages = async (roomId: string): Promise<TeamMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching team messages:', error);
      throw error;
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception in getMessages:', e);
    return [];
  }
};

export const createMessage = async (
  messageData: Omit<TeamMessage, 'id' | 'created_at' | 'updated_at'> & { room_id: string }
): Promise<TeamMessage> => {
  const { data, error } = await supabase
    .from('team_messages')
    .insert(messageData)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating message:', error);
    throw error;
  }
  
  return data;
};

export const markMessageAsRead = async (messageId: string, userId: string): Promise<void> => {
  const { data: message, error: fetchError } = await supabase
    .from('team_messages')
    .select('read_by')
    .eq('id', messageId)
    .single();
    
  if (fetchError) {
    console.error('Error fetching message read status:', fetchError);
    throw fetchError;
  }
  
  const readBy = message.read_by || [];
  if (!readBy.includes(userId)) {
    readBy.push(userId);
    
    const { error: updateError } = await supabase
      .from('team_messages')
      .update({ read_by: readBy })
      .eq('id', messageId);
      
    if (updateError) {
      console.error('Error marking message as read:', updateError);
      throw updateError;
    }
  }
};

export const addMessageReaction = async (
  messageId: string,
  emoji: string,
  userId: string
): Promise<TeamMessage> => {
  // Fetch the current message
  const { data: message, error: fetchError } = await supabase
    .from('team_messages')
    .select('*')
    .eq('id', messageId)
    .single();
    
  if (fetchError) {
    console.error('Error fetching message:', fetchError);
    throw fetchError;
  }
  
  // Initialize or get current reactions
  const reactions = message.reactions || [];
  
  // Check if this emoji reaction already exists
  const existingReactionIndex = reactions.findIndex(
    (reaction: MessageReaction) => reaction.emoji === emoji
  );
  
  if (existingReactionIndex !== -1) {
    // Check if user already reacted with this emoji
    const userIds = reactions[existingReactionIndex].user_ids || [];
    const userReactionIndex = userIds.indexOf(userId);
    
    if (userReactionIndex !== -1) {
      // Remove user's reaction if already exists (toggle behavior)
      userIds.splice(userReactionIndex, 1);
      
      // If no users left reacting with this emoji, remove the reaction entirely
      if (userIds.length === 0) {
        reactions.splice(existingReactionIndex, 1);
      } else {
        reactions[existingReactionIndex].user_ids = userIds;
      }
    } else {
      // Add user's reaction
      reactions[existingReactionIndex].user_ids.push(userId);
    }
  } else {
    // Add new reaction type with this user
    reactions.push({
      emoji,
      user_ids: [userId]
    });
  }
  
  // Update the message with new reactions
  const { data: updatedMessage, error: updateError } = await supabase
    .from('team_messages')
    .update({ reactions })
    .eq('id', messageId)
    .select()
    .single();
    
  if (updateError) {
    console.error('Error updating message reactions:', updateError);
    throw updateError;
  }
  
  return updatedMessage;
};

// Poll functions
export const getPolls = async (): Promise<TeamPoll[]> => {
  try {
    const { data: polls, error } = await supabase
      .from('team_polls')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching team polls:', error);
      throw error;
    }
    
    // Fetch options for each poll
    const pollsWithOptions = await Promise.all(
      polls.map(async (poll) => {
        const { data: options, error: optionsError } = await supabase
          .from('team_poll_options')
          .select('*')
          .eq('poll_id', poll.id)
          .order('option_order', { ascending: true });
          
        if (optionsError) {
          console.error('Error fetching poll options:', optionsError);
          return { ...poll, options: [] };
        }
        
        // Get votes for each option
        const { data: votes, error: votesError } = await supabase
          .from('team_poll_votes')
          .select('*')
          .eq('poll_id', poll.id);
          
        if (votesError) {
          console.error('Error fetching poll votes:', votesError);
          return { ...poll, options, votes: [] };
        }
        
        // For each option, get the users who voted for it
        const optionsWithVotes = await Promise.all(
          options.map(async (option) => {
            const optionVotes = votes.filter(vote => vote.option_id === option.id);
            const vote_count = optionVotes.length;
            
            // Get user profiles for voters
            const userIds = optionVotes.map(vote => vote.user_id);
            let voters: UserProfile[] = [];
            
            if (userIds.length) {
              const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);
                
              if (profilesError) {
                console.error('Error fetching voter profiles:', profilesError);
              } else {
                voters = profiles || [];
              }
            }
            
            return {
              ...option,
              vote_count,
              voters
            };
          })
        );
        
        return {
          ...poll,
          options: optionsWithVotes,
          votes
        };
      })
    );
    
    return pollsWithOptions;
  } catch (e) {
    console.error('Exception in getPolls:', e);
    return [];
  }
};

export const createPoll = async (
  poll: Pick<TeamPoll, 'question' | 'author_id' | 'multiple_choice' | 'color'>,
  options: Pick<TeamPollOption, 'option_text' | 'option_type' | 'attachment_url' | 'option_order'>[]
): Promise<TeamPoll> => {
  // First, create the poll
  const { data: createdPoll, error: pollError } = await supabase
    .from('team_polls')
    .insert(poll)
    .select()
    .single();
    
  if (pollError) {
    console.error('Error creating poll:', pollError);
    throw pollError;
  }
  
  // Then create options for the poll
  const pollOptions = options.map(option => ({
    ...option,
    poll_id: createdPoll.id
  }));
  
  const { data: createdOptions, error: optionsError } = await supabase
    .from('team_poll_options')
    .insert(pollOptions)
    .select();
    
  if (optionsError) {
    console.error('Error creating poll options:', optionsError);
    throw optionsError;
  }
  
  return {
    ...createdPoll,
    options: createdOptions
  };
};

export const votePoll = async (vote: Omit<TeamPollVote, 'id' | 'created_at' | 'updated_at'>): Promise<TeamPollVote> => {
  // Check if this is a single-choice poll and the user already voted
  const { data: poll, error: pollError } = await supabase
    .from('team_polls')
    .select('multiple_choice')
    .eq('id', vote.poll_id)
    .single();
    
  if (pollError) {
    console.error('Error fetching poll details:', pollError);
    throw pollError;
  }
  
  if (!poll.multiple_choice) {
    // For single choice polls, we need to remove any previous votes by this user
    const { error: deleteError } = await supabase
      .from('team_poll_votes')
      .delete()
      .eq('poll_id', vote.poll_id)
      .eq('user_id', vote.user_id);
      
    if (deleteError) {
      console.error('Error removing previous vote:', deleteError);
      throw deleteError;
    }
  } else {
    // For multiple choice, check if this exact vote already exists
    const { data: existingVote, error: checkError } = await supabase
      .from('team_poll_votes')
      .select('*')
      .eq('poll_id', vote.poll_id)
      .eq('user_id', vote.user_id)
      .eq('option_id', vote.option_id);
      
    if (checkError) {
      console.error('Error checking existing vote:', checkError);
      throw checkError;
    }
    
    if (existingVote && existingVote.length > 0) {
      // Vote already exists, remove it (toggle behavior)
      const { error: deleteError } = await supabase
        .from('team_poll_votes')
        .delete()
        .eq('id', existingVote[0].id);
        
      if (deleteError) {
        console.error('Error removing existing vote:', deleteError);
        throw deleteError;
      }
      
      return existingVote[0];
    }
  }
  
  // Insert the new vote
  const { data: createdVote, error: voteError } = await supabase
    .from('team_poll_votes')
    .insert(vote)
    .select()
    .single();
    
  if (voteError) {
    console.error('Error creating vote:', voteError);
    throw voteError;
  }
  
  return createdVote;
};

export const deletePoll = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('team_polls')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting poll:', error);
    throw error;
  }
};

export const updatePollStatus = async (id: string, active: boolean): Promise<TeamPoll> => {
  const { data, error } = await supabase
    .from('team_polls')
    .update({ active })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating poll status:', error);
    throw error;
  }
  
  return data;
};

// File upload helper
export const uploadTeamFile = async (file: File, folder: 'notes' | 'messages' | 'polls'): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `team/${folder}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('team-files')
      .upload(filePath, file);
      
    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
    
    const { data } = supabase.storage
      .from('team-files')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (e) {
    console.error('Exception in uploadTeamFile:', e);
    throw e;
  }
};

// Get all available chat rooms
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const { data, error } = await supabase
    .from('team_chat_rooms')
    .select('*');
    
  if (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
  
  return data || [];
};
