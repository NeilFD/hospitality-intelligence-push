
import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatCurrency, formatPercentage } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getActualAmount, getForecastAmount, fetchForecastSettings, calculateForecastFromSettings } from './tracker/TrackerCalculations';
import { ForecastSettingsControl } from "./forecast/ForecastSettingsControl";

type PLReportTableProps = {
  isLoading: boolean;
  processedBudgetData: any[];
  currentMonthName: string;
  currentYear: number;
};

export function PLReportTable({
  isLoading,
  processedBudgetData,
  currentMonthName,
  currentYear,
}: PLReportTableProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [renderedData, setRenderedData] = useState<any[]>([]);
  
  const getMonthNumber = (monthName: string) => {
    const months = ["January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"];
    return months.indexOf(monthName) + 1;
  };
  
  const currentMonth = getMonthNumber(currentMonthName);
  
  useEffect(() => {
    const handleForecastUpdate = (event: any) => {
      console.log("PLReportTable: Forecast updated event received", event.detail);
      
      if (event.detail && event.detail.itemName) {
        setRenderedData(prevData => {
          return prevData.map(item => {
            if (item && item.name === event.detail.itemName) {
              console.log(`Updating forecast for ${item.name} to ${event.detail.forecastAmount || event.detail.finalTotal}`);
              const forecastAmount = event.detail.forecastAmount || event.detail.finalTotal;
              
              const updatedItem = {
                ...item,
                forecast_amount: forecastAmount,
                forecast_settings: {
                  method: event.detail.method,
                  discrete_values: event.detail.values || {}
                }
              };
              
              console.log(`Updated item for ${item.name}:`, updatedItem);
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
    const loadData = async () => {
      console.log("PLReportTable: Processing data with current forecast settings");
      
      if (processedBudgetData && processedBudgetData.length > 0) {
        const processedData = JSON.parse(JSON.stringify(processedBudgetData));
        
        const updatedData = await Promise.all(processedData.map(async (item: any) => {
          // Ensure item has a name property
          if (!item || !item.name) {
            console.warn("Warning: Item without name found in processedBudgetData", item);
            return item; // Return the item unchanged
          }
          
          const cacheKey = `forecast_${item.name}_${currentYear}_${currentMonth}`;
          const cachedSettings = localStorage.getItem(cacheKey);
          
          let settings = null;
          
          if (cachedSettings) {
            try {
              settings = JSON.parse(cachedSettings);
              console.log(`Found cached forecast settings for ${item.name}:`, settings);
            } catch (e) {
              console.error(`Error parsing cached settings for ${item.name}:`, e);
            }
          }
          
          if (!settings) {
            settings = await fetchForecastSettings(item.name, currentYear, currentMonth);
          }
          
          if (settings) {
            item.forecast_settings = settings;
            const forecastAmount = calculateForecastFromSettings(settings, item.budget_amount);
            console.log(`Calculated forecast for ${item.name}: ${forecastAmount}`);
            item.forecast_amount = forecastAmount;
          }
          
          return item;
        }));
        
        setRenderedData(updatedData);
      }
    };
    
    loadData();
  }, [processedBudgetData, refreshTrigger, currentYear, currentMonth]);

  const getDaysInMonth = () => {
    const date = new Date(currentYear, getMonthNumber(currentMonthName), 0);
    return date.getDate();
  };
  
  const getCurrentDay = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (yesterday.getFullYear() === currentYear && yesterday.getMonth() === getMonthNumber(currentMonthName) - 1) {
      return yesterday.getDate();
    }
    
    const daysInMonth = getDaysInMonth();
    return Math.min(yesterday.getDate(), daysInMonth);
  };
  
  const getFontClass = (name: string) => {
    if (!name) return ""; // Guard against undefined names
    
    const lowercaseName = name.toLowerCase();
    if (
      lowercaseName === "turnover" ||
      lowercaseName === "total revenue" ||
      lowercaseName === "gross profit" ||
      lowercaseName === "gross profit/(loss)" ||
      lowercaseName === "operating profit" ||
      lowercaseName === "operating profit/(loss)" ||
      lowercaseName === "ebitda" ||
      lowercaseName === "net profit" ||
      lowercaseName === "net profit/(loss)"
    ) {
      return "font-semibold";
    }
    return "";
  };

  const shouldShowPercentage = (item: any) => {
    if (!item || !item.name) return false; // Guard against undefined items or names
    
    const lowercaseName = item.name.toLowerCase();
    return (
      lowercaseName.includes("gross profit") || 
      lowercaseName === "wages and salaries" ||
      lowercaseName === "wages" ||
      lowercaseName === "salaries"
    );
  };

  const getPercentageDisplay = (item: any) => {
    if (!item || !item.name) return null; // Guard against undefined items or names
    
    const lowercaseName = item.name.toLowerCase();
    
    if (lowercaseName.includes("food gross profit")) {
      const foodRevenueItems = processedBudgetData.filter(
        i => i && i.name && i.name.toLowerCase().includes('food') && 
             (i.name.toLowerCase().includes('revenue') || i.name.toLowerCase().includes('sales'))
      );
      
      const foodRevenue = foodRevenueItems.reduce(
        (sum, item) => sum + (item.actual_amount || 0), 0
      );
      
      if (foodRevenue > 0) {
        return formatPercentage((item.actual_amount / foodRevenue));
      }
      return formatPercentage(0);
    } 
    else if (lowercaseName.includes("beverage gross profit") || 
             lowercaseName.includes("drink gross profit")) {
      const beverageRevenueItems = processedBudgetData.filter(
        i => i && i.name && (i.name.toLowerCase().includes('beverage') || 
              i.name.toLowerCase().includes('drink') || 
              i.name.toLowerCase().includes('bar')) && 
             (i.name.toLowerCase().includes('revenue') || i.name.toLowerCase().includes('sales'))
      );
      
      const beverageRevenue = beverageRevenueItems.reduce(
        (sum, item) => sum + (item.actual_amount || 0), 0
      );
      
      if (beverageRevenue > 0) {
        return formatPercentage((item.actual_amount / beverageRevenue));
      }
      return formatPercentage(0);
    }
    else if (lowercaseName === "gross profit" || 
             lowercaseName === "gross profit/(loss)") {
      const turnover = processedBudgetData.find(
        i => i && i.name && (i.name.toLowerCase() === "turnover" || i.name.toLowerCase() === "total revenue")
      )?.actual_amount || 0;
      
      if (turnover > 0) {
        return formatPercentage((item.actual_amount / turnover));
      }
      return formatPercentage(0);
    }
    else if (
      lowercaseName === "wages and salaries" ||
      lowercaseName === "wages" ||
      lowercaseName === "salaries"
    ) {
      const turnover = processedBudgetData.find(
        i => i && i.name && (i.name.toLowerCase() === "turnover" || i.name.toLowerCase() === "total revenue")
      )?.actual_amount || 0;
      
      if (turnover > 0) {
        return formatPercentage((item.actual_amount / turnover));
      }
    }
    
    return null;
  };

  const filteredBudgetData = React.useMemo(() => {
    if (!renderedData || renderedData.length === 0) {
      return [];
    }
    
    const data = JSON.parse(JSON.stringify(renderedData));
    
    const grossProfitRows = data
      .map((item: any, index: number) => {
        if (item && item.name && 
            (item.name.toLowerCase().includes("gross profit") || 
             item.name.toLowerCase().includes("gross profit/(loss)"))) {
          return index;
        }
        return -1;
      })
      .filter((index: number) => index !== -1);
    
    let rowsToRemove: number[] = [];
    
    grossProfitRows.forEach((gpIndex: number) => {
      if (gpIndex >= 0 && gpIndex < data.length - 1) {
        const nextRow = data[gpIndex + 1];
        if (nextRow && nextRow.name && 
           (nextRow.name === "Total" || 
            nextRow.name === "total" || 
            nextRow.name === "TOTAL" ||
            nextRow.name.trim() === "Total ")) {
          rowsToRemove.push(gpIndex + 1);
        }
      }
    });
    
    let lastTotalAdminExpensesIndex = -1;
    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];
      if (item && item.name && 
          item.name.trim().toLowerCase() === "total admin expenses") {
        lastTotalAdminExpensesIndex = i;
        break;
      }
    }
    
    if (lastTotalAdminExpensesIndex !== -1) {
      rowsToRemove.push(lastTotalAdminExpensesIndex);
      console.log(`Found the last Total Admin expenses at index ${lastTotalAdminExpensesIndex}`);
    }
    
    rowsToRemove.sort((a, b) => b - a).forEach(index => {
      console.log(`Removing row at index ${index}: "${data[index]?.name}"`);
      data.splice(index, 1);
    });
    
    return data.filter((item: any) => {
      if (!item || !item.name) return true;
      const name = item.name.trim().toLowerCase();
      return name !== "total";
    });
  }, [renderedData]);

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
    if (!name) return false; // Guard against undefined names
    
    const lowercaseName = name.toLowerCase();
    return (
      lowercaseName.includes('cost') ||
      lowercaseName.includes('expense') ||
      lowercaseName.includes('wages') ||
      lowercaseName.includes('salaries') ||
      lowercaseName.includes('insurance') ||
      lowercaseName === 'repairs and maintenance' ||
      lowercaseName === 'utilities' ||
      lowercaseName === 'rent' ||
      lowercaseName === 'rates' ||
      lowercaseName.includes('administration') ||
      lowercaseName.includes('marketing') ||
      lowercaseName.includes('service charge') ||
      lowercaseName.includes('office') ||
      lowercaseName.includes('cleaning') ||
      lowercaseName.includes('maintenance') ||
      !lowercaseName.includes('profit') && 
      !lowercaseName.includes('revenue') && 
      !lowercaseName.includes('sales') && 
      !lowercaseName.includes('turnover')
    );
  };

  const isCostEditableRow = (name: string) => {
    if (!name) return false; // Guard against undefined names
    
    const lowercaseName = name.toLowerCase();
    
    const allAdminCosts = [
      'marketing',
      'training',
      'printing',
      'stationery',
      'telephone',
      'computer',
      'it costs',
      'bank charges',
      'accountancy',
      'legal',
      'professional',
      'recruitment',
      'sundry expenses',
      'sundry',
      'hotel',
      'travel',
      'administration',
      'advertising',
      'cleaning',
      'office expenses',
      'postage',
      'subscriptions',
      'entertainment',
      'motor expenses',
      'motor',
      'insurance',
      'heat and power',
      'heat',
      'power',
      'utilities',
      'repairs',
      'maintenance',
      'premises',
      'rates',
      'rent',
      'staff costs',
      'other staff'
    ];
    
    return allAdminCosts.some(category => lowercaseName.includes(category));
  };

  const calculatePercentageOfTurnover = (amount: number, turnover: number) => {
    return turnover > 0 ? (amount / turnover) * 100 : 0;
  };

  const calculatePercentageOfRevenue = (amount: number, revenue: number) => {
    return revenue > 0 ? (amount / revenue) * 100 : 0;
  };

  const getForecastPercentage = (item: any) => {
    if (!item || !item.name) return '0.0%'; // Guard against undefined items or names
    
    const forecastAmount = item.forecast_amount || getForecastAmount(item, currentYear, currentMonth);
    const name = item.name.toLowerCase();

    const turnoverItem = filteredBudgetData.find(item => 
      item && item.name && (
        item.name.toLowerCase() === 'turnover' || 
        item.name.toLowerCase() === 'total revenue'
      )
    );
    
    const foodRevenueItem = filteredBudgetData.find(item => 
      item && item.name && (
        item.name.toLowerCase().includes('food') && 
        (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales'))
      )
    );
    
    const beverageRevenueItem = filteredBudgetData.find(item => 
      item && item.name && (
        (item.name.toLowerCase().includes('beverage') || 
         item.name.toLowerCase().includes('drink')) && 
        (item.name.toLowerCase().includes('revenue') || item.name.toLowerCase().includes('sales'))
      )
    );

    const totalTurnoverForecast = turnoverItem?.forecast_amount || 0;
    const foodRevenueForecast = foodRevenueItem?.forecast_amount || 0;
    const beverageRevenueForecast = beverageRevenueItem?.forecast_amount || 0;

    if (name.includes('food') && name.includes('sales') || name.includes('food') && name.includes('revenue')) {
      return totalTurnoverForecast > 0 ? formatPercentage(forecastAmount / totalTurnoverForecast) : '0.0%';
    }
    
    if ((name.includes('beverage') || name.includes('drink')) && 
        (name.includes('sales') || name.includes('revenue'))) {
      return totalTurnoverForecast > 0 ? formatPercentage(forecastAmount / totalTurnoverForecast) : '0.0%';
    }
    
    if (name.includes('food') && name.includes('cost of sales')) {
      return foodRevenueForecast > 0 ? formatPercentage(forecastAmount / foodRevenueForecast) : '0.0%';
    }
    
    if ((name.includes('beverage') || name.includes('drink')) && name.includes('cost of sales')) {
      return beverageRevenueForecast > 0 ? formatPercentage(forecastAmount / beverageRevenueForecast) : '0.0%';
    }
    
    if (name === 'food gross profit' || name.includes('food gross profit')) {
      return foodRevenueForecast > 0 ? formatPercentage(forecastAmount / foodRevenueForecast) : '0.0%';
    }
    
    if (name === 'beverage gross profit' || name.includes('beverage gross profit') || name.includes('drink gross profit')) {
      return beverageRevenueForecast > 0 ? formatPercentage(forecastAmount / beverageRevenueForecast) : '0.0%';
    }
    
    if (name === 'cost of sales' || (name.includes('cost of sales') && !name.includes('food') && !name.includes('beverage') && !name.includes('drink'))) {
      return totalTurnoverForecast > 0 ? formatPercentage(forecastAmount / totalTurnoverForecast) : '0.0%';
    }
    
    if (name === 'gross profit' || name === 'gross profit/(loss)') {
      return totalTurnoverForecast > 0 ? formatPercentage(forecastAmount / totalTurnoverForecast) : '0.0%';
    }
    
    if (name === 'turnover' || name === 'total revenue') {
      return '100.0%';
    }
    
    if (name.includes('wages') || name.includes('salaries')) {
      return totalTurnoverForecast > 0 ? formatPercentage(forecastAmount / totalTurnoverForecast) : '0.0%';
    }
    
    if (!name.includes('revenue') && 
        !name.includes('cost of sales') && 
        !name.includes('gross profit') && 
        !item.isHeader) {
      return totalTurnoverForecast > 0 ? formatPercentage(forecastAmount / totalTurnoverForecast) : '0.0%';
    }
    
    return '0.0%';
  };

  const renderTableContent = () => {
    const adminExpenseItems = [
      "Wages and Salaries", 
      "Marketing", 
      "Professional Fees",
      "Bank charges",
      "Cleaning",
      "Entertainment (Staff, customer or supplier)",
      "Printing, postage and stationery",
      "Sundry Expenses",
      "Motor expenses",
      "Insurance",
      "Heat and power",
      "Repairs, Maintenance, Premises",
      "Telephone and internet",
      "Rates",
      "Rent",
      "Other staff costs",
      "Subscriptions",
      "Hotel and travel"
    ];
    
    const adminItems = filteredBudgetData.filter(item => 
      item && item.name && adminExpenseItems.some(expName => 
        item.name.trim() === expName || 
        item.name.trim().toLowerCase() === expName.toLowerCase()
      )
    );
    
    console.log('Admin expense items for total calculation:', adminItems.length);
    console.log('Admin items:', adminItems.map(item => ({
      name: item.name,
      budget_amount: item.budget_amount,
      actual_amount: getActualAmount(item),
      forecast_amount: item.forecast_amount || getForecastAmount(item, currentYear, currentMonth)
    })));
    
    const adminTotalBudget = adminItems.reduce((sum, item) => sum + (item.budget_amount || 0), 0);
    const adminTotalActual = adminItems.reduce((sum, item) => sum + getActualAmount(item), 0);
    
    const adminTotalForecast = adminItems.reduce((sum, item) => {
      const forecast = item.forecast_amount || getForecastAmount(item, currentYear, currentMonth);
      return sum + (forecast || 0);
    }, 0);
    
    const adminBudgetVariance = adminTotalForecast - adminTotalBudget;
    
    console.log(`Admin totals: Budget=${adminTotalBudget}, Actual=${adminTotalActual}, Forecast=${adminTotalForecast}, Variance=${adminBudgetVariance}`);
    
    const grossProfitItem = filteredBudgetData.find(item => 
      item && item.name && (
        (item.name.toLowerCase() === 'gross profit' || 
         item.name.toLowerCase() === 'gross profit/(loss)') &&
        !item.name.toLowerCase().includes('food') && 
        !item.name.toLowerCase().includes('beverage')
      )
    );
    
    const grossProfitActual = grossProfitItem ? getActualAmount(grossProfitItem) : 0;
    const grossProfitBudget = grossProfitItem ? grossProfitItem.budget_amount || 0 : 0;
    
    const grossProfitForecast = grossProfitItem && grossProfitItem.forecast_amount 
      ? grossProfitItem.forecast_amount 
      : (grossProfitActual > 0 && getCurrentDay() > 0) 
        ? (grossProfitActual / getCurrentDay()) * getDaysInMonth() 
        : grossProfitBudget;
    
    const operatingProfitBudget = grossProfitBudget - adminTotalBudget;
    const operatingProfitActual = grossProfitActual - adminTotalActual;
    const operatingProfitForecast = grossProfitForecast - adminTotalForecast;
    const operatingProfitVariance = operatingProfitForecast - operatingProfitBudget;
    
    console.log(`Operating profit: Budget=${operatingProfitBudget}, Actual=${operatingProfitActual}, Forecast=${operatingProfitForecast}, Variance=${operatingProfitVariance}`);

    const turnoverItem = filteredBudgetData.find(item => 
      item && item.name && (
        item.name.toLowerCase() === 'turnover' || 
        item.name.toLowerCase() === 'total revenue'
      )
    );
    const totalTurnoverForecast = turnoverItem?.forecast_amount || 0;

    return (
      <>
        {filteredBudgetData.map((item, index) => {
          if (!item || (item.category === "header" && item.budget_amount === 0)) {
            return null;
          }
          
          // Skip items without a name property
          if (!item.name) {
            console.warn("Warning: Item without name found in filteredBudgetData", item);
            return null;
          }
          
          const fontClass = getFontClass(item.name);
          const percentageDisplay = shouldShowPercentage(item) ? getPercentageDisplay(item) : null;
          
          const actualAmount = getActualAmount(item);
          
          let forecastAmount = item.forecast_amount;
          
          if (!forecastAmount && item.forecast_settings) {
            forecastAmount = calculateForecastFromSettings(
              item.forecast_settings, 
              item.budget_amount
            );
          }
          
          if (!forecastAmount) {
            forecastAmount = getForecastAmount(item, currentYear, currentMonth);
          }
          
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
          const boldValueClass = (shouldHighlight && item.name.toLowerCase().includes("cost of sales")) ? "font-bold" : "";
          const boldTitleClass = (shouldHighlight && item.name.toLowerCase().includes("cost of sales")) ? "font-bold" : "";
          
          const varianceAmount = forecastAmount - (item.budget_amount || 0);
          const itemIsCostLine = isCostLine(item.name);
          
          if (item.name.toLowerCase().includes('total admin')) {
            return null;
          }
          
          if (item.name.toLowerCase().includes('operating profit')) {
            return null;
          }
          
          const forecastPercentage = getForecastPercentage(item);
          
          return (
            <TableRow key={index} className={`${item.category === "header" ? "bg-slate-50" : ""} ${highlightClass}`}>
              <TableCell className={`${fontClass} ${boldTitleClass}`}>{item.name}</TableCell>
              <TableCell className={`text-right ${fontClass} ${boldValueClass}`}>
                {formatCurrency(item.budget_amount)}
              </TableCell>
              <TableCell className={`text-right ${fontClass} ${boldValueClass}`}>
                {formatCurrency(actualAmount)}
              </TableCell>
              <TableCell className="text-right">
                {percentageDisplay ? percentageDisplay : ""}
              </TableCell>
              <TableCell className={`text-right ${fontClass} ${boldValueClass}`}>
                {formatCurrency(forecastAmount)}
                {isCostEditableRow(item.name) && (
                  <ForecastSettingsControl
                    itemName={item.name}
                    budgetAmount={item.budget_amount || 0}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                    onMethodChange={() => {
                      console.log(`ForecastSettingsControl onMethodChange triggered for ${item.name}`);
                      setRefreshTrigger(prev => prev + 1);
                    }}
                  />
                )}
              </TableCell>
              <TableCell className="text-right">
                {forecastPercentage}
              </TableCell>
              <TableCell className={`text-right ${fontClass} ${boldValueClass} ${getValueColor(varianceAmount, itemIsCostLine)}`}>
                {formatCurrency(varianceAmount)}
              </TableCell>
            </TableRow>
          );
        })}
        
        <TableRow className="bg-purple-100/50 text-[#48495e]">
          <TableCell className="font-bold">
            TOTAL ADMIN EXPENSES
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(adminTotalBudget)}
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(adminTotalActual)}
          </TableCell>
          <TableCell className="text-right">
            {/* Percentage can be added here if needed */}
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(adminTotalForecast)}
          </TableCell>
          <TableCell className="text-right">
            {totalTurnoverForecast > 0 
              ? formatPercentage(adminTotalForecast / totalTurnoverForecast)
              : '0.0%'}
          </TableCell>
          <TableCell className={`text-right font-bold ${
            adminBudgetVariance < 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(adminBudgetVariance)}
          </TableCell>
        </TableRow>
        
        <TableRow className="bg-[#8B5CF6]/90 text-white">
          <TableCell className="font-bold">
            Operating profit
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(operatingProfitBudget)}
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(operatingProfitActual)}
          </TableCell>
          <TableCell className="text-right">
            {/* Percentage can be added here if needed */}
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(operatingProfitForecast)}
          </TableCell>
          <TableCell className="text-right font-bold">
            {totalTurnoverForecast > 0 
              ? formatPercentage(operatingProfitForecast / totalTurnoverForecast)
              : '0.0%'}
          </TableCell>
          <TableCell className={`text-right font-bold ${
            operatingProfitVariance > 0 ? 'text-green-200' : 'text-red-300'
          }`}>
            {formatCurrency(operatingProfitVariance)}
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          P&L Report - {currentMonthName} {currentYear}
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[240px] font-bold">Item</TableHead>
              <TableHead className="text-right font-bold">Budget</TableHead>
              <TableHead className="text-right font-bold">Actual MTD</TableHead>
              <TableHead className="text-right font-bold">%</TableHead>
              <TableHead className="text-right font-bold">Forecast</TableHead>
              <TableHead className="text-right font-bold">F%</TableHead>
              <TableHead className="text-right font-bold">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(10)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-[80px] ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-[40px] ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-[80px] ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-[80px] ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-[80px] ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-[80px] ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              renderTableContent()
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
