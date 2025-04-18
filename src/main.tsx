
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
    }
  }
  
  // Store the color for consistent access
  localStorage.setItem('custom-sidebar-color', immediateColor);
  
  // Find and update any sidebar elements
  const sidebarElements = document.querySelectorAll('.sidebar');
  if (sidebarElements.length > 0) {
    sidebarElements.forEach(sidebar => {
      (sidebar as HTMLElement).style.backgroundColor = immediateColor;
    });
    console.log('Applied immediate sidebar color on initial load:', immediateColor);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
