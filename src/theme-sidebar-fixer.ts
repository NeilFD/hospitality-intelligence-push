
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
  
  // Purge Tavern Blue completely
  if (localStorage.getItem('app-active-theme') === 'Tavern Blue') {
    localStorage.setItem('app-active-theme', 'Berry Purple');
    console.log('Purged Tavern Blue theme from localStorage, replacing with Berry Purple');
    
    // Apply Berry Purple theme immediately
    const berryColor = '#8e24aa';
    localStorage.setItem('custom-sidebar-color', berryColor);
    
    // Apply to all sidebar elements
    sidebarElements.forEach(sidebar => {
      (sidebar as HTMLElement).style.setProperty('background-color', berryColor, 'important');
    });
    
    // Force Berry Purple theme class
    html.classList.remove('theme-tavern-blue', 'tavern-blue', 'theme-hi', 'theme-hi-purple');
    html.classList.add('theme-berry-purple');
    
    // Dispatch theme update event
    window.dispatchEvent(new CustomEvent('app-theme-updated', {
      detail: { 
        theme: { name: 'Berry Purple' },
        colors: { sidebarColor: berryColor }
      }
    }));
    
    return;
  }
  
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
        'theme-purple-700',
        'theme-tavern-blue',
        'tavern-blue',
        'theme-hi',
        'theme-hi-purple'
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
    
    // Define direct mapping for known themes
    const knownThemes: Record<string, {color: string, className: string}> = {
      'Forest Green': {color: '#2e7d32', className: 'theme-forest-green'},
      'Ocean Blue': {color: '#1976d2', className: 'theme-ocean-blue'},
      'Sunset Orange': {color: '#ef6c00', className: 'theme-sunset-orange'},
      'Berry Purple': {color: '#8e24aa', className: 'theme-berry-purple'},
      'Dark Mode': {color: '#333333', className: 'theme-dark-mode'}
    };
    
    if (activeName in knownThemes) {
      const themeData = knownThemes[activeName];
      console.log(`Theme-sidebar-fixer: Applying known theme ${activeName}:`, themeData);
      
      // Store the color in localStorage
      localStorage.setItem('custom-sidebar-color', themeData.color);
      
      // Apply to all sidebar elements
      sidebarElements.forEach(sidebar => {
        (sidebar as HTMLElement).style.setProperty('background-color', themeData.color, 'important');
      });
      
      // Set CSS variables
      html.style.setProperty('--custom-sidebar-color', themeData.color, 'important');
      html.style.setProperty('--sidebar-color', themeData.color, 'important');
      
      // Update theme class
      const themeClasses = [
        'theme-forest-green', 
        'theme-ocean-blue', 
        'theme-sunset-orange', 
        'theme-berry-purple', 
        'theme-dark-mode',
        'theme-purple-700',
        'theme-tavern-blue',
        'tavern-blue',
        'theme-nfd-theme',
        'theme-hi',
        'theme-hi-purple'
      ];
      
      themeClasses.forEach(cls => {
        html.classList.remove(cls);
      });
      
      html.classList.add(themeData.className);
      
      // Force body style update
      document.body.setAttribute('style', `--custom-sidebar-color: ${themeData.color} !important; --sidebar-color: ${themeData.color} !important;`);
      
      // Trigger theme changed events
      document.dispatchEvent(new Event('themeClassChanged'));
      window.dispatchEvent(new CustomEvent('app-theme-updated', {
        detail: { 
          colors: { sidebarColor: themeData.color }
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
          html.style.setProperty('--custom-primary-color', parsedData.primaryColor || '#9d89c9', 'important');
          html.style.setProperty('--custom-secondary-color', parsedData.secondaryColor || '#f3e5f5', 'important');
          html.style.setProperty('--custom-accent-color', parsedData.accentColor || '#ab47bc', 'important');
          html.style.setProperty('--custom-sidebar-color', parsedData.sidebarColor, 'important');
          html.style.setProperty('--custom-button-color', parsedData.buttonColor || '#7e57c2', 'important');
          html.style.setProperty('--custom-text-color', parsedData.textColor || '#333333', 'important');
          html.style.setProperty('--sidebar-color', parsedData.sidebarColor, 'important');
          
          // For custom themes, set to theme-purple-700
          const themeClasses = [
            'theme-forest-green', 
            'theme-ocean-blue', 
            'theme-sunset-orange', 
            'theme-berry-purple', 
            'theme-dark-mode',
            'theme-nfd-theme',
            'theme-purple-700',
            'theme-tavern-blue',
            'tavern-blue',
            'theme-hi',
            'theme-hi-purple'
          ];
          
          themeClasses.forEach(cls => {
            html.classList.remove(cls);
          });
          
          // This is a custom theme, use the purple-700 class
          html.classList.add('theme-purple-700');
          
          // Force body style update to ensure variables are applied
          document.body.setAttribute('style', `--custom-sidebar-color: ${parsedData.sidebarColor} !important; --sidebar-color: ${parsedData.sidebarColor} !important;`);
          
          // Trigger theme changed events
          document.dispatchEvent(new Event('themeClassChanged'));
          window.dispatchEvent(new CustomEvent('app-theme-updated', {
            detail: { 
              colors: { 
                sidebarColor: parsedData.sidebarColor,
                primaryColor: parsedData.primaryColor,
                secondaryColor: parsedData.secondaryColor,
                accentColor: parsedData.accentColor,
                buttonColor: parsedData.buttonColor,
                textColor: parsedData.textColor
              }
            }
          }));
          
          return;
        }
      } catch (e) {
        console.error('Error parsing theme data from localStorage', e);
      }
    }
  }
  
  // Check theme classes on HTML element if we haven't returned yet
  const themeColorMap: Record<string, string> = {
    'theme-forest-green': '#2e7d32',
    'theme-ocean-blue': '#1976d2',
    'theme-sunset-orange': '#ef6c00', 
    'theme-berry-purple': '#8e24aa',
    'theme-dark-mode': '#333333',
    'theme-nfd-theme': '#ec193a'
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
  
  // We should only reach here if no theme is set or there was an error - respect active theme name
  if (activeName) {
    // Try to get color from known themes
    const knownThemes: Record<string, string> = {
      'Forest Green': '#2e7d32',
      'Ocean Blue': '#1976d2',
      'Sunset Orange': '#ef6c00',
      'Berry Purple': '#8e24aa',
      'Dark Mode': '#333333',
      'NFD': '#ec193a',
      'NFD Theme': '#ec193a'
    };
    
    if (activeName in knownThemes) {
      const color = knownThemes[activeName];
      console.log(`Theme-sidebar-fixer: Using color for known theme ${activeName}:`, color);
      
      // Store and apply color
      localStorage.setItem('custom-sidebar-color', color);
      sidebarElements.forEach(sidebar => {
        (sidebar as HTMLElement).style.setProperty('background-color', color, 'important');
      });
      
      return;
    }
  }
  
  // Final fallback to Berry Purple - should rarely reach here
  const defaultColor = '#8e24aa';
  console.log('Theme-sidebar-fixer: Using default Berry Purple color as last resort:', defaultColor);
  
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

// Apply sidebar color immediately
applySidebarColor();

// Set up handlers for the Control Centre page
const setupControlCentreHandlers = () => {
  if (typeof window === 'undefined' || !window.location.pathname.includes('control-centre')) {
    return;
  }
  
  console.log('Setting up Control Centre theme handlers');
  
  // Run applySidebarColor multiple times with delays to ensure theme is applied
  setTimeout(applySidebarColor, 100);
  setTimeout(applySidebarColor, 500);
  setTimeout(applySidebarColor, 1000);
  
  // Add click listener for theme selection in Control Centre
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Check if this might be a theme selection click
    const themeElement = target.closest('[class*="theme"]') || 
                         target.closest('[role="button"]') || 
                         target.closest('[class*="card"]') ||
                         target.closest('button');
    
    if (themeElement) {
      console.log('Theme selection click detected in Control Centre');
      
      // Wait for React to update state/localStorage
      setTimeout(() => {
        const themeName = localStorage.getItem('app-active-theme');
        console.log('Theme name after click:', themeName);
        
        if (themeName && themeName !== 'Tavern Blue') {
          // Force theme update events
          window.dispatchEvent(new CustomEvent('app-theme-updated', {
            detail: { theme: { name: themeName } }
          }));
          
          // Apply theme
          applySidebarColor();
        }
      }, 100);
      
      // Apply again after UI updates
      setTimeout(applySidebarColor, 300);
      setTimeout(applySidebarColor, 600);
      setTimeout(applySidebarColor, 1000);
    }
  });
};

