import { supabase } from '@/lib/supabase';
import { PLTrackerBudgetItem } from '../types/PLTrackerTypes';
import { toast } from "sonner";

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
  
  const isWagesItem = item.name.toLowerCase().includes('wages') ||
                     item.name.toLowerCase().includes('salaries');

  const isExpenseItem = !isRevenueItem && !isCOSItem && !isGrossProfitItem && 
                       !isWagesItem && !item.isHeader && !item.isOperatingProfit;
  
  if (typeof item.manually_entered_actual === 'number') {
    return Number(item.manually_entered_actual);
  }
  
  if (item.daily_values && item.daily_values.length > 0) {
    const total = item.daily_values.reduce((sum, day) => sum + (Number(day.value) || 0), 0);
    return total;
  }

  if ((isRevenueItem || isCOSItem || isGrossProfitItem || isWagesItem) && 
      typeof item.actual_amount === 'number' && item.actual_amount !== 0) {
    return Number(item.actual_amount);
  }

  return 0;
}

export function calculateProRatedActual(
  item: PLTrackerBudgetItem,
  daysInMonth: number,
  dayOfMonth: number
): number {
  if (item.budget_amount) {
    return (item.budget_amount / daysInMonth) * dayOfMonth;
  }
  return 0;
}

export async function fetchForecastSettings(itemName: string, year: number, month: number) {
  try {
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
    if (actualAmount && actualAmount !== 0 && dayOfMonth && dayOfMonth > 0 && daysInMonth) {
      return (actualAmount / dayOfMonth) * daysInMonth;
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
          } else if (typeof value === 'object' && value !== null && 'value' in value) {
            const numValue = Number(value.value);
            if (!isNaN(numValue)) {
              total += numValue;
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
          } else if (typeof value === 'object' && value !== null && 'value' in value) {
            const numValue = Number(value.value);
            if (!isNaN(numValue)) {
              dailyTotal += numValue;
            }
          }
        });
      }
      return (budgetAmount || 0) + dailyTotal;
    }
    
    case 'mtd_projection': {
      if (actualAmount && actualAmount !== 0 && dayOfMonth && dayOfMonth > 0 && daysInMonth) {
        return (actualAmount / dayOfMonth) * daysInMonth;
      }
      return budgetAmount || 0;
    }
    
    default:
      return budgetAmount || 0;
  }
}

