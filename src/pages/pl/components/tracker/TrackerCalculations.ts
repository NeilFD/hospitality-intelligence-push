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
  // Check if item is a special item with preloaded actual_amount
  const isSpecialItem = item.name.toLowerCase().includes('turnover') || 
    item.name.toLowerCase().includes('revenue') ||
    item.name.toLowerCase().includes('sales') ||
    item.name.toLowerCase().includes('cost of sales') ||
    item.name.toLowerCase().includes('cos') ||
    item.name.toLowerCase().includes('gross profit') ||
    item.name.toLowerCase().includes('gross profit/(loss)') ||
    item.name.toLowerCase().includes('operating profit') ||
    item.name.toLowerCase().includes('wages') ||
    item.name.toLowerCase().includes('salary') ||
    item.isGrossProfit ||
    item.isOperatingProfit ||
    item.isHighlighted;
    
  if (isSpecialItem) {
    // For revenue, COS, wages, etc. use the actual_amount that's loaded from the respective sources
    return Number(item.actual_amount) || 0;
  }

  // For regular Pro-Rated items
  if (item.tracking_type === 'Pro-Rated') {
    return Number(item.actual_amount) || 0;
  }
  
  // Handle Discrete items
  if (item.tracking_type === 'Discrete') {
    if (item.daily_values && item.daily_values.length > 0) {
      // Sum up all the daily values
      return item.daily_values.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
    }
    // Use manually entered actual or actual_amount
    return Number(item.manually_entered_actual) || Number(item.actual_amount) || 0;
  }
  
  return Number(item.actual_amount) || 0;
}

export function calculateProRatedActual(
  item: PLTrackerBudgetItem,
  daysInMonth: number,
  dayOfMonth: number
): number {
  const proRatedActual = (item.budget_amount / daysInMonth) * dayOfMonth;
  return proRatedActual;
}
