
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './theme-sidebar-fixer' // Import our sidebar fixer

// Immediately try to apply any saved sidebar color from localStorage
document.addEventListener('DOMContentLoaded', () => {
  const savedSidebarColor = localStorage.getItem('custom-sidebar-color');
  if (savedSidebarColor) {
    // Find and update any sidebar elements that might already be in the DOM
    const sidebarElements = document.querySelectorAll('.sidebar');
    if (sidebarElements.length > 0) {
      sidebarElements.forEach(sidebar => {
        (sidebar as HTMLElement).style.backgroundColor = savedSidebarColor;
      });
      console.log('Applied saved sidebar color on initial load:', savedSidebarColor);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
