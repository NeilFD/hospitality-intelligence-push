
import { processBudgetFile } from './file-processor';
import { saveBudgetItems } from './data-processor';

/**
 * Hook for processing and saving budget files
 * @returns Object with process function and loading state
 */
export const useBudgetProcessor = () => {
  const processBudget = async (file: File, year: number, month: number = 0) => {
    try {
      console.log(`Processing budget file for year ${year}, month ${month === 0 ? 'ALL' : month}:`, file.name);
      
      // Process the file
      const budgetItemsByMonth = await processBudgetFile(file, month);
      
      let totalItemsFound = 0;
      for (const monthItems of Object.values(budgetItemsByMonth)) {
        totalItemsFound += monthItems.length;
      }
      
      if (totalItemsFound === 0) {
        console.log("No valid budget data found in the file.");
        return false;
      }
      
      // Save to database
      await saveBudgetItems(budgetItemsByMonth, year);
      
      console.log(`Successfully imported ${totalItemsFound} budget items across ${Object.keys(budgetItemsByMonth).length} months.`);
      
      return true;
    } catch (error) {
      console.error('Budget processing error:', error);
      console.error(error instanceof Error ? error.message : "Failed to process budget file.");
      throw error; // Re-throw to let the UI handle the error
    }
  };
  
  return { processBudget };
};
