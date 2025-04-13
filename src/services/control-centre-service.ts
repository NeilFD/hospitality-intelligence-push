
import { supabase } from '@/lib/supabase';
import { PermissionMatrix, ThemeSettings, TargetSettings } from '@/types/control-centre-types';

// Available fonts remain the same
export const availableFonts: { name: string; value: string }[] = [
  { name: 'Default System Font', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' },
  { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { name: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", system-ui, sans-serif' },
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Montserrat', value: 'Montserrat, system-ui, sans-serif' },
  { name: 'Poppins', value: 'Poppins, system-ui, sans-serif' },
  { name: 'Lato', value: 'Lato, system-ui, sans-serif' },
];

// Modify getControlCentreData to fetch themes from database
export const getControlCentreData = async () => {
  // Initialize database if needed
  
  // Get permission matrix from database
  const permissionMatrix = await getPermissionMatrix();
  
  // Fetch current active theme and available themes
  const { data: themesData, error: themeError } = await supabase
    .from('themes')
    .select('*')
    .order('created_at');
  
  if (themeError) {
    console.error('Error fetching themes:', themeError);
  }
  
  // Transform database column names to match ThemeSettings interface
  const themes = themesData?.map(themeData => ({
    id: themeData.id,
    name: themeData.name,
    primaryColor: themeData.primary_color,
    secondaryColor: themeData.secondary_color,
    accentColor: themeData.accent_color,
    sidebarColor: themeData.sidebar_color,
    buttonColor: themeData.button_color,
    textColor: themeData.text_color,
    logoUrl: themeData.logo_url,
    customFont: themeData.custom_font,
    isDefault: false, // Not in DB schema but in interface
    isActive: themeData.is_active
  })) || [];
  
  const currentTheme = themes.find(theme => theme.isActive) || null;
  
  return {
    permissionMatrix,
    currentTheme,
    availableThemes: themes,
    targetSettings: {
      foodGpTarget: 68,
      beverageGpTarget: 72,
      wageCostTarget: 28,
    },
  };
};

// Helper function to get permission matrix from database
export const getPermissionMatrix = async (): Promise<PermissionMatrix[]> => {
  try {
    const { data, error } = await supabase.rpc('get_permission_matrix');
    
    if (error) {
      console.error('Error getting permission matrix:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getPermissionMatrix:', error);
    return [];
  }
};

// Helper function to update permission matrix in database
export const updatePermissionMatrix = async (permissionMatrix: PermissionMatrix[]): Promise<void> => {
  try {
    const { error } = await supabase.rpc('update_permission_matrix', {
      matrix: permissionMatrix
    });
    
    if (error) {
      console.error('Error updating permission matrix:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updatePermissionMatrix:', error);
    throw error;
  }
};

// Initialize basic data if needed
const initializeControlCentreDatabase = async () => {
  try {
    // Check if modules table is empty
    const { data: modulesCheck, error: modulesError } = await supabase
      .from('permission_modules')
      .select('module_id')
      .limit(1);
    
    // If empty, populate with default modules and pages
    if (!modulesError && (!modulesCheck || modulesCheck.length === 0)) {
      console.log('Initializing permission modules and pages...');
      
      // Define default modules
      const modules = [
        { module_id: 'food', module_name: 'Food Hub', module_type: 'food', display_order: 1 },
        { module_id: 'beverage', module_name: 'Beverage Hub', module_type: 'beverage', display_order: 2 },
        { module_id: 'pl', module_name: 'P&L', module_type: 'pl', display_order: 3 },
        { module_id: 'wages', module_name: 'Wages', module_type: 'wages', display_order: 4 },
        { module_id: 'performance', module_name: 'Performance', module_type: 'performance', display_order: 5 },
        { module_id: 'team', module_name: 'Team', module_type: 'team', display_order: 6 },
      ];
      
      // Insert modules
      const { error: insertModulesError } = await supabase
        .from('permission_modules')
        .insert(modules);
      
      if (insertModulesError) {
        console.error('Error inserting modules:', insertModulesError);
        return;
      }
      
      // Define pages for each module
      const pages = [
        // Food Hub pages
        { module_id: 'food', page_id: 'food-dashboard', page_name: 'Dashboard', page_url: '/food/dashboard', display_order: 1 },
        { module_id: 'food', page_id: 'food-input-settings', page_name: 'Input Settings', page_url: '/food/input-settings', display_order: 2 },
        { module_id: 'food', page_id: 'food-month-summary', page_name: 'Month Summary', page_url: '/food/month/{year}/{month}', display_order: 3 },
        { module_id: 'food', page_id: 'food-annual-summary', page_name: 'Annual Summary', page_url: '/food/annual-summary', display_order: 4 },
        { module_id: 'food', page_id: 'food-bible', page_name: 'Food Bible', page_url: '/food/bible', display_order: 5 },
        
        // Beverage Hub pages
        { module_id: 'beverage', page_id: 'beverage-dashboard', page_name: 'Dashboard', page_url: '/beverage/dashboard', display_order: 1 },
        { module_id: 'beverage', page_id: 'beverage-input-settings', page_name: 'Input Settings', page_url: '/beverage/input-settings', display_order: 2 },
        { module_id: 'beverage', page_id: 'beverage-month-summary', page_name: 'Month Summary', page_url: '/beverage/month/{year}/{month}', display_order: 3 },
        { module_id: 'beverage', page_id: 'beverage-annual-summary', page_name: 'Annual Summary', page_url: '/beverage/annual-summary', display_order: 4 },
        { module_id: 'beverage', page_id: 'beverage-bible', page_name: 'Beverage Bible', page_url: '/beverage/bible', display_order: 5 },
        
        // P&L pages
        { module_id: 'pl', page_id: 'pl-dashboard', page_name: 'Dashboard', page_url: '/pl/dashboard', display_order: 1 },
        
        // Wages pages
        { module_id: 'wages', page_id: 'wages-dashboard', page_name: 'Dashboard', page_url: '/wages/dashboard', display_order: 1 },
        
        // Performance pages
        { module_id: 'performance', page_id: 'performance-dashboard', page_name: 'Dashboard', page_url: '/performance/dashboard', display_order: 1 },
        
        // Team pages
        { module_id: 'team', page_id: 'team-dashboard', page_name: 'Dashboard', page_url: '/team/dashboard', display_order: 1 },
        { module_id: 'team', page_id: 'team-noticeboard', page_name: 'Noticeboard', page_url: '/team/noticeboard', display_order: 2 },
        { module_id: 'team', page_id: 'team-chat', page_name: 'Team Chat', page_url: '/team/chat', display_order: 3 },
        { module_id: 'team', page_id: 'team-knowledge', page_name: 'Knowledge Base', page_url: '/team/knowledge', display_order: 4 },
      ];
      
      // Insert pages
      const { error: insertPagesError } = await supabase
        .from('permission_pages')
        .insert(pages);
      
      if (insertPagesError) {
        console.error('Error inserting pages:', insertPagesError);
        return;
      }
      
      // Set default access for GOD and Super User roles
      const accessEntries = [];
      
      for (const module of modules) {
        // GOD role - full access
        accessEntries.push({
          role_id: 'GOD',
          module_id: module.module_id,
          has_access: true
        });
        
        // Super User role - full access
        accessEntries.push({
          role_id: 'Super User',
          module_id: module.module_id,
          has_access: true
        });
        
        // Manager role - access to all modules by default
        accessEntries.push({
          role_id: 'Manager',
          module_id: module.module_id,
          has_access: true
        });
        
        // Team Member role - limited access
        accessEntries.push({
          role_id: 'Team Member',
          module_id: module.module_id,
          has_access: module.module_id === 'team' ? true : false
        });
      }
      
      // Insert module access
      const { error: insertAccessError } = await supabase
        .from('permission_access')
        .insert(accessEntries);
      
      if (insertAccessError) {
        console.error('Error inserting access entries:', insertAccessError);
        return;
      }
      
      // Set default page access
      const pageAccessEntries = [];
      
      for (const page of pages) {
        // GOD role - full access to all pages
        pageAccessEntries.push({
          role_id: 'GOD',
          page_id: page.page_id,
          has_access: true
        });
        
        // Super User role - full access to all pages
        pageAccessEntries.push({
          role_id: 'Super User',
          page_id: page.page_id,
          has_access: true
        });
        
        // Manager role - access to all pages by default
        pageAccessEntries.push({
          role_id: 'Manager',
          page_id: page.page_id,
          has_access: true
        });
        
        // Team Member role - access only to team pages
        pageAccessEntries.push({
          role_id: 'Team Member',
          page_id: page.page_id,
          has_access: page.module_id === 'team' ? true : false
        });
      }
      
      // Insert page access
      const { error: insertPageAccessError } = await supabase
        .from('permission_page_access')
        .insert(pageAccessEntries);
      
      if (insertPageAccessError) {
        console.error('Error inserting page access entries:', insertPageAccessError);
      }
    }
  } catch (error) {
    console.error('Error initializing control centre database:', error);
  }
};
