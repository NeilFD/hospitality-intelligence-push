
import { supabase } from '@/lib/supabase';
import { BudgetItem } from './types';

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
      
      // Log Food and Beverage Gross Profit items if present
      const foodGP = budgetItems.find(item => 
        item.name === 'Food Gross Profit' || 
        item.name.toLowerCase() === 'food gross profit');
      
      const bevGP = budgetItems.find(item => 
        item.name === 'Beverage Gross Profit' || 
        item.name.toLowerCase() === 'beverage gross profit');
      
      if (foodGP) {
        console.log(`Found Food Gross Profit item for month ${month}: £${foodGP.budget}`);
      }
      
      if (bevGP) {
        console.log(`Found Beverage Gross Profit item for month ${month}: £${bevGP.budget}`);
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
