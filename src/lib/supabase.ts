
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase-types';
import { UserProfile } from '@/types/supabase-types';

// Create a single supabase client for the entire app
const supabaseUrl = 'https://kfiergoryrnjkewmeriy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWVyZ29yeXJuamtld21lcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDk0NDMsImV4cCI6MjA1OTQyNTQ0M30.FJ2lWSSJBfGy3rUUmIYZwPMd6fFlBTO1xHjZrMwT_wY';

// Configure the Supabase client with proper auth settings
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});

// Authentication helpers
export const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
};

export const getProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: { first_name?: string; last_name?: string; avatar_url?: string }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
};
