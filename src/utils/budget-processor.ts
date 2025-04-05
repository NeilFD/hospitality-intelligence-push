
import { read, utils } from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

export interface BudgetItem {
  category: string;
  name: string;
  budget: number;
  actual?: number;
  forecast?: number;
}

/**
 * Process an Excel budget file and extract budget data
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
        
        // Convert to JSON
        const jsonData = utils.sheet_to_json<any>(worksheet);
        
        // Map to our budget item structure
        // This assumes specific columns in the Excel file
        const budgetItems: BudgetItem[] = jsonData.map((row: any) => {
          // Try to find appropriate columns in the Excel file
          const category = row['Category'] || row['category'] || 'Uncategorized';
          const name = row['Item'] || row['Name'] || row['Description'] || row['name'] || row['description'];
          const budget = parseFloat(row['Budget'] || row['budget'] || 0);
          
          return {
            category,
            name: name || 'Unnamed Item',
            budget: isNaN(budget) ? 0 : budget,
          };
        }).filter(item => item.name && item.budget);
        
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
    // First, delete any existing budget items for this year/month
    await supabase
      .from('budget_items')
      .delete()
      .eq('year', year)
      .eq('month', month);
    
    // Then insert the new budget items
    const { error } = await supabase
      .from('budget_items')
      .insert(
        budgetItems.map(item => ({
          year,
          month,
          category: item.category,
          name: item.name,
          budget_amount: item.budget,
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
  const { toast } = useToast();
  
  const processBudget = async (file: File, year: number, month: number) => {
    try {
      // Process the file
      const budgetItems = await processBudgetFile(file);
      
      if (budgetItems.length === 0) {
        toast({
          title: "Processing Error",
          description: "No valid budget data found in the file.",
          variant: "destructive",
        });
        return false;
      }
      
      // Save to database
      await saveBudgetItems(budgetItems, year, month);
      
      toast({
        title: "Budget Imported",
        description: `Successfully imported ${budgetItems.length} budget items.`,
      });
      
      return true;
    } catch (error) {
      console.error('Budget processing error:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process budget file.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  return { processBudget };
};
