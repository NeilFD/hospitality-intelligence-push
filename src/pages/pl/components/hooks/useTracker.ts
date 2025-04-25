
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
    
    // Create an async function
    const initializeData = async () => {
      try {
        // Update forecasts
        console.log("Updating all forecasts...");
        const forecastSuccess = await updateAllForecasts(currentYear, monthNumber);
        console.log('Forecasts updated successfully:', forecastSuccess);
        
        // Refresh budget vs actual data
        console.log("Refreshing budget vs actual data...");
        try {
          const refreshResult = await refreshBudgetVsActual();
          console.log('Budget vs actual refresh completed:', refreshResult);
        } catch (refreshError) {
          console.warn('Non-critical error during budget vs actual refresh:', refreshError);
          // Continue even if this fails - it's not critical
        }
      } catch (err) {
        console.error('Error during data initialization:', err);
        setError(err instanceof Error ? err : new Error('Unknown error during initialization'));
      } finally {
        // Always set loading to false when done
        setIsInitializing(false);
      }
    };
    
    // Execute the async function
    initializeData();
    
    // Cleanup function not needed here as we don't need to cancel anything
  }, [currentMonthName, currentYear]);
  
  return {
    isInitializing,
    error
  };
}
