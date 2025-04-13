
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
  birth_date?: string;
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
  birth_date?: string;
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

// Create a default GOD user profile for development
const defaultGodProfile: Profile = {
  id: 'dev-god-user',
  first_name: 'Developer',
  last_name: 'GOD',
  role: 'GOD',
  job_title: 'System Developer',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Developer',
  favourite_dish: 'Code Spaghetti',
  favourite_drink: 'Coffee',
  about_me: 'I am the supreme developer with access to everything!'
};

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initialize with the default GOD profile for development
  user: { id: 'dev-god-user', email: 'dev@example.com' },
  profile: defaultGodProfile,
  isAuthenticated: true, // Always authenticated in dev mode
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

      // In development mode, return to the default GOD user instead of actual logout
      console.log('Development mode: Returning to default GOD user instead of actual logout');
      set({
        user: { id: 'dev-god-user', email: 'dev@example.com' },
        profile: defaultGodProfile,
        isAuthenticated: true,
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
      console.log('Development mode: Loading default GOD user');
      // For development, always load the default GOD user
      set({
        user: { id: 'dev-god-user', email: 'dev@example.com' },
        profile: defaultGodProfile,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Comment out the actual Supabase auth code for development
      /*
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
      */
    } catch (error: any) {
      console.error('Error loading user:', error);
      // For development, still load the default GOD user even if there's an error
      set({
        user: { id: 'dev-god-user', email: 'dev@example.com' },
        profile: defaultGodProfile,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  },

  updateProfile: async (profileData) => {
    try {
      set({ isLoading: true, error: null });
      
      // In development mode, just update the local state without making Supabase calls
      if (get().user?.id === 'dev-god-user') {
        console.log('Development mode: Updating local GOD profile', profileData);
        const updatedProfile = {
          ...get().profile,
          ...profileData
        };
        set({
          profile: updatedProfile,
          isLoading: false,
        });
        return;
      }
      
      // For real users, update the profile in Supabase
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
