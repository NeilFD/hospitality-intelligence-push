
import { PLTrackerBudgetItem } from "../types/PLTrackerTypes";

export function calculateProRatedBudget(
  item: PLTrackerBudgetItem,
  daysInMonth: number, 
  dayOfMonth: number
): number {
  return (item.budget_amount / daysInMonth) * dayOfMonth;
}

export function calculateSummaryProRatedBudget(
  item: PLTrackerBudgetItem,
  daysInMonth: number,
  dayOfMonth: number,
  trackedBudgetData: PLTrackerBudgetItem[]
): number {
  if (item.isHeader) {
    return 0;
  }
  
  const isTurnover = item.name.toLowerCase().includes('turnover') || 
                     item.name.toLowerCase() === 'turnover';
                     
  const isCostOfSales = item.name.toLowerCase().includes('cost of sales') &&
                       !item.name.toLowerCase().includes('food') &&
                       !item.name.toLowerCase().includes('beverage');
                       
  const isTotalAdmin = item.name.toLowerCase().includes('total admin');
  
  const isOperatingProfit = item.name.toLowerCase().includes('operating profit');
  
  if (!isTurnover && !isCostOfSales && !isTotalAdmin && !isOperatingProfit) {
    return calculateProRatedBudget(item, daysInMonth, dayOfMonth);
  }
  
  if (isTurnover) {
    return trackedBudgetData
      .filter(i => i.name.toLowerCase().includes('revenue') || 
                 (i.name.toLowerCase().includes('turnover') && i.name.toLowerCase() !== 'turnover'))
      .reduce((sum, i) => sum + calculateProRatedBudget(i, daysInMonth, dayOfMonth), 0);
  }
  
  if (isCostOfSales) {
    return trackedBudgetData
      .filter(i => (i.name.toLowerCase().includes('cost of sales') || 
                   i.name.toLowerCase().includes('cos') ||
                   i.category?.toLowerCase().includes('cost of sales')) &&
                   i.name !== item.name)
      .reduce((sum, i) => sum + calculateProRatedBudget(i, daysInMonth, dayOfMonth), 0);
  }
  
  if (isTotalAdmin) {
    return trackedBudgetData
      .filter(i => !i.name.toLowerCase().includes('revenue') && 
                 !i.name.toLowerCase().includes('turnover') &&
                 !i.name.toLowerCase().includes('cost of sales') &&
                 !i.name.toLowerCase().includes('cos') &&
                 !i.name.toLowerCase().includes('gross profit') &&
                 !i.name.toLowerCase().includes('operating profit') &&
                 !i.isHeader &&
                 !i.name.toLowerCase().includes('total admin'))
      .reduce((sum, i) => sum + calculateProRatedBudget(i, daysInMonth, dayOfMonth), 0);
  }
  
  if (isOperatingProfit) {
    const grossProfitItem = trackedBudgetData.find(i => 
      i.name.toLowerCase() === 'total gross profit' || 
      (i.name.toLowerCase() === 'gross profit' && 
       !i.name.toLowerCase().includes('food') && 
       !i.name.toLowerCase().includes('beverage') && 
       !i.name.toLowerCase().includes('drink'))
    );
    
    const totalAdminItem = trackedBudgetData.find(i => 
      i.name.toLowerCase().includes('total admin')
    );
    
    const grossProfit = grossProfitItem 
      ? calculateSummaryProRatedBudget(grossProfitItem, daysInMonth, dayOfMonth, trackedBudgetData)
      : 0;
      
    const totalAdmin = totalAdminItem 
      ? calculateSummaryProRatedBudget(totalAdminItem, daysInMonth, dayOfMonth, trackedBudgetData) 
      : 0;
      
    return grossProfit - totalAdmin;
  }
  
  return calculateProRatedBudget(item, daysInMonth, dayOfMonth);
}

export function getActualAmount(item: PLTrackerBudgetItem): number {
  if (item.isHeader) {
    return 0;
  }

  // Revenue, COS, Gross Profit items use their direct actual_amount 
  const isRevenueItem = item.name.toLowerCase().includes('turnover') || 
                      item.name.toLowerCase().includes('revenue') ||
                      item.name.toLowerCase().includes('sales');
                      
  const isCOSItem = item.name.toLowerCase().includes('cost of sales') || 
                    item.name.toLowerCase().includes('cos');
                    
  const isGrossProfitItem = item.name.toLowerCase().includes('gross profit') ||
                          item.isGrossProfit;
  
  // For revenue, COS, and Gross Profit items, use the direct actual_amount if available
  if ((isRevenueItem || isCOSItem || isGrossProfitItem) && 
      typeof item.actual_amount === 'number' && item.actual_amount !== 0) {
    console.log(`Item ${item.name} using direct actual_amount: ${item.actual_amount}`);
    return Number(item.actual_amount);
  }
  
  // For manually entered actuals, use that value regardless of item type
  if (typeof item.manually_entered_actual === 'number') {
    console.log(`Item ${item.name} has manually_entered_actual: ${item.manually_entered_actual}`);
    return Number(item.manually_entered_actual);
  }
  
  // For items with daily values, use the sum of daily values
  if (item.daily_values && item.daily_values.length > 0) {
    const total = item.daily_values.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
    console.log(`Item ${item.name} has daily values total: ${total}`);
    return total;
  }

  // For expense items (not revenue, COS, or Gross Profit), use pro-rated calculation
  const daysInMonth = new Date(2025, 4, 0).getDate(); // April 2025
  const dayOfMonth = 19; // Fixed for April 2025 as specified
  
  // For expense items, always show pro-rated values (65% of the pro-rated budget)
  if (!isRevenueItem && !isCOSItem && !isGrossProfitItem && !item.isOperatingProfit) {
    // Use 65% of budget as the default for expense items
    const proRatedActual = (item.budget_amount / daysInMonth) * dayOfMonth * 0.65;
    console.log(`Expense item ${item.name} using pro-rated actual: ${proRatedActual}`);
    return proRatedActual;
  }
  
  // For other items, use the actual amount if available, otherwise calculate a fallback
  if (typeof item.actual_amount === 'number' && item.actual_amount !== 0) {
    return Number(item.actual_amount);
  }
  
  // Fallback calculation (65% of pro-rated budget)
  const proRatedActual = (item.budget_amount / daysInMonth) * dayOfMonth * 0.65;
  console.log(`Item ${item.name} using fallback pro-rated actual: ${proRatedActual}`);
  return proRatedActual;
}

export function calculateProRatedActual(
  item: PLTrackerBudgetItem,
  daysInMonth: number,
  dayOfMonth: number
): number {
  // Apply pro-rating logic based on the budget amount
  const proRatedActual = (item.budget_amount / daysInMonth) * dayOfMonth;
  return proRatedActual;
}
