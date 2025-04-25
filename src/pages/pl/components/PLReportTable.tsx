import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatCurrency, formatPercentage } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getActualAmount, getForecastAmount, fetchForecastSettings, calculateForecastFromSettings, calculateProRatedActual } from './tracker/TrackerCalculations';
import { ForecastSettingsControl } from "./forecast/ForecastSettingsControl";
import { useDateCalculations } from "./hooks/useDateCalculations";
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { syncUiWithAnalytics } from './tracker/TrackerCalculations';
import { storeTrackerSnapshot } from './tracker/SnapshotManager';
import { toast } from "sonner";

type PLReportTableProps = {
  isLoading: boolean;
  processedBudgetData: any[];
  currentMonthName: string;
  currentYear: number;
  currentMonth: number;
};

export function PLReportTable({
  isLoading,
  processedBudgetData,
  currentMonthName,
  currentYear,
  currentMonth
}: PLReportTableProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [renderedData, setRenderedData] = useState<any[]>([]);
  const [adminTotalForecast, setAdminTotalForecast] = useState<number>(0);
  const [operatingProfitForecast, setOperatingProfitForecast] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const getMonthNumber = (monthName: string) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months.indexOf(monthName) + 1;
  };

  const { dayOfMonth, daysInMonth } = useDateCalculations(currentMonthName, currentYear);

  console.log('PLReportTable date calculations:', {
    currentMonthName,
    currentYear,
    dayOfMonth,
    daysInMonth
  });

  const shouldUseProRatedActual = (item: any): boolean => {
    if (!item || !item.name) return false;
    
    const specialItems = ['turnover', 'revenue', 'sales', 'cost of sales', 'cos', 
                        'gross profit', 'wages', 'salaries'];
                        
    const isSpecialItem = specialItems.some(term => 
      item.name.toLowerCase().includes(term)
    );
    
    return !isSpecialItem;
  };

  const getEffectiveActualAmount = (item: any): number => {
    if (!item || !item.name) return 0;
    
    const manualActual = getActualAmount(item);
    
    if (manualActual > 0) {
      return manualActual;
    }
    
    if (shouldUseProRatedActual(item)) {
      return calculateProRatedActual(item, daysInMonth, dayOfMonth);
    }
    
    return manualActual;
  };

  const handleSyncAnalytics = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      // First step: Sync analytics data
      const success = await syncUiWithAnalytics(currentYear, currentMonth);
      
      if (success) {
        // Second step: Store snapshot data
        const snapshotSuccess = await storeTrackerSnapshot(
          renderedData.filter(item => 
            !(item.isHeader && !item.name.toLowerCase().includes('total') && !item.name.toLowerCase().includes('turnover'))
          ).map(item => ({
            ...item,
            category: item.category || 'General',
            budget_amount: item.budget_amount || 0,
            actual_amount: getActualAmount(item),
            forecast_amount: calculateCorrectForecast(item)
          })), 
          currentYear, 
          currentMonth
        );

        if (snapshotSuccess) {
          setLastSyncTime(new Date().toLocaleTimeString());
          setRefreshTrigger(prev => prev + 1);
          toast.success("Data synced and snapshot stored successfully");
        } else {
          toast.error("Analytics synced but snapshot creation failed");
        }
      } else {
        toast.error("Failed to sync analytics data");
      }
    } catch (error) {
      console.error('Error in sync operation:', error);
      toast.error("Error during sync operation");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const handleForecastUpdate = (event: any) => {
      if (event.detail && event.detail.itemName) {
        setRenderedData(prevData => {
          return prevData.map(item => {
            if (item && item.name === event.detail.itemName) {
              const forecastAmount = event.detail.forecastAmount || event.detail.finalTotal;
              const updatedItem = {
                ...item,
                forecast_amount: forecastAmount,
                forecast_settings: {
                  method: event.detail.method,
                  discrete_values: event.detail.values || {}
                }
              };
              return updatedItem;
            }
            return item;
          });
        });
        setRefreshTrigger(prev => prev + 1);
      }
    };
    window.addEventListener('forecast-updated', handleForecastUpdate);
    return () => {
      window.removeEventListener('forecast-updated', handleForecastUpdate);
    };
  }, []);

  useEffect(() => {
    if (adminTotalForecast > 0 || operatingProfitForecast !== 0) {
      const event = new CustomEvent('pl-forecasts-updated', {
        detail: {
          adminExpensesForecast: adminTotalForecast,
          operatingProfitForecast: operatingProfitForecast
        }
      });
      window.dispatchEvent(event);
    }
  }, [adminTotalForecast, operatingProfitForecast]);

  useEffect(() => {
    const loadData = async () => {
      if (processedBudgetData && processedBudgetData.length > 0) {
        const processedData = JSON.parse(JSON.stringify(processedBudgetData));
        
        const updatedData = await Promise.all(processedData.map(async (item: any) => {
          if (!item || !item.name) {
            return item;
          }
          
          const isSpecialItem = isItemRequiringMTDProjection(item.name);
          
          if (isSpecialItem && item.actual_amount > 0 && dayOfMonth > 0) {
            const projection = (item.actual_amount / dayOfMonth) * daysInMonth;
            item.forecast_amount = projection;
            console.log(`Applied MTD projection for ${item.name}: ${item.actual_amount} → ${projection}`);
          } else {
            const cacheKey = `forecast_${item.name}_${currentYear}_${currentMonth}`;
            const cachedSettings = localStorage.getItem(cacheKey);
            let settings = null;
            
            if (cachedSettings) {
              try {
                settings = JSON.parse(cachedSettings);
              } catch (e) {
                // ignore parse errors
              }
            }
            
            if (!settings) {
              settings = await fetchForecastSettings(item.name, currentYear, currentMonth);
            }
            
            if (settings) {
              item.forecast_settings = settings;
              const forecastAmount = calculateForecastFromSettings(
                settings, 
                item.budget_amount, 
                item.actual_amount,
                daysInMonth,
                dayOfMonth
              );
              item.forecast_amount = forecastAmount;
            } else if (!item.forecast_amount) {
              item.forecast_amount = getForecastAmount(
                item, 
                currentYear, 
                currentMonth,
                daysInMonth,
                dayOfMonth
              );
            }
          }
          
          return item;
        }));
        
        setRenderedData(updatedData);
        
        syncUiWithAnalytics(currentYear, currentMonth).then(success => {
          if (success) {
            setLastSyncTime(new Date().toLocaleTimeString());
          }
        });
      }
    };
    
    loadData();
  }, [processedBudgetData, refreshTrigger, currentYear, currentMonth, dayOfMonth, daysInMonth]);

  const isItemRequiringMTDProjection = (name: string): boolean => {
    if (!name) return false;
    
    const lowercaseName = name.toLowerCase();
    return (
      lowercaseName.includes('revenue') || 
      lowercaseName.includes('sales') || 
      lowercaseName === 'turnover' || 
      lowercaseName.includes('cost of sales') || 
      lowercaseName.includes('cos') || 
      lowercaseName.includes('gross profit') || 
      lowercaseName.includes('wages') || 
      lowercaseName.includes('salaries')
    );
  };

  const getFontClass = (name: string) => {
    if (!name) return "";
    const lowercaseName = name.toLowerCase();
    if (lowercaseName === "turnover" || lowercaseName === "total revenue" || lowercaseName === "gross profit" || lowercaseName === "gross profit/(loss)" || lowercaseName === "operating profit" || lowercaseName === "operating profit/(loss)" || lowercaseName === "ebitda" || lowercaseName === "net profit" || lowercaseName === "net profit/(loss)") {
      return "font-semibold";
    }
    return "";
  };

  const shouldShowPercentage = (item: any) => {
    if (!item || !item.name) return false;
    const lowercaseName = item.name.toLowerCase();
    return lowercaseName.includes("gross profit") || lowercaseName === "wages and salaries" || lowercaseName === "wages" || lowercaseName === "salaries";
  };

  const getPercentageDisplay = (item: any) => {
    if (!item || !item.name) return null;
    const lowercaseName = item.name.toLowerCase();
    if (lowercaseName.includes("food gross profit")) {
      const foodRevenueItems = processedBudgetData.filter(i => i && i.name && i.name.toLowerCase().includes('food') && (i.name.toLowerCase().includes('revenue') || i.name.toLowerCase().includes('sales')));
      const foodRevenue = foodRevenueItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
      if (foodRevenue > 0) {
        return formatPercentage(item.actual_amount / foodRevenue);
      }
      return formatPercentage(0);
    } else if (lowercaseName.includes("beverage gross profit") || lowercaseName.includes("drink gross profit")) {
      const beverageRevenueItems = processedBudgetData.filter(i => i && i.name && (i.name.toLowerCase().includes('beverage') || i.name.toLowerCase().includes('drink')) && (i.name.toLowerCase().includes('revenue') || i.name.toLowerCase().includes('sales')));
      const beverageRevenue = beverageRevenueItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
      if (beverageRevenue > 0) {
        return formatPercentage(item.actual_amount / beverageRevenue);
      }
      return formatPercentage(0);
    } else if (lowercaseName === "gross profit" || lowercaseName === "gross profit/(loss)") {
      const turnover = processedBudgetData.find(i => i && i.name && (i.name.toLowerCase() === "turnover" || i.name.toLowerCase() === "total revenue"))?.actual_amount || 0;
      if (turnover > 0) {
        return formatPercentage(item.actual_amount / turnover);
      }
      return formatPercentage(0);
    } else if (lowercaseName === "wages and salaries" || lowercaseName === "wages" || lowercaseName === "salaries") {
      const turnover = processedBudgetData.find(i => i && i.name && (i.name.toLowerCase() === "turnover" || i.name.toLowerCase() === "total revenue"))?.actual_amount || 0;
      if (turnover > 0) {
        return formatPercentage(item.actual_amount / turnover);
      }
    }
    return null;
  };

  const getValueColor = (value: number, isCostLine: boolean = false) => {
    if (isCostLine) {
      if (value < 0) return "text-green-600";
      if (value > 0) return "text-red-600";
    } else {
      if (value > 0) return "text-green-600";
      if (value < 0) return "text-red-600";
    }
    return "";
  };

  const isCostLine = (name: string) => {
    if (!name) return false;
    const lowercaseName = name.toLowerCase();
    return lowercaseName.includes('cost') || lowercaseName.includes('expense') || lowercaseName.includes('wages') || lowercaseName.includes('salaries') || lowercaseName.includes('insurance') || lowercaseName === 'repairs and maintenance' || lowercaseName === 'utilities' || lowercaseName === 'rent' || lowercaseName === 'rates' || lowercaseName.includes('administration') || lowercaseName.includes('marketing') || lowercaseName.includes('service charge') || lowercaseName.includes('office') || lowercaseName.includes('cleaning') || lowercaseName.includes('maintenance') || !lowercaseName.includes('profit') && !lowercaseName.includes('revenue') && !lowercaseName.includes('sales') && !lowercaseName.includes('turnover');
  };

  const isCostEditableRow = (name: string) => {
    if (!name) return false;
    const lowercaseName = name.toLowerCase();
    const allAdminCosts = ['marketing', 'training', 'printing', 'stationery', 'telephone', 'computer', 'it costs', 'bank charges', 'accountancy', 'legal', 'professional', 'recruitment', 'sundry expenses', 'sundry', 'hotel', 'travel', 'administration', 'advertising', 'cleaning', 'office expenses', 'postage', 'subscriptions', 'entertainment', 'motor expenses', 'motor', 'insurance', 'heat and power', 'heat', 'power', 'utilities', 'repairs', 'maintenance', 'premises', 'rates', 'rent', 'staff costs', 'other staff'];
    return allAdminCosts.some(category => lowercaseName.includes(category));
  };

  const getForecastPercentage = (item: any) => {
    if (!item || !item.name) return '0.0%';
    
    const forecastAmount = calculateCorrectForecast(item);
    
    if (forecastAmount === undefined || forecastAmount === null || forecastAmount === 0) return '0.0%';
    const name = item.name.toLowerCase();
    const turnoverItem = renderedData.find(item => item && item.name && (item.name.toLowerCase() === 'turnover' || item.name.toLowerCase() === 'total revenue'));
    const totalTurnoverForecast = turnoverItem ? calculateCorrectForecast(turnoverItem) : 0;
    
    const foodRevenueItem = renderedData.find(item => item && item.name && item.name.toLowerCase().includes('food') && (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales')));
    const foodRevenueForecast = foodRevenueItem ? calculateCorrectForecast(foodRevenueItem) : 0;
    
    const beverageRevenueItem = renderedData.find(item => item && item.name && (item.name.toLowerCase().includes('beverage') || item.name.toLowerCase().includes('drink')) && (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales')));
    const beverageRevenueForecast = beverageRevenueItem ? calculateCorrectForecast(beverageRevenueItem) : 0;
    
    if (name === 'turnover' || name === 'total revenue') {
      return '100.0%';
    }
    
    if (name.includes('food') && (name.includes('revenue') || name.includes('sales'))) {
      if (totalTurnoverForecast > 0) {
        const percentage = forecastAmount / totalTurnoverForecast;
        return formatPercentage(percentage);
      }
      return formatPercentage(0);
    }
    if ((name.includes('beverage') || name.includes('drink') || name.includes('bev')) && (name.includes('revenue') || name.includes('sales'))) {
      if (totalTurnoverForecast > 0) {
        const percentage = forecastAmount / totalTurnoverForecast;
        return formatPercentage(percentage);
      }
      return formatPercentage(0);
    }
    if (name.includes('food') && (name.includes('cost of sales') || name.includes('cos'))) {
      if (foodRevenueForecast > 0) {
        const percentage = forecastAmount / foodRevenueForecast;
        return formatPercentage(percentage);
      }
      return '0.0%';
    }
    if ((name.includes('beverage') || name.includes('drink') || name.includes('bev')) && (name.includes('cost of sales') || name.includes('cos'))) {
      if (beverageRevenueForecast > 0) {
        const percentage = forecastAmount / beverageRevenueForecast;
        return formatPercentage(percentage);
      }
      return '0.0%';
    }
    if (name === 'food gross profit' || name.includes('food gross profit')) {
      if (foodRevenueForecast > 0) {
        const percentage = forecastAmount / foodRevenueForecast;
        return formatPercentage(percentage);
      }
      return '0.0%';
    }
    if (name === 'beverage gross profit' || name.includes('drink gross profit')) {
      if (beverageRevenueForecast > 0) {
        const percentage = forecastAmount / beverageRevenueForecast;
        return formatPercentage(percentage);
      }
      return '0.0%';
    }
    if (name === 'cost of sales' || name === 'cos') {
      if (totalTurnoverForecast > 0) {
        const percentage = forecastAmount / totalTurnoverForecast;
        return formatPercentage(percentage);
      }
      return '0.0%';
    }
    if (name === 'gross profit' || name === 'gross profit/(loss)') {
      if (totalTurnoverForecast > 0) {
        const percentage = forecastAmount / totalTurnoverForecast;
        return formatPercentage(percentage);
      }
      return '0.0%';
    }
    if (name.includes('wages') || name.includes('salaries') || name.includes('marketing') || name.includes('professional') || name.includes('bank charges') || name.includes('cleaning') || name.includes('entertainment') || name.includes('printing') || name.includes('postage') || name.includes('stationery') || name.includes('sundry') || name.includes('motor') || name.includes('insurance') || name.includes('heat and power') || name.includes('utilities') || name.includes('repairs') || name.includes('maintenance') || name.includes('premises') || name.includes('telephone') || name.includes('internet') || name.includes('rates') || name.includes('rent') || name.includes('staff costs') || name.includes('subscriptions') || name.includes('hotel') || name.includes('travel')) {
      if (totalTurnoverForecast > 0) {
        const percentage = forecastAmount / totalTurnoverForecast;
        return formatPercentage(percentage);
      }
      return '0.0%';
    }
    if (!name.includes('revenue') && !name.includes('sales') && !name.includes('turnover') && !item.isHeader) {
      if (totalTurnoverForecast > 0) {
        const percentage = forecastAmount / totalTurnoverForecast;
        return formatPercentage(percentage);
      }
      return '0.0%';
    }

    return '0.0%';
  };
  
  const calculateCorrectForecast = (item: any): number => {
    if (!item) return 0;
    
    if (isItemRequiringMTDProjection(item.name) && item.actual_amount > 0) {
      if (dayOfMonth > 0) {
        return (item.actual_amount / dayOfMonth) * daysInMonth;
      }
    }
    
    return item.forecast_amount || getForecastAmount(item, currentYear, currentMonth);
  };

  const getBudgetPercentage = (item: any) => {
    if (!item || !item.name) return '0.0%';
    const name = item.name.toLowerCase();
    const budgetAmount = item.budget_amount || 0;
    if (budgetAmount === undefined || budgetAmount === null || budgetAmount === 0) return '0.0%';
    const turnoverItem = processedBudgetData.find(
      i => i && i.name && (i.name.toLowerCase() === 'turnover' || i.name.toLowerCase() === 'total revenue')
    );
    const turnoverBudget = turnoverItem && turnoverItem.budget_amount ? turnoverItem.budget_amount : 0;
    const foodRevenueItem = processedBudgetData.find(
      i => i && i.name && i.name.toLowerCase().includes('food') && (i.name.toLowerCase().includes('revenue') || i.name.toLowerCase().includes('sales'))
    );
    const foodRevenueBudget = foodRevenueItem && foodRevenueItem.budget_amount ? foodRevenueItem.budget_amount : 0;
    const beverageRevenueItem = processedBudgetData.find(
      i => i && i.name && (i.name.toLowerCase().includes('beverage') || i.name.toLowerCase().includes('drink')) &&
      (i.name.toLowerCase().includes('revenue') || i.name.toLowerCase().includes('sales'))
    );
    const beverageRevenueBudget = beverageRevenueItem && beverageRevenueItem.budget_amount ? beverageRevenueItem.budget_amount : 0;

    if (name === 'turnover' || name === 'total revenue') {
      return '100.0%';
    }
    if (name.includes('food') && (name.includes('revenue') || name.includes('sales'))) {
      if (turnoverBudget > 0) return formatPercentage(budgetAmount / turnoverBudget);
      return formatPercentage(0);
    }
    if ((name.includes('beverage') || name.includes('drink') || name.includes('bev')) && (name.includes('revenue') || name.includes('sales'))) {
      if (turnoverBudget > 0) return formatPercentage(budgetAmount / turnoverBudget);
      return formatPercentage(0);
    }
    if (name.includes('food') && (name.includes('cost of sales') || name.includes('cos'))) {
      if (foodRevenueBudget > 0) return formatPercentage(budgetAmount / foodRevenueBudget);
      return '0.0%';
    }
    if ((name.includes('beverage') || name.includes('drink') || name.includes('bev')) && (name.includes('cost of sales') || name.includes('cos'))) {
      if (beverageRevenueBudget > 0) return formatPercentage(budgetAmount / beverageRevenueBudget);
      return '0.0%';
    }
    if (name === 'food gross profit' || name.includes('food gross profit')) {
      if (foodRevenueBudget > 0) return formatPercentage(budgetAmount / foodRevenueBudget);
      return '0.0%';
    }
    if (name === 'beverage gross profit' || name.includes('drink gross profit')) {
      if (beverageRevenueBudget > 0) return formatPercentage(budgetAmount / beverageRevenueBudget);
      return '0.0%';
    }
    if (name === 'cost of sales' || name === 'cos') {
      if (turnoverBudget > 0) return formatPercentage(budgetAmount / turnoverBudget);
      return '0.0%';
    }
    if (name === 'gross profit' || name === 'gross profit/(loss)') {
      if (turnoverBudget > 0) return formatPercentage(budgetAmount / turnoverBudget);
      return '0.0%';
    }
    if (
      name.includes('wages') ||
      name.includes('salaries') ||
      name.includes('marketing') ||
      name.includes('professional') ||
      name.includes('bank charges') ||
      name.includes('cleaning') ||
      name.includes('entertainment') ||
      name.includes('printing') ||
      name.includes('postage') ||
      name.includes('stationery') ||
      name.includes('sundry') ||
      name.includes('motor') ||
      name.includes('insurance') ||
      name.includes('heat and power') ||
      name.includes('utilities') ||
      name.includes('repairs') ||
      name.includes('maintenance') ||
      name.includes('premises') ||
      name.includes('telephone') ||
      name.includes('internet') ||
      name.includes('rates') ||
      name.includes('rent') ||
      name.includes('staff costs') ||
      name.includes('subscriptions') ||
      name.includes('hotel') ||
      name.includes('travel')
    ) {
      if (turnoverBudget > 0) return formatPercentage(budgetAmount / turnoverBudget);
      return '0.0%';
    }
    if (
      !name.includes('revenue') &&
      !name.includes('sales') &&
      !name.includes('turnover') &&
      !item.isHeader
    ) {
      if (turnoverBudget > 0) return formatPercentage(budgetAmount / turnoverBudget);
      return '0.0%';
    }
    return '0.0%';
  };

  const renderTableContent = () => {
    const adminExpenseItems = ["Wages and Salaries", "Marketing", "Professional Fees", "Bank charges", "Cleaning", "Entertainment (Staff, customer or supplier)", "Printing, postage and stationery", "Sundry Expenses", "Motor expenses", "Insurance", "Heat and power", "Repairs, Maintenance, Premises", "Telephone and internet", "Rates", "Rent", "Other staff costs", "Subscriptions", "Hotel and travel"];
    const adminItems = renderedData.filter(item => item && item.name && adminExpenseItems.some(expName => item.name.trim() === expName || item.name.trim().toLowerCase() === expName.toLowerCase()));
    const turnoverItem = renderedData.find(item => item && item.name && (item.name.toLowerCase() === 'turnover' || item.name.toLowerCase() === 'total revenue'));
    const foodRevenueItem = renderedData.find(item => item && item.name && item.name.toLowerCase().includes('food') && (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales')));
    const beverageRevenueItem = renderedData.find(item => item && item.name && (item.name.toLowerCase().includes('beverage') || item.name.toLowerCase().includes('drink')) && (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales')));
    const foodCOSItem = renderedData.find(item => item && item.name && item.name.toLowerCase().includes('food') && (item.name.toLowerCase().includes('cos') || item.name.toLowerCase().includes('cost of sales')));
    const beverageCOSItem = renderedData.find(item => item && item.name && (item.name.toLowerCase().includes('beverage') || item.name.toLowerCase().includes('drink') || item.name.toLowerCase().includes('bev')) && (item.name.toLowerCase().includes('cos') || item.name.toLowerCase().includes('cost of sales')));
    const costOfSalesItem = renderedData.find(item => item && item.name && (item.name.toLowerCase() === 'cost of sales' || item.name.toLowerCase() === 'cos') && !item.name.toLowerCase().includes('food') && !item.name.toLowerCase().includes('beverage') && !item.name.toLowerCase().includes('drink'));
    const adminTotalBudget = adminItems.reduce((sum, item) => sum + (item.budget_amount || 0), 0);
    const adminTotalActual = adminItems.reduce((sum, item) => sum + getEffectiveActualAmount(item), 0);
    const calculatedAdminTotalForecast = adminItems.reduce((sum, item) => {
      const forecast = calculateCorrectForecast(item);
      return sum + (forecast || 0);
    }, 0);
    
    if (calculatedAdminTotalForecast !== adminTotalForecast) {
      setAdminTotalForecast(calculatedAdminTotalForecast);
    }
    
    const adminBudgetVariance = calculatedAdminTotalForecast - adminTotalBudget;
    const grossProfitItem = renderedData.find(item => item && item.name && (item.name.toLowerCase() === 'gross profit' || item.name.toLowerCase() === 'gross profit/(loss)') && !item.name.toLowerCase().includes('food') && !item.name.toLowerCase().includes('beverage'));
    const grossProfitActual = grossProfitItem ? getActualAmount(grossProfitItem) : 0;
    const grossProfitBudget = grossProfitItem ? grossProfitItem.budget_amount || 0 : 0;
    const grossProfitForecast = grossProfitItem ? calculateCorrectForecast(grossProfitItem) : 0;
    const operatingProfitBudget = grossProfitBudget - adminTotalBudget;
    const operatingProfitActual = grossProfitActual - adminTotalActual;
    const calculatedOperatingProfitForecast = grossProfitForecast - calculatedAdminTotalForecast;
    
    if (calculatedOperatingProfitForecast !== operatingProfitForecast) {
      setOperatingProfitForecast(calculatedOperatingProfitForecast);
    }
    
    const operatingProfitVariance = calculatedOperatingProfitForecast - operatingProfitBudget;
    const totalTurnoverForecast = turnoverItem ? calculateCorrectForecast(turnoverItem) : 0;
    const totalTurnoverActual = turnoverItem ? getActualAmount(turnoverItem) : 0;
    const adminActualPercentage = totalTurnoverActual && totalTurnoverActual !== 0 ? adminTotalActual / totalTurnoverActual * 100 : 0;
    const safeTurnoverForecast = totalTurnoverForecast && totalTurnoverForecast !== 0 ? totalTurnoverForecast : 1;
    const adminForecastPercentage = calculatedAdminTotalForecast / safeTurnoverForecast * 100;
    const operatingProfitActualPercentage = totalTurnoverActual && totalTurnoverActual !== 0 ? operatingProfitActual / totalTurnoverActual * 100 : 0;
    const operatingProfitForecastPercentage = calculatedOperatingProfitForecast / safeTurnoverForecast * 100;

    return (
      <>
        {renderedData
          .filter(item => {
            if (!item || !item.name) return false;
            
            if (item.name.trim().toLowerCase() === 'total') return false;
            
            if (item.category === "header") return false;
            
            if (item.budget_amount === 0) return false;
            
            const lowerName = item.name.toLowerCase();
            if (lowerName.includes('total') && 
                !lowerName.includes('total admin') && 
                !lowerName.includes('total revenue')) {
              console.log('Filtering out total row:', item.name);
              return false;
            }
            
            return true;
          })
          .map((item, index) => {
            if (!item || (item.category === "header" && item.budget_amount === 0)) {
              return null;
            }
            if (!item.name || item.name === "Total") {  // Added condition to skip "Total" row
              return null;
            }
            
            const fontClass = getFontClass(item.name);
            const percentageDisplay = shouldShowPercentage(item) ? getPercentageDisplay(item) : null;
            const actualAmount = getEffectiveActualAmount(item);
            
            const forecastAmount = calculateCorrectForecast(item);
            
            const shouldHighlight =
              item.name.toLowerCase() === "turnover" ||
              item.name.toLowerCase() === "total revenue" ||
              (item.name.toLowerCase().includes("gross profit") &&
                !item.name.toLowerCase().includes("food") &&
                !item.name.toLowerCase().includes("beverage") &&
                !item.name.toLowerCase().includes("drink")) ||
              item.name.toLowerCase() === "total admin expenses" ||
              item.name.toLowerCase().includes("operating profit") ||
              (item.name.toLowerCase().includes("cost of sales") &&
                !item.name.toLowerCase().includes("food") &&
                !item.name.toLowerCase().includes("beverage") &&
                !item.name.toLowerCase().includes("drink"));
              
            const highlightClass = shouldHighlight ? "bg-purple-50" : "";
            const boldValueClass = shouldHighlight && item.name.toLowerCase().includes("cost of sales") ? "font-bold" : "";
            const boldTitleClass = shouldHighlight && item.name.toLowerCase().includes("cost of sales") ? "font-bold" : "";
            const varianceAmount = forecastAmount - (item.budget_amount || 0);
            const itemIsCostLine = isCostLine(item.name);

            if (item.name.toLowerCase().includes('total admin')) {
              return null;
            }
            if (item.name.toLowerCase().includes('operating profit')) {
              return null;
            }

            const forecastPercentage = getForecastPercentage(item);
            const budgetPercentage = getBudgetPercentage(item);

            return (
              <TableRow key={index} className={`${item.category === "header" ? "bg-slate-50" : ""} ${highlightClass}`}>
                <TableCell className={`${fontClass} ${boldTitleClass} flex items-center justify-between`}>
                  <span className="flex-grow">{item.name}</span>
                  {isCostEditableRow(item.name) && (
                    <ForecastSettingsControl
                      itemName={item.name}
                      budgetAmount={item.budget_amount || 0}
                      currentYear={currentYear}
                      currentMonth={currentMonth}
                      onMethodChange={() => {
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  )}
                </TableCell>
                <TableCell className={`text-right ${fontClass} ${boldValueClass}`}>
                  {formatCurrency(item.budget_amount)}
                </TableCell>
                <TableCell className="text-right w-14 min-w-[40px] max-w-[40px]">
                  {budgetPercentage}
                </TableCell>
                <TableCell className={`text-right ${fontClass} ${boldValueClass}`}>
                  {formatCurrency(actualAmount)}
                </TableCell>
                <TableCell className="text-right w-14 min-w-[40px] max-w-[40px]">
                  {percentageDisplay}
                </TableCell>
                <TableCell className={`text-right ${fontClass} ${boldValueClass}`}>
                  {formatCurrency(forecastAmount)}
                </TableCell>
                <TableCell className="text-right w-14 min-w-[40px] max-w-[40px]">
                  {forecastPercentage}
                </TableCell>
                <TableCell className={`text-right ${getValueColor(varianceAmount, itemIsCostLine)}`}>
                  {formatCurrency(varianceAmount)}
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* Total Admin Expenses Row */}
          <TableRow className="bg-purple-50">
            <TableCell className="font-semibold">Total Admin Expenses</TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(adminTotalBudget)}
            </TableCell>
            <TableCell className="text-right w-14 min-w-[40px] max-w-[40px]">
              {formatPercentage(adminTotalBudget / (turnoverItem?.budget_amount || 1))}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(adminTotalActual)}
            </TableCell>
            <TableCell className="text-right w-14 min-w-[40px] max-w-[40px]">
              {formatPercentage(adminActualPercentage / 100)}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(calculatedAdminTotalForecast)}
            </TableCell>
            <TableCell className="text-right w-14 min-w-[40px] max-w-[40px]">
              {formatPercentage(adminForecastPercentage / 100)}
            </TableCell>
            <TableCell className={`text-right ${getValueColor(adminBudgetVariance, true)}`}>
              {formatCurrency(adminBudgetVariance)}
            </TableCell>
          </TableRow>
          
          {/* Operating Profit Row */}
          <TableRow className="bg-purple-50">
            <TableCell className="font-semibold">Operating Profit/(Loss)</TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(operatingProfitBudget)}
            </TableCell>
            <TableCell className="text-right w-14 min-w-[40px] max-w-[40px]">
              {formatPercentage(operatingProfitBudget / (turnoverItem?.budget_amount || 1))}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(operatingProfitActual)}
            </TableCell>
            <TableCell className="text-right w-14 min-w-[40px] max-w-[40px]">
              {formatPercentage(operatingProfitActualPercentage / 100)}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(calculatedOperatingProfitForecast)}
            </TableCell>
            <TableCell className="text-right w-14 min-w-[40px] max-w-[40px]">
              {formatPercentage(operatingProfitForecastPercentage / 100)}
            </TableCell>
            <TableCell className={`text-right ${getValueColor(operatingProfitVariance, false)}`}>
              {formatCurrency(operatingProfitVariance)}
            </TableCell>
          </TableRow>
      </>
    );
  };
  
  return (
    <div className="px-1 pt-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">P&L Report - {currentMonthName} {currentYear}</h2>
        <div className="flex items-center gap-2">
          {lastSyncTime && (
            <span className="text-sm text-gray-500">Last synced: {lastSyncTime}</span>
          )}
          <Button
            onClick={handleSyncAnalytics}
            disabled={isSyncing}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Analytics'}
          </Button>
        </div>
      </div>
      
      <div className="relative overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-64">Item</TableHead>
              <TableHead className="text-right w-24">Budget</TableHead>
              <TableHead className="text-right w-14 min-w-[40px] max-w-[40px]">%</TableHead>
              <TableHead className="text-right w-24">Actual</TableHead>
              <TableHead className="text-right w-14 min-w-[40px] max-w-[40px]">%</TableHead>
              <TableHead className="text-right w-24">Forecast</TableHead>
              <TableHead className="text-right w-14 min-w-[40px] max-w-[40px]">%</TableHead>
              <TableHead className="text-right w-24">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-8 w-[300px]" />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              renderTableContent()
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
