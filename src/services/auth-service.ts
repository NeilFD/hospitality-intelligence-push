
import { supabase, signIn, signUp, signOut, getCurrentUser, getProfile } from '@/lib/supabase';
import { UserProfile } from '@/types/supabase-types';
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (updates: { firstName?: string; lastName?: string; role?: 'Owner' | 'Head Chef' | 'Staff'; avatarUrl?: string }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true, // Start with loading true so we can check for existing session
  error: null,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await signIn(email, password);
      
      if (error) throw error;
      
      if (data.user) {
        const profile = await getProfile(data.user.id);
        set({ 
          user: data.user, 
          profile, 
          isAuthenticated: true, 
          isLoading: false 
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to sign in', 
        isLoading: false,
        isAuthenticated: false
      });
    }
  },
  
  register: async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName
      });
      
      if (error) throw error;
      
      set({ 
        isLoading: false,
        // Note: User may need to verify email before being authenticated
        isAuthenticated: data.user !== null && !data.user.email_confirmed_at
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign up',
        isLoading: false,
        isAuthenticated: false
      });
    }
  },
  
  logout: async () => {
    try {
      set({ isLoading: true });
      await signOut();
      set({ 
        user: null, 
        profile: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign out',
        isLoading: false
      });
    }
  },
  
  loadUser: async () => {
    try {
      set({ isLoading: true });
      
      const user = await getCurrentUser();
      
      if (!user) {
        set({ 
          user: null, 
          profile: null,
          isAuthenticated: false, 
          isLoading: false 
        });
        return;
      }
      
      const profile = await getProfile(user.id);
      
      set({ 
        user, 
        profile, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Failed to load user:', error);
      set({
        user: null,
        profile: null,
        error: error.message || 'Failed to load user',
        isLoading: false,
        isAuthenticated: false
      });
    }
  },
  
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ isLoading: true });
      
      const updateData = {
        first_name: updates.firstName,
        last_name: updates.lastName,
        role: updates.role,
        avatar_url: updates.avatarUrl
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Reload user data to get the updated profile
      await get().loadUser();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update profile',
        isLoading: false
      });
    }
  },
  
  clearError: () => set({ error: null })
}));

// Initialize auth state on store creation
// This will check for existing session on app load
useAuthStore.getState().loadUser();

// Setup auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    useAuthStore.getState().loadUser();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ 
      user: null, 
      profile: null, 
      isAuthenticated: false 
    });
  }
});
