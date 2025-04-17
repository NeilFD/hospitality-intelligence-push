
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { fixHiTheme, runDatabaseFix } from './theme-fixer.ts'
import { format } from 'date-fns'

// Execute the Hi theme fix before rendering the app
fixHiTheme();

// Run database fix after a short delay
runDatabaseFix();

// Add a global function to format dates with day of week
window.formatDateWithDayOfWeek = (date: Date) => {
  return format(date, "EEEE, d MMM yyyy");
};

// Add the type definition to the global Window interface
declare global {
  interface Window {
    formatDateWithDayOfWeek: (date: Date) => string;
    // Using the same type as the existing declaration elsewhere in the codebase
    bevStore?: BevStore;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
