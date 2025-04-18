
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
  
  // Get the appropriate color based on current theme
  let sidebarColor = '';
  
  if (html.classList.contains('theme-forest-green')) {
    sidebarColor = '#2e7d32';
  } else if (html.classList.contains('theme-ocean-blue')) {
    sidebarColor = '#1976d2';
  } else if (html.classList.contains('theme-sunset-orange')) {
    sidebarColor = '#ef6c00';
  } else if (html.classList.contains('theme-berry-purple')) {
    sidebarColor = '#8e24aa';
  } else if (html.classList.contains('theme-dark-mode')) {
    sidebarColor = '#333333';
  } else if (html.classList.contains('theme-nfd-theme')) {
    sidebarColor = '#ec193a';
  } else if (html.classList.contains('theme-purple-700')) {
    // For custom themes, use the CSS variable
    sidebarColor = getComputedStyle(html).getPropertyValue('--custom-sidebar-color').trim();
    
    // If the variable is empty or has quotes, try to get it directly
    if (!sidebarColor || sidebarColor.includes('"') || sidebarColor.includes("'")) {
      // Fallback to localStorage
      const themeName = localStorage.getItem('app-active-theme');
      if (themeName && themeName !== 'Berry Purple' && 
          themeName !== 'Forest Green' &&
          themeName !== 'Ocean Blue' &&
          themeName !== 'Sunset Orange' &&
          themeName !== 'Dark Mode' &&
          themeName !== 'NFD Theme') {
        // This is likely a custom theme, try to load its sidebar color from localStorage
        const customSidebarColor = localStorage.getItem('custom-sidebar-color');
        if (customSidebarColor) {
          sidebarColor = customSidebarColor;
        }
      }
    }
  }
  
  // Apply the color to all sidebar elements
  if (sidebarColor) {
    sidebarElements.forEach(sidebar => {
      (sidebar as HTMLElement).style.backgroundColor = sidebarColor;
    });
    console.log('Theme-sidebar-fixer: Applied sidebar color:', sidebarColor);
  }
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

// Run the setup
setupThemeObserver();

export default {};
