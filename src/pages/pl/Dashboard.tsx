
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MonthYearSelector } from './components/MonthYearSelector';
import { PerformanceChart } from './components/PerformanceChart';
import { PLReportTable } from './components/PLReportTable';
import { DailySalesEntry } from './components/DailySalesEntry';
import { VariableCosts } from './components/VariableCosts';
import { useBudgetData } from './hooks/useBudgetData';
import { PLTracker } from './components/PLTracker';

// Sample chart data
const chartData = [{
  name: 'Budget',
  revenue: 73000,
  costs: 56450,
  ebitda: 16550
}, {
  name: 'MTD Actual',
  revenue: 71000,
  costs: 56000,
  ebitda: 15000
}, {
  name: 'Forecast',
  revenue: 75000,
  costs: 58500,
  ebitda: 16500
}];

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
    setCurrentMonthName(new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' }));
  };

  const handleYearChange = (value: string) => {
    setCurrentYear(parseInt(value));
  };

  const {
    isLoading,
    processedBudgetData
  } = useBudgetData(currentYear, currentMonth);
  
  console.log("Dashboard - processed budget data:", processedBudgetData.map(item => item.name));

  return (
    <div className="container py-8 text-[#48495e]">
      <h1 className="text-3xl font-bold text-purple-600 mb-6 text-center">P&L Tracker Dashboard</h1>
      
      <div className="flex justify-between items-center mb-6">
        <MonthYearSelector 
          currentMonth={currentMonth}
          currentMonthName={currentMonthName}
          currentYear={currentYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
        />
        
        <Button variant="outline" asChild>
          <Link to="/pl/budget" className="flex items-center gap-2">
            <FileUp size={16} />
            Manage Budget Data
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <PerformanceChart 
          chartData={chartData} 
          currentMonthName={currentMonthName} 
          currentYear={currentYear} 
        />
      </div>
      
      {showTracker ? (
        <div className="grid grid-cols-1 gap-6 mb-6">
          <PLTracker 
            isLoading={isLoading}
            processedBudgetData={processedBudgetData}
            currentMonthName={currentMonthName}
            currentYear={currentYear}
            onClose={() => setShowTracker(false)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 mb-6">
          <PLReportTable 
            isLoading={isLoading} 
            processedBudgetData={processedBudgetData}
            currentMonthName={currentMonthName}
            currentYear={currentYear}
            onOpenTracker={() => setShowTracker(true)}
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DailySalesEntry />
        <VariableCosts />
      </div>
    </div>
  );
}
