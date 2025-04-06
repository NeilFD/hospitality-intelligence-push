
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BudgetItem } from '@/utils/budget/types';

// Type for processed budget data that extends BudgetItem but replaces budget with budget_amount
export interface ProcessedBudgetItem extends Omit<BudgetItem, 'budget'> {
  budget_amount: number;
  actual_amount?: number;
  forecast_amount?: number;
  isAdminHeader?: boolean; 
  tracking_type?: string; // Add tracking_type as optional
}

export const useBudgetData = (year: number, month: number) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processedBudgetData, setProcessedBudgetData] = useState<ProcessedBudgetItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgetData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch budget data from Supabase
        const { data: budgetData, error: budgetError } = await supabase
          .from('budget_items')
          .select('*')
          .eq('year', year)
          .eq('month', month);
        
        if (budgetError) {
          console.error('Error fetching budget data:', budgetError);
          setError('Failed to load budget data.');
          setIsLoading(false);
          return;
        }
        
        if (!budgetData || budgetData.length === 0) {
          setProcessedBudgetData([]);
          setIsLoading(false);
          return;
        }
        
        // Process the budget data
        const processedData = processBudgetData(budgetData);
        console.log("Processed budget data:", processedData.map(item => `${item.name} (${item.category})`));
        setProcessedBudgetData(processedData);
      } catch (err) {
        console.error('Unexpected error in useBudgetData:', err);
        setError('An unexpected error occurred while loading budget data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBudgetData();
  }, [year, month]);
  
  const processBudgetData = (budgetData: BudgetItem[]): ProcessedBudgetItem[] => {
    // Group items by category for easier processing
    const categorizedItems = budgetData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, BudgetItem[]>);
    
    let result: ProcessedBudgetItem[] = [];
    
    // Add Turnover header and items
    if (categorizedItems['Revenue'] || categorizedItems['Turnover']) {
      result.push({ category: 'Header', name: 'TURNOVER', budget_amount: 0, isHeader: true });
      
      // Add revenue items
      const revenueItems = categorizedItems['Revenue'] || categorizedItems['Turnover'] || [];
      
      // Separate food and beverage revenue items
      const foodRevenueItems = revenueItems.filter(item => 
        item.name.toLowerCase().includes('food'));
      const beverageRevenueItems = revenueItems.filter(item => 
        item.name.toLowerCase().includes('beverage') || 
        item.name.toLowerCase().includes('drink') ||
        item.name.toLowerCase().includes('bar'));
      const otherRevenueItems = revenueItems.filter(item => 
        !foodRevenueItems.includes(item) && !beverageRevenueItems.includes(item));
      
      // Calculate food turnover
      const foodTurnover = foodRevenueItems.reduce((sum, item) => sum + (item.budget_amount || item.budget), 0);
      const foodActualTurnover = foodRevenueItems.reduce((sum, item) => sum + (item.actual_amount || item.actual || 0), 0);
      const foodForecastTurnover = foodRevenueItems.reduce((sum, item) => sum + (item.forecast_amount || item.forecast || 0), 0);
      
      // Calculate beverage turnover
      const beverageTurnover = beverageRevenueItems.reduce((sum, item) => sum + (item.budget_amount || item.budget), 0);
      const beverageActualTurnover = beverageRevenueItems.reduce((sum, item) => sum + (item.actual_amount || item.actual || 0), 0);
      const beverageForecastTurnover = beverageRevenueItems.reduce((sum, item) => sum + (item.forecast_amount || item.forecast || 0), 0);
      
      // Add all revenue items
      revenueItems.forEach(item => {
        result.push({
          id: item.id,
          category: item.category,
          name: item.name,
          budget_amount: item.budget_amount || item.budget,
          actual_amount: item.actual_amount || item.actual || 0,
          forecast_amount: item.forecast_amount || item.forecast,
          tracking_type: item.tracking_type,
        });
      });
      
      // Calculate total turnover
      const totalTurnover = revenueItems.reduce((sum, item) => sum + (item.budget_amount || item.budget), 0);
      const totalActualTurnover = revenueItems.reduce((sum, item) => sum + (item.actual_amount || item.actual || 0), 0);
      const totalForecastTurnover = revenueItems.reduce((sum, item) => sum + (item.forecast_amount || item.forecast || 0), 0);
      
      result.push({
        category: 'Summary',
        name: 'Turnover',
        budget_amount: totalTurnover,
        actual_amount: totalActualTurnover,
        forecast_amount: totalForecastTurnover,
        isHighlighted: true
      });
    }
    
    // Add Cost of Sales header and items
    if (categorizedItems['Cost of Sales'] || categorizedItems['COS']) {
      result.push({ category: 'Header', name: 'COST OF SALES', budget_amount: 0, isHeader: true });
      
      const cosItems = categorizedItems['Cost of Sales'] || categorizedItems['COS'] || [];
      
      // Separate food and beverage COS items
      const foodCosItems = cosItems.filter(item => 
        item.name.toLowerCase().includes('food'));
      const beverageCosItems = cosItems.filter(item => 
        item.name.toLowerCase().includes('beverage') || 
        item.name.toLowerCase().includes('drink') ||
        item.name.toLowerCase().includes('bar'));
      const otherCosItems = cosItems.filter(item => 
        !foodCosItems.includes(item) && !beverageCosItems.includes(item));
      
      // Calculate food COS
      const foodCOS = foodCosItems.reduce((sum, item) => sum + (item.budget_amount || item.budget), 0);
      const foodActualCOS = foodCosItems.reduce((sum, item) => sum + (item.actual_amount || item.actual || 0), 0);
      const foodForecastCOS = foodCosItems.reduce((sum, item) => sum + (item.forecast_amount || item.forecast || 0), 0);
      
      // Calculate beverage COS
      const beverageCOS = beverageCosItems.reduce((sum, item) => sum + (item.budget_amount || item.budget), 0);
      const beverageActualCOS = beverageCosItems.reduce((sum, item) => sum + (item.actual_amount || item.actual || 0), 0);
      const beverageForecastCOS = beverageCosItems.reduce((sum, item) => sum + (item.forecast_amount || item.forecast || 0), 0);
      
      cosItems.forEach(item => {
        result.push({
          id: item.id,
          category: item.category,
          name: item.name,
          budget_amount: item.budget_amount || item.budget,
          actual_amount: item.actual_amount || item.actual || 0,
          forecast_amount: item.forecast_amount || item.forecast,
          tracking_type: item.tracking_type,
        });
      });
      
      // Calculate total cost of sales
      const totalCOS = cosItems.reduce((sum, item) => sum + (item.budget_amount || item.budget), 0);
      const totalActualCOS = cosItems.reduce((sum, item) => sum + (item.actual_amount || item.actual || 0), 0);
      const totalForecastCOS = cosItems.reduce((sum, item) => sum + (item.forecast_amount || item.forecast || 0), 0);
      
      result.push({
        category: 'Summary',
        name: 'Cost of Sales',
        budget_amount: totalCOS,
        actual_amount: totalActualCOS,
        forecast_amount: totalForecastCOS,
        isHighlighted: true
      });
      
      // Get turnover values for GP calculations
      const revenueItems = categorizedItems['Revenue'] || categorizedItems['Turnover'] || [];
      
      // Separate food and beverage revenue items again to ensure we have them
      const foodRevenueItems = revenueItems.filter(item => 
        item.name.toLowerCase().includes('food'));
      const beverageRevenueItems = revenueItems.filter(item => 
        item.name.toLowerCase().includes('beverage') || 
        item.name.toLowerCase().includes('drink') ||
        item.name.toLowerCase().includes('bar'));
      
      // Make sure we have turnover values calculated
      const foodTurnover = foodRevenueItems.reduce((sum, item) => sum + (item.budget_amount || item.budget), 0);
      const foodActualTurnover = foodRevenueItems.reduce((sum, item) => sum + (item.actual_amount || item.actual || 0), 0);
      const foodForecastTurnover = foodRevenueItems.reduce((sum, item) => sum + (item.forecast_amount || item.forecast || 0), 0);
      
      const beverageTurnover = beverageRevenueItems.reduce((sum, item) => sum + (item.budget_amount || item.budget), 0);
      const beverageActualTurnover = beverageRevenueItems.reduce((sum, item) => sum + (item.actual_amount || item.actual || 0), 0);
      const beverageForecastTurnover = beverageRevenueItems.reduce((sum, item) => sum + (item.forecast_amount || item.forecast || 0), 0);
      
      // Calculate Food Gross Profit - ensure this is explicitly named "Food Gross Profit"
      if (foodRevenueItems.length > 0 && foodCosItems.length > 0) {
        const foodGrossProfit = foodTurnover - foodCOS;
        const foodGpPercentage = foodTurnover > 0 ? foodGrossProfit / foodTurnover : 0;
        
        result.push({
          category: 'Summary',
          name: 'Food Gross Profit',
          budget_amount: foodGrossProfit,
          budget_percentage: foodGpPercentage,
          actual_amount: foodActualTurnover - foodActualCOS,
          forecast_amount: foodForecastTurnover - foodForecastCOS,
          isGrossProfit: true
        });
      }
      
      // Calculate Beverage Gross Profit - ensure this is explicitly named "Beverage Gross Profit"
      if (beverageRevenueItems.length > 0 && beverageCosItems.length > 0) {
        const beverageGrossProfit = beverageTurnover - beverageCOS;
        const beverageGpPercentage = beverageTurnover > 0 ? beverageGrossProfit / beverageTurnover : 0;
        
        result.push({
          category: 'Summary',
          name: 'Beverage Gross Profit',
          budget_amount: beverageGrossProfit,
          budget_percentage: beverageGpPercentage,
          actual_amount: beverageActualTurnover - beverageActualCOS,
          forecast_amount: beverageForecastTurnover - beverageForecastCOS,
          isGrossProfit: true
        });
      }
      
      // Calculate Total Gross Profit
      const turnoverItem = result.find(item => item.name === 'Turnover');
      if (turnoverItem) {
        const grossProfit = turnoverItem.budget_amount - totalCOS;
        const gpPercentage = turnoverItem.budget_amount > 0 ? grossProfit / turnoverItem.budget_amount : 0;
        
        result.push({
          category: 'Summary',
          name: 'Gross Profit',
          budget_amount: grossProfit,
          budget_percentage: gpPercentage,
          actual_amount: (turnoverItem.actual_amount || 0) - totalActualCOS,
          forecast_amount: (turnoverItem.forecast_amount || 0) - totalForecastCOS,
          isGrossProfit: true,
          isHighlighted: true
        });
      }
    }
    
    // Add Administrative Expenses
    const adminCategories = Object.keys(categorizedItems).filter(cat => 
      !['Revenue', 'Turnover', 'Cost of Sales', 'COS', 'Header', 'Summary'].includes(cat)
    );
    
    if (adminCategories.length > 0) {
      // Find all items that should be under Admin Expenses
      const allAdminItems = adminCategories.flatMap(category => categorizedItems[category]);
      
      // Find the "Wages and Salaries" item - as the start point
      const wagesIndex = allAdminItems.findIndex(item => 
        item.name.toLowerCase().includes('wages and salaries'));
        
      // Find the "Hotel and Travel" item - as the end point
      const hotelTravelIndex = allAdminItems.findIndex(item => 
        item.name.toLowerCase().includes('hotel and travel'));
        
      // Add the ADMIN EXPENSES header row
      if (wagesIndex !== -1) {
        result.push({ 
          category: 'Header', 
          name: 'ADMIN EXPENSES', 
          budget_amount: 0, 
          isHeader: true,
          isAdminHeader: true  // Adding this flag to identify the admin header
        });
      }
      
      let totalAdminBudget = 0;
      let totalAdminActual = 0;
      let totalAdminForecast = 0;
      
      adminCategories.forEach(category => {
        // Add category header
        result.push({ category: 'Header', name: category.toUpperCase(), budget_amount: 0, isHeader: true });
        
        // Add category items
        const items = categorizedItems[category];
        items.forEach(item => {
          result.push({
            id: item.id,
            category: item.category,
            name: item.name,
            budget_amount: item.budget_amount || item.budget,
            actual_amount: item.actual_amount || item.actual || 0,
            forecast_amount: item.forecast_amount || item.forecast,
            tracking_type: item.tracking_type,
          });
          
          totalAdminBudget += item.budget_amount || item.budget;
          totalAdminActual += item.actual_amount || item.actual || 0;
          totalAdminForecast += item.forecast_amount || item.forecast || 0;
        });
        
        // Add category subtotal
        const categoryTotal = items.reduce((sum, item) => sum + (item.budget_amount || item.budget), 0);
        result.push({
          category: 'Summary',
          name: `Total ${category}`,
          budget_amount: categoryTotal,
          actual_amount: items.reduce((sum, item) => sum + (item.actual_amount || item.actual || 0), 0),
          forecast_amount: items.reduce((sum, item) => sum + (item.forecast_amount || item.forecast || 0), 0),
          isHighlighted: true
        });
      });
      
      // Calculate Operating Profit
      const grossProfitItem = result.find(item => item.name === 'Gross Profit');
      if (grossProfitItem) {
        const operatingProfit = grossProfitItem.budget_amount - totalAdminBudget;
        const turnoverItem = result.find(item => item.name === 'Turnover');
        const turnover = turnoverItem ? turnoverItem.budget_amount : 0;
        const opPercentage = turnover > 0 ? operatingProfit / turnover : 0;
        
        result.push({
          category: 'Summary',
          name: 'Operating Profit',
          budget_amount: operatingProfit,
          budget_percentage: opPercentage,
          actual_amount: (grossProfitItem.actual_amount || 0) - totalAdminActual,
          forecast_amount: (grossProfitItem.forecast_amount || 0) - totalAdminForecast,
          isOperatingProfit: true,
          isHighlighted: true
        });
      }
    }
    
    // Debug: Log to check if Food and Beverage Gross Profit items are created
    const foodGpItem = result.find(item => item.name === 'Food Gross Profit');
    const bevGpItem = result.find(item => item.name === 'Beverage Gross Profit');
    console.log("Food GP Item:", foodGpItem);
    console.log("Beverage GP Item:", bevGpItem);
    
    // Filter out any row with the name "Total" that follows the Gross Profit row
    const grossProfitIndex = result.findIndex(item => item.name === 'Gross Profit');
    if (grossProfitIndex !== -1) {
      result = result.filter((item, index) => {
        if (index > grossProfitIndex && item.name === 'Total') {
          return false;
        }
        return true;
      });
    }
    
    // Add a filter to remove specific unwanted headers and rows
    result = result.filter(item => 
      item.name.toLowerCase() !== 'admin expenses' && 
      item.name.toLowerCase() !== 'tavern'
    );

    return result;
  };
  
  return { isLoading, processedBudgetData, error };
};
