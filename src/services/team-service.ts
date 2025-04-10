
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
export const getMessages = async (): Promise<TeamMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .select('*')
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

export const createMessage = async (message: Omit<TeamMessage, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMessage> => {
  const { data, error } = await supabase
    .from('team_messages')
    .insert(message)
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

// File upload helper
export const uploadTeamFile = async (file: File, folder: 'notes' | 'messages'): Promise<string> => {
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
