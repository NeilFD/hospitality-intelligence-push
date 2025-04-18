import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './theme-sidebar-fixer' // Import our sidebar fixer

// Function to purge Tavern Blue and ensure immediate and correct theme application
const applyInitialTheme = () => {
  // Purge Tavern Blue
  if (localStorage.getItem('app-active-theme') === 'Tavern Blue') {
    localStorage.setItem('app-active-theme', 'Berry Purple');
    console.log('Initial purge: Replaced Tavern Blue with Berry Purple');
  }
  
  // Try to get the active theme name
  const activeName = localStorage.getItem('app-active-theme') || 'Berry Purple';
  const html = document.documentElement;
  
  console.log('Initial theme application, loading theme:', activeName);
  
  // Apply theme-specific color immediately based on known theme names
  let immediateColor = '#8e24aa'; // Berry Purple as default
  
  // Define theme class to apply
  let themeClass = 'theme-berry-purple';
  
  // Handle NFD theme specially - highest priority
  if (activeName === 'NFD' || activeName === 'NFD Theme') {
    immediateColor = '#ec193a';
    themeClass = 'theme-nfd-theme';
    
    // Save NFD theme data to ensure persistence
    localStorage.setItem('custom-sidebar-color', immediateColor);
    localStorage.setItem('theme-NFD Theme', JSON.stringify({
      primaryColor: '#ec193a',
      secondaryColor: '#ffebee',
      accentColor: '#d81b60',
      sidebarColor: '#ec193a',
      buttonColor: '#ec193a',
      textColor: '#212121'
    }));
    
    // Force the NFD color to apply to all needed elements
    document.body.setAttribute('style', `--custom-sidebar-color: ${immediateColor} !important; --sidebar-color: ${immediateColor} !important;`);
  } 
  // Handle other built-in themes
  else if (activeName === 'Forest Green') {
    immediateColor = '#2e7d32';
    themeClass = 'theme-forest-green';
  } else if (activeName === 'Ocean Blue') {
    immediateColor = '#1976d2';
    themeClass = 'theme-ocean-blue';
  } else if (activeName === 'Sunset Orange') {
    immediateColor = '#ef6c00';
    themeClass = 'theme-sunset-orange';
  } else if (activeName === 'Dark Mode') {
    immediateColor = '#333333';
    themeClass = 'theme-dark-mode';
  } else if (activeName === 'Berry Purple') {
    immediateColor = '#8e24aa';
    themeClass = 'theme-berry-purple';
  } else {
    // For custom or unknown themes - use theme-custom
    themeClass = 'theme-custom';
    
    // Try to load theme data from localStorage first
    const themeData = localStorage.getItem(`theme-${activeName}`);
    if (themeData) {
      try {
        console.log('Found custom theme data for:', activeName);
        const parsedData = JSON.parse(themeData);
        if (parsedData && parsedData.sidebarColor) {
          immediateColor = parsedData.sidebarColor;
          console.log('Applying custom theme sidebar color:', immediateColor);
          
          // Force the theme data to be available in localStorage
          localStorage.setItem('custom-sidebar-color', parsedData.sidebarColor);
          
          // Also set all theme CSS variables directly
          html.style.setProperty('--custom-primary-color', parsedData.primaryColor || '#9d89c9', 'important');
          html.style.setProperty('--custom-secondary-color', parsedData.secondaryColor || '#f3e5f5', 'important');
          html.style.setProperty('--custom-accent-color', parsedData.accentColor || '#ab47bc', 'important');
          html.style.setProperty('--custom-sidebar-color', parsedData.sidebarColor || immediateColor, 'important');
          html.style.setProperty('--custom-button-color', parsedData.buttonColor || '#7e57c2', 'important');
          html.style.setProperty('--custom-text-color', parsedData.textColor || '#333333', 'important');
          html.style.setProperty('--sidebar-color', parsedData.sidebarColor || immediateColor, 'important');
          
          // Force body style to ensure CSS variables are applied
          document.body.setAttribute('style', `--custom-sidebar-color: ${parsedData.sidebarColor} !important; --sidebar-color: ${parsedData.sidebarColor} !important;`);
        }
      } catch (e) {
        console.error('Error parsing theme data:', e);
      }
    } else {
      // Try to get from localStorage color directly
      const savedColor = localStorage.getItem('custom-sidebar-color');
      if (savedColor) {
        immediateColor = savedColor;
        console.log('Using saved sidebar color from localStorage:', savedColor);
        
        // Force CSS variables
        html.style.setProperty('--custom-sidebar-color', savedColor, 'important');
        html.style.setProperty('--sidebar-color', savedColor, 'important');
        
        // Force body style
        document.body.setAttribute('style', `--custom-sidebar-color: ${savedColor} !important; --sidebar-color: ${savedColor} !important;`);
      }
    }
  }
  
  // Store the color for consistent access
  localStorage.setItem('custom-sidebar-color', immediateColor);
  
  // Remove all existing theme classes
  const themeClasses = [
    'theme-forest-green', 
    'theme-ocean-blue', 
    'theme-sunset-orange', 
    'theme-berry-purple', 
    'theme-dark-mode',
    'theme-hi-purple',
    'theme-tavern-blue',
    'tavern-blue',
    'theme-nfd-theme',
    'theme-custom',
    'theme-purple-700',
    'purple-700'
  ];
  
  themeClasses.forEach(cls => {
    html.classList.remove(cls);
  });
  
  // Apply the theme class
  html.classList.add(themeClass);
  console.log('Applied theme class:', themeClass);
  
  // Special handling for custom themes (theme-custom)
  if (themeClass === 'theme-custom') {
    console.log('Setting CSS variables for custom theme:', activeName);
    
    // Try to get theme data one more time
    const themeData = localStorage.getItem(`theme-${activeName}`);
    if (themeData) {
      try {
        const parsedData = JSON.parse(themeData);
        if (parsedData) {
          // Set CSS variables with !important to override any default values
          html.style.setProperty('--custom-primary-color', parsedData.primaryColor || '#9d89c9', 'important');
          html.style.setProperty('--custom-secondary-color', parsedData.secondaryColor || '#f3e5f5', 'important');
          html.style.setProperty('--custom-accent-color', parsedData.accentColor || '#ab47bc', 'important');
          html.style.setProperty('--custom-sidebar-color', parsedData.sidebarColor || immediateColor, 'important');
          html.style.setProperty('--custom-button-color', parsedData.buttonColor || '#7e57c2', 'important');
          html.style.setProperty('--custom-text-color', parsedData.textColor || '#333333', 'important');
          html.style.setProperty('--sidebar-color', parsedData.sidebarColor || immediateColor, 'important');
          
          // Force body style
          document.body.setAttribute('style', `--custom-sidebar-color: ${parsedData.sidebarColor} !important; --sidebar-color: ${parsedData.sidebarColor} !important;`);
          
          console.log('Applied CSS variables for custom theme:', parsedData);
        }
      } catch (e) {
        console.error('Error parsing theme data for CSS vars:', e);
        // Set fallback values
        html.style.setProperty('--custom-sidebar-color', immediateColor, 'important');
        html.style.setProperty('--sidebar-color', immediateColor, 'important');
        
        // Force body style
        document.body.setAttribute('style', `--custom-sidebar-color: ${immediateColor} !important; --sidebar-color: ${immediateColor} !important;`);
      }
    } else {
      // Set at least the sidebar color
      html.style.setProperty('--custom-sidebar-color', immediateColor, 'important');
      html.style.setProperty('--sidebar-color', immediateColor, 'important');
      
      // Force body style
      document.body.setAttribute('style', `--custom-sidebar-color: ${immediateColor} !important; --sidebar-color: ${immediateColor} !important;`);
    }
  }
  
  // Find and update any sidebar elements
  const sidebarElements = document.querySelectorAll('.sidebar');
  if (sidebarElements.length > 0) {
    sidebarElements.forEach(sidebar => {
      (sidebar as HTMLElement).style.setProperty('background-color', immediateColor, 'important');
    });
    console.log('Applied immediate sidebar color on initial load:', immediateColor);
  }
  
  // Trigger events to ensure other components update
  document.dispatchEvent(new Event('themeClassChanged'));
  window.dispatchEvent(new CustomEvent('app-theme-updated', {
    detail: { 
      theme: { name: activeName },
      colors: {
        sidebarColor: immediateColor
      }
    }
  }));
};

