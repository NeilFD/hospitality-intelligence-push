
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
    'theme-hi-theme'
  ];
  
  // Remove all Hi-related theme classes
  themeClasses.forEach(cls => {
    html.classList.remove(cls);
  });
  
  // Force Berry Purple theme
  html.classList.add('theme-berry-purple');
  
  // Update localStorage settings
  const savedTheme = localStorage.getItem('app-active-theme');
  if (savedTheme === 'Hi' || savedTheme === 'H i') {
    console.log('Fixing localStorage theme from', savedTheme, 'to Berry Purple');
    localStorage.setItem('app-active-theme', 'Berry Purple');
  }
  
  // Fix company name in localStorage
  const companyName = localStorage.getItem('company-name');
  if (companyName === 'Hi' || companyName === 'H i') {
    console.log('Fixing localStorage company name from', companyName, 'to Hospitality Intelligence');
    localStorage.setItem('company-name', 'Hospitality Intelligence');
  }
  
  // Fix company name in database through event
  const companyNameUpdateEvent = new CustomEvent('company-name-updated', {
    detail: { companyName: 'Hospitality Intelligence' }
  });
  window.dispatchEvent(companyNameUpdateEvent);
  
  // Force theme update event
  const themeUpdateEvent = new CustomEvent('app-theme-updated', {
    detail: { theme: { name: 'Berry Purple' } }
  });
  window.dispatchEvent(themeUpdateEvent);
  
  // Return true to indicate successful execution
  console.log('Enhanced theme fixer executed');
  return true;
}

// Run a database fix function after a delay to ensure database connection is ready
export function runDatabaseFix() {
  setTimeout(async () => {
    try {
      // Import the supabase client
      const { supabase } = await import('@/lib/supabase');
      
      // Fix company name in company_settings table
      const { error: companyError } = await supabase
        .from('company_settings')
        .update({ company_name: 'Hospitality Intelligence' })
        .eq('id', 1);
      
      if (companyError) {
        console.error('Error fixing company name in database:', companyError);
      } else {
        console.log('Successfully fixed company name in database');
      }
      
      // Get Berry Purple theme ID
      const { data: berryThemeData } = await supabase
        .from('themes')
        .select('id')
        .eq('name', 'Berry Purple')
        .single();
      
      if (berryThemeData) {
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
      
      // Force application to use updated theme
      const themeUpdateEvent = new CustomEvent('app-theme-updated', {
        detail: { theme: { name: 'Berry Purple' } }
      });
      window.dispatchEvent(themeUpdateEvent);
      
    } catch (error) {
      console.error('Error in database fix:', error);
    }
  }, 2000); // Wait 2 seconds for DB connection to be ready
}