export async function saveForecastToDatabase(itemId: string, forecastAmount: number): Promise<boolean> {
  try {
    console.log(`Saving forecast amount ${forecastAmount} for item ID ${itemId}`);
    
    const { error } = await supabase
      .from('budget_items')
      .update({ 
        forecast_amount: forecastAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);
      
    if (error) {
      console.error(`Error updating forecast for item ${itemId}:`, error);
      return false;
    } else {
      console.log(`Successfully updated forecast for item ${itemId} to ${forecastAmount}`);
      return true;
    }
  } catch (err) {
    console.error(`Error in database update for item ${itemId}:`, err);
    return false;
  }
}

export async function updateAllForecasts(year: number, month: number): Promise<boolean> {
  try {
    console.log(`Updating all forecasts for ${year}-${month}...`);
    
    const { data: refreshData, error: refreshError } = await supabase
      .rpc('refresh_all_forecasts', { 
        year_val: year, 
        month_val: month 
      });
    
    if (refreshError) {
      console.error('Error refreshing forecasts:', refreshError);
      return false;
    }
    
    console.log('Basic forecast refresh completed with result:', refreshData);
    
    const { data: items, error: itemsError } = await supabase
      .from('budget_items')
      .select('*')
      .eq('year', year)
      .eq('month', month);
    
    if (itemsError) {
      console.error('Error fetching budget items for forecast update:', itemsError);
      return false;
    }
    
    if (!items || items.length === 0) {
      console.log('No budget items found to update forecasts for.');
      return true;
    }
    
    console.log(`Processing ${items.length} budget items for forecast updates...`);
    
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (const item of items) {
      if (!item.budget_amount || item.budget_amount === 0) continue;
      
      const { data: settingsData } = await supabase
        .from('cost_item_forecast_settings')
        .select('*')
        .eq('item_name', item.name)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();
      
      let forecastAmount = item.budget_amount;
      
      if (settingsData) {
        forecastAmount = getForecastAmount(
          { ...item, id: item.id },
          year,
          month,
          daysInMonth,
          currentDay
        );
      }
      
      const specialItems = ['revenue', 'sales', 'turnover', 'cost of sales', 'cos', 'gross profit', 'wages', 'salaries'];
      const isSpecialItem = specialItems.some(term => item.name.toLowerCase().includes(term));
      
      if (isSpecialItem && item.actual_amount && item.actual_amount > 0 && currentDay < daysInMonth) {
        forecastAmount = (item.actual_amount / currentDay) * daysInMonth;
      }
      
      if (forecastAmount !== item.forecast_amount) {
        const { error: updateError } = await supabase
          .from('budget_items')
          .update({ 
            forecast_amount: forecastAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
          
        if (updateError) {
          console.error(`Error updating forecast for ${item.name}:`, updateError);
        }
      }
    }
    
    await refreshBudgetVsActual();
    
    return true;
  } catch (err) {
    console.error('Error in updateAllForecasts:', err);
    return false;
  }
}

export function getForecastAmount(
  item: PLTrackerBudgetItem | any,
  year: number,
  month: number,
  daysInMonth: number = 30,
  dayOfMonth: number = 19
): number {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  if (year === currentYear && month === currentMonth) {
    dayOfMonth = today.getDate() - 1;
    if (dayOfMonth < 1) dayOfMonth = 1;
  }
  
  const actualAmount = getActualAmount(item);
  const itemName = item.name?.toLowerCase() || '';
  
  const isRevenueItem = 
    itemName.includes('revenue') || 
    itemName.includes('sales') || 
    itemName === 'turnover' ||
    itemName.includes('turnover');
    
  const isCOSItem = 
    itemName.includes('cost of sales') ||
    itemName.includes('cos');
    
  const isGrossProfitItem = 
    itemName.includes('gross profit');
    
  const isWagesItem = 
    itemName.includes('wages') ||
    itemName.includes('salaries');
  
  if ((isRevenueItem || isCOSItem || isGrossProfitItem || isWagesItem) && 
      actualAmount && actualAmount !== 0 && dayOfMonth > 0) {
    const projection = (actualAmount / dayOfMonth) * daysInMonth;
    
    if (item.id) {
      const forecastAmount = projection;
      saveForecastToDatabase(item.id, forecastAmount);
      return projection;
    }
    
    return projection;
  }

  if (item.forecast_amount !== undefined && 
      item.forecast_amount !== null && 
      item.forecast_amount !== 0) {
    return item.forecast_amount;
  }

  let forecastSettings = null;
  
  if (item.forecast_settings) {
    console.log(`Using direct forecast_settings for ${item.name}:`, item.forecast_settings);
    forecastSettings = item.forecast_settings;
  } else {
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
  
  if (forecastSettings) {
    const forecastAmount = calculateForecastFromSettings(
      forecastSettings, 
      item.budget_amount, 
      actualAmount, 
      daysInMonth, 
      dayOfMonth
    );
    
    if (item.id) {
      saveForecastToDatabase(item.id, forecastAmount);
    }
    
    return forecastAmount;
  }
  
  if (actualAmount && actualAmount > 0 && dayOfMonth > 0) {
    const projection = (actualAmount / dayOfMonth) * daysInMonth;
    
    if (item.id) {
      saveForecastToDatabase(item.id, projection);
    }
    
    return projection;
  }
  
  if (item.budget_amount && item.id) {
    saveForecastToDatabase(item.id, item.budget_amount);
    return item.budget_amount;
  }
  
  return item.budget_amount || 0;
}

export const refreshBudgetVsActual = async (): Promise<boolean> => {
  try {
    console.log('Manually refreshing budget_vs_actual view at', new Date().toISOString());
    const { data, error } = await supabase.rpc('refresh_budget_vs_actual');
    
    if (error) {
      console.error('Error refreshing budget_vs_actual view:', error);
      return false;
    }
    
    console.log('Successfully refreshed budget_vs_actual view');
    return true;
  } catch (err) {
    console.error('Unexpected error refreshing budget_vs_actual view:', err);
    return false;
  }
};

export const syncUiWithAnalytics = async (year: number, month: number): Promise<boolean> => {
  try {
    console.log(`Synchronizing UI data with analytics for ${year}-${month}`);
    
    await updateAllForecasts(year, month);
    
    const refreshSuccess = await refreshBudgetVsActual();
    
    if (refreshSuccess) {
      toast.success("Analytics data synchronized successfully");
      return true;
    } else {
      toast.error("Failed to synchronize analytics data");
      return false;
    }
  } catch (err) {
    console.error('Error in syncUiWithAnalytics:', err);
    toast.error("Error synchronizing analytics data");
    return false;
  }
};
