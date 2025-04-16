import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/supabase-types';

// Auth Service Role Type
export type AuthServiceRole = 'GOD' | 'Super User' | 'Manager' | 'Team Member' | 'Owner';

// Auth Store State Interface
interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loadUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  clearError: () => void;
}

// Create Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Load user from Supabase session
      loadUser: async () => {
        set({ isLoading: true });
        try {
          // Check current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;
          
          if (!session) {
            set({ 
              user: null, 
              profile: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
            return;
          }
          
          // Get current user from session
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) throw userError;
          
          // If we have a user, get their profile
          if (user) {
            // Get additional profile info
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
              
            if (profileError) {
              console.error('Error fetching profile:', profileError);
              
              // If no profile found, create a simple one as fallback
              if (profileError.code === 'PGRST116') {
                console.log('Profile not found, attempting to create one...');
                try {
                  const userData = user.user_metadata || {};
                  
                  // Create a simple profile with just the essentials
                  const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                      id: user.id,
                      first_name: userData.first_name || '',
                      last_name: userData.last_name || '',
                      role: userData.role || 'Team Member',
                      email: user.email
                    })
                    .select('*')
                    .single();
                    
                  if (createError) {
                    console.error('Error creating profile:', createError);
                    set({ isLoading: false, error: createError.message });
                    return;
                  } else {
                    console.log('Created new profile:', newProfile);
                    set({ 
                      user, 
                      profile: newProfile as UserProfile, 
                      isAuthenticated: true,
                      isLoading: false 
                    });
                    return;
                  }
                } catch (err) {
                  console.error('Exception creating profile:', err);
                }
              }
              
              // We couldn't find or create a profile, but we still have a valid auth user
              // Let's proceed with authentication but with a null profile
              set({ 
                user, 
                profile: null, 
                isAuthenticated: true,
                isLoading: false 
              });
              return;
            }
            
            set({ 
              user, 
              profile: profile as UserProfile, 
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            set({ 
              user: null, 
              profile: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error: any) {
          console.error('Error loading user:', error);
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: error.message 
          });
        }
      },
      
      // Login with email and password
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) throw error;
          
          // After successful login, load the user profile
          await get().loadUser();
          
        } catch (error: any) {
          console.error('Error logging in:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to login. Please check your credentials and try again.'
          });
        }
      },
      
      // Register a new user
      register: async (email: string, password: string, firstName: string, lastName: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                first_name: firstName,
                last_name: lastName,
                email: email
              }
            }
          });
          
          if (error) throw error;
          
          // If sign up successful, load the user profile
          // The database trigger should have created the profile
          await get().loadUser();
          
        } catch (error: any) {
          console.error('Error registering:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to register. Please try again.' 
          });
        }
      },
      
      // Logout user
      logout: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signOut();
          
          if (error) throw error;
          
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Error logging out:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to logout. Please try again.' 
          });
        }
      },
      
      // Update user profile
      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) throw new Error("No user logged in");
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();
          
          if (error) throw error;
          
          set({ profile: data as UserProfile });
          return data as UserProfile;
        } catch (error: any) {
          console.error('Error updating profile:', error);
          throw error;
        }
      },
      
      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage'
    }
  )
);
