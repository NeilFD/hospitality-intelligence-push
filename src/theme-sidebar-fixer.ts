
/**
 * This module ensures that custom theme colors are correctly applied to the sidebar
 * It runs automatically when imported and monitors theme changes to update the sidebar color
 */

const applySidebarColor = () => {
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  // Find all sidebar elements
  const sidebarElements = document.querySelectorAll('.sidebar');
  if (!sidebarElements || sidebarElements.length === 0) return;
  
  const html = document.documentElement;
  
  // First check for active theme name in localStorage
  const activeName = localStorage.getItem('app-active-theme');
  
  // If we have a theme name, check for its specific color data first
  if (activeName) {
    console.log('Theme-sidebar-fixer: Looking for theme data for:', activeName);
    
    // Handle NFD theme name specially with highest priority
    if (activeName === 'NFD' || activeName === 'NFD Theme') {
      const nfdColor = '#ec193a';
      console.log('Theme-sidebar-fixer: Applied NFD theme color:', nfdColor);
      
      // Store the color in localStorage for consistent access
      localStorage.setItem('custom-sidebar-color', nfdColor);
      
      // Apply to all sidebar elements with !important flag
      sidebarElements.forEach(sidebar => {
        (sidebar as HTMLElement).style.setProperty('background-color', nfdColor, 'important');
      });
      
      // Also set CSS variables with !important flag
      html.style.setProperty('--custom-sidebar-color', nfdColor, 'important');
      html.style.setProperty('--sidebar-color', nfdColor, 'important');
      
      // Update html class for NFD theme and remove other theme classes
      const themeClasses = [
        'theme-forest-green', 
        'theme-ocean-blue', 
        'theme-sunset-orange', 
        'theme-berry-purple', 
        'theme-dark-mode',
        'theme-purple-700'
      ];
      
      themeClasses.forEach(cls => {
        html.classList.remove(cls);
      });
      
      html.classList.add('theme-nfd-theme');
      
      // Force update CSS variables to ensure they take precedence
      document.body.setAttribute('style', `--custom-sidebar-color: ${nfdColor} !important; --sidebar-color: ${nfdColor} !important;`);
      
      // Trigger theme changed events
      document.dispatchEvent(new Event('themeClassChanged'));
      window.dispatchEvent(new CustomEvent('app-theme-updated', {
        detail: { 
          colors: { sidebarColor: nfdColor }
        }
      }));
      
      return;
    }
    
    // For other named themes, try to get stored theme data
    const themeData = localStorage.getItem(`theme-${activeName}`);
    if (themeData) {
      try {
        const parsedData = JSON.parse(themeData);
        if (parsedData && parsedData.sidebarColor) {
          console.log('Theme-sidebar-fixer: Found color for theme in localStorage:', parsedData.sidebarColor);
          
          // Store the color in localStorage for consistent access
          localStorage.setItem('custom-sidebar-color', parsedData.sidebarColor);
          
          // Apply to all sidebar elements with !important flag
          sidebarElements.forEach(sidebar => {
            (sidebar as HTMLElement).style.setProperty('background-color', parsedData.sidebarColor, 'important');
          });
          
          // Also set CSS variables with !important flag
          html.style.setProperty('--custom-sidebar-color', parsedData.sidebarColor, 'important');
          html.style.setProperty('--sidebar-color', parsedData.sidebarColor, 'important');
          
          // Apply the appropriate theme class if it's a known theme
          const themeClassMap: {[key: string]: string} = {
            'Berry Purple': 'theme-berry-purple',
            'Forest Green': 'theme-forest-green',
            'Ocean Blue': 'theme-ocean-blue',
            'Sunset Orange': 'theme-sunset-orange',
            'Dark Mode': 'theme-dark-mode',
            'NFD': 'theme-nfd-theme',
            'NFD Theme': 'theme-nfd-theme'
          };
          
          // Remove all existing theme classes first
          const themeClasses = [
            'theme-forest-green', 
            'theme-ocean-blue', 
            'theme-sunset-orange', 
            'theme-berry-purple', 
            'theme-dark-mode',
            'theme-nfd-theme',
            'theme-purple-700'
          ];
          
          themeClasses.forEach(cls => {
            html.classList.remove(cls);
          });
          
          // Set custom theme class if not one of the presets
          if (activeName in themeClassMap) {
            // Add the correct theme class
            html.classList.add(themeClassMap[activeName]);
          } else {
            // This is a custom theme, use the purple-700 class
            html.classList.add('theme-purple-700');
          }
          
          // Force body style update to ensure variables are applied
          document.body.setAttribute('style', `--custom-sidebar-color: ${parsedData.sidebarColor} !important; --sidebar-color: ${parsedData.sidebarColor} !important;`);
          
          // Trigger theme changed events
          document.dispatchEvent(new Event('themeClassChanged'));
          window.dispatchEvent(new CustomEvent('app-theme-updated', {
            detail: { 
              colors: { sidebarColor: parsedData.sidebarColor }
            }
          }));
          
          return;
        }
      } catch (e) {
        console.error('Error parsing theme data from localStorage', e);
      }
    }
  }
  
  // NFD theme class gets highest priority if still looking
  if (html.classList.contains('theme-nfd-theme')) {
    const sidebarColor = '#ec193a';
    console.log('Theme-sidebar-fixer: Applied NFD theme sidebar color:', sidebarColor);
    
    // Store the color in localStorage for consistent access
    localStorage.setItem('custom-sidebar-color', sidebarColor);
    
    // Apply to all sidebar elements
    sidebarElements.forEach(sidebar => {
      (sidebar as HTMLElement).style.setProperty('background-color', sidebarColor, 'important');
    });
    
    // Also set CSS variables
    html.style.setProperty('--custom-sidebar-color', sidebarColor, 'important');
    html.style.setProperty('--sidebar-color', sidebarColor, 'important');
    
    // Force body style update
    document.body.setAttribute('style', `--custom-sidebar-color: ${sidebarColor} !important; --sidebar-color: ${sidebarColor} !important;`);
    return;
  }
  
  // Handle other theme classes with direct color mapping
  const themeColorMap: Record<string, string> = {
    'theme-forest-green': '#2e7d32',
    'theme-ocean-blue': '#1976d2',
    'theme-sunset-orange': '#ef6c00', 
    'theme-berry-purple': '#8e24aa',
    'theme-dark-mode': '#333333'
  };
  
  // Check for predefined themes
  for (const [themeClass, color] of Object.entries(themeColorMap)) {
    if (html.classList.contains(themeClass)) {
      console.log(`Theme-sidebar-fixer: Applied ${themeClass} sidebar color:`, color);
      
      // Store the color in localStorage for consistent access
      localStorage.setItem('custom-sidebar-color', color);
      
      // Apply to all sidebar elements
      sidebarElements.forEach(sidebar => {
        (sidebar as HTMLElement).style.setProperty('background-color', color, 'important');
      });
      
      // Also set CSS variables
      html.style.setProperty('--custom-sidebar-color', color, 'important');
      html.style.setProperty('--sidebar-color', color, 'important');
      
      // Force body style update
      document.body.setAttribute('style', `--custom-sidebar-color: ${color} !important; --sidebar-color: ${color} !important;`);
      return;
    }
  }
  
  // Handle custom theme (theme-purple-700)
  if (html.classList.contains('theme-purple-700')) {
    // For custom themes, read from multiple sources
    
    // 1. First check localStorage for custom sidebar color (most reliable)
    const localStorageColor = localStorage.getItem('custom-sidebar-color');
    
    if (localStorageColor && localStorageColor !== '') {
      console.log('Theme-sidebar-fixer: Using custom sidebar color from localStorage:', localStorageColor);
      
      // Apply to all sidebar elements
      sidebarElements.forEach(sidebar => {
        (sidebar as HTMLElement).style.setProperty('background-color', localStorageColor, 'important');
      });
      
      // Also set CSS variables
      html.style.setProperty('--custom-sidebar-color', localStorageColor, 'important');
      html.style.setProperty('--sidebar-color', localStorageColor, 'important');
      
      // Force body style update
      document.body.setAttribute('style', `--custom-sidebar-color: ${localStorageColor} !important; --sidebar-color: ${localStorageColor} !important;`);
      return;
    }
    
    // 2. Check if active theme has data in localStorage
    const themeName = localStorage.getItem('app-active-theme');
    if (themeName) {
      const themeDataString = localStorage.getItem(`theme-${themeName}`);
      if (themeDataString) {
        try {
          const themeData = JSON.parse(themeDataString);
          if (themeData && themeData.sidebarColor) {
            console.log('Theme-sidebar-fixer: Got sidebar color from localStorage theme data:', themeData.sidebarColor);
            
            // Store the color in localStorage for consistent access
            localStorage.setItem('custom-sidebar-color', themeData.sidebarColor);
            
            // Apply to all sidebar elements
            sidebarElements.forEach(sidebar => {
              (sidebar as HTMLElement).style.setProperty('background-color', themeData.sidebarColor, 'important');
            });
            
            // Also set CSS variables
            html.style.setProperty('--custom-sidebar-color', themeData.sidebarColor, 'important');
            html.style.setProperty('--sidebar-color', themeData.sidebarColor, 'important');
            
            // Force body style update
            document.body.setAttribute('style', `--custom-sidebar-color: ${themeData.sidebarColor} !important; --sidebar-color: ${themeData.sidebarColor} !important;`);
            return;
          }
        } catch (e) {
          console.error('Error parsing theme data from localStorage', e);
        }
      }
    }
    
    // 3. Try CSS variable
    const cssVarColor = getComputedStyle(html).getPropertyValue('--custom-sidebar-color').trim();
    if (cssVarColor && cssVarColor !== '') {
      // Clean up the color value if it has quotes
      const cleanColor = cssVarColor.replace(/['"]/g, '');
      console.log('Theme-sidebar-fixer: Using custom sidebar color from CSS variable:', cleanColor);
      
      // Store the color in localStorage for consistent access
      localStorage.setItem('custom-sidebar-color', cleanColor);
      
      // Apply to all sidebar elements
      sidebarElements.forEach(sidebar => {
        (sidebar as HTMLElement).style.setProperty('background-color', cleanColor, 'important');
      });
      
      // Update CSS variables to ensure consistency
      html.style.setProperty('--custom-sidebar-color', cleanColor, 'important');
      html.style.setProperty('--sidebar-color', cleanColor, 'important');
      
      // Force body style update
      document.body.setAttribute('style', `--custom-sidebar-color: ${cleanColor} !important; --sidebar-color: ${cleanColor} !important;`);
      return;
    }
    
    // 4. Last resort, use Berry Purple as fallback
    const fallbackColor = '#8e24aa';
    console.log('Theme-sidebar-fixer: Using fallback Berry Purple color:', fallbackColor);
    
    // Store the color in localStorage for consistent access
    localStorage.setItem('custom-sidebar-color', fallbackColor);
    
    // Apply to all sidebar elements
    sidebarElements.forEach(sidebar => {
      (sidebar as HTMLElement).style.setProperty('background-color', fallbackColor, 'important');
    });
    
    // Also set CSS variables
    html.style.setProperty('--custom-sidebar-color', fallbackColor, 'important');
    html.style.setProperty('--sidebar-color', fallbackColor, 'important');
    
    // Force body style update
    document.body.setAttribute('style', `--custom-sidebar-color: ${fallbackColor} !important; --sidebar-color: ${fallbackColor} !important;`);
    return;
  }
  
  // If we get here, no theme class was matched - use Berry Purple
  const defaultColor = '#8e24aa';
  console.log('Theme-sidebar-fixer: Using default Berry Purple color:', defaultColor);
  
  // Store the color in localStorage for consistent access
  localStorage.setItem('custom-sidebar-color', defaultColor);
  
  // Apply to all sidebar elements
  sidebarElements.forEach(sidebar => {
    (sidebar as HTMLElement).style.setProperty('background-color', defaultColor, 'important');
  });
  
  // Also set CSS variables
  html.style.setProperty('--custom-sidebar-color', defaultColor, 'important');
  html.style.setProperty('--sidebar-color', defaultColor, 'important');
  
  // Force body style update
  document.body.setAttribute('style', `--custom-sidebar-color: ${defaultColor} !important; --sidebar-color: ${defaultColor} !important;`);
};

// Set up a MutationObserver to watch for class changes on the html element
const setupThemeObserver = () => {
  if (typeof window === 'undefined') return;
  
  // Apply immediately
  applySidebarColor();
  
  // Set up event listeners
  document.addEventListener('themeClassChanged', applySidebarColor);
  window.addEventListener('app-theme-updated', applySidebarColor);
  
  // Set up a MutationObserver to watch for class changes on the html element
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        applySidebarColor();
      }
    });
  });
  
  // Start observing the html element
  observer.observe(document.documentElement, { attributes: true });
  
  // Also set up a listener for when the sidebar is added to the DOM
  const bodyObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const sidebarAdded = Array.from(mutation.addedNodes).some(node => 
          node instanceof HTMLElement && (
            node.classList.contains('sidebar') || 
            node.querySelector('.sidebar')
          )
        );
        
        if (sidebarAdded) {
          setTimeout(applySidebarColor, 0); // Apply immediately
          setTimeout(applySidebarColor, 100); // And again after a short delay
        }
      }
    });
  });
  
  // Start observing the body element
  bodyObserver.observe(document.body, { childList: true, subtree: true });
  
  // Set up an interval to continuously check and enforce the sidebar color
  const enforceInterval = setInterval(() => {
    applySidebarColor();
  }, 2000);
  
  return () => {
    clearInterval(enforceInterval);
    observer.disconnect();
    bodyObserver.disconnect();
    document.removeEventListener('themeClassChanged', applySidebarColor);
    window.removeEventListener('app-theme-updated', applySidebarColor);
  };
};

