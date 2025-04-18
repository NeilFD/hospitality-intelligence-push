
/**
 * This script runs before the React app to ensure the page is visible
 * and prevent theme-related loading issues.
 */

// Force visibility of the document
document.body.style.opacity = '1';
document.body.style.visibility = 'visible';

// Apply Berry Purple theme as default
document.documentElement.classList.add('theme-berry-purple');

// Store default theme in localStorage to prevent blank screens
localStorage.setItem('app-active-theme', 'Berry Purple');
localStorage.setItem('custom-sidebar-color', '#8e24aa');

// Export a function that can be called to ensure the app is visible
export function ensureVisibility() {
  document.body.style.opacity = '1';
  document.body.style.visibility = 'visible';
  
  // Make sure the root div exists
  if (!document.getElementById('root')) {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    document.body.appendChild(rootDiv);
  }
}

// Call it immediately
ensureVisibility();

// Also call it after a delay to catch any issues
setTimeout(ensureVisibility, 1000);
