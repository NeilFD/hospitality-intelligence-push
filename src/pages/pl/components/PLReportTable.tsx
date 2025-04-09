
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import React from "react";

type PLReportTableProps = {
  isLoading: boolean;
  processedBudgetData: any[];
  currentMonthName: string;
  currentYear: number;
  onOpenTracker: () => void;
};

export function PLReportTable({
  isLoading,
  processedBudgetData,
  currentMonthName,
  currentYear,
  onOpenTracker,
}: PLReportTableProps) {
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
    const turnover = processedBudgetData.find(
      i => i.name.toLowerCase() === "turnover" || i.name.toLowerCase() === "total revenue"
    )?.actual_amount || 0;
    
    if (turnover === 0) return null;
    
    let percentage = 0;
    
    if (lowercaseName.includes("gross profit")) {
      percentage = (item.actual_amount / turnover) * 100;
    } 
    else if (
      lowercaseName === "wages and salaries" ||
      lowercaseName === "wages" ||
      lowercaseName === "salaries"
    ) {
      percentage = (item.actual_amount / turnover) * 100;
    }
    
    return formatPercentage(percentage / 100);
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

  const renderTableContent = () => {
    return filteredBudgetData.map((item, index) => {
      const fontClass = getFontClass(item.name);
      const percentageDisplay = shouldShowPercentage(item) ? getPercentageDisplay(item) : null;
      
      // Check if this is a row that needs highlighting
      const shouldHighlight = 
        item.name.toLowerCase() === "turnover" || 
        item.name.toLowerCase() === "total revenue" ||
        item.name.toLowerCase().includes("gross profit/(loss)") ||
        item.name.toLowerCase().includes("gross profit") ||
        item.name.toLowerCase() === "total admin expenses" ||
        item.name.toLowerCase().includes("operating profit");
      
      const highlightClass = shouldHighlight ? "bg-purple-50" : "";
      
      return (
        <TableRow key={index} className={`${item.category === "header" ? "bg-slate-50" : ""} ${highlightClass}`}>
          <TableCell className={`${fontClass}`}>{item.name}</TableCell>
          <TableCell className={`text-right ${fontClass}`}>
            {formatCurrency(item.budget_amount)}
          </TableCell>
          <TableCell className={`text-right ${fontClass}`}>
            {formatCurrency(item.actual_amount)}
          </TableCell>
          <TableCell className={`text-right ${fontClass}`}>
            {percentageDisplay ? percentageDisplay : ""}
          </TableCell>
          <TableCell className={`text-right ${fontClass}`}>
            {formatCurrency(item.forecast_amount || item.budget_amount)}
          </TableCell>
          <TableCell className={`text-right ${fontClass}`}>
            {formatCurrency(
              (item.forecast_amount || item.budget_amount) - item.actual_amount
            )}
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
        <Button variant="outline" size="sm" onClick={onOpenTracker}>
          Open Tracker <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[240px]">Item</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Actual MTD</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead className="text-right">Forecast</TableHead>
              <TableHead className="text-right">Variance</TableHead>
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
