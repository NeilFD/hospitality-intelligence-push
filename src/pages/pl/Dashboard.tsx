import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MonthYearSelector } from './components/MonthYearSelector';
import { PerformanceChart } from './components/PerformanceChart';
import { PLReportTable } from './components/PLReportTable';
import { useBudgetData } from './hooks/useBudgetData';
import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyRevenueData } from '@/services/master-record-service';
import { fetchFoodCOSForMonth, fetchBeverageCOSForMonth } from '@/services/budget-service';
import { fetchTotalWagesForMonth } from '@/services/wages-service';
import { getActualAmount, getForecastAmount } from './components/tracker/TrackerCalculations';

export default function PLDashboard() {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentMonthName, setCurrentMonthName] = useState<string>(new Date().toLocaleString('default', {
    month: 'long'
  }));
  const [currentYear, setCurrentYear] = useState<number>(2025);
  
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
  
  const { data: masterRevenueData, isLoading: isMasterDataLoading } = useQuery({
    queryKey: ['master-revenue-data', currentYear, currentMonth],
    queryFn: () => fetchMonthlyRevenueData(currentYear, currentMonth)
  });

  const { data: foodCOSData, isLoading: isFoodCOSLoading } = useQuery({
    queryKey: ['food-cos-data', currentYear, currentMonth],
    queryFn: () => fetchFoodCOSForMonth(currentYear, currentMonth)
  });

  const { data: beverageCOSData, isLoading: isBeverageCOSLoading } = useQuery({
    queryKey: ['beverage-cos-data', currentYear, currentMonth],
    queryFn: () => fetchBeverageCOSForMonth(currentYear, currentMonth)
  });

  const { data: wagesData, isLoading: isWagesLoading } = useQuery({
    queryKey: ['wages-data', currentYear, currentMonth],
    queryFn: () => fetchTotalWagesForMonth(currentYear, currentMonth)
  });

  const {
    isLoading: isBudgetDataLoading,
    processedBudgetData
  } = useBudgetData(currentYear, currentMonth);
  
  const isLoading = isBudgetDataLoading || isMasterDataLoading || isFoodCOSLoading || isBeverageCOSLoading || isWagesLoading;
  
  useEffect(() => {
    console.log("Loading forecast settings for all items");
    const loadForecastSettings = async () => {
      if (!processedBudgetData || processedBudgetData.length === 0) return;
      
      const updatedItems = processedBudgetData.map(item => {
        if (!item || !item.name) {
          console.warn("Warning: Found item without name in processedBudgetData", item);
          return item;
        }
        
        const cacheKey = `forecast_${item.name}_${currentYear}_${currentMonth}`;
        const cachedSettings = localStorage.getItem(cacheKey);
        
        if (cachedSettings) {
          try {
            console.log(`Found cached forecast settings for ${item.name}:`, cachedSettings);
            const updatedItem = { ...item };
            updatedItem.forecast_settings = JSON.parse(cachedSettings);
            return updatedItem;
          } catch (e) {
            console.error(`Error parsing cached forecast settings for ${item.name}:`, e);
            return item;
          }
        }
        return item;
      });
    };
    
    loadForecastSettings();
  }, [processedBudgetData, currentYear, currentMonth]);
  
  useEffect(() => {
    const handleForecastUpdate = (event: any) => {
      console.log("Dashboard: Forecast updated event received", event.detail);
    };

    window.addEventListener('forecast-updated', handleForecastUpdate);
    
    return () => {
      window.removeEventListener('forecast-updated', handleForecastUpdate);
    };
  }, []);
  
  const generateTempId = (name: string) => {
    return `temp-id-${name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const updatedBudgetData = processedBudgetData.map(item => {
    if (!item || !item.name) {
      console.warn("Warning: Found item without name in updatedBudgetData");
      return item;
    }
    
    if (masterRevenueData && !isLoading) {
      if (item.name.toLowerCase().includes('food sales') || 
          item.name.toLowerCase().includes('food revenue')) {
        const foodRevenue = masterRevenueData.foodRevenue || 0;
        return { ...item, actual_amount: foodRevenue };
      }
      
      if (item.name.toLowerCase().includes('beverage sales') || 
          item.name.toLowerCase().includes('beverage revenue') || 
          item.name.toLowerCase().includes('drink sales') ||
          item.name.toLowerCase().includes('drinks revenue')) {
        const beverageRevenue = masterRevenueData.beverageRevenue || 0;
        return { ...item, actual_amount: beverageRevenue };
      }
      
      if (item.name.toLowerCase().includes('turnover') || 
          item.name.toLowerCase().includes('total revenue')) {
        const totalRevenue = masterRevenueData.totalRevenue || 0;
        return { ...item, actual_amount: totalRevenue };
      }

      if (item.name.toLowerCase().includes('food cost of sales') || 
          item.name.toLowerCase().includes('food cos') ||
          (item.name.toLowerCase().includes('food') && 
           item.category && item.category.toLowerCase().includes('cost of sales'))) {
        return { ...item, actual_amount: foodCOSData || 0 };
      }
      
      if (item.name.toLowerCase().includes('beverage cost of sales') || 
          item.name.toLowerCase().includes('beverage cos') ||
          item.name.toLowerCase().includes('drinks cost of sales') ||
          item.name.toLowerCase().includes('drinks cos') ||
          item.name.toLowerCase().includes('bev cos') ||
          ((item.name.toLowerCase().includes('beverage') || 
            item.name.toLowerCase().includes('drink') || 
            item.name.toLowerCase().includes('bev')) && 
           item.category && item.category.toLowerCase().includes('cost of sales'))) {
        return { ...item, actual_amount: beverageCOSData || 0 };
      }
      
      if ((item.name.toLowerCase() === 'cost of sales' || 
          item.name.toLowerCase() === 'cos') && 
          !item.name.toLowerCase().includes('food') &&
          !item.name.toLowerCase().includes('beverage') &&
          !item.name.toLowerCase().includes('drink') &&
          !item.name.toLowerCase().includes('bev')) {
        return { ...item, actual_amount: (foodCOSData || 0) + (beverageCOSData || 0) };
      }
      
      if (item.name.toLowerCase().includes('food gross profit')) {
        const foodRevenue = masterRevenueData.foodRevenue || 0;
        const foodCOS = foodCOSData || 0;
        const foodGP = foodRevenue - foodCOS;
        return { ...item, actual_amount: foodGP };
      }
      
      if (item.name.toLowerCase().includes('beverage gross profit') || 
          item.name.toLowerCase().includes('drinks gross profit')) {
        const beverageRevenue = masterRevenueData.beverageRevenue || 0;
        const beverageCOS = beverageCOSData || 0;
        const beverageGP = beverageRevenue - beverageCOS;
        return { ...item, actual_amount: beverageGP };
      }
      
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

      if (item.name.toLowerCase().includes('wages and salaries') || 
          item.name.toLowerCase() === 'wages' ||
          item.name.toLowerCase() === 'salaries') {
        return { ...item, actual_amount: wagesData || 0 };
      }
    }
    
    const result = { ...item };
    
    if (!result.forecast_settings) {
      const cacheKey = `forecast_${item.name}_${currentYear}_${currentMonth}`;
      const cachedSettings = localStorage.getItem(cacheKey);
      if (cachedSettings) {
        try {
          console.log(`Loading cached forecast settings for ${item.name}:`, cachedSettings);
          result.forecast_settings = JSON.parse(cachedSettings);
        } catch (e) {
          console.error('Error parsing cached forecast settings:', e);
        }
      }
    }
    
    return result;
  });
  
  const turnoverItem = updatedBudgetData.find(item => 
    item && item.name && (
      item.name.toLowerCase() === 'turnover' || 
      item.name.toLowerCase() === 'total revenue'
    )
  );
  
  const costOfSalesItem = updatedBudgetData.find(item => 
    item && item.name && (
      (item.name.toLowerCase() === 'cost of sales' || 
       item.name.toLowerCase() === 'cos') && 
      !item.name.toLowerCase().includes('food') && 
      !item.name.toLowerCase().includes('beverage') && 
      !item.name.toLowerCase().includes('drink')
    )
  );
  
  const operatingProfitItem = updatedBudgetData.find(item => 
    item && item.name && (
      item.name.toLowerCase().includes('operating profit') || 
      item.name.toLowerCase().includes('ebitda')
    )
  );

  const adminExpensesItem = updatedBudgetData.find(item => 
    item && item.name && (
      item.name.toLowerCase() === 'total admin expenses' ||
      item.name.toLowerCase() === 'total admin'
    )
  );

  const turnoverForecast = turnoverItem?.forecast_amount || 
                         (turnoverItem ? getForecastAmount({
                           ...(turnoverItem || {}), 
                           id: turnoverItem?.id || generateTempId('turnover')
                         }, currentYear, currentMonth) : 0);
                         
  const costOfSalesForecast = costOfSalesItem?.forecast_amount || 
                            (costOfSalesItem ? getForecastAmount({
                              ...(costOfSalesItem || {}), 
                              id: costOfSalesItem?.id || generateTempId('cost-of-sales')
                            }, currentYear, currentMonth) : 0);
  
  const adminExpensesForecast = adminExpensesItem?.forecast_amount || 
                             (adminExpensesItem ? getForecastAmount({
                               ...(adminExpensesItem || {}),
                               id: adminExpensesItem?.id || generateTempId('admin-expenses')
                             }, currentYear, currentMonth) : 0);
                            
  const operatingProfitForecast = operatingProfitItem?.forecast_amount || 
                                (operatingProfitItem ? getForecastAmount({
                                  ...(operatingProfitItem || {}), 
                                  id: operatingProfitItem?.id || generateTempId('operating-profit')
                                }, currentYear, currentMonth) : 0);

  const turnoverActual = turnoverItem ? getActualAmount({
    ...turnoverItem, 
    id: turnoverItem.id || generateTempId('turnover')
  }) : 0;
  
  const costOfSalesActual = costOfSalesItem ? getActualAmount({
    ...costOfSalesItem, 
    id: costOfSalesItem.id || generateTempId('cost-of-sales')
  }) : 0;
  
  const adminExpensesActual = adminExpensesItem ? getActualAmount({
    ...adminExpensesItem,
    id: adminExpensesItem.id || generateTempId('admin-expenses')
  }) : 0;
  
  const operatingProfitActual = operatingProfitItem ? getActualAmount({
    ...operatingProfitItem, 
    id: operatingProfitItem.id || generateTempId('operating-profit')
  }) : 0;
  
  const chartData = [{
    name: 'Budget',
    revenue: turnoverItem?.budget_amount || 0,
    cosCosts: costOfSalesItem?.budget_amount || 0,
    adminCosts: adminExpensesItem?.budget_amount || 0,
    ebitda: operatingProfitItem?.budget_amount || 0
  }, {
    name: 'MTD Actual',
    revenue: turnoverActual,
    cosCosts: costOfSalesActual,
    adminCosts: adminExpensesActual,
    ebitda: operatingProfitActual
  }, {
    name: 'Forecast',
    revenue: turnoverForecast,
    cosCosts: costOfSalesForecast,
    adminCosts: adminExpensesForecast,
    ebitda: operatingProfitForecast
  }];
  
  console.log("Chart data:", chartData);
  
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
      
      <div className="grid grid-cols-1 gap-6">
        <PLReportTable 
          isLoading={isLoading} 
          processedBudgetData={updatedBudgetData} 
          currentMonthName={currentMonthName} 
          currentYear={currentYear} 
        />
      </div>
    </div>;
}
