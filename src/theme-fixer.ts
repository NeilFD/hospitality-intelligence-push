
// This file is a direct fix to ensure the "Hi" theme is completely removed

// Function to run on app initialization
export function fixHiTheme() {
  // Immediately remove any "Hi" theme and ensure Berry Purple is active
  const html = document.documentElement;
  
  // Remove possible theme classes
  const themeClasses = [
    'theme-hi',
    'theme-hi-purple',
    'hi'
  ];
  
  // Clean up all Hi theme classes
  themeClasses.forEach(cls => {
    html.classList.remove(cls);
  });
  
  // Make sure Berry Purple is applied
  const savedTheme = localStorage.getItem('app-active-theme');
  if (savedTheme === 'Hi') {
    localStorage.setItem('app-active-theme', 'Berry Purple');
    html.classList.add('theme-berry-purple');
  }
  
  // Fix company name if needed
  const companyName = localStorage.getItem('company-name');
  if (companyName === 'Hi') {
    localStorage.setItem('company-name', 'Hospitality Intelligence');
  }
  
  console.log('Theme fixer executed, Hi theme removed if present');
  
  // Return true to indicate successful execution
  return true;
}
