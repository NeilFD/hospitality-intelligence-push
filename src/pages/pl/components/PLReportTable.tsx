import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatCurrency, formatPercentage } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getActualAmount } from '../components/tracker/TrackerCalculations';
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
  
  const getMonthNumber = (monthName: string) => {
    const months = ["January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"];
    return months.indexOf(monthName) + 1;
  };
  
  const daysInMonth = getDaysInMonth();
  const currentDay = getCurrentDay();
  
  const calculateForecast = (actualAmount: number) => {
    if (currentDay <= 0) return actualAmount;
    const dailyAverage = actualAmount / currentDay;
    return dailyAverage * daysInMonth;
  };

  const getFontClass = (name: string) => {
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
    const lowercaseName = item.name.toLowerCase();
    return (
      lowercaseName.includes("gross profit") || 
      lowercaseName === "wages and salaries" ||
      lowercaseName === "wages" ||
      lowercaseName === "salaries"
    );
  };

  const getPercentageDisplay = (item: any) => {
    const lowercaseName = item.name.toLowerCase();
    
    if (lowercaseName.includes("food gross profit")) {
      const foodRevenueItems = processedBudgetData.filter(
        i => i.name.toLowerCase().includes("food") && 
             (i.name.toLowerCase().includes("revenue") || i.name.toLowerCase().includes("sales"))
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
        i => (i.name.toLowerCase().includes("beverage") || 
              i.name.toLowerCase().includes("drink") || 
              i.name.toLowerCase().includes("bar")) && 
             (i.name.toLowerCase().includes("revenue") || i.name.toLowerCase().includes("sales"))
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
        i => i.name.toLowerCase() === "turnover" || i.name.toLowerCase() === "total revenue"
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
        i => i.name.toLowerCase() === "turnover" || i.name.toLowerCase() === "total revenue"
      )?.actual_amount || 0;
      
      if (turnover > 0) {
        return formatPercentage((item.actual_amount / turnover));
      }
    }
    
    return null;
  };

  const filteredBudgetData = React.useMemo(() => {
    if (!processedBudgetData || processedBudgetData.length === 0) {
      return [];
    }
    
    const data = JSON.parse(JSON.stringify(processedBudgetData));
    
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
  }, [processedBudgetData]);

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
    const lowercaseName = name.toLowerCase();
    const editableCategories = [
      'marketing',
      'training',
      'subscriptions',
      'printing',
      'stationery',
      'telephone',
      'computer costs',
      'bank charges',
      'accountancy',
      'legal & professional',
      'recruitment',
      'sundry expenses',
      'hotel',
      'travel'
    ];
    
    return editableCategories.includes(lowercaseName);
  };

  const renderTableContent = () => {
    return filteredBudgetData.map((item, index) => {
      if (item.category === "header" && item.budget_amount === 0) {
        return null;
      }
      
      const fontClass = getFontClass(item.name);
      const percentageDisplay = shouldShowPercentage(item) ? getPercentageDisplay(item) : null;
      
      const actualAmount = getActualAmount(item);
      
      const forecastAmount = calculateForecast(actualAmount || 0);
      
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
      
      const boldValueClass = (shouldHighlight && item.name.toLowerCase().includes("cost of sales")) 
        ? "font-bold" 
        : "";
      
      const boldTitleClass = (shouldHighlight && item.name.toLowerCase().includes("cost of sales")) 
        ? "font-bold" 
        : "";
      
      const isOperatingProfit = item.name.toLowerCase().includes('operating profit');
      const varianceAmount = forecastAmount - (item.budget_amount || 0);
      const itemIsCostLine = isCostLine(item.name);
      
      return (
        <TableRow key={index} className={`${item.category === "header" ? "bg-slate-50" : ""} ${highlightClass}`}>
          <TableCell className={`${fontClass} ${boldTitleClass}`}>{item.name}</TableCell>
          <TableCell className={`text-right ${fontClass} ${boldValueClass}`}>
            {formatCurrency(item.budget_amount)}
          </TableCell>
          <TableCell className={`text-right ${fontClass} ${boldValueClass} ${isOperatingProfit ? getValueColor(actualAmount || 0) : ''}`}>
            <div className="flex items-center justify-end">
              {formatCurrency(actualAmount)}
              {isCostEditableRow(item.name) && (
                <ForecastSettingsControl
                  itemName={item.name}
                  budgetAmount={item.budget_amount || 0}
                  currentYear={currentYear}
                  currentMonth={getMonthNumber(currentMonthName)}
                  onMethodChange={() => {
                    window.location.reload();
                  }}
                />
              )}
            </div>
          </TableCell>
          <TableCell className={`text-right ${fontClass}`}>
            {percentageDisplay ? percentageDisplay : ""}
          </TableCell>
          <TableCell className={`text-right ${fontClass} ${boldValueClass} ${isOperatingProfit ? getValueColor(forecastAmount) : ''}`}>
            {formatCurrency(forecastAmount)}
          </TableCell>
          <TableCell className={`text-right ${fontClass} ${boldValueClass} ${getValueColor(varianceAmount, itemIsCostLine)}`}>
            {formatCurrency(varianceAmount)}
          </TableCell>
        </TableRow>
      );
    });
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
