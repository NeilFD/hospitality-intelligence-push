
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { fixHiTheme, runDatabaseFix } from './theme-fixer.ts'

// Execute the Hi theme fix before rendering the app
fixHiTheme();

// Run database fix after a short delay
runDatabaseFix();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
