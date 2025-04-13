
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// Define the types
export type AuthServiceRole = 'GOD' | 'Super User' | 'Manager' | 'Team Member';

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  job_title?: string;
  favourite_dish?: string;
  favourite_drink?: string;
  about_me?: string;
  role?: AuthServiceRole;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  job_title?: string;
  favourite_dish?: string;
  favourite_drink?: string;
  about_me?: string;
  role?: AuthServiceRole;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (profileData: UpdateProfileData) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      // Load profile data
      if (data?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: data.user,
          profile: profileData,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'An error occurred during login', 
        isLoading: false 
      });
    }
  },

  register: async (email, password, firstName, lastName) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      set({
        user: data?.user || null,
        isAuthenticated: !!data?.user,
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'An error occurred during registration', 
        isLoading: false 
      });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'An error occurred during logout', 
        isLoading: false 
      });
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      set({
        user,
        profile: profileData,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to load user data', 
        isLoading: false,
        isAuthenticated: false
      });
    }
  },

  updateProfile: async (profileData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { user } = get();
      
      if (!user) {
        set({ error: 'Not authenticated', isLoading: false });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      // Reload the profile data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      set({
        profile: updatedProfile,
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update profile', 
        isLoading: false 
      });
    }
  },
}));
