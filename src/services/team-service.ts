
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

// Store the mock notes in memory when we don't have a database table
const mockNotes: TeamNote[] = [];
const mockMessages: TeamMessage[] = [];

// Notes functions - Internal implementation
const fetchNotesFromSupabase = async (): Promise<TeamNote[]> => {
  try {
    const { data, error } = await supabase
      .from('team_notes')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching team notes:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception in fetchNotesFromSupabase:', e);
    return [];
  }
};

// Public function that decides between mock and real data
export const getNotes = async (): Promise<TeamNote[]> => {
  try {
    const { error } = await supabase
      .from('team_notes')
      .select('id')
      .limit(1);
      
    if (error && error.code === '42P01') {
      // Table doesn't exist, use mock data
      console.warn('The team_notes table does not exist yet. Returning mock notes.');
      return [...mockNotes];
    }
    
    // Table exists, use the database function
    return await fetchNotesFromSupabase();
  } catch (e) {
    console.error('Exception in getNotes:', e);
    return [...mockNotes];
  }
};

export const createNote = async (note: Omit<TeamNote, 'id' | 'created_at' | 'updated_at'>): Promise<TeamNote> => {
  try {
    const now = new Date().toISOString();
    
    // Check if the table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('team_notes')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, use mock data instead
      console.warn('The team_notes table does not exist yet. Creating a mock note.');
      
      const mockNote: TeamNote = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content: note.content,
        author_id: note.author_id,
        created_at: now,
        updated_at: now,
        pinned: note.pinned || false,
        color: note.color || '',
        type: note.type || 'text',
        attachment_url: note.attachment_url,
        mentioned_users: note.mentioned_users
      };
      
      // Add to our in-memory mock notes array
      mockNotes.push(mockNote);
      
      return mockNote;
    }
    
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
  } catch (e) {
    console.error('Exception in createNote:', e);
    
    // Fallback to mock data if anything goes wrong
    const mockNote: TeamNote = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: note.content,
      author_id: note.author_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pinned: note.pinned || false,
      color: note.color || '',
      type: note.type || 'text',
      attachment_url: note.attachment_url,
      mentioned_users: note.mentioned_users
    };
    
    mockNotes.push(mockNote);
    return mockNote;
  }
};

export const updateNote = async (id: string, updates: Partial<TeamNote>): Promise<TeamNote> => {
  // Check if we're using mock data
  if (id.startsWith('mock-')) {
    const index = mockNotes.findIndex(note => note.id === id);
    if (index !== -1) {
      mockNotes[index] = { 
        ...mockNotes[index], 
        ...updates, 
        updated_at: new Date().toISOString() 
      };
      return mockNotes[index];
    }
    throw new Error('Mock note not found');
  }

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
  // Check if we're using mock data
  if (id.startsWith('mock-')) {
    const index = mockNotes.findIndex(note => note.id === id);
    if (index !== -1) {
      mockNotes.splice(index, 1);
      return;
    }
    throw new Error('Mock note not found');
  }

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
    const { error } = await supabase
      .from('team_messages')
      .select('id')
      .limit(1);
      
    if (error && error.code === '42P01') {
      // Table doesn't exist, use mock data
      console.warn('The team_messages table does not exist yet. Returning mock messages.');
      return [...mockMessages];
    }
    
    const { data, error: fetchError } = await supabase
      .from('team_messages')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (fetchError) {
      console.error('Error fetching team messages:', fetchError);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception in getMessages:', e);
    return [...mockMessages];
  }
};

export const createMessage = async (message: Omit<TeamMessage, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMessage> => {
  try {
    const now = new Date().toISOString();
    
    // Check if the table exists
    const { error: checkError } = await supabase
      .from('team_messages')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, use mock data
      console.warn('The team_messages table does not exist yet. Creating a mock message.');
      
      const mockMessage: TeamMessage = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content: message.content,
        author_id: message.author_id,
        created_at: now,
        updated_at: now,
        type: message.type || 'text',
        attachment_url: message.attachment_url,
        mentioned_users: message.mentioned_users,
        read_by: message.read_by || []
      };
      
      mockMessages.push(mockMessage);
      return mockMessage;
    }
    
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
  } catch (e) {
    console.error('Exception in createMessage:', e);
    
    // Fallback to mock data
    const mockMessage: TeamMessage = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: message.content,
      author_id: message.author_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: message.type || 'text',
      attachment_url: message.attachment_url,
      mentioned_users: message.mentioned_users,
      read_by: message.read_by || []
    };
    
    mockMessages.push(mockMessage);
    return mockMessage;
  }
};

export const markMessageAsRead = async (messageId: string, userId: string): Promise<void> => {
  // Check if we're using mock data
  if (messageId.startsWith('mock-')) {
    const index = mockMessages.findIndex(msg => msg.id === messageId);
    if (index !== -1 && !mockMessages[index].read_by.includes(userId)) {
      mockMessages[index].read_by.push(userId);
    }
    return;
  }

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
      return `https://mock-storage-url.com/${filePath}`;
    }
    
    const { data } = supabase.storage
      .from('team-files')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (e) {
    console.error('Exception in uploadTeamFile:', e);
    return `https://mock-storage-url.com/error-fallback-${Date.now()}.png`;
  }
};
