
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MonthYearSelector } from './components/MonthYearSelector';
import { PerformanceChart } from './components/PerformanceChart';
import { PLReportTable } from './components/PLReportTable';
import { PLTracker } from './components/PLTracker';
import { useBudgetData } from './hooks/useBudgetData';
import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyRevenueData } from '@/services/master-record-service';
import { fetchFoodCOSForMonth, fetchBeverageCOSForMonth } from '@/services/budget-service';
import { fetchTotalWagesForMonth } from '@/services/wages-service';

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

  // Fetch Food and Beverage COS data
  const { data: foodCOSData, isLoading: isFoodCOSLoading } = useQuery({
    queryKey: ['food-cos-data', currentYear, currentMonth],
    queryFn: () => fetchFoodCOSForMonth(currentYear, currentMonth)
  });

  const { data: beverageCOSData, isLoading: isBeverageCOSLoading } = useQuery({
    queryKey: ['beverage-cos-data', currentYear, currentMonth],
    queryFn: () => fetchBeverageCOSForMonth(currentYear, currentMonth)
  });

  // Fetch Wages data
  const { data: wagesData, isLoading: isWagesLoading } = useQuery({
    queryKey: ['wages-data', currentYear, currentMonth],
    queryFn: () => fetchTotalWagesForMonth(currentYear, currentMonth)
  });

  const {
    isLoading: isBudgetDataLoading,
    processedBudgetData
  } = useBudgetData(currentYear, currentMonth);
  
  const isLoading = isBudgetDataLoading || isMasterDataLoading || isFoodCOSLoading || isBeverageCOSLoading || isWagesLoading;
  
  console.log("Dashboard - Food COS:", foodCOSData);
  console.log("Dashboard - Beverage COS:", beverageCOSData);
  console.log("Dashboard - Revenue Data:", masterRevenueData);
  
  // Update the processedBudgetData with master record revenue data, COS, and wages data
  const updatedBudgetData = processedBudgetData.map(item => {
    if (masterRevenueData && !isLoading) {
      // Update food revenue item
      if (item.name.toLowerCase().includes('food sales') || 
          item.name.toLowerCase().includes('food revenue')) {
        const foodRevenue = masterRevenueData.foodRevenue || 0;
        return { ...item, actual_amount: foodRevenue };
      }
      
      // Update beverage revenue item
      if (item.name.toLowerCase().includes('beverage sales') || 
          item.name.toLowerCase().includes('beverage revenue') || 
          item.name.toLowerCase().includes('drink sales') ||
          item.name.toLowerCase().includes('drinks revenue')) {
        const beverageRevenue = masterRevenueData.beverageRevenue || 0;
        return { ...item, actual_amount: beverageRevenue };
      }
      
      // Update total revenue/turnover
      if (item.name.toLowerCase().includes('turnover') || 
          item.name.toLowerCase().includes('total revenue')) {
        const totalRevenue = masterRevenueData.totalRevenue || 0;
        return { ...item, actual_amount: totalRevenue };
      }

      // Update food COS
      if (item.name.toLowerCase().includes('food cost of sales') || 
          item.name.toLowerCase().includes('food cos') ||
          (item.name.toLowerCase().includes('food') && 
           item.category.toLowerCase().includes('cost of sales'))) {
        return { ...item, actual_amount: foodCOSData || 0 };
      }
      
      // Update beverage COS
      if (item.name.toLowerCase().includes('beverage cost of sales') || 
          item.name.toLowerCase().includes('beverage cos') ||
          item.name.toLowerCase().includes('drinks cost of sales') ||
          item.name.toLowerCase().includes('drinks cos') ||
          item.name.toLowerCase().includes('bev cos') || // Added this match
          ((item.name.toLowerCase().includes('beverage') || 
            item.name.toLowerCase().includes('drink') || 
            item.name.toLowerCase().includes('bev')) && // Added this match
           item.category.toLowerCase().includes('cost of sales'))) {
        return { ...item, actual_amount: beverageCOSData || 0 };
      }
      
      // Update total COS
      if ((item.name.toLowerCase() === 'cost of sales' || 
          item.name.toLowerCase() === 'cos') && 
          !item.name.toLowerCase().includes('food') &&
          !item.name.toLowerCase().includes('beverage') &&
          !item.name.toLowerCase().includes('drink') &&
          !item.name.toLowerCase().includes('bev')) {
        return { ...item, actual_amount: (foodCOSData || 0) + (beverageCOSData || 0) };
      }
      
      // Update Food Gross Profit
      if (item.name.toLowerCase().includes('food gross profit')) {
        const foodRevenue = masterRevenueData.foodRevenue || 0;
        const foodCOS = foodCOSData || 0;
        const foodGP = foodRevenue - foodCOS;
        return { ...item, actual_amount: foodGP };
      }
      
      // Update Beverage Gross Profit
      if (item.name.toLowerCase().includes('beverage gross profit') || 
          item.name.toLowerCase().includes('drinks gross profit')) {
        const beverageRevenue = masterRevenueData.beverageRevenue || 0;
        const beverageCOS = beverageCOSData || 0;
        const beverageGP = beverageRevenue - beverageCOS;
        return { ...item, actual_amount: beverageGP };
      }
      
      // Update Total Gross Profit
      if ((item.name.toLowerCase() === 'gross profit' || 
           item.name.toLowerCase() === 'gross profit/(loss)') && 
          !item.name.toLowerCase().includes('food') &&
          !item.name.toLowerCase().includes('beverage') &&
          !item.name.toLowerCase().includes('drink')) {
        const totalRevenue = masterRevenueData.totalRevenue || 0;
        const totalCOS = (foodCOSData || 0) + (beverageCOSData || 0);
        const totalGP = totalRevenue - totalCOS;
        return { ...item, actual_amount: totalGP };
      }

      // Update wages
      if (item.name.toLowerCase().includes('wages and salaries') || 
          item.name.toLowerCase() === 'wages' ||
          item.name.toLowerCase() === 'salaries') {
        return { ...item, actual_amount: wagesData || 0 };
      }
    }
    return item;
  });
  
  console.log("Dashboard - processed budget data:", updatedBudgetData.map(item => ({
    name: item.name,
    actualAmount: item.actual_amount
  })));

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
