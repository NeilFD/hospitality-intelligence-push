
// This file completely removes the "Hi" theme from all possible locations

// Function to run on app initialization
export function fixHiTheme() {
  console.log('Running enhanced Hi theme fixer...');
  
  // Get HTML element and localStorage
  const html = document.documentElement;
  
  // Clean up ALL possible theme classes
  const themeClasses = [
    'theme-hi',
    'theme-hi-purple',
    'hi',
    'theme-hi-theme',
    'theme-tavern-blue', // Remove Tavern Blue
    'theme-purple-700'   // Don't remove custom theme class - we'll handle it separately
  ];
  
  // Remove only Hi-related and Tavern Blue theme classes, but preserve custom themes
  themeClasses.forEach(cls => {
    if (cls !== 'theme-purple-700') { // Keep custom theme class if present
      html.classList.remove(cls);
    }
  });
  
  // Only force Berry Purple theme if we're currently using Hi or Tavern Blue
  const currentTheme = localStorage.getItem('app-active-theme');
  if (currentTheme === 'Hi' || currentTheme === 'H i' || currentTheme === 'Tavern Blue') {
    html.classList.add('theme-berry-purple');
    
    // Update localStorage settings
    console.log('Fixing localStorage theme from', currentTheme, 'to Berry Purple');
    localStorage.setItem('app-active-theme', 'Berry Purple');
  }
  
  // Fix company name in localStorage only if it's exactly "Hi" or "H i"
  const companyName = localStorage.getItem('company-name');
  if (companyName === 'Hi' || companyName === 'H i') {
    console.log('Fixing localStorage company name from', companyName, 'to Hospitality Intelligence');
    localStorage.setItem('company-name', 'Hospitality Intelligence');
  }
  
  // Fix company name in database through event only if it's exactly "Hi" or "H i"
  const companyNameUpdateEvent = new CustomEvent('company-name-updated', {
    detail: { companyName: 'Hospitality Intelligence' }
  });
  window.dispatchEvent(companyNameUpdateEvent);
  
  // Only force theme update event if we're using Hi or Tavern Blue
  if (currentTheme === 'Hi' || currentTheme === 'H i' || currentTheme === 'Tavern Blue') {
    const themeUpdateEvent = new CustomEvent('app-theme-updated', {
      detail: { theme: { name: 'Berry Purple' } }
    });
    window.dispatchEvent(themeUpdateEvent);
  }
  
  // Apply custom theme CSS variable support
  applyCustomThemeSupport();
  
  // Return true to indicate successful execution
  console.log('Enhanced theme fixer executed');
  return true;
}

// Apply CSS variables for custom themes
function applyCustomThemeSupport() {
  const styleId = 'custom-theme-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      /* Custom theme variables application */
      .theme-purple-700 .sidebar {
        background-color: var(--custom-sidebar-color, #9C27B0);
      }
      .theme-purple-700 .bg-primary {
        background-color: var(--custom-primary-color, #6a1b9a);
      }
      .theme-purple-700 .text-primary {
        color: var(--custom-primary-color, #6a1b9a);
      }
      .theme-purple-700 .border-primary {
        border-color: var(--custom-primary-color, #6a1b9a);
      }
      .theme-purple-700 .hover\\:bg-primary:hover {
        background-color: var(--custom-primary-color, #6a1b9a);
      }
      /* Add more custom theme CSS variables as needed */
    `;
    document.head.appendChild(style);
    console.log('Added custom theme styles to document head');
  }
}

// Run a database fix function after a delay to ensure database connection is ready
export function runDatabaseFix() {
  setTimeout(async () => {
    try {
      // Import the supabase client
      const { supabase } = await import('@/lib/supabase');
      
      // Fix company name in company_settings table only if it's exactly "Hi"
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('company_name')
        .eq('id', 1)
        .single();
        
      if (companySettings && (companySettings.company_name === 'Hi' || companySettings.company_name === 'H i')) {
        const { error: companyError } = await supabase
          .from('company_settings')
          .update({ company_name: 'Hospitality Intelligence' })
          .eq('id', 1);
        
        if (companyError) {
          console.error('Error fixing company name in database:', companyError);
        } else {
          console.log('Successfully fixed company name in database');
        }
      }
      
      // Get Berry Purple theme ID
      const { data: berryThemeData } = await supabase
        .from('themes')
        .select('id')
        .eq('name', 'Berry Purple')
        .single();
      
      if (berryThemeData) {
        // Only activate Berry Purple theme if current active theme is Tavern Blue or Hi
        const { data: activeTheme } = await supabase
          .from('themes')
          .select('id, name')
          .eq('is_active', true)
          .single();
          
        if (activeTheme && (activeTheme.name === 'Tavern Blue' || activeTheme.name === 'Hi')) {
          // Deactivate all themes
          await supabase
            .from('themes')
            .update({ is_active: false })
            .neq('id', 0);
            
          // Activate Berry Purple theme
          const { error: themeError } = await supabase
            .from('themes')
            .update({ is_active: true })
            .eq('id', berryThemeData.id);
          
          if (themeError) {
            console.error('Error setting Berry Purple as active in database:', themeError);
          } else {
            console.log('Successfully set Berry Purple as active in database');
          }
        } else {
          console.log('Keeping current active theme:', activeTheme?.name);
        }
      }
      
      // Update or delete Hi theme if it exists
      const { data: hiThemeData } = await supabase
        .from('themes')
        .select('id')
        .eq('name', 'Hi')
        .single();
      
      if (hiThemeData) {
        // Rename Hi theme to Berry Purple to avoid any future issues
        const { error: renameError } = await supabase
          .from('themes')
          .update({ 
            name: 'Berry Purple (backup)', 
            is_active: false,
            company_name: 'Hospitality Intelligence'
          })
          .eq('id', hiThemeData.id);
        
        if (renameError) {
          console.error('Error renaming Hi theme in database:', renameError);
        } else {
          console.log('Successfully renamed Hi theme in database');
        }
      }
      
      // Check for and delete any 'Tavern Blue' themes
      const { data: tavernBlueThemeData } = await supabase
        .from('themes')
        .select('id')
        .eq('name', 'Tavern Blue')
        .single();
      
      if (tavernBlueThemeData) {
        // Delete Tavern Blue theme completely
        const { error: deleteError } = await supabase
          .from('themes')
          .delete()
          .eq('id', tavernBlueThemeData.id);
        
        if (deleteError) {
          console.error('Error deleting Tavern Blue theme from database:', deleteError);
          
          // If we can't delete, rename it and deactivate
          const { error: renameError } = await supabase
            .from('themes')
            .update({ 
              name: 'Berry Purple (converted)', 
              is_active: false
            })
            .eq('id', tavernBlueThemeData.id);
          
          if (!renameError) {
            console.log('Renamed Tavern Blue theme in database since it could not be deleted');
          }
        } else {
          console.log('Successfully deleted Tavern Blue theme from database');
        }
      }
      
      // Don't force application theme update here - let the current theme remain
      
    } catch (error) {
      console.error('Error in database fix:', error);
    }
  }, 2000); // Wait 2 seconds for DB connection to be ready
}
