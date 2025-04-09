
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MonthYearSelector } from './components/MonthYearSelector';
import { PerformanceChart } from './components/PerformanceChart';
import { PLReportTable } from './components/PLReportTable';
import { useBudgetData } from './hooks/useBudgetData';
import { PLTracker } from './components/PLTracker';
import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyRevenueData } from '@/services/master-record-service';

export default function PLDashboard() {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentMonthName, setCurrentMonthName] = useState<string>(new Date().toLocaleString('default', {
    month: 'long'
  }));
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [showTracker, setShowTracker] = useState<boolean>(false);
  
  const handleMonthChange = (value: string) => {
    const month = parseInt(value);
    setCurrentMonth(month);
    setCurrentMonthName(new Date(2000, month - 1, 1).toLocaleString('default', {
      month: 'long'
    }));
  };
  
  const handleYearChange = (value: string) => {
    setCurrentYear(parseInt(value));
  };
  
  // Fetch master record revenue data
  const { data: masterRevenueData, isLoading: isMasterDataLoading } = useQuery({
    queryKey: ['master-revenue-data', currentYear, currentMonth],
    queryFn: () => fetchMonthlyRevenueData(currentYear, currentMonth)
  });

  const {
    isLoading: isBudgetDataLoading,
    processedBudgetData
  } = useBudgetData(currentYear, currentMonth);
  
  const isLoading = isBudgetDataLoading || isMasterDataLoading;
  
  // Update the processedBudgetData with master record revenue data
  const updatedBudgetData = processedBudgetData.map(item => {
    if (masterRevenueData && !isLoading) {
      // Update food revenue item
      if (item.name.toLowerCase() === 'food sales' || 
          item.name.toLowerCase() === 'food revenue') {
        return { ...item, actual_amount: masterRevenueData.foodRevenue };
      }
      
      // Update beverage revenue item
      if (item.name.toLowerCase() === 'beverage sales' || 
          item.name.toLowerCase() === 'beverage revenue' || 
          item.name.toLowerCase() === 'drink sales' ||
          item.name.toLowerCase() === 'drinks revenue') {
        return { ...item, actual_amount: masterRevenueData.beverageRevenue };
      }
      
      // Update total revenue/turnover
      if (item.name.toLowerCase() === 'turnover' || 
          item.name.toLowerCase() === 'total revenue') {
        return { ...item, actual_amount: masterRevenueData.totalRevenue };
      }
    }
    return item;
  });
  
  console.log("Dashboard - processed budget data:", updatedBudgetData.map(item => item.name));

  // Calculate chart data from processed budget data
  const turnoverItem = updatedBudgetData.find(item => item.name.toLowerCase() === 'turnover' || item.name.toLowerCase() === 'revenue');
  const costOfSalesItem = updatedBudgetData.find(item => item.name.toLowerCase() === 'cost of sales' || item.name.toLowerCase() === 'cos');
  const operatingProfitItem = updatedBudgetData.find(item => item.name.toLowerCase().includes('operating profit') || item.name.toLowerCase().includes('ebitda'));
  const chartData = [{
    name: 'Budget',
    revenue: turnoverItem?.budget_amount || 0,
    costs: costOfSalesItem?.budget_amount || 0,
    ebitda: operatingProfitItem?.budget_amount || 0
  }, {
    name: 'MTD Actual',
    revenue: turnoverItem?.actual_amount || 0,
    costs: costOfSalesItem?.actual_amount || 0,
    ebitda: operatingProfitItem?.actual_amount || 0
  }, {
    name: 'Forecast',
    revenue: turnoverItem?.forecast_amount || turnoverItem?.budget_amount || 0,
    costs: costOfSalesItem?.forecast_amount || costOfSalesItem?.budget_amount || 0,
    ebitda: operatingProfitItem?.forecast_amount || operatingProfitItem?.budget_amount || 0
  }];
  
  return <div className="container py-8 text-[#48495e]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#342640]">P&L Tracker Dashboard</h1>
      
      <div className="flex justify-between items-center mb-6">
        <MonthYearSelector currentMonth={currentMonth} currentMonthName={currentMonthName} currentYear={currentYear} onMonthChange={handleMonthChange} onYearChange={handleYearChange} />
        
        <Button variant="outline" asChild>
          <Link to="/pl/budget" className="flex items-center gap-2">
            <FileUp size={16} />
            Manage Budget Data
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <PerformanceChart chartData={chartData} currentMonthName={currentMonthName} currentYear={currentYear} isLoading={isLoading} />
      </div>
      
      {showTracker ? <div className="grid grid-cols-1 gap-6 mb-6">
          <PLTracker isLoading={isLoading} processedBudgetData={updatedBudgetData} currentMonthName={currentMonthName} currentYear={currentYear} onClose={() => setShowTracker(false)} />
        </div> : <div className="grid grid-cols-1 gap-6 mb-6">
          <PLReportTable isLoading={isLoading} processedBudgetData={updatedBudgetData} currentMonthName={currentMonthName} currentYear={currentYear} onOpenTracker={() => setShowTracker(true)} />
        </div>}
    </div>;
}
