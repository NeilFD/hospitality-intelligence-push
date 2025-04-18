
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
    // For custom or unknown themes
    themeClass = 'theme-purple-700';
    
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
    'theme-purple-700'
  ];
  
  themeClasses.forEach(cls => {
    html.classList.remove(cls);
  });
  
  // Apply the theme class
  html.classList.add(themeClass);
  console.log('Applied theme class:', themeClass);
  
  // Special handling for custom themes (theme-purple-700)
  if (themeClass === 'theme-purple-700') {
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

// Add special handling for Control Centre page - it needs extra attention
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
        'theme-purple-700',
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

// Add a click handler for the Control Centre page to refresh themes when clicked
if (typeof window !== 'undefined' && window.location.pathname.includes('control-centre')) {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Check if this might be a theme-related click
    if (target.closest('button') || target.closest('[role="button"]') || 
        target.closest('[class*="theme"]') || target.closest('[class*="card"]')) {
      
      console.log('Potential theme selection click in Control Centre');
      
      // Reapply themes with delays
      setTimeout(applyInitialTheme, 100);
      setTimeout(applyInitialTheme, 300);
      setTimeout(applyInitialTheme, 500);
      
      // Also check for NFD theme selection
      setTimeout(() => {
        if (localStorage.getItem('app-active-theme') === 'NFD' || 
            localStorage.getItem('app-active-theme') === 'NFD Theme') {
          
          const nfdColor = '#ec193a';
          console.log('NFD theme detected after click, forcing application');
          
          // Force NFD theme application
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
          if (sidebarElements.length > 0) {
            sidebarElements.forEach(sidebar => {
              (sidebar as HTMLElement).style.setProperty('background-color', nfdColor, 'important');
            });
          }
        }
      }, 200);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