// Set up a MutationObserver to watch for class changes on the html element
const setupThemeObserver = () => {
  if (typeof window === 'undefined') return;
  
  // Apply immediately
  applySidebarColor();
  
  // Run Control Centre specific handlers
  setupControlCentreHandlers();
  
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
    // Get current active theme
    const activeName = localStorage.getItem('app-active-theme');
    console.log('Interval check for theme:', activeName);
    
    // Always apply current theme
    applySidebarColor();
    
    // Also check for and purge Tavern Blue specifically
    if (localStorage.getItem('app-active-theme') === 'Tavern Blue') {
      localStorage.setItem('app-active-theme', 'Berry Purple');
      console.log('Purged Tavern Blue from localStorage during interval check');
      
      // Force Berry Purple theme updates
      document.dispatchEvent(new Event('themeClassChanged'));
      window.dispatchEvent(new CustomEvent('app-theme-updated', {
        detail: { 
          theme: { name: 'Berry Purple' }
        }
      }));
    }
  }, 2000);
  
  return () => {
    clearInterval(enforceInterval);
    observer.disconnect();
    bodyObserver.disconnect();
    document.removeEventListener('themeClassChanged', applySidebarColor);
    window.removeEventListener('app-theme-updated', applySidebarColor);
  };
};

// Run the setup
const cleanup = setupThemeObserver();

