
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBudgetItems } from '@/utils/budget/api';

interface BudgetItem {
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

export function useBudgetData(currentYear: number, currentMonth: number) {
  const {
    data: budgetItems,
    isLoading: isLoadingBudget
  } = useQuery({
    queryKey: ['budget-items', currentYear, currentMonth],
    queryFn: () => fetchBudgetItems(currentYear, currentMonth),
    enabled: true
  });

  const processedBudgetData = useMemo(() => {
    if (!budgetItems) return [];
    
    // Filter out the "Tavern" row
    const filteredItems = budgetItems.filter(item => 
      item.name.toLowerCase() !== 'tavern' 
    );
    
    // Process the data to add headers and organize by category
    const processedData: BudgetItem[] = [];
    
    // Add Revenue section header and items
    processedData.push({
      id: 'revenue-header',
      category: 'Header',
      name: 'REVENUE',
      isHeader: true,
      budget_amount: 0,
      actual_amount: 0,
      forecast_amount: 0
    });
    
    // Add revenue items (Food Revenue, Beverage Revenue, Total Revenue)
    const revenueItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes('revenue') || 
      item.name.toLowerCase().includes('turnover') ||
      item.category.toLowerCase().includes('revenue')
    );
    
    revenueItems.forEach(item => {
      processedData.push({
        ...item,
        isHeader: false
      });
    });
    
    // Add COGS section header and items
    processedData.push({
      id: 'cogs-header',
      category: 'Header',
      name: 'COST OF GOODS SOLD (COGS)',
      isHeader: true,
      budget_amount: 0,
      actual_amount: 0,
      forecast_amount: 0
    });
    
    // Add COGS items, but exclude "Other Staff Costs"
    const cogsItems = filteredItems.filter(item => 
      (item.name.toLowerCase().includes('cos') || 
       item.name.toLowerCase().includes('cost of sales') ||
       item.category.toLowerCase().includes('cost of sales')) &&
      !item.name.toLowerCase().includes('other staff costs')
    );
    
    cogsItems.forEach(item => {
      processedData.push({
        ...item,
        isHeader: false
      });
    });
    
    // Add Gross Profit section header and items
    processedData.push({
      id: 'profit-header',
      category: 'Header',
      name: 'GROSS PROFIT',
      isHeader: true,
      budget_amount: 0, 
      actual_amount: 0,
      forecast_amount: 0
    });
    
    // Add Gross Profit items - make sure to include Food and Beverage-specific gross profits
    const profitItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes('gross profit') || 
      item.name.toLowerCase().includes('profit/(loss)') ||
      item.category.toLowerCase().includes('profit')
    );
    
    // Calculate Food Gross Profit if it doesn't exist
    const foodRevenueItem = revenueItems.find(item => 
      item.name.toLowerCase().includes('food') && 
      (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales'))
    );
    
    const foodCostItem = cogsItems.find(item => 
      item.name.toLowerCase().includes('food') && 
      (item.name.toLowerCase().includes('cost') || item.name.toLowerCase().includes('cos'))
    );
    
    const hasFoodGrossProfit = profitItems.some(item => 
      item.name.toLowerCase().includes('food') && 
      item.name.toLowerCase().includes('gross profit')
    );
    
    // Add Food Gross Profit if food revenue and cost exist but gross profit doesn't
    if (foodRevenueItem && foodCostItem && !hasFoodGrossProfit) {
      const foodGrossProfitAmount = foodRevenueItem.budget_amount - foodCostItem.budget_amount;
      const foodGrossProfitActual = 
        (foodRevenueItem.actual_amount || 0) - (foodCostItem.actual_amount || 0);
      const foodGrossProfitForecast = 
        (foodRevenueItem.forecast_amount || foodRevenueItem.budget_amount) - 
        (foodCostItem.forecast_amount || foodCostItem.budget_amount);
      
      const foodGPPercentage = foodRevenueItem.budget_amount !== 0 ? 
        (foodGrossProfitAmount / foodRevenueItem.budget_amount) * 100 : 0;
      
      processedData.push({
        id: 'food-gross-profit',
        category: 'Food Gross Profit',
        name: 'Food Gross Profit',
        budget_amount: foodGrossProfitAmount,
        actual_amount: foodGrossProfitActual,
        forecast_amount: foodGrossProfitForecast,
        budget_percentage: foodGPPercentage,
        isHeader: false,
        isGrossProfit: true
      });
    }
    
    // Calculate Beverage Gross Profit if it doesn't exist
    const bevRevenueItem = revenueItems.find(item => 
      (item.name.toLowerCase().includes('beverage') || 
       item.name.toLowerCase().includes('drink') || 
       item.name.toLowerCase().includes('bar')) && 
      (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales'))
    );
    
    const bevCostItem = cogsItems.find(item => 
      (item.name.toLowerCase().includes('beverage') || 
       item.name.toLowerCase().includes('drink') || 
       item.name.toLowerCase().includes('bar')) && 
      (item.name.toLowerCase().includes('cost') || item.name.toLowerCase().includes('cos'))
    );
    
    const hasBevGrossProfit = profitItems.some(item => 
      (item.name.toLowerCase().includes('beverage') || 
       item.name.toLowerCase().includes('drink') || 
       item.name.toLowerCase().includes('bar')) && 
      item.name.toLowerCase().includes('gross profit')
    );
    
    // Add Beverage Gross Profit if beverage revenue and cost exist but gross profit doesn't
    if (bevRevenueItem && bevCostItem && !hasBevGrossProfit) {
      const bevGrossProfitAmount = bevRevenueItem.budget_amount - bevCostItem.budget_amount;
      const bevGrossProfitActual = 
        (bevRevenueItem.actual_amount || 0) - (bevCostItem.actual_amount || 0);
      const bevGrossProfitForecast = 
        (bevRevenueItem.forecast_amount || bevRevenueItem.budget_amount) - 
        (bevCostItem.forecast_amount || bevCostItem.budget_amount);
      
      const bevGPPercentage = bevRevenueItem.budget_amount !== 0 ? 
        (bevGrossProfitAmount / bevRevenueItem.budget_amount) * 100 : 0;
      
      processedData.push({
        id: 'beverage-gross-profit',
        category: 'Beverage Gross Profit',
        name: 'Beverage Gross Profit',
        budget_amount: bevGrossProfitAmount,
        actual_amount: bevGrossProfitActual,
        forecast_amount: bevGrossProfitForecast,
        budget_percentage: bevGPPercentage,
        isHeader: false,
        isGrossProfit: true
      });

      console.log("Added Beverage Gross Profit with value:", bevGrossProfitAmount);
    } else {
      console.log("Beverage Gross Profit check:", { 
        hasBevRevenue: !!bevRevenueItem, 
        hasBevCost: !!bevCostItem, 
        alreadyHasGP: hasBevGrossProfit 
      });
    }
    
    // Add existing profit items
    profitItems.forEach(item => {
      processedData.push({
        ...item,
        isHeader: false,
        isGrossProfit: true
      });
    });
    
    // Add Expenses section header
    processedData.push({
      id: 'expenses-header',
      category: 'Header',
      name: 'OPERATING EXPENSES',
      isHeader: true,
      budget_amount: 0,
      actual_amount: 0,
      forecast_amount: 0
    });
    
    // Find Wages and Salaries item, and Other Staff Costs
    const wagesItem = filteredItems.find(item => 
      item.name.toLowerCase().includes('wages') && 
      item.name.toLowerCase().includes('salaries')
    );
    
    const otherStaffCostsItem = filteredItems.find(item => 
      item.name.toLowerCase().includes('other staff costs')
    );
    
    // Prepare expense items list, excluding items we handle specially
    const expenseItems = filteredItems.filter(item => 
      !item.name.toLowerCase().includes('revenue') && 
      !item.name.toLowerCase().includes('turnover') &&
      !item.name.toLowerCase().includes('cos') && 
      !item.name.toLowerCase().includes('cost of sales') &&
      !item.name.toLowerCase().includes('gross profit') &&
      !item.name.toLowerCase().includes('profit/(loss)') &&
      !item.category.toLowerCase().includes('revenue') &&
      !item.category.toLowerCase().includes('cost of sales') &&
      !item.category.toLowerCase().includes('profit') &&
      // Exclude items we'll handle separately
      !item.name.toLowerCase().includes('total admin') &&
      !item.name.toLowerCase().includes('operating profit') &&
      !item.name.toLowerCase().includes('other staff costs')
    );
    
    // First add all expense items except Other Staff Costs
    expenseItems.forEach(item => {
      processedData.push({
        ...item,
        isHeader: false
      });
      
      // If this is the Wages and Salaries item, add Other Staff Costs right after it
      if (wagesItem && 
          item.name.toLowerCase() === wagesItem.name.toLowerCase() && 
          otherStaffCostsItem) {
        processedData.push({
          ...otherStaffCostsItem,
          isHeader: false
        });
      }
    });
    
    // If Wages and Salaries wasn't found but we have Other Staff Costs, add it at the beginning
    if (!wagesItem && otherStaffCostsItem && expenseItems.length > 0) {
      // Insert Other Staff Costs at the beginning of Operating Expenses section
      const expensesHeaderIndex = processedData.findIndex(item => 
        item.isHeader && item.name === 'OPERATING EXPENSES'
      );
      
      if (expensesHeaderIndex !== -1) {
        processedData.splice(expensesHeaderIndex + 1, 0, {
          ...otherStaffCostsItem,
          isHeader: false
        });
      }
    }
    
    // Add Total Admin Expenses as a highlighted item
    const totalAdminItem = filteredItems.find(item => 
      item.name.toLowerCase().includes('total admin')
    );
    
    if (totalAdminItem) {
      processedData.push({
        ...totalAdminItem,
        isHeader: false,
        isHighlighted: true,
        name: 'Total Admin Expenses',
        category: 'Expenses'
      });
    }
    
    // Add Operating Profit as a highlighted item
    const operatingProfitItem = filteredItems.find(item => 
      item.name.toLowerCase().includes('operating profit')
    );
    
    if (operatingProfitItem) {
      processedData.push({
        ...operatingProfitItem,
        isHeader: false,
        isHighlighted: true,
        name: 'Operating Profit',
        category: 'Header',
        isOperatingProfit: true
      });
    }
    
    return processedData;
  }, [budgetItems]);

  return {
    isLoading: isLoadingBudget,
    processedBudgetData
  };
}
