
import { read, utils } from 'xlsx';
import { supabase } from '@/lib/supabase';

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
        
        console.log("Excel data parsed, rows found:", jsonData.length);
        
        // Budget items array
        const budgetItems: BudgetItem[] = [];
        
        // Skip empty rows and look for data directly
        let currentCategory = "";
        
        // Process all rows, looking for data that looks like budget items
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          if (!row || !Array.isArray(row) || row.length === 0) continue;
          
          const firstCell = row[0];
          
          // Skip empty rows or rows without a name in the first column
          if (!firstCell) continue;
          
          // Handle row parsing more generically to identify budget items
          if (typeof firstCell === 'string') {
            // Check if this looks like a category header
            // Category headers typically don't have numeric values in the next columns
            const hasNumericValues = row.slice(1).some(cell => typeof cell === 'number');
            
            if (!hasNumericValues) {
              // This looks like a category header
              currentCategory = firstCell;
              console.log("Found category:", currentCategory);
              continue;
            }
            
            // If this looks like an item row with a name and at least one numeric value
            // Extract the budget value from the row - it's usually in the first numeric column
            let budgetValue = null;
            for (let j = 1; j < row.length; j++) {
              const cell = row[j];
              if (typeof cell === 'number') {
                budgetValue = cell;
                break;
              } else if (typeof cell === 'string' && !isNaN(parseFloat(cell.replace(/[£$,]/g, '')))) {
                // Try to extract numeric value from string with currency symbols
                budgetValue = parseFloat(cell.replace(/[£$,]/g, ''));
                break;
              }
            }
            
            if (budgetValue !== null && currentCategory) {
              budgetItems.push({
                category: currentCategory,
                name: firstCell,
                budget: budgetValue,
              });
              console.log(`Added budget item: ${firstCell} (${currentCategory}) - £${budgetValue}`);
            }
          } else if (typeof firstCell === 'number' && row.length > 1 && currentCategory) {
            // Handle case where first cell is a number and second cell might be a description
            const itemName = typeof row[1] === 'string' ? row[1] : `Item ${firstCell}`;
            budgetItems.push({
              category: currentCategory,
              name: itemName,
              budget: firstCell,
            });
            console.log(`Added budget item: ${itemName} (${currentCategory}) - £${firstCell}`);
          }
        }
        
        if (budgetItems.length === 0) {
          console.log("No valid budget items found in the spreadsheet");
          throw new Error("No valid budget items found in the spreadsheet. Please check the format or try a different file.");
        }
        
        console.log(`Successfully extracted ${budgetItems.length} budget items`);
        resolve(budgetItems);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(error instanceof Error ? error : new Error('Failed to process the Excel file. Please check the format.'));
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
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
    // First, delete any existing budget items for this year/month
    const { error: deleteError } = await supabase
      .from('budget_items')
      .delete()
      .eq('year', year)
      .eq('month', month);
    
    if (deleteError) {
      console.error('Error deleting existing budget items:', deleteError);
      throw deleteError;
    }
    
    console.log(`Deleted existing budget items for ${month}/${year}`);
    
    // Then insert the new budget items
    const { error: insertError } = await supabase
      .from('budget_items')
      .insert(
        budgetItems.map(item => ({
          year,
          month,
          category: item.category,
          name: item.name,
          budget_amount: item.budget,
          actual_amount: item.actual || null,
          forecast_amount: item.forecast || null,
        }))
      );
    
    if (insertError) {
      console.error('Error inserting budget items:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${budgetItems.length} budget items`);
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
      console.log(`Processing budget file for ${month}/${year}:`, file.name);
      
      // Process the file
      const budgetItems = await processBudgetFile(file);
      
      if (budgetItems.length === 0) {
        console.log("No valid budget data found in the file.");
        return false;
      }
      
      // Save to database
      await saveBudgetItems(budgetItems, year, month);
      
      console.log(`Successfully imported ${budgetItems.length} budget items.`);
      
      return true;
    } catch (error) {
      console.error('Budget processing error:', error);
      console.error(error instanceof Error ? error.message : "Failed to process budget file.");
      throw error; // Re-throw to let the UI handle the error
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
