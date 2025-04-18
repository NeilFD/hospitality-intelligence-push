
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
  
  // Berry Purple fallback color
  let sidebarColor = '#8e24aa';
  
  // NFD theme gets highest priority
  if (html.classList.contains('theme-nfd-theme')) {
    sidebarColor = '#ec193a';
    console.log('Theme-sidebar-fixer: Applied NFD theme sidebar color: #ec193a');
  } else if (html.classList.contains('theme-purple-700')) {
    // For custom themes, read from multiple sources and use the most reliable one
    
    // 1. First check localStorage for custom sidebar color (most reliable)
    const localStorageColor = localStorage.getItem('custom-sidebar-color');
    
    if (localStorageColor && localStorageColor !== '') {
      sidebarColor = localStorageColor;
      console.log('Theme-sidebar-fixer: Using custom sidebar color from localStorage:', sidebarColor);
    } else {
      // 2. Try CSS variable if localStorage doesn't have the color
      const cssVarColor = getComputedStyle(html).getPropertyValue('--custom-sidebar-color').trim();
      if (cssVarColor && cssVarColor !== '') {
        // Clean up the color value if it has quotes
        sidebarColor = cssVarColor.replace(/['"]/g, '');
        console.log('Theme-sidebar-fixer: Using custom sidebar color from CSS variable:', sidebarColor);
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
                sidebarColor = themeData.sidebarColor;
                console.log('Theme-sidebar-fixer: Got sidebar color from localStorage theme data:', sidebarColor);
              }
            } catch (e) {
              console.error('Error parsing theme data from localStorage', e);
              // Fall back to Berry Purple
              sidebarColor = '#8e24aa';
            }
          }
        }
      }
    }
  } else if (html.classList.contains('theme-forest-green')) {
    sidebarColor = '#2e7d32';
  } else if (html.classList.contains('theme-ocean-blue')) {
    sidebarColor = '#1976d2';
  } else if (html.classList.contains('theme-sunset-orange')) {
    sidebarColor = '#ef6c00';
  } else if (html.classList.contains('theme-berry-purple')) {
    sidebarColor = '#8e24aa';
  } else if (html.classList.contains('theme-dark-mode')) {
    sidebarColor = '#333333';
  } else {
    // If no theme class matches, use Berry Purple
    sidebarColor = '#8e24aa';
  }
  
  // Store the color in localStorage for consistent access
  localStorage.setItem('custom-sidebar-color', sidebarColor);
  
  // Apply the color to all sidebar elements with !important to override any other styles
  sidebarElements.forEach(sidebar => {
    (sidebar as HTMLElement).style.setProperty('background-color', sidebarColor, 'important');
  });
  console.log('Theme-sidebar-fixer: Applied sidebar color:', sidebarColor);
  
  // Also apply to CSS variable for components that use it
  html.style.setProperty('--custom-sidebar-color', sidebarColor, 'important');
  html.style.setProperty('--sidebar-color', sidebarColor, 'important');
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
setupThemeObserver();

// Additional handler for custom themes - run this on a short delay to catch any late DOM changes
setTimeout(() => {
  // Check if we're using a custom theme
  if (document.documentElement.classList.contains('theme-purple-700')) {
    applySidebarColor();
  }
}, 200);

export default {};
