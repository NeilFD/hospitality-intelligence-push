
import { read, utils } from 'xlsx';
import { BudgetItem } from './types';

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
            // Explicitly check for Food Gross Profit and Beverage Gross Profit
            const isFoodGrossProfit = lcFirstCell.includes('food') && lcFirstCell.includes('gross profit');
            const isBeverageGrossProfit = (lcFirstCell.includes('beverage') || lcFirstCell.includes('drink')) && lcFirstCell.includes('gross profit');
            
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
              
              // Add to budget items
              const budgetItem = {
                category: currentCategory,
                name: firstCellStr,
                budget: budgetValue,
              };
              
              // Special handling for Food and Beverage Gross Profit
              if (isFoodGrossProfit) {
                console.log(`Found Food Gross Profit for month ${month}: £${budgetValue}`);
                budgetItem.name = "Food Gross Profit";
              } else if (isBeverageGrossProfit) {
                console.log(`Found Beverage Gross Profit for month ${month}: £${budgetValue}`);
                budgetItem.name = "Beverage Gross Profit";
              }
              
              budgetItemsByMonth[month].push(budgetItem);
              
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

