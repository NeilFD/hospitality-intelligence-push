
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
  // Check if item is a summary or special item with preloaded actual_amount
  if (item.name.toLowerCase().includes('turnover') || 
      item.name.toLowerCase().includes('revenue') ||
      item.name.toLowerCase().includes('sales') ||
      item.name.toLowerCase().includes('cost of sales') ||
      item.name.toLowerCase().includes('cos') ||
      item.name.toLowerCase() === 'gross profit' ||
      item.name.toLowerCase() === 'gross profit/(loss)' ||
      item.name.toLowerCase() === 'operating profit' ||
      item.name.toLowerCase().includes('wages') ||
      item.name.toLowerCase().includes('salary') ||
      item.isGrossProfit ||
      item.isOperatingProfit) {
    return Number(item.actual_amount) || 0;
  }
  
  // For pro-rated items, calculate the pro-rated amount based on the current day of month
  if (item.tracking_type === 'Pro-Rated') {
    // Use actual_amount if available, otherwise calculate from budget
    const currentDate = new Date();
    const dayOfMonth = currentDate.getDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    return Number(item.actual_amount) || (item.budget_amount / daysInMonth * dayOfMonth);
  }

  if (item.tracking_type === 'Discrete') {
    if (item.daily_values && item.daily_values.length > 0) {
      return item.daily_values.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
    }
    return Number(item.manually_entered_actual) || Number(item.actual_amount) || 0;
  }
  
  // Fallback to actual_amount or 0
  return Number(item.actual_amount) || 0;
}