// Execute immediately
applySidebarColor();

// Run the setup
const cleanup = setupThemeObserver();

// Apply again after a short delay to catch any late DOM changes
setTimeout(applySidebarColor, 200);

// Apply one more time after a longer delay to catch very late DOM changes
setTimeout(applySidebarColor, 1000);

// Add special handling for the Control Centre page where theme settings are changed
if (typeof window !== 'undefined') {
  // Apply theme color when navigating to Control Centre
  const controlCentreApplier = () => {
    if (window.location.pathname.includes('control-centre')) {
      console.log('Control Centre page detected, forcing theme application');
      
      // Check for immediate sidebar application
      setTimeout(applySidebarColor, 0);
      setTimeout(applySidebarColor, 200);
      setTimeout(applySidebarColor, 500);
      setTimeout(applySidebarColor, 1000);
      
      // Check if we have a theme name that should be applied
      const themeName = localStorage.getItem('app-active-theme');
      if (themeName) {
        console.log('Active theme found in Control Centre:', themeName);
        
        // Special handling for NFD theme
        if (themeName === 'NFD' || themeName === 'NFD Theme') {
          const nfdColor = '#ec193a';
          console.log('NFD theme found in Control Centre, applying color:', nfdColor);
          
          // Set to localStorage and force apply
          localStorage.setItem('custom-sidebar-color', nfdColor);
          
          // Force theme class update
          document.documentElement.classList.remove(
            'theme-forest-green', 
            'theme-ocean-blue', 
            'theme-sunset-orange', 
            'theme-berry-purple', 
            'theme-dark-mode',
            'theme-purple-700'
          );
          document.documentElement.classList.add('theme-nfd-theme');
          
          // Force sidebar color
          const sidebarElements = document.querySelectorAll('.sidebar');
          sidebarElements.forEach(sidebar => {
            (sidebar as HTMLElement).style.setProperty('background-color', nfdColor, 'important');
          });
          
          // Force CSS variables
          document.documentElement.style.setProperty('--custom-sidebar-color', nfdColor, 'important');
          document.documentElement.style.setProperty('--sidebar-color', nfdColor, 'important');
        }
      }
    }
  };
  
  // Run initially
  controlCentreApplier();
  
  // Run when URL changes
  window.addEventListener('popstate', controlCentreApplier);
  
  // Clean up event listener
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('popstate', controlCentreApplier);
  });
}

export default {};
