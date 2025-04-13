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
  developerMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (profileData: UpdateProfileData) => Promise<void>;
  clearError: () => void;
  enableDevMode: () => void;
  disableDevMode: () => void;
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
  // Initialize with null values instead of GOD profile
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  developerMode: false,

  clearError: () => set({ error: null }),
  
  enableDevMode: () => {
    set({
      user: { id: 'dev-god-user', email: 'dev@example.com' },
      profile: defaultGodProfile,
      isAuthenticated: true,
      isLoading: false,
      developerMode: true
    });
    localStorage.setItem('tavern-dev-mode', 'enabled');
  },
  
  disableDevMode: () => {
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      developerMode: false
    });
    localStorage.setItem('tavern-dev-mode', 'disabled');
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      // Dev mode login check
      if (email === 'dev@example.com' && password === (localStorage.getItem('dev-god-password') || 'password123')) {
        set({
          user: { id: 'dev-god-user', email: 'dev@example.com' },
          profile: defaultGodProfile,
          isAuthenticated: true,
          isLoading: false,
          developerMode: true
        });
        localStorage.setItem('tavern-dev-mode', 'enabled');
        return;
      }
      
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
          developerMode: false
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
        developerMode: false
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
      
      // Check if in developer mode
      if (get().developerMode) {
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          developerMode: false
        });
        localStorage.setItem('tavern-dev-mode', 'disabled');
        return;
      }
      
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
        developerMode: false
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
      
      // Check if dev mode was previously enabled
      const devMode = localStorage.getItem('tavern-dev-mode') === 'enabled';
      
      // If dev mode is enabled, load the GOD user
      if (devMode) {
        console.log('Development mode enabled: Loading default GOD user');
        set({
          user: { id: 'dev-god-user', email: 'dev@example.com' },
          profile: defaultGodProfile,
          isAuthenticated: true,
          isLoading: false,
          developerMode: true
        });
        return;
      }
      
      // Otherwise, check for a real Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ 
          user: null,
          profile: null,
          isAuthenticated: false, 
          isLoading: false,
          developerMode: false 
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ 
          user: null,
          profile: null,
          isAuthenticated: false, 
          isLoading: false,
          developerMode: false 
        });
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
        developerMode: false
      });
    } catch (error: any) {
      console.error('Error loading user:', error);
      set({ 
        user: null,
        profile: null,
        isAuthenticated: false, 
        isLoading: false,
        developerMode: false 
      });
    }
  },

  updateProfile: async (profileData) => {
    try {
      set({ isLoading: true, error: null });
      
      // In development mode, just update the local state without making Supabase calls
      if (get().developerMode) {
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