// Apply again after delays to catch late DOM changes
setTimeout(applySidebarColor, 200);
setTimeout(applySidebarColor, 1000);

// Add special handling for URL changes
if (typeof window !== 'undefined') {
  // Apply theme color when navigating to Control Centre
  const controlCentreApplier = () => {
    if (window.location.pathname.includes('control-centre')) {
      console.log('Control Centre page detected, forcing theme application');
      
      // Set up Control Centre-specific handlers
      setupControlCentreHandlers();
      
      // Force theme application
      setTimeout(applySidebarColor, 0);
      setTimeout(applySidebarColor, 200);
      setTimeout(applySidebarColor, 500);
      setTimeout(applySidebarColor, 1000);
    }
  };
  
  // Run initially
  controlCentreApplier();
  
  // Run when URL changes
  window.addEventListener('popstate', controlCentreApplier);
}

// Final check to purge Tavern Blue
if (typeof window !== 'undefined') {
  if (localStorage.getItem('app-active-theme') === 'Tavern Blue') {
    localStorage.setItem('app-active-theme', 'Berry Purple');
    console.log('Final purge of Tavern Blue theme from localStorage');
    
    // Force Berry Purple theme application
    setTimeout(() => {
      if (document.documentElement.classList.contains('theme-tavern-blue') || 
          document.documentElement.classList.contains('tavern-blue')) {
        document.documentElement.classList.remove('theme-tavern-blue', 'tavern-blue');
        document.documentElement.classList.add('theme-berry-purple');
      }
      
      // Force theme update events
      document.dispatchEvent(new Event('themeClassChanged'));
      window.dispatchEvent(new CustomEvent('app-theme-updated', {
        detail: { theme: { name: 'Berry Purple' } }
      }));
    }, 100);
  }
}

export default {};
