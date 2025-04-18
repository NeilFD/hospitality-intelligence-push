
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
  
  // NFD theme gets highest priority
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
  
  // Check for predefined themes first
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
      return;
    }
  }
  
  // Handle custom theme (theme-purple-700)
  if (html.classList.contains('theme-purple-700')) {
    // For custom themes, read from multiple sources and use the most reliable one
    
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
    } else {
      // 2. Try CSS variable if localStorage doesn't have the color
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
        
        // Also update CSS variables to ensure consistency
        html.style.setProperty('--custom-sidebar-color', cleanColor, 'important');
        html.style.setProperty('--sidebar-color', cleanColor, 'important');
      } else {
        // 3. Try to get active theme data from localStorage
        const themeName = localStorage.getItem('app-active-theme');
        
        if (themeName) {
          // Get raw sidebar color data from localStorage if available
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
                return;
              }
            } catch (e) {
              console.error('Error parsing theme data from localStorage', e);
            }
          }
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
      }
    }
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
          applySidebarColor();
        }
      }
    });
  });
  
  // Start observing the body element
  bodyObserver.observe(document.body, { childList: true, subtree: true });
  
  return () => {
    observer.disconnect();
    bodyObserver.disconnect();
    document.removeEventListener('themeClassChanged', applySidebarColor);
    window.removeEventListener('app-theme-updated', applySidebarColor);
  };
};

// Ensure theme is applied immediately
applySidebarColor();

// Run the setup
const cleanup = setupThemeObserver();

// Apply again after a short delay to catch any late DOM changes
setTimeout(applySidebarColor, 200);

// Apply one more time after a longer delay to catch very late DOM changes
setTimeout(applySidebarColor, 1000);

export default {};
