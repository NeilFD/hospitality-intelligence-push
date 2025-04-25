
import { useState, useEffect } from 'react';
import { updateAllForecasts, refreshBudgetVsActual } from '../tracker/TrackerCalculations';

export function useTracker(currentYear: number, currentMonthName: string) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const monthNumber = new Date(Date.parse(`${currentMonthName} 1, ${currentYear}`)).getMonth() + 1;
    console.log(`Initializing forecasts for ${currentYear}-${monthNumber}`);
    
    // Set loading state
    setIsInitializing(true);
    setError(null);
    
    // Update forecasts without checking return values
    console.log("Updating all forecasts...");
    updateAllForecasts(currentYear, monthNumber)
      .then(() => {
        console.log('Forecasts updated successfully');
        
        // Attempt to refresh budget vs actual data, but don't prevent completion if it fails
        console.log("Refreshing budget vs actual data...");
        refreshBudgetVsActual()
          .then(() => {
            console.log('Budget vs actual refresh completed');
          })
          .catch(refreshError => {
            console.warn('Non-critical error during budget vs actual refresh:', refreshError);
          })
          .finally(() => {
            // Always mark initialization as complete
            setIsInitializing(false);
          });
      })
      .catch(err => {
        console.error('Error during data initialization:', err);
        setError(err instanceof Error ? err : new Error('Unknown error during initialization'));
        setIsInitializing(false);
      });
  }, [currentMonthName, currentYear]);
  
  return {
    isInitializing,
    error
  };
}
