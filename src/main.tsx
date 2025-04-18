
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './theme-sidebar-fixer' // Import our sidebar fixer

// Apply any saved sidebar color more forcefully
document.addEventListener('DOMContentLoaded', () => {
  // Try to get the active theme name
  const activeName = localStorage.getItem('app-active-theme') || 'Berry Purple';
  
  // Apply theme-specific color immediately based on known theme names
  let immediateColor = '#8e24aa'; // Berry Purple as default
  
  if (activeName === 'NFD' || activeName === 'NFD Theme') {
    immediateColor = '#ec193a';
  } else if (activeName === 'Forest Green') {
    immediateColor = '#2e7d32';
  } else if (activeName === 'Ocean Blue') {
    immediateColor = '#1976d2';
  } else if (activeName === 'Sunset Orange') {
    immediateColor = '#ef6c00';
  } else if (activeName === 'Dark Mode') {
    immediateColor = '#333333';
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
  }
  
  // Store the color for consistent access
  localStorage.setItem('custom-sidebar-color', immediateColor);
  
  // Determine theme class to apply
  let themeClass = 'theme-berry-purple';
  
  if (activeName === 'NFD' || activeName === 'NFD Theme') {
    themeClass = 'theme-nfd-theme';
  } else if (activeName === 'Forest Green') {
    themeClass = 'theme-forest-green';
  } else if (activeName === 'Ocean Blue') {
    themeClass = 'theme-ocean-blue';
  } else if (activeName === 'Sunset Orange') {
    themeClass = 'theme-sunset-orange';
  } else if (activeName === 'Dark Mode') {
    themeClass = 'theme-dark-mode';
  } else if (activeName === 'Berry Purple') {
    themeClass = 'theme-berry-purple';
  } else {
    // Custom theme
    themeClass = 'theme-purple-700';
  }
  
  // Apply the theme class
  document.documentElement.classList.add(themeClass);
  
  // Set CSS variables for the theme colors, using stored data if available
  if (themeClass === 'theme-purple-700') {
    const themeData = localStorage.getItem(`theme-${activeName}`);
    if (themeData) {
      try {
        const parsedData = JSON.parse(themeData);
        if (parsedData) {
          document.documentElement.style.setProperty('--custom-primary-color', parsedData.primaryColor || '#9d89c9', 'important');
          document.documentElement.style.setProperty('--custom-secondary-color', parsedData.secondaryColor || '#f3e5f5', 'important');
          document.documentElement.style.setProperty('--custom-accent-color', parsedData.accentColor || '#ab47bc', 'important');
          document.documentElement.style.setProperty('--custom-sidebar-color', parsedData.sidebarColor || '#8e24aa', 'important');
          document.documentElement.style.setProperty('--custom-button-color', parsedData.buttonColor || '#7e57c2', 'important');
          document.documentElement.style.setProperty('--custom-text-color', parsedData.textColor || '#333333', 'important');
          document.documentElement.style.setProperty('--sidebar-color', parsedData.sidebarColor || '#8e24aa', 'important');
        }
      } catch (e) {
        console.error('Error parsing theme data:', e);
      }
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
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
