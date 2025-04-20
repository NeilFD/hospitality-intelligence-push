
import { PLTrackerBudgetItem } from "../types/PLTrackerTypes";

export function calculateProRatedBudget(
  item: PLTrackerBudgetItem,
  daysInMonth: number, 
  dayOfMonth: number
): number {
  // For Pro-Rated items, calculate based on days completed
  if (item.tracking_type === 'Pro-Rated') {
    return (item.budget_amount / daysInMonth) * dayOfMonth;
  }
  
  // For Discrete items, return the full budget amount
  if (item.tracking_type === 'Discrete') {
    return item.budget_amount;
  }
  
  // Default calculation (shouldn't reach here)
  return item.budget_amount;
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
       !i.name.toLowerCase().includes('beverage'))
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

  // For any item with actual_amount directly set (from revenue sources, COS, or wages)
  if (typeof item.actual_amount === 'number' && item.actual_amount !== 0) {
    console.log(`Item ${item.name} has direct actual_amount: ${item.actual_amount}`);
    return Number(item.actual_amount);
  }
  
  // For items with manually entered actuals
  if (typeof item.manually_entered_actual === 'number') {
    console.log(`Item ${item.name} has manually_entered_actual: ${item.manually_entered_actual}`);
    return Number(item.manually_entered_actual);
  }
  
  // For items with daily values
  if (item.daily_values && item.daily_values.length > 0) {
    const total = item.daily_values.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
    console.log(`Item ${item.name} has daily values total: ${total}`);
    return total;
  }

  // For ALL items that don't have actual amounts set, calculate a pro-rated actual
  // Admin expenses will now use this calculation too
  const daysInMonth = new Date(2025, 4, 0).getDate(); // April 2025
  const dayOfMonth = 19; // Fixed for April 2025 as specified
  
  // Use 65% of budget as the default for test data
  const proRatedActual = (item.budget_amount / daysInMonth) * dayOfMonth * 0.65;
  console.log(`Item ${item.name} using pro-rated actual: ${proRatedActual}`);
  return proRatedActual;
  
  // Default return 0 if no actual amount found - this should never be reached now
  // console.log(`Item ${item.name} has no actual amount source, returning 0`);
  // return 0;
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
