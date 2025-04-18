
import './bootstrap' // Import bootstrap first to ensure visibility
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './theme-sidebar-fixer' // Import our sidebar fixer

// Very simple theme application - no complex logic
const applyBasicTheme = () => {
  const html = document.documentElement;
  html.classList.remove('theme-purple-700', 'purple-700');
  html.classList.add('theme-berry-purple');
  document.body.style.opacity = '1';
  document.body.style.visibility = 'visible';
};

// Apply immediately
applyBasicTheme();

// Render the React app with minimal wrapping
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
