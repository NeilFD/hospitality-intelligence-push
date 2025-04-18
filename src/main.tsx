
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './theme-sidebar-fixer' // Import our sidebar fixer

// Function to ensure immediate and correct theme application
const applyInitialTheme = () => {
  // Try to get the active theme name
  const activeName = localStorage.getItem('app-active-theme') || 'Berry Purple';
  const html = document.documentElement;
  
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
    // For custom or unknown themes, try to get saved color
    const savedColor = localStorage.getItem('custom-sidebar-color');
    if (savedColor) {
      immediateColor = savedColor;
    } else {
      // Try to get from theme storage
      const themeData = localStorage.getItem(`theme-${activeName}`);
      if (themeData) {
        try {
          const parsedData = JSON.parse(themeData);
          if (parsedData && parsedData.sidebarColor) {
            immediateColor = parsedData.sidebarColor;
          }
        } catch (e) {
          console.error('Error parsing theme data:', e);
        }
      }
    }
    
    // Custom theme uses purple-700 class
    themeClass = 'theme-purple-700';
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
    'theme-nfd-theme',
    'theme-purple-700'
  ];
  
  themeClasses.forEach(cls => {
    html.classList.remove(cls);
  });
  
  // Apply the theme class
  html.classList.add(themeClass);
  
  // Set CSS variables for the theme colors
  if (themeClass === 'theme-purple-700') {
    const themeData = localStorage.getItem(`theme-${activeName}`);
    if (themeData) {
      try {
        const parsedData = JSON.parse(themeData);
        if (parsedData) {
          html.style.setProperty('--custom-primary-color', parsedData.primaryColor || '#9d89c9', 'important');
          html.style.setProperty('--custom-secondary-color', parsedData.secondaryColor || '#f3e5f5', 'important');
          html.style.setProperty('--custom-accent-color', parsedData.accentColor || '#ab47bc', 'important');
          html.style.setProperty('--custom-sidebar-color', parsedData.sidebarColor || immediateColor, 'important');
          html.style.setProperty('--custom-button-color', parsedData.buttonColor || '#7e57c2', 'important');
          html.style.setProperty('--custom-text-color', parsedData.textColor || '#333333', 'important');
          html.style.setProperty('--sidebar-color', parsedData.sidebarColor || immediateColor, 'important');
        }
      } catch (e) {
        console.error('Error parsing theme data:', e);
        
        // Fallback to setting at least the sidebar color
        html.style.setProperty('--custom-sidebar-color', immediateColor, 'important');
        html.style.setProperty('--sidebar-color', immediateColor, 'important');
      }
    } else {
      // Fallback to setting at least the sidebar color
      html.style.setProperty('--custom-sidebar-color', immediateColor, 'important');
      html.style.setProperty('--sidebar-color', immediateColor, 'important');
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
