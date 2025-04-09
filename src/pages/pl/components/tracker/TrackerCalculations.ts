
import { PLTrackerBudgetItem } from "../types/PLTrackerTypes";

export function calculateProRatedBudget(
  item: PLTrackerBudgetItem,
  daysInMonth: number, 
  dayOfMonth: number
): number {
  console.log(`Calculating pro-rated budget for ${item.name}:`, {
    budget: item.budget_amount,
    daysInMonth,
    dayOfMonth,
    result: (item.budget_amount / daysInMonth) * dayOfMonth
  });
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
                   i.category.toLowerCase().includes('cost of sales')) &&
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
  console.log(`Getting actual amount for ${item.name}:`, {
    tracking_type: item.tracking_type,
    actual_amount: item.actual_amount,
    budget_amount: item.budget_amount
  });
  
  // Check if item is a summary or special item with preloaded actual_amount
  if (item.name.toLowerCase().includes('turnover') || 
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
      item.isOperatingProfit) {
    return Number(item.actual_amount) || 0;
  }

  if (item.tracking_type === 'Discrete') {
    if (item.daily_values && item.daily_values.length > 0) {
      // Sum up all the daily values
      return item.daily_values.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
    }
    // Use manually entered actual or actual_amount
    return Number(item.manually_entered_actual) || Number(item.actual_amount) || 0;
  }
  
  // Pro-rated items should use pro-rated actual calculation
  return Number(item.actual_amount) || 0;
}

export function calculateProRatedActual(
  item: PLTrackerBudgetItem,
  daysInMonth: number,
  dayOfMonth: number
): number {
  const proRatedActual = (item.budget_amount / daysInMonth) * dayOfMonth;
  console.log(`Calculating pro-rated actual for ${item.name}:`, {
    budget: item.budget_amount,
    daysInMonth,
    dayOfMonth,
    result: proRatedActual
  });
  return proRatedActual;
}