// Apply theme immediately
applyInitialTheme();

// Apply on DOMContentLoaded for safety
document.addEventListener('DOMContentLoaded', applyInitialTheme);

// Force delayed re-application for components that might load late
setTimeout(() => {
  applyInitialTheme();
  console.log('Forced re-application of theme after delay');
}, 500);

// Fix the Control Centre page theme loading issue
if (typeof window !== 'undefined') {
  // Watch for navigation to Control Centre page
  const observer = new MutationObserver(() => {
    if (window.location.pathname.includes('control-centre')) {
      // Fix theme selection handling for Control Centre
      const handleThemeSelection = (event) => {
        // Get the clicked element
        const target = event.target as HTMLElement;
        
        // Look for theme-related clicks
        const themeCard = target.closest('[class*="theme-card"]') || 
                          target.closest('[class*="theme-option"]') || 
                          target.closest('[role="button"]');
                          
        if (themeCard) {
          // Get the theme name from various possible attributes
          const themeName = themeCard.getAttribute('data-theme-name') || 
                           themeCard.getAttribute('data-value') ||
                           themeCard.textContent?.trim();
                           
          if (themeName) {
            console.log('Theme selection detected in Control Centre:', themeName);
            
            // Update localStorage immediately
            localStorage.setItem('app-active-theme', themeName);
            
            // Force theme update with short delay to let React update state
            setTimeout(() => {
              // Dispatch theme updated event
              window.dispatchEvent(new CustomEvent('app-theme-updated', {
                detail: { 
                  theme: { name: themeName }
                }
              }));
              
              // Also reapply theme
              applyInitialTheme();
            }, 50);
          }
        }
      };
      
      // Add event listener to control centre container for theme selections
      const controlCentre = document.querySelector('.container');
      if (controlCentre) {
        controlCentre.addEventListener('click', handleThemeSelection);
      }
    }
  });
  
  // Start observing for URL changes
  observer.observe(document.body, { subtree: true, childList: true });
}

