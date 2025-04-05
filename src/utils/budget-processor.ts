
import { read, utils } from 'xlsx';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

export interface BudgetItem {
  category: string;
  name: string;
  budget: number;
  actual?: number;
  forecast?: number;
}

/**
 * Process a Tavern P&L Excel file and extract budget data
 * @param file The uploaded Excel file
 * @returns A promise that resolves to an array of budget items
 */
export const processBudgetFile = async (file: File): Promise<BudgetItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error("Failed to read file");
        }
        
        // Parse the Excel file
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        
        // Assume the first sheet contains our budget data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON - using header row
        const jsonData = utils.sheet_to_json<any>(worksheet, { header: 1 });
        
        // Budget items array
        const budgetItems: BudgetItem[] = [];
        
        // Based on the image, we're looking for rows starting from the Consolidation - Profit and Loss section
        // Skip header rows
        let startProcessing = false;
        let currentCategory = "";
        
        // Months mapping from the header row
        const monthColumns: {[key: string]: number} = {};
        
        // Find the header row with months (it should contain Mar-25, Apr-25, etc.)
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && Array.isArray(row) && row.some(cell => typeof cell === 'string' && cell.includes('-25'))) {
            // Found month header row
            for (let j = 1; j < row.length; j++) { // Start from 1 to skip the first column
              const cell = row[j];
              if (typeof cell === 'string' && cell.includes('-25')) {
                // Extract month from format like "Apr-25" -> "Apr"
                const monthName = cell.split('-')[0];
                monthColumns[monthName] = j;
              }
            }
            break;
          }
        }
        
        // Process the data rows
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          if (!row || !Array.isArray(row) || row.length === 0) continue;
          
          const firstCell = row[0];
          
          // Start processing after we find the "Consolidation - Profit and Loss" text
          if (!startProcessing && firstCell === "Consolidation - Profit and Loss") {
            startProcessing = true;
            continue;
          }
          
          if (!startProcessing) continue;
          
          // Skip empty rows or rows without a name in the first column
          if (!firstCell) continue;
          
          // Check if this is a category header (like "Food Revenue", "Beverage Revenue", etc.)
          // In the image, it seems categories don't have £ signs and are header-like
          const isHeaderRow = typeof firstCell === 'string' && !row[1] && !row[2];
          
          if (isHeaderRow) {
            currentCategory = firstCell;
            continue;
          }
          
          // If this looks like an item row (has a name and values)
          const itemName = firstCell;
          
          if (typeof itemName === 'string' && itemName !== 'Total' && itemName !== 'Turnover') {
            // Process values for each month
            for (const [month, colIndex] of Object.entries(monthColumns)) {
              // Check if we have a value for this month
              const rawValue = row[colIndex];
              const value = typeof rawValue === 'number' ? 
                rawValue : 
                (typeof rawValue === 'string' && rawValue.startsWith('£') ? 
                  parseFloat(rawValue.replace('£', '').replace(/,/g, '').trim()) : 
                  null);
              
              if (value !== null && !isNaN(value)) {
                budgetItems.push({
                  category: currentCategory,
                  name: itemName,
                  budget: value,
                  // For now, actual and forecast are null as they'll be filled later
                });
              }
            }
          }
        }
        
        if (budgetItems.length === 0) {
          throw new Error("No valid budget items found in the spreadsheet");
        }
        
        resolve(budgetItems);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(new Error('Failed to process the Excel file. Please check the format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Save budget items to the database
 * @param budgetItems The budget items to save
 * @param year The budget year
 * @param month The budget month
 * @returns Promise that resolves when saving is complete
 */
export const saveBudgetItems = async (
  budgetItems: BudgetItem[], 
  year: number, 
  month: number
): Promise<void> => {
  try {
    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' });
    
    // First, delete any existing budget items for this year/month
    await supabase
      .from('budget_items')
      .delete()
      .eq('year', year)
      .eq('month', month);
    
    // Filter for items specific to the selected month
    const monthItems = budgetItems.filter(item => {
      // This would need to be adjusted based on how you determine which items belong to which month
      return true; // For now, assuming all items are for the selected month
    });
    
    // Then insert the new budget items
    const { error } = await supabase
      .from('budget_items')
      .insert(
        monthItems.map(item => ({
          year,
          month,
          category: item.category,
          name: item.name,
          budget_amount: item.budget,
          actual_amount: item.actual || null,
          forecast_amount: item.forecast || null,
        }))
      );
    
    if (error) throw error;
  } catch (error) {
    console.error('Error saving budget items:', error);
    throw new Error('Failed to save budget data to the database.');
  }
};

/**
 * Hook for processing and saving budget files
 * @returns Object with process function and loading state
 */
export const useBudgetProcessor = () => {
  const processBudget = async (file: File, year: number, month: number) => {
    try {
      // Process the file
      const budgetItems = await processBudgetFile(file);
      
      if (budgetItems.length === 0) {
        toast.error("No valid budget data found in the file.");
        return false;
      }
      
      // Save to database
      await saveBudgetItems(budgetItems, year, month);
      
      toast.success(`Successfully imported ${budgetItems.length} budget items.`);
      
      return true;
    } catch (error) {
      console.error('Budget processing error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process budget file.");
      return false;
    }
  };
  
  return { processBudget };
};

/**
 * Fetch budget items for a specific year and month
 * @param year The budget year
 * @param month The budget month 
 * @returns Promise that resolves to an array of budget items
 */
export const fetchBudgetItems = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('year', year)
    .eq('month', month);
    
  if (error) throw error;
  return data;
};
