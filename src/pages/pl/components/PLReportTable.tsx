
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
  // Helper function to determine font class based on item name
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

  // Helper function to determine if an item should display percentage
  const shouldShowPercentage = (item: any) => {
    const lowercaseName = item.name.toLowerCase();
    return (
      lowercaseName.includes("gross profit") || 
      lowercaseName === "wages and salaries" ||
      lowercaseName === "wages" ||
      lowercaseName === "salaries"
    );
  };

  // Helper function to calculate percentage display
  const getPercentageDisplay = (item: any) => {
    const lowercaseName = item.name.toLowerCase();
    const turnover = processedBudgetData.find(
      i => i.name.toLowerCase() === "turnover" || i.name.toLowerCase() === "total revenue"
    )?.actual_amount || 0;
    
    if (turnover === 0) return null;
    
    let percentage = 0;
    
    // For gross profit items, calculate percentage of revenue
    if (lowercaseName.includes("gross profit")) {
      percentage = (item.actual_amount / turnover) * 100;
    } 
    // For wages, calculate percentage of turnover
    else if (
      lowercaseName === "wages and salaries" ||
      lowercaseName === "wages" ||
      lowercaseName === "salaries"
    ) {
      percentage = (item.actual_amount / turnover) * 100;
    }
    
    return formatPercentage(percentage / 100);
  };

  // Find indices we need
  let grossProfitIndex = -1;
  let wagesIndex = -1;
  
  // Identify the positions of Gross Profit and Wages rows
  processedBudgetData.forEach((item, index) => {
    if (item.name && item.name.toLowerCase().includes("gross profit")) {
      grossProfitIndex = index;
    }
    if (
      item.name && 
      (item.name.toLowerCase().includes("wages") || 
       item.name.toLowerCase().includes("salaries"))
    ) {
      if (wagesIndex === -1) wagesIndex = index;
    }
  });
  
  // Filter out the unwanted Total row
  const filteredBudgetData = processedBudgetData.filter((item, index) => {
    // Check if this is a Total row between Gross Profit and Wages
    if ((item.name === "Total" || item.name === "TOTAL") && 
        index > grossProfitIndex && 
        index < wagesIndex) {
      return false;
    }
    return true;
  });

  const renderTableContent = () => {
    return filteredBudgetData.map((item, index) => {
      const fontClass = getFontClass(item.name);
      const percentageDisplay = shouldShowPercentage(item) ? getPercentageDisplay(item) : null;
      
      return (
        <TableRow key={index} className={item.category === "header" ? "bg-slate-50" : ""}>
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
