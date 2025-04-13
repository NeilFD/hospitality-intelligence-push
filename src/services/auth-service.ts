import { supabase, signIn, signUp, signOut, getCurrentUser, getProfile } from '@/lib/supabase';
import { UserProfile } from '@/types/supabase-types';
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

export type AuthServiceRole = 'GOD' | 'Super User' | 'Manager' | 'Team Member';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loadUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    firstName?: string;
    lastName?: string;
    role?: AuthServiceRole;
    avatarUrl?: string;
    jobTitle?: string;
    birthDate?: string | null;
    favouriteDish?: string;
    favouriteDrink?: string;
    aboutMe?: string;
  }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

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
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          role: updates.role,
          avatar_url: updates.avatarUrl,
          job_title: updates.jobTitle,
          birth_date_month: updates.birthDate,
          favourite_dish: updates.favouriteDish,
          favourite_drink: updates.favouriteDrink,
          about_me: updates.aboutMe
        })
        .eq('id', user.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        set((state) => ({
          ...state,
          profile: {
            ...state.profile,
            first_name: updates.firstName || state.profile?.first_name || '',
            last_name: updates.lastName || state.profile?.last_name || '',
            role: updates.role || state.profile?.role,
            avatar_url: updates.avatarUrl || state.profile?.avatar_url,
            job_title: updates.jobTitle || state.profile?.job_title,
            birth_date: updates.birthDate || state.profile?.birth_date,
            favourite_dish: updates.favouriteDish || state.profile?.favourite_dish,
            favourite_drink: updates.favouriteDrink || state.profile?.favourite_drink,
            about_me: updates.aboutMe || state.profile?.about_me
          } as UserProfile
        }));
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.message);
    }
  },
  
  clearError: () => set({ error: null })
}));

useAuthStore.getState().loadUser();

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
