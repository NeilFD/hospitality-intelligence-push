
import { PLTrackerBudgetItem } from "../types/PLTrackerTypes";
import { supabase } from "@/lib/supabase";

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

  const isRevenueItem = item.name.toLowerCase().includes('turnover') || 
                      item.name.toLowerCase().includes('revenue') ||
                      item.name.toLowerCase().includes('sales');
                      
  const isCOSItem = item.name.toLowerCase().includes('cost of sales') || 
                    item.name.toLowerCase().includes('cos');
                    
  const isGrossProfitItem = item.name.toLowerCase().includes('gross profit') ||
                          item.isGrossProfit;
  
  const isWages = item.name.toLowerCase().includes('wages') ||
                 item.name.toLowerCase().includes('salaries');

  const isExpenseItem = !isRevenueItem && !isCOSItem && !isGrossProfitItem && 
                       !isWages && !item.isHeader && !item.isOperatingProfit;
  
  if (typeof item.manually_entered_actual === 'number') {
    return Number(item.manually_entered_actual);
  }
  
  if (item.daily_values && item.daily_values.length > 0) {
    const total = item.daily_values.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
    return total;
  }

  if ((isRevenueItem || isCOSItem || isGrossProfitItem || isWages) && 
      typeof item.actual_amount === 'number' && item.actual_amount !== 0) {
    return Number(item.actual_amount);
  }

  if (isExpenseItem) {
    const daysInMonth = 30;
    const dayOfMonth = 19;
    return (item.budget_amount / daysInMonth) * dayOfMonth * 0.65;
  }

  return 0;
}

export function getForecastAmount(
  item: PLTrackerBudgetItem | any,
  year: number,
  month: number
): number {
  // First, check if the item has a forecast_amount directly set
  if (item.forecast_amount !== undefined && item.forecast_amount !== null) {
    // If forecast_amount is directly set on the item, return it
    return item.forecast_amount;
  }
  
  // Next, check if the item itself has forecast_settings
  if (item.forecast_settings) {
    console.log(`Using direct forecast_settings for ${item.name}:`, item.forecast_settings);
    const method = item.forecast_settings.method;
    const discreteValues = item.forecast_settings.discrete_values || {};
    
    switch (method) {
      case 'fixed':
        return item.budget_amount || 0;
      
      case 'discrete': {
        let total = 0;
        if (discreteValues && typeof discreteValues === 'object') {
          Object.values(discreteValues).forEach((value: any) => {
            if (typeof value === 'number') {
              total += value;
            } else if (typeof value === 'string') {
              const parsed = parseFloat(value);
              if (!isNaN(parsed)) {
                total += parsed;
              }
            }
          });
        }
        console.log(`Calculated discrete total for ${item.name}: ${total}`);
        return total;
      }
      
      case 'fixed_plus': {
        let dailyTotal = 0;
        if (discreteValues && typeof discreteValues === 'object') {
          Object.values(discreteValues).forEach((value: any) => {
            if (typeof value === 'number') {
              dailyTotal += value;
            } else if (typeof value === 'string') {
              const parsed = parseFloat(value);
              if (!isNaN(parsed)) {
                dailyTotal += parsed;
              }
            }
          });
        }
        const result = (item.budget_amount || 0) + dailyTotal;
        console.log(`Calculated fixed_plus total for ${item.name}: ${result} (${item.budget_amount} + ${dailyTotal})`);
        return result;
      }
      
      default:
        return item.budget_amount || 0;
    }
  }
  
  // Try to get settings from localStorage
  const cacheKey = `forecast_${item.name}_${year}_${month}`;
  const cachedSettings = localStorage.getItem(cacheKey);
  
  if (cachedSettings) {
    try {
      console.log(`Using cached forecast settings for ${item.name}:`, cachedSettings);
      const settings = JSON.parse(cachedSettings);
      
      if (settings.method === 'fixed') {
        return item.budget_amount || 0;
      } else if (settings.method === 'discrete') {
        let total = 0;
        const discreteValues = settings.discrete_values || {};
        Object.values(discreteValues).forEach((value: any) => {
          if (typeof value === 'number') {
            total += value;
          } else if (typeof value === 'string') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
              total += parsed;
            }
          }
        });
        console.log(`Calculated discrete total from localStorage for ${item.name}: ${total}`);
        return total;
      } else if (settings.method === 'fixed_plus') {
        let dailyTotal = 0;
        const discreteValues = settings.discrete_values || {};
        Object.values(discreteValues).forEach((value: any) => {
          if (typeof value === 'number') {
            dailyTotal += value;
          } else if (typeof value === 'string') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
              dailyTotal += parsed;
            }
          }
        });
        const result = (item.budget_amount || 0) + dailyTotal;
        console.log(`Calculated fixed_plus total from localStorage for ${item.name}: ${result} (${item.budget_amount} + ${dailyTotal})`);
        return result;
      }
    } catch (e) {
      console.error('Error parsing cached forecast settings:', e);
    }
  }
  
  // Fall back to budget amount
  return item.budget_amount || 0;
}

export function calculateProRatedActual(
  item: PLTrackerBudgetItem,
  daysInMonth: number,
  dayOfMonth: number
): number {
  const proRatedActual = (item.budget_amount / daysInMonth) * dayOfMonth;
  return proRatedActual;
}
