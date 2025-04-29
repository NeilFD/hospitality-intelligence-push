
// This script runs on app startup to ensure the HiQ module is properly available in the sidebar

export const fixHiQModuleAvailability = () => {
  console.log('Running HiQ module availability fix...');
  
  try {
    // Check localStorage for module data
    const storeData = localStorage.getItem('tavern-kitchen-ledger');
    if (storeData) {
      const parsedData = JSON.parse(storeData);
      
      // Check if modules array exists and add HiQ if needed
      if (parsedData.state && parsedData.state.modules) {
        let hiqExists = false;
        
        for (const module of parsedData.state.modules) {
          if (module.type === 'hiq') {
            hiqExists = true;
            break;
          }
        }
        
        // Add HiQ module if it doesn't exist
        if (!hiqExists) {
          parsedData.state.modules.push({
            id: 'hiq',
            type: 'hiq',
            name: 'HiQ',
            displayOrder: 900
          });
          
          console.log('Added HiQ module to localStorage');
        }
        
        // Check if we're on an HiQ page and update currentModule accordingly
        if (window.location.pathname.includes('/hiq') && parsedData.state.currentModule !== 'hiq') {
          parsedData.state.currentModule = 'hiq';
          console.log('Updated currentModule to hiq in localStorage');
        }
        
        // Save changes back to localStorage
        localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
      }
    }
  } catch (error) {
    console.error('Error fixing HiQ module availability:', error);
  }
};

// Auto-run the fix
(() => {
  console.log('Auto-executing HiQ module fixer');
  fixHiQModuleAvailability();
  
  // Also run when URL changes
  const handleUrlChange = () => {
    if (window.location.pathname.includes('/hiq')) {
      console.log('URL changed to HiQ path, running fixer');
      fixHiQModuleAvailability();
    }
  };
  
  window.addEventListener('popstate', handleUrlChange);
  
  // Clean up
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('popstate', handleUrlChange);
  });
})();
