
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BudgetItem } from '@/types/supabase-types';

// Type for processed budget data
interface ProcessedBudgetItem {
  id?: string;
  category: string;
  name: string;
  budget_amount: number;
  actual_amount?: number;
  forecast_amount?: number;
  budget_percentage?: number;
  isHeader?: boolean;
  isHighlighted?: boolean;
  isGrossProfit?: boolean;
  isOperatingProfit?: boolean;
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
      revenueItems.forEach(item => {
        result.push({
          id: item.id,
          category: item.category,
          name: item.name,
          budget_amount: item.budget_amount,
          actual_amount: item.actual_amount || 0,
          forecast_amount: item.forecast_amount,
        });
      });
      
      // Calculate total turnover
      const totalTurnover = revenueItems.reduce((sum, item) => sum + item.budget_amount, 0);
      result.push({
        category: 'Summary',
        name: 'Turnover',
        budget_amount: totalTurnover,
        actual_amount: revenueItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
        forecast_amount: revenueItems.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
        isHighlighted: true
      });
    }
    
    // Add Cost of Sales header and items
    if (categorizedItems['Cost of Sales'] || categorizedItems['COS']) {
      result.push({ category: 'Header', name: 'COST OF SALES', budget_amount: 0, isHeader: true });
      
      const cosItems = categorizedItems['Cost of Sales'] || categorizedItems['COS'] || [];
      cosItems.forEach(item => {
        result.push({
          id: item.id,
          category: item.category,
          name: item.name,
          budget_amount: item.budget_amount,
          actual_amount: item.actual_amount || 0,
          forecast_amount: item.forecast_amount,
        });
      });
      
      // Calculate total cost of sales
      const totalCOS = cosItems.reduce((sum, item) => sum + item.budget_amount, 0);
      result.push({
        category: 'Summary',
        name: 'Cost of Sales',
        budget_amount: totalCOS,
        actual_amount: cosItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
        forecast_amount: cosItems.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
        isHighlighted: true
      });
      
      // Calculate Gross Profit
      const turnoverItem = result.find(item => item.name === 'Turnover');
      if (turnoverItem) {
        const turnover = turnoverItem.budget_amount;
        const grossProfit = turnover - totalCOS;
        const gpPercentage = turnover > 0 ? grossProfit / turnover : 0;
        
        result.push({
          category: 'Summary',
          name: 'Gross Profit',
          budget_amount: grossProfit,
          budget_percentage: gpPercentage,
          actual_amount: (turnoverItem.actual_amount || 0) - cosItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
          forecast_amount: (turnoverItem.forecast_amount || 0) - cosItems.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
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
      // Removing the "ADMINISTRATIVE EXPENSES" header and "Total Admin expenses" as requested
      
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
            budget_amount: item.budget_amount,
            actual_amount: item.actual_amount || 0,
            forecast_amount: item.forecast_amount,
          });
          
          totalAdminBudget += item.budget_amount;
          totalAdminActual += item.actual_amount || 0;
          totalAdminForecast += item.forecast_amount || 0;
        });
        
        // Add category subtotal
        const categoryTotal = items.reduce((sum, item) => sum + item.budget_amount, 0);
        result.push({
          category: 'Summary',
          name: `Total ${category}`,
          budget_amount: categoryTotal,
          actual_amount: items.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
          forecast_amount: items.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
          isHighlighted: true
        });
      });
      
      // Removed "Total Administrative Expenses" and "Total Admin expenses" rows as requested
      
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
    
    return result;
  };
  
  return { isLoading, processedBudgetData, error };
};
