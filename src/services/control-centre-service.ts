import { supabase } from '@/lib/supabase';
import { PermissionMatrix, ThemeSettings, TargetSettings } from '@/types/control-centre-types';

// Available fonts with added typewriter font - ensure Courier Prime is properly defined
export const availableFonts: { name: string; value: string }[] = [
  { name: 'Default System Font', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' },
  { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { name: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", system-ui, sans-serif' },
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Montserrat', value: 'Montserrat, system-ui, sans-serif' },
  { name: 'Poppins', value: 'Poppins, system-ui, sans-serif' },
  { name: 'Lato', value: 'Lato, system-ui, sans-serif' },
  { name: 'Courier Prime', value: '"Courier Prime", "Courier New", monospace' },
];

export const getControlCentreData = async () => {
  // Always default to Berry Purple theme, replacing any problematic themes
  const { data: themesData, error: themeError } = await supabase
    .from('themes')
    .select('*')
    .order('created_at');
  
  if (themeError) {
    console.error('Error fetching themes:', themeError);
  }
  
  // Get company name from company_settings table
  const { data: companySettingsData, error: companySettingsError } = await supabase
    .from('company_settings')
    .select('company_name')
    .eq('id', 1)
    .single();
    
  if (companySettingsError && companySettingsError.code !== 'PGRST116') {
    console.error('Error fetching company settings:', companySettingsError);
  }
  
  // Set proper company name, only convert if exactly "Hi" or "H i"
  const companyName = (companySettingsData?.company_name === 'Hi' || companySettingsData?.company_name === 'H i')
    ? 'Hospitality Intelligence' 
    : (companySettingsData?.company_name || 'Hospitality Intelligence');
  
  // Store company name in localStorage for persistence
  localStorage.setItem('company-name', companyName);
  console.log('Stored company name in localStorage:', companyName);
  
  // Check for problematic themes that need to be fixed
  const hiThemeIsActive = themesData?.some(theme => theme.name === 'Hi' && theme.is_active) || false;
  const tavernBlueThemeIsActive = themesData?.some(theme => theme.name === 'Tavern Blue' && theme.is_active) || false;
  
  // Find the Berry Purple theme
  const berryPurpleTheme = themesData?.find(theme => theme.name === 'Berry Purple');
  
  // If problematic theme is active, we need to fix that in the database
  if ((hiThemeIsActive || tavernBlueThemeIsActive) && berryPurpleTheme) {
    try {
      // Set all themes to inactive first
      await supabase
        .from('themes')
        .update({ is_active: false })
        .neq('id', 0);
      
      // Activate Berry Purple theme
      await supabase
        .from('themes')
        .update({ is_active: true })
        .eq('id', berryPurpleTheme.id);
      
      console.log('Switched active theme from problematic theme to Berry Purple in database');
    } catch (err) {
      console.error('Error updating theme activity:', err);
    }
  }
  
  // Transform database column names to match ThemeSettings interface
  const themes = themesData?.map(themeData => {
    // Force replace any problematic theme names with Berry Purple
    const safeName = ['Hi', 'Tavern Blue', 'Tavern', 'Custom Theme'].includes(themeData.name) 
      ? 'Berry Purple' 
      : themeData.name;
    
    return {
      id: themeData.id,
      name: safeName,
      primaryColor: themeData.primary_color || '#9d89c9',
      secondaryColor: themeData.secondary_color || '#f3e5f5',
      accentColor: themeData.accent_color || '#ab47bc',
      sidebarColor: themeData.sidebar_color || '#7e57c2',
      buttonColor: themeData.button_color || '#7e57c2',
      textColor: themeData.text_color || '#333333',
      logoUrl: themeData.logo_url,
      customFont: themeData.custom_font,
      isDefault: false,
      isActive: safeName === 'Berry Purple', // Force Berry Purple to be active
      companyName: companyName
    };
  }) || [];
  
  // Ensure Berry Purple theme is always considered active
  const currentTheme = themes.find(theme => theme.name === 'Berry Purple') || 
                       themes[0] || // Fallback to first theme if no Berry Purple
                       null;
  
  // Force save Berry Purple as active theme
  if (currentTheme) {
    localStorage.setItem('app-active-theme', 'Berry Purple');
    
    // Additional theme application logic
    if (typeof window !== 'undefined') {
      // Save all theme data for Berry Purple
      localStorage.setItem('custom-sidebar-color', currentTheme.sidebarColor);
      localStorage.setItem('theme-Berry Purple', JSON.stringify({
        primaryColor: currentTheme.primaryColor,
        secondaryColor: currentTheme.secondaryColor,
        accentColor: currentTheme.accentColor,
        sidebarColor: currentTheme.sidebarColor,
        buttonColor: currentTheme.buttonColor,
        textColor: currentTheme.textColor
      }));
    }
  }
  
  // Initialize database if needed
  
  // Get permission matrix from database
  const permissionMatrix = await getPermissionMatrix();
  
  // Fetch target settings from business_targets table
  const { data: targetData, error: targetError } = await supabase
    .from('business_targets')
    .select('*')
    .eq('id', 1)
    .single();
    
  let targetSettings: TargetSettings = {
    foodGpTarget: 68,
    beverageGpTarget: 72,
    wageCostTarget: 28,
  };
  
  if (targetData && !targetError) {
    targetSettings = {
      foodGpTarget: targetData.food_gp_target || 68,
      beverageGpTarget: targetData.beverage_gp_target || 72,
      wageCostTarget: targetData.wage_cost_target || 28,
    };
  } else if (targetError && targetError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" which is expected if no targets are set yet
    console.error('Error fetching target settings:', targetError);
  }
  
  return {
    permissionMatrix,
    currentTheme: currentTheme, // Ensure Berry Purple is always the current theme
    availableThemes: themes,
    targetSettings,
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

// Add a function to update target settings
export const updateTargetSettings = async (targetSettings: TargetSettings) => {
  try {
    // First check if record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('business_targets')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking business targets:', checkError);
      return { error: checkError };
    }
    
    let result;
    
    // Convert any potential string values to numbers
    const formattedSettings = {
      food_gp_target: Number(targetSettings.foodGpTarget),
      beverage_gp_target: Number(targetSettings.beverageGpTarget),
      wage_cost_target: Number(targetSettings.wageCostTarget)
    };
    
    if (!existingRecord) {
      // Insert new record with id=1 if it doesn't exist
      result = await supabase
        .from('business_targets')
        .insert({
          id: 1,
          ...formattedSettings
        });
    } else {
      // Update existing record
      result = await supabase
        .from('business_targets')
        .update(formattedSettings)
        .eq('id', 1);
    }
    
    if (result.error) {
      console.error('Error updating business targets:', result.error);
      return { error: result.error };
    }
    
    // Return updated data
    return { data: targetSettings, success: true };
  } catch (error) {
    console.error('Exception in updateTargetSettings:', error);
    return { error: error instanceof Error ? error : new Error('Unknown error') };
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
        { module_id: 'home', module_name: 'Home', module_type: 'home', display_order: 0 },
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
        // Home pages
        { module_id: 'home', page_id: 'home-dashboard', page_name: 'Dashboard', page_url: '/home/dashboard', display_order: 1 },
        
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
