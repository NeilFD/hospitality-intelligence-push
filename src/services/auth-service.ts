
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
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
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
      set({
        user: null,
        profile: null,
        error: error.message || 'Failed to load user',
        isLoading: false,
        isAuthenticated: false
      });
    }
  },
  
  clearError: () => set({ error: null })
}));

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