// Special handling for Control Centre page - it needs extra attention
setTimeout(() => {
  if (window.location.pathname.includes('control-centre')) {
    console.log('Control Centre page detected, applying extra theme enforcement');
    applyInitialTheme();
    
    // Force color application to any sidebar elements
    const sidebarColor = localStorage.getItem('custom-sidebar-color') || '#8e24aa';
    const sidebarElements = document.querySelectorAll('.sidebar');
    if (sidebarElements.length > 0) {
      sidebarElements.forEach(sidebar => {
        (sidebar as HTMLElement).style.setProperty('background-color', sidebarColor, 'important');
      });
      console.log('Forced sidebar color on Control Centre page:', sidebarColor);
    }
    
    // Special handling for NFD theme in Control Centre
    if (localStorage.getItem('app-active-theme') === 'NFD' || 
        localStorage.getItem('app-active-theme') === 'NFD Theme') {
      const nfdColor = '#ec193a';
      
      // Force direct application of NFD color
      document.documentElement.classList.remove(
        'theme-forest-green', 
        'theme-ocean-blue', 
        'theme-sunset-orange', 
        'theme-berry-purple', 
        'theme-dark-mode',
        'theme-custom',
        'theme-tavern-blue',
        'tavern-blue'
      );
      document.documentElement.classList.add('theme-nfd-theme');
      
      // Apply to all sidebar elements
      const sidebarElements = document.querySelectorAll('.sidebar');
      if (sidebarElements.length > 0) {
        sidebarElements.forEach(sidebar => {
          (sidebar as HTMLElement).style.setProperty('background-color', nfdColor, 'important');
        });
      }
      
      // Force CSS variables
      document.documentElement.style.setProperty('--custom-sidebar-color', nfdColor, 'important');
      document.documentElement.style.setProperty('--sidebar-color', nfdColor, 'important');
    }
  }
}, 1000);

// Fix Control Centre theme selection handling
if (typeof window !== 'undefined' && window.location.pathname.includes('control-centre')) {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Check for theme cards or buttons that might change themes
    if (target.closest('[class*="theme"]') || 
        target.closest('[role="button"]') ||
        target.closest('[class*="card"]')) {
      
      // Get possible theme container 
      const themeElement = target.closest('[data-theme-name]') || 
                           target.closest('[data-value]') ||
                           target.closest('button') ||
                           target.closest('[role="button"]');
                           
      if (themeElement) {
        console.log('Potential theme selection detected in Control Centre');
        
        // Wait a moment for React to update state
        setTimeout(() => {
          // Get the current theme from localStorage
          const currentTheme = localStorage.getItem('app-active-theme');
          if (currentTheme && currentTheme !== 'Tavern Blue') {
            console.log('Applying selected theme after click:', currentTheme);
            
            // Force application
            applyInitialTheme();
            
            // Extra enforcement for difficult themes
            if (currentTheme === 'NFD' || currentTheme === 'NFD Theme') {
              const nfdColor = '#ec193a';
              
              // Force NFD theme to sidebar
              const sidebarElements = document.querySelectorAll('.sidebar');
              sidebarElements.forEach(sidebar => {
                (sidebar as HTMLElement).style.setProperty('background-color', nfdColor, 'important');
              });
            }
          }
        }, 100);
        
        // Apply again after a bit longer delay to catch UI updates
        setTimeout(applyInitialTheme, 300);
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
