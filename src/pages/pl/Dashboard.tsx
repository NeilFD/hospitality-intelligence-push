import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FileUp, Info, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { fetchBudgetItems } from '@/utils/budget-processor';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const chartData = [
  { name: 'Budget', revenue: 73000, costs: 56450, ebitda: 16550 },
  { name: 'MTD Actual', revenue: 71000, costs: 56000, ebitda: 15000 },
  { name: 'Forecast', revenue: 75000, costs: 58500, ebitda: 16500 },
];

export default function PLDashboard() {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentMonthName, setCurrentMonthName] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [currentYear, setCurrentYear] = useState<number>(2025);
  
  const { data: budgetItems, isLoading: isLoadingBudget } = useQuery({
    queryKey: ['budget-items', currentYear, currentMonth],
    queryFn: () => fetchBudgetItems(currentYear, currentMonth),
    enabled: true,
  });
  
  const processedBudgetData = useMemo(() => {
    if (!budgetItems) return [];
    
    const grouped = budgetItems.reduce((acc, item) => {
      const category = acc.find(c => c.category === item.category);
      if (category) {
        category.items.push(item);
      } else {
        acc.push({ 
          category: item.category, 
          items: [item] 
        });
      }
      return acc;
    }, [] as Array<{ category: string; items: typeof budgetItems }>);
    
    return grouped.flatMap(group => [
      ...group.items.map(item => ({
        category: group.category,
        name: item.name,
        budget: item.budget_amount,
        actual: item.actual_amount || 0,
        forecast: item.forecast_amount || item.budget_amount,
      })),
    ]);
  }, [budgetItems]);
  
  const formatCurrency = (value: number): string => {
    return `£${value.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };
  
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };
  
  const handleMonthChange = (value: string) => {
    setCurrentMonth(parseInt(value));
  };

  useEffect(() => {
    const monthName = new Date(currentYear, currentMonth - 1, 1)
      .toLocaleString('default', { month: 'long' });
    setCurrentMonthName(monthName);
  }, [currentMonth, currentYear]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-6 text-center">P&L Tracker Dashboard</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue>{currentMonthName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue>{currentYear}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" asChild>
          <Link to="/pl/budget" className="flex items-center gap-2">
            <FileUp size={16} />
            Manage Budget Data
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md rounded-xl overflow-hidden lg:col-span-3">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle className="flex items-center justify-between">
              <span>Monthly Performance Overview - {currentMonthName} {currentYear}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 border-tavern-blue text-tavern-blue hover:bg-tavern-green hover:text-white"
              >
                <Info size={14} /> Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={{
              revenue: { color: '#8B5CF6' },
              costs: { color: '#F97316' },
              ebitda: { color: '#10B981' },
            }}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="var(--color-revenue)" />
                <Bar dataKey="costs" name="Costs" fill="var(--color-costs)" />
                <Bar dataKey="ebitda" name="EBITDA" fill="var(--color-ebitda)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle>P&L Flash Report - {currentMonthName} {currentYear}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingBudget ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : processedBudgetData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-50">
                      <TableHead className="w-[250px]">Line Item</TableHead>
                      <TableHead className="text-right">Monthly Budget</TableHead>
                      <TableHead className="text-right">MTD Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Forecast</TableHead>
                      <TableHead className="text-right">Forecast Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedBudgetData.map((item, i) => {
                      const variance = item.actual - item.budget;
                      const variancePercent = item.budget !== 0 ? (variance / item.budget) * 100 : 0;
                      const forecastVariance = item.forecast - item.budget;
                      const forecastVariancePercent = item.budget !== 0 ? (forecastVariance / item.budget) * 100 : 0;
                      
                      const isPositiveVariance = 
                        (item.category === 'Food Revenue' || item.category === 'Beverage Revenue' || item.category.includes('Profit')) 
                          ? variance > 0 
                          : variance < 0;
                      
                      const isPositiveForecast = 
                        (item.category === 'Food Revenue' || item.category === 'Beverage Revenue' || item.category.includes('Profit')) 
                          ? forecastVariance > 0 
                          : forecastVariance < 0;
                      
                      return (
                        <TableRow key={i} className={item.name.includes('Total') || item.name.includes('Gross Profit') ? 'font-semibold' : ''}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.budget)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                          <TableCell className={`text-right ${isPositiveVariance ? 'text-green-600' : 'text-red-600'}`}>
                            {variance > 0 ? '+' : ''}{formatCurrency(variance)} ({formatPercentage(variancePercent)})
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.forecast)}</TableCell>
                          <TableCell className={`text-right ${isPositiveForecast ? 'text-green-600' : 'text-red-600'}`}>
                            {forecastVariance > 0 ? '+' : ''}{formatCurrency(forecastVariance)} ({formatPercentage(forecastVariancePercent)})
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <p className="mb-4">No budget data available for {currentMonthName} {currentYear}.</p>
                <Button asChild variant="outline">
                  <Link to="/pl/budget">
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Budget Data
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle>Daily Sales Entry</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-4">Enter daily sales data to update your MTD figures and forecasts.</p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" defaultValue="2025-04-05" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Food Sales</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Beverage Sales</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <Button className="mt-2 bg-purple-600 hover:bg-purple-700">
                Submit Daily Sales
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b">
            <CardTitle>Variable Overhead Costs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-4">Track and update variable overhead costs for the current month.</p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Maintenance & Repairs</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Marketing & Promotions</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Miscellaneous</label>
                <Input type="number" placeholder="0.00" />
              </div>
              
              <Button className="mt-2 bg-purple-600 hover:bg-purple-700">
                Update Overheads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { 
  active?: boolean, 
  payload?: Array<{ value: number, name: string }>, 
  label?: string 
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-md p-2 shadow-lg">
        <p className="font-bold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index}>
            {entry.name}: £{entry.value.toLocaleString('en-GB', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
