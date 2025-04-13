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

// Default Developer GOD ID - must be a valid UUID format
const DEV_GOD_ID = '00000000-0000-0000-0000-000000000000';

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initialize with null values instead of GOD profile
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  developerMode: false,

  clearError: () => set({ error: null }),
  
  enableDevMode: async () => {
    set({ isLoading: true });
    
    try {
      // First, check if the Developer GOD profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', DEV_GOD_ID)
        .single();
      
      // If profile doesn't exist, create it
      if (checkError || !existingProfile) {
        console.log('Developer GOD profile not found, creating it...');
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: DEV_GOD_ID,
            first_name: 'Developer',
            last_name: 'GOD',
            role: 'GOD',
            job_title: 'System Administrator',
            about_me: 'I am the Developer GOD account, used for system administration and testing.'
          })
          .select();
          
        if (insertError) {
          console.error('Error creating Developer GOD profile:', insertError);
          set({ 
            error: 'Failed to create Developer GOD profile',
            isLoading: false 
          });
          return;
        }
      }
      
      // Now fetch the profile (either existing or newly created)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', DEV_GOD_ID)
        .single();
      
      if (profileError) {
        console.error('Error loading Developer GOD profile:', profileError);
        set({ 
          error: 'Error loading developer profile', 
          isLoading: false 
        });
        return;
      }
      
      // Set the developer mode
      set({
        user: { id: DEV_GOD_ID, email: 'dev@example.com' },
        profile: profileData,
        isAuthenticated: true,
        isLoading: false,
        developerMode: true
      });
      localStorage.setItem('tavern-dev-mode', 'enabled');
    } catch (error) {
      console.error('Error enabling developer mode:', error);
      set({ 
        isLoading: false,
        error: 'Failed to enable developer mode'
      });
    }
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
      if (email === 'dev@example.com') {
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'dev_god_password')
          .single();
          
        if (settingsError) {
          console.error('Error fetching dev password:', settingsError);
          set({ error: 'Error verifying developer credentials', isLoading: false });
          return;
        }
        
        const storedPassword = settingsData?.value || 'password123';
        
        if (password === storedPassword) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000000')
            .single();
            
          if (profileError) {
            console.error('Error loading Developer GOD profile:', profileError);
            set({ error: 'Error loading developer profile', isLoading: false });
            return;
          }
          
          set({
            user: { id: '00000000-0000-0000-0000-000000000000', email: 'dev@example.com' },
            profile: profileData,
            isAuthenticated: true,
            isLoading: false,
            developerMode: true
          });
          localStorage.setItem('tavern-dev-mode', 'enabled');
          return;
        } else {
          set({ error: 'Invalid developer password', isLoading: false });
          return;
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

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
      
      const devMode = localStorage.getItem('tavern-dev-mode') === 'enabled';
      
      if (devMode) {
        console.log('Development mode enabled: Loading default GOD user');
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', DEV_GOD_ID)
          .single();
          
        if (profileError) {
          console.error('Error loading Developer GOD profile:', profileError);
          set({ 
            developerMode: false,
            isLoading: false
          });
          return;
        }
        
        set({
          user: { id: DEV_GOD_ID, email: 'dev@example.com' },
          profile: profileData,
          isAuthenticated: true,
          isLoading: false,
          developerMode: true
        });
        return;
      }
      
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
      
      if (get().developerMode) {
        console.log('Development mode: Updating GOD profile', profileData);
        
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', '00000000-0000-0000-0000-000000000000');
          
        if (error) {
          set({ error: error.message, isLoading: false });
          return;
        }
        
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000000')
          .single();
          
        set({
          profile: updatedProfile,
          isLoading: false,
        });
        return;
      }
      
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
