// Import statement for Json type from Supabase
import { Json } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface PagePermission {
  pageId: string;
  pageName: string;
  pageUrl: string;
  hasAccess: boolean;
}

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  moduleType: string;
  hasAccess: boolean;
  pagePermissions: PagePermission[];
}

export interface PermissionMatrix {
  roleId: string;
  modulePermissions: ModulePermission[];
}

export type ThemeSettings = {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  button_color: string;
  sidebar_color: string;
  company_name: string;
  is_active: boolean;
  logo_url?: string;
  custom_font?: string;
  id?: string;
};

export async function fetchUserMatrix(): Promise<PermissionMatrix[]> {
  try {
    const response = await supabase.rpc('get_permission_matrix');
    
    if (response.error) {
      console.error('Error fetching user matrix:', response.error);
      return [];
    }
    
    // Cast the data to the correct type
    return response.data as unknown as PermissionMatrix[];
  } catch (error) {
    console.error('Error in fetchUserMatrix:', error);
    return [];
  }
}

export async function saveUserMatrix(matrix: PermissionMatrix[]): Promise<boolean> {
  try {
    const response = await supabase.rpc('update_permission_matrix', {
      matrix: matrix as unknown as Json
    });
    
    if (response.error) {
      console.error('Error saving user matrix:', response.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveUserMatrix:', error);
    return false;
  }
}

export async function fetchThemeSettings(): Promise<ThemeSettings[]> {
  try {
    const { data, error } = await supabase
      .from('theme_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching theme settings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching theme settings:', error);
    return [];
  }
}

export async function createThemeSetting(theme: Omit<ThemeSettings, 'id'>): Promise<ThemeSettings | null> {
  try {
    const { data, error } = await supabase
      .from('theme_settings')
      .insert([theme])
      .select()
      .single();

    if (error) {
      console.error('Error creating theme setting:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error creating theme setting:', error);
    return null;
  }
}

export async function updateThemeSetting(id: string, updates: Partial<ThemeSettings>): Promise<ThemeSettings | null> {
  try {
    const { data, error } = await supabase
      .from('theme_settings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating theme setting:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error updating theme setting:', error);
    return null;
  }
}

export async function deleteThemeSetting(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('theme_settings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting theme setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting theme setting:', error);
    return false;
  }
}
