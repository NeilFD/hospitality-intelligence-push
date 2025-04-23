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
    return 0;
  }

  return 0;
}

export function calculateProRatedActual(
  item: PLTrackerBudgetItem,
  daysInMonth: number,
  dayOfMonth: number
): number {
  const proRatedActual = (item.budget_amount / daysInMonth) * dayOfMonth;
  return proRatedActual;
}

export async function fetchForecastSettings(itemName: string, year: number, month: number) {
  try {
    // First check in Supabase
    const { data } = await supabase
      .from('cost_item_forecast_settings')
      .select('method, discrete_values')
      .eq('item_name', itemName)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (data) {
      console.log(`Fetched database forecast settings for ${itemName}:`, data);
      
      const cacheKey = `forecast_${itemName}_${year}_${month}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        method: data.method,
        discrete_values: data.discrete_values || {}
      }));
      
      return {
        method: data.method,
        discrete_values: data.discrete_values || {}
      };
    }
  } catch (error) {
    console.error(`Error fetching forecast settings for ${itemName}:`, error);
  }
  
  // If not in Supabase, try localStorage
  try {
    const cacheKey = `forecast_${itemName}_${year}_${month}`;
    const cachedSettings = localStorage.getItem(cacheKey);
    
    if (cachedSettings) {
      console.log(`Fetched cached forecast settings for ${itemName}:`, cachedSettings);
      return JSON.parse(cachedSettings);
    }
  } catch (e) {
    console.error('Error parsing cached settings:', e);
  }
  
  return null;
}

export function calculateForecastFromSettings(
  settings: any,
  budgetAmount: number,
  actualAmount?: number,
  daysInMonth?: number,
  dayOfMonth?: number
): number {
  if (!settings) {
    // If there are no settings but we have actuals and days, use them for projection
    if (actualAmount && actualAmount !== 0 && dayOfMonth && dayOfMonth > 0) {
      return (actualAmount / dayOfMonth) * (daysInMonth || 30);
    }
    return budgetAmount || 0;
  }
  
  const method = settings.method;
  const discreteValues = settings.discrete_values || {};
  
  switch (method) {
    case 'fixed':
      return budgetAmount || 0;
    
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
      return (budgetAmount || 0) + dailyTotal;
    }
    
    default:
      return budgetAmount || 0;
  }
}

export function getForecastAmount(
  item: PLTrackerBudgetItem | any,
  year: number,
  month: number,
  daysInMonth: number = 30,
  dayOfMonth: number = 19
): number {
  const itemName = item.name.toLowerCase();
  const actualAmount = getActualAmount(item);
  
  // For revenue/sales, COS, GP, and wages, use MTD projection
  if (itemName.includes('revenue') || 
      itemName.includes('sales') || 
      itemName === 'turnover' ||
      itemName.includes('cost of sales') ||
      itemName.includes('cos') ||
      itemName.includes('gross profit') ||
      itemName.includes('wages') ||
      itemName.includes('salaries')) {
    
    if (actualAmount && actualAmount !== 0 && dayOfMonth > 0) {
      return (actualAmount / dayOfMonth) * daysInMonth;
    }
  }

  // If forecast_amount is already set and not zero, use it
  if (item.forecast_amount !== undefined && 
      item.forecast_amount !== null && 
      item.forecast_amount !== 0) {
    return item.forecast_amount;
  }

  // Try to get settings directly first
  let forecastSettings = null;
  
  // Check if the item already has forecast settings attached
  if (item.forecast_settings) {
    console.log(`Using direct forecast_settings for ${item.name}:`, item.forecast_settings);
    forecastSettings = item.forecast_settings;
  } else {
    // Try to get settings from localStorage
    const cacheKey = `forecast_${item.name}_${year}_${month}`;
    const cachedSettings = localStorage.getItem(cacheKey);
    
    if (cachedSettings) {
      try {
        forecastSettings = JSON.parse(cachedSettings);
        console.log(`Using cached forecast settings for ${item.name}:`, forecastSettings);
      } catch (e) {
        console.error('Error parsing cached forecast settings:', e);
      }
    }
  }
  
  // Calculate the forecast amount based on the settings
  if (forecastSettings) {
    return calculateForecastFromSettings(forecastSettings, item.budget_amount, actualAmount, daysInMonth, dayOfMonth);
  }
  
  // If no settings found, use the budget amount
  return item.budget_amount || 0;
}
