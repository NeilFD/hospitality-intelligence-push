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
 * @param targetMonth The specific month to extract (1-12), or 0 for all months
 * @returns A promise that resolves to an array of budget items mapped by month
 */
export const processBudgetFile = async (
  file: File, 
  targetMonth: number = 0
): Promise<Record<number, BudgetItem[]>> => {
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
        
        // Map to store budget data by month
        const budgetItemsByMonth: Record<number, BudgetItem[]> = {};
        
        // Initialize months 1-12
        for (let i = 1; i <= 12; i++) {
          budgetItemsByMonth[i] = [];
        }
        
        // Keep track of column indices for monthly data
        const monthlyColumnIndices: Record<number, number> = {}; // month number (1-12) -> column index
        
        // Current category and subcategory tracking
        let currentCategory = "";
        let foundHeaderRow = false;
        let foodRevenueValue = 0;
        let beverageRevenueValue = 0;
        
        // First, identify the header row and column indices for monthly data
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !Array.isArray(row)) continue;
          
          // Check if this might be the header row with month names
          const monthNames = [
            'March', 'April', 'May', 'June', 'July', 'August',
            'September', 'October', 'November', 'December', 'January', 'February'
          ];
          
          const alternateMonthNames = [
            'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
            'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'
          ];
          
          // Check if this row contains month names
          let monthIndicesFound = 0;
          
          for (let j = 1; j < row.length; j++) {
            const cellValue = String(row[j]).trim();
            
            // Try to match with month names
            monthNames.forEach((monthName, idx) => {
              if (cellValue.includes(monthName)) {
                const monthNum = ((idx + 2) % 12) + 1; // Convert to 1-12 format (March is 3)
                monthlyColumnIndices[monthNum] = j;
                monthIndicesFound++;
                console.log(`Found month: ${monthName} (${monthNum}) at column ${j}`);
              }
            });
            
            // Try alternate format
            alternateMonthNames.forEach((monthName, idx) => {
              if (cellValue.includes(monthName)) {
                const monthNum = ((idx + 2) % 12) + 1; // Convert to 1-12 format (Mar is 3)
                if (!monthlyColumnIndices[monthNum]) {
                  monthlyColumnIndices[monthNum] = j;
                  monthIndicesFound++;
                  console.log(`Found month: ${monthName} (${monthNum}) at column ${j}`);
                }
              }
            });
          }
          
          if (monthIndicesFound >= 3) {
            foundHeaderRow = true;
            console.log("Found header row with month columns:", monthlyColumnIndices);
            break;
          }
        }
        
        // If we couldn't find month columns, try a more generic approach
        if (!foundHeaderRow) {
          console.log("Couldn't find specific monthly columns, using generic approach");
          // Assuming first 12 numeric columns after the first column might be months
          for (let i = 1; i <= 12; i++) {
            monthlyColumnIndices[i] = i;
          }
        }
        
        // Now process the data rows
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          if (!row || !Array.isArray(row) || row.length === 0) continue;
          
          const firstCell = row[0];
          
          // Skip empty rows or rows without a name in the first column
          if (!firstCell) continue;
          
          const firstCellStr = String(firstCell).trim();
          
          // Check if this looks like a category header
          if (typeof firstCell === 'string' && firstCellStr !== '') {
            // Check if this is a main category header (often in all caps or without numbers)
            const hasNumericValues = row.slice(1).some(cell => 
              typeof cell === 'number' || 
              (typeof cell === 'string' && /\d/.test(cell) && !isNaN(parseFloat(cell.replace(/[£$,]/g, ''))))
            );
            
            if (!hasNumericValues) {
              // This looks like a category header
              currentCategory = firstCellStr;
              console.log("Found category:", currentCategory);
              continue;
            }
            
            // Handle turnover-related rows
            const lcFirstCell = firstCellStr.toLowerCase();
            
            // Check for specific revenue lines we want to track
            const isTotalTurnover = lcFirstCell.includes('turnover') || lcFirstCell.includes('total sales') || lcFirstCell.includes('total revenue');
            const isFoodRevenue = lcFirstCell.includes('food') && (lcFirstCell.includes('revenue') || lcFirstCell.includes('sales'));
            const isBeverageRevenue = lcFirstCell.includes('beverage') || lcFirstCell.includes('drink') || lcFirstCell.includes('bar');
            
            // Skip year end calculations
            if (lcFirstCell.includes('year') && lcFirstCell.includes('end')) {
              continue;
            }
            
            // Process the item for each month we're interested in
            const monthsToProcess = targetMonth > 0 ? [targetMonth] : Object.keys(monthlyColumnIndices).map(Number);
            
            for (const month of monthsToProcess) {
              if (!monthlyColumnIndices[month]) continue;
              
              const columnIndex = monthlyColumnIndices[month];
              if (columnIndex >= row.length) continue;
              
              let budgetValue = extractNumericValue(row[columnIndex]);
              
              if (budgetValue === null) continue;
              
              // Store special revenue values for turnover calculation
              if (isFoodRevenue) {
                foodRevenueValue = budgetValue;
              } else if (isBeverageRevenue && (lcFirstCell.includes('revenue') || lcFirstCell.includes('sales'))) {
                beverageRevenueValue = budgetValue;
              }
              
              // For turnover, either use the actual turnover value or calculate it
              if (isTotalTurnover) {
                // Check if we already have a calculated value or should use the provided one
                const calculatedTurnover = foodRevenueValue + beverageRevenueValue;
                
                // Use the calculated value if it seems more accurate
                if (calculatedTurnover > 0 && Math.abs(calculatedTurnover - budgetValue) / budgetValue < 0.05) {
                  budgetValue = calculatedTurnover;
                }
              }
              
              budgetItemsByMonth[month].push({
                category: currentCategory,
                name: firstCellStr,
                budget: budgetValue,
              });
              
              console.log(`Added budget item for month ${month}: ${firstCellStr} (${currentCategory}) - £${budgetValue}`);
              
              // Add food and beverage revenue items if they're meaningful but not already included
              if (isTotalTurnover) {
                const hasFood = budgetItemsByMonth[month].some(item => 
                  item.name.toLowerCase().includes('food') && 
                  (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales'))
                );
                
                const hasBeverage = budgetItemsByMonth[month].some(item => 
                  (item.name.toLowerCase().includes('beverage') || item.name.toLowerCase().includes('drink')) && 
                  (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales'))
                );
                
                if (!hasFood && foodRevenueValue > 0) {
                  budgetItemsByMonth[month].push({
                    category: currentCategory,
                    name: "Food Revenue",
                    budget: foodRevenueValue
                  });
                  console.log(`Added derived Food Revenue item for month ${month}: £${foodRevenueValue}`);
                }
                
                if (!hasBeverage && beverageRevenueValue > 0) {
                  budgetItemsByMonth[month].push({
                    category: currentCategory,
                    name: "Beverage Revenue",
                    budget: beverageRevenueValue
                  });
                  console.log(`Added derived Beverage Revenue item for month ${month}: £${beverageRevenueValue}`);
                }
              }
            }
          }
        }
        
        // Check if we found any data
        let dataFound = false;
        for (const month in budgetItemsByMonth) {
          if (budgetItemsByMonth[month].length > 0) {
            dataFound = true;
            break;
          }
        }
        
        if (!dataFound) {
          console.log("No valid budget items found in the spreadsheet");
          throw new Error("No valid budget items found in the spreadsheet. Please check the format or try a different file.");
        }
        
        console.log(`Successfully extracted budget items for ${Object.keys(budgetItemsByMonth).filter(month => 
          budgetItemsByMonth[Number(month)].length > 0
        ).length} months`);
        
        resolve(budgetItemsByMonth);
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
 * Extract a numeric value from various cell formats
 * @param cell The cell value from the Excel sheet
 * @returns The extracted number or null if not a valid number
 */
const extractNumericValue = (cell: any): number | null => {
  if (typeof cell === 'number') {
    return cell;
  }
  
  if (typeof cell === 'string' && cell.trim() !== '') {
    // Remove currency symbols, commas, and parentheses (for negative values)
    let cleanedStr = cell.replace(/[£$,]/g, '');
    
    // Handle parentheses as negative values
    if (cleanedStr.startsWith('(') && cleanedStr.endsWith(')')) {
      cleanedStr = '-' + cleanedStr.substring(1, cleanedStr.length - 1);
    }
    
    const numValue = parseFloat(cleanedStr);
    if (!isNaN(numValue)) {
      return numValue;
    }
  }
  
  return null;
};

/**
 * Save budget items to the database
 * @param budgetItemsByMonth The budget items to save, mapped by month
 * @param year The budget year
 * @returns Promise that resolves when saving is complete
 */
export const saveBudgetItems = async (
  budgetItemsByMonth: Record<number, BudgetItem[]>, 
  year: number
): Promise<void> => {
  try {
    for (const monthStr in budgetItemsByMonth) {
      const month = Number(monthStr);
      const budgetItems = budgetItemsByMonth[month];
      
      if (budgetItems.length === 0) continue;
      
      console.log(`Saving ${budgetItems.length} budget items for month ${month}/${year}`);
      
      // First, delete any existing budget items for this year/month
      const { error: deleteError } = await supabase
        .from('budget_items')
        .delete()
        .eq('year', year)
        .eq('month', month);
      
      if (deleteError) {
        console.error(`Error deleting existing budget items for ${month}/${year}:`, deleteError);
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
        console.error(`Error inserting budget items for ${month}/${year}:`, insertError);
        throw insertError;
      }
      
      console.log(`Successfully inserted ${budgetItems.length} budget items for ${month}/${year}`);
    }
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
