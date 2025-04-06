
import { supabase } from '@/lib/supabase';
import { BudgetItem } from './types';
import { toast } from 'sonner';

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
    console.log(`==== BUDGET SAVE OPERATION STARTED at ${new Date().toISOString()} ====`);
    console.log(`Attempting to save budget data for year ${year} with ${Object.keys(budgetItemsByMonth).length} months`);
    
    for (const monthStr in budgetItemsByMonth) {
      const month = Number(monthStr);
      const budgetItems = budgetItemsByMonth[month];
      
      if (budgetItems.length === 0) continue;
      
      console.log(`Saving ${budgetItems.length} budget items for month ${month}/${year}`);
      
      // Log Food and Beverage Gross Profit items if present
      const foodGP = budgetItems.find(item => 
        item.name === 'Food Gross Profit' || 
        item.name.toLowerCase() === 'food gross profit');
      
      const bevGP = budgetItems.find(item => 
        item.name === 'Beverage Gross Profit' || 
        item.name.toLowerCase() === 'beverage gross profit');
      
      if (foodGP) {
        console.log(`Found Food Gross Profit item for month ${month}: £${foodGP.budget}`);
      } else {
        console.log(`⚠️ No Food Gross Profit item found for month ${month}`);
      }
      
      if (bevGP) {
        console.log(`Found Beverage Gross Profit item for month ${month}: £${bevGP.budget}`);
      } else {
        console.log(`⚠️ No Beverage Gross Profit item found for month ${month}`);
      }
      
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
      const { data: insertedData, error: insertError } = await supabase
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
        )
        .select();
      
      if (insertError) {
        console.error(`Error inserting budget items for ${month}/${year}:`, insertError);
        throw insertError;
      }
      
      console.log(`Successfully inserted ${budgetItems.length} budget items for ${month}/${year}`);
      
      if (insertedData) {
        const insertedFoodGP = insertedData.find(item => 
          item.name === 'Food Gross Profit');
        const insertedBevGP = insertedData.find(item => 
          item.name === 'Beverage Gross Profit');
          
        if (insertedFoodGP) {
          console.log(`✅ Food Gross Profit successfully saved to database for ${month}/${year}: £${insertedFoodGP.budget_amount}`);
        }
        
        if (insertedBevGP) {
          console.log(`✅ Beverage Gross Profit successfully saved to database for ${month}/${year}: £${insertedBevGP.budget_amount}`);
        }
      }
    }
    
    console.log(`==== BUDGET SAVE OPERATION COMPLETED at ${new Date().toISOString()} ====`);
    toast.success(`Budget data for year ${year} saved successfully`);
  } catch (error) {
    console.error('Error saving budget items:', error);
    toast.error('Failed to save budget data to the database.');
    throw new Error('Failed to save budget data to the database.');
  }
};
