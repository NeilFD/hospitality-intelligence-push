
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
      let foodGpFound = false;
      let bevGpFound = false;
      
      // Check if Food GP and Beverage GP items were found
      for (const monthStr in budgetItemsByMonth) {
        const monthItems = budgetItemsByMonth[Number(monthStr)];
        totalItemsFound += monthItems.length;
        
        const foodGpItem = monthItems.find(item => 
          item.name === 'Food Gross Profit' || 
          item.name.toLowerCase() === 'food gross profit' ||
          item.name === 'Food GP');
          
        const bevGpItem = monthItems.find(item => 
          item.name === 'Beverage Gross Profit' || 
          item.name.toLowerCase() === 'beverage gross profit' ||
          item.name.toLowerCase() === 'drinks gross profit' ||
          item.name === 'Beverage GP');
        
        if (foodGpItem) {
          foodGpFound = true;
          console.log(`Found Food GP item for month ${monthStr}: £${foodGpItem.budget}`);
        }
        
        if (bevGpItem) {
          bevGpFound = true;
          console.log(`Found Beverage GP item for month ${monthStr}: £${bevGpItem.budget}`);
        }
      }
      
      console.log(`Food GP found: ${foodGpFound ? 'Yes' : 'No'}, Beverage GP found: ${bevGpFound ? 'Yes' : 'No'}`);
      
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
