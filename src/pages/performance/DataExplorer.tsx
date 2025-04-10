
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { formatCurrency, formatPercentage } from '@/lib/date-utils';
import { fetchMasterMonthlyRecords } from '@/services/master-record-service';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, TrendingUp, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, ChevronRight, Bot } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useWagesStore } from '@/components/wages/WagesStore';
import { TavernLogo } from '@/components/TavernLogo';
import { supabase } from '@/lib/supabase';

export default function DataExplorer() {
  const { currentYear } = useStore();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dataType, setDataType] = useState('revenue');
  const [chartType, setChartType] = useState('bar');
  const [aggregation, setAggregation] = useState('monthly');
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [queryResults, setQueryResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [chartConfig, setChartConfig] = useState<Record<string, any>>({});
  
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  
  // Fetch master records for the whole year
  const { data: masterRecords, isLoading: isMasterDataLoading } = useQuery({
    queryKey: ['master-records-year', selectedYear],
    queryFn: async () => {
      const allMonthsData = await Promise.all(
        Array.from({ length: 12 }, (_, i) => i + 1).map(month => 
          fetchMasterMonthlyRecords(selectedYear, month)
        )
      );
      return allMonthsData.flat();
    },
    staleTime: 10 * 60 * 1000
  });
  
  // Fetch wages data for the whole year
  const { getMonthlyWages } = useWagesStore();
  const [wagesData, setWagesData] = useState([]);
  
  useEffect(() => {
    const fetchAllWages = async () => {
      const allMonthsWages = await Promise.all(
        Array.from({ length: 12 }, (_, i) => i + 1).map(month =>
          getMonthlyWages(selectedYear, month)
        )
      );
      setWagesData(allMonthsWages.flat());
    };
    
    fetchAllWages();
  }, [selectedYear, getMonthlyWages]);
  
  const dataTypeOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'covers', label: 'Covers' },
    { value: 'averageSpend', label: 'Average Spend' },
    { value: 'wages', label: 'Wage Costs' }
  ];
  
  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart', icon: <BarChart3 className="h-4 w-4" /> },
    { value: 'line', label: 'Line Chart', icon: <LineChartIcon className="h-4 w-4" /> },
    { value: 'pie', label: 'Pie Chart', icon: <PieChartIcon className="h-4 w-4" /> },
    { value: 'scatter', label: 'Scatter Plot', icon: <TrendingUp className="h-4 w-4" /> }
  ];
  
  const aggregationOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'dayOfWeek', label: 'Day of Week' }
  ];
  
  // Generate chart configuration based on data type
  useEffect(() => {
    const config = {
      food: { 
        label: 'Food', 
        theme: { light: '#10b981', dark: '#047857' }
      },
      beverage: { 
        label: 'Beverage', 
        theme: { light: '#6366f1', dark: '#4338ca' }
      },
      total: { 
        label: 'Total', 
        theme: { light: '#f59e0b', dark: '#d97706' }
      },
      covers: { 
        label: 'Covers', 
        theme: { light: '#ec4899', dark: '#be185d' }
      },
      wages: { 
        label: 'Wages', 
        theme: { light: '#8b5cf6', dark: '#6d28d9' }
      }
    };
    
    setChartConfig(config);
  }, [dataType]);
  
  // Process data based on selected options
  const processedData = React.useMemo(() => {
    if (!masterRecords || !wagesData) return [];
    
    // Combine master records with wages data
    const combinedData = masterRecords.map(record => {
      const date = record.date;
      const matchingWage = wagesData.find(wage => wage.date === date);
      
      return {
        ...record,
        date,
        month: new Date(date).getMonth() + 1,
        week: Math.ceil(new Date(date).getDate() / 7),
        fohWages: matchingWage?.fohWages || 0,
        kitchenWages: matchingWage?.kitchenWages || 0,
        totalWages: (matchingWage?.fohWages || 0) + (matchingWage?.kitchenWages || 0),
        averageSpend: record.totalCovers > 0 ? record.totalRevenue / record.totalCovers : 0
      };
    });
    
    // Aggregate data based on selected aggregation
    if (aggregation === 'monthly') {
      const monthlyData = Array(12).fill(0).map((_, i) => {
        const month = i + 1;
        const monthData = combinedData.filter(d => new Date(d.date).getMonth() + 1 === month);
        
        return {
          month,
          monthName: new Date(selectedYear, i).toLocaleString('default', { month: 'long' }),
          foodRevenue: monthData.reduce((sum, d) => sum + (d.foodRevenue || 0), 0),
          beverageRevenue: monthData.reduce((sum, d) => sum + (d.beverageRevenue || 0), 0),
          totalRevenue: monthData.reduce((sum, d) => sum + (d.totalRevenue || 0), 0),
          lunchCovers: monthData.reduce((sum, d) => sum + (d.lunchCovers || 0), 0),
          dinnerCovers: monthData.reduce((sum, d) => sum + (d.dinnerCovers || 0), 0),
          totalCovers: monthData.reduce((sum, d) => sum + (d.totalCovers || 0), 0),
          fohWages: monthData.reduce((sum, d) => sum + (d.fohWages || 0), 0),
          kitchenWages: monthData.reduce((sum, d) => sum + (d.kitchenWages || 0), 0),
          totalWages: monthData.reduce((sum, d) => sum + (d.totalWages || 0), 0),
          averageSpend: monthData.reduce((sum, d) => sum + (d.totalRevenue || 0), 0) / 
                        Math.max(monthData.reduce((sum, d) => sum + (d.totalCovers || 0), 0), 1)
        };
      });
      
      return monthlyData;
    } else if (aggregation === 'weekly') {
      // Group by weeks (1-5 for each month)
      const weeklyData = [];
      
      for (let month = 1; month <= 12; month++) {
        for (let week = 1; week <= 5; week++) {
          const weekData = combinedData.filter(d => 
            new Date(d.date).getMonth() + 1 === month && 
            Math.ceil(new Date(d.date).getDate() / 7) === week
          );
          
          if (weekData.length > 0) {
            const monthName = new Date(selectedYear, month - 1).toLocaleString('default', { month: 'short' });
            
            weeklyData.push({
              weekLabel: `${monthName} W${week}`,
              month,
              week,
              foodRevenue: weekData.reduce((sum, d) => sum + (d.foodRevenue || 0), 0),
              beverageRevenue: weekData.reduce((sum, d) => sum + (d.beverageRevenue || 0), 0),
              totalRevenue: weekData.reduce((sum, d) => sum + (d.totalRevenue || 0), 0),
              totalCovers: weekData.reduce((sum, d) => sum + (d.totalCovers || 0), 0),
              fohWages: weekData.reduce((sum, d) => sum + (d.fohWages || 0), 0),
              kitchenWages: weekData.reduce((sum, d) => sum + (d.kitchenWages || 0), 0),
              totalWages: weekData.reduce((sum, d) => sum + (d.totalWages || 0), 0),
              averageSpend: weekData.reduce((sum, d) => sum + (d.totalRevenue || 0), 0) / 
                          Math.max(weekData.reduce((sum, d) => sum + (d.totalCovers || 0), 0), 1)
            });
          }
        }
      }
      
      return weeklyData;
    } else if (aggregation === 'dayOfWeek') {
      // Group by day of week
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayOfWeekData = days.map(day => {
        const dayData = combinedData.filter(d => d.dayOfWeek === day);
        
        return {
          dayOfWeek: day,
          foodRevenue: dayData.reduce((sum, d) => sum + (d.foodRevenue || 0), 0) / Math.max(dayData.length, 1),
          beverageRevenue: dayData.reduce((sum, d) => sum + (d.beverageRevenue || 0), 0) / Math.max(dayData.length, 1),
          totalRevenue: dayData.reduce((sum, d) => sum + (d.totalRevenue || 0), 0) / Math.max(dayData.length, 1),
          totalCovers: dayData.reduce((sum, d) => sum + (d.totalCovers || 0), 0) / Math.max(dayData.length, 1),
          fohWages: dayData.reduce((sum, d) => sum + (d.fohWages || 0), 0) / Math.max(dayData.length, 1),
          kitchenWages: dayData.reduce((sum, d) => sum + (d.kitchenWages || 0), 0) / Math.max(dayData.length, 1),
          totalWages: dayData.reduce((sum, d) => sum + (d.totalWages || 0), 0) / Math.max(dayData.length, 1),
          averageSpend: dayData.reduce((sum, d) => sum + (d.totalRevenue || 0), 0) / 
                      Math.max(dayData.reduce((sum, d) => sum + (d.totalCovers || 0), 0), 1)
        };
      });
      
      return dayOfWeekData;
    } else {
      // Daily data, but sort by date
      return combinedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  }, [masterRecords, wagesData, selectedYear, aggregation]);
  
  // Generate chart based on selected options
  const renderChart = () => {
    if (!processedData || processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }
    
    let xAxisKey, dataKey;
    
    // Determine x-axis key based on aggregation
    if (aggregation === 'monthly') {
      xAxisKey = 'monthName';
    } else if (aggregation === 'weekly') {
      xAxisKey = 'weekLabel';
    } else if (aggregation === 'dayOfWeek') {
      xAxisKey = 'dayOfWeek';
    } else {
      xAxisKey = 'date';
    }
    
    // Determine data key based on data type
    if (dataType === 'revenue') {
      if (chartType === 'pie') {
        // For pie chart, we need to prepare special data format
        const total = processedData.reduce((sum, item) => sum + item.totalRevenue, 0);
        const foodTotal = processedData.reduce((sum, item) => sum + item.foodRevenue, 0);
        const bevTotal = processedData.reduce((sum, item) => sum + item.beverageRevenue, 0);
        
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Food', value: foodTotal },
                    { name: 'Beverage', value: bevTotal }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill={chartConfig.food?.theme?.light || "#10b981"} />
                  <Cell fill={chartConfig.beverage?.theme?.light || "#6366f1"} />
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'bar') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tickFormatter={value => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return value;
                  }} 
                />
                <YAxis tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="foodRevenue" stackId="revenue" name="Food" fill={chartConfig.food?.theme?.light || "#10b981"} />
                <Bar dataKey="beverageRevenue" stackId="revenue" name="Beverage" fill={chartConfig.beverage?.theme?.light || "#6366f1"} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'line') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tickFormatter={value => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return value;
                  }} 
                />
                <YAxis tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="foodRevenue" name="Food" stroke={chartConfig.food?.theme?.light || "#10b981"} />
                <Line type="monotone" dataKey="beverageRevenue" name="Beverage" stroke={chartConfig.beverage?.theme?.light || "#6366f1"} />
                <Line type="monotone" dataKey="totalRevenue" name="Total" stroke={chartConfig.total?.theme?.light || "#f59e0b"} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'scatter') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="foodRevenue" 
                  name="Food Revenue" 
                  tickFormatter={(value) => `£${value}`}
                />
                <YAxis 
                  type="number" 
                  dataKey="beverageRevenue" 
                  name="Beverage Revenue" 
                  tickFormatter={(value) => `£${value}`}
                />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Scatter name="Revenues" data={processedData} fill={chartConfig.total?.theme?.light || "#f59e0b"} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      }
    } else if (dataType === 'covers') {
      if (chartType === 'pie') {
        const lunchTotal = processedData.reduce((sum, item) => sum + item.lunchCovers, 0);
        const dinnerTotal = processedData.reduce((sum, item) => sum + item.dinnerCovers, 0);
        
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Lunch', value: lunchTotal },
                    { name: 'Dinner', value: dinnerTotal }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#f59e0b" />
                  <Cell fill="#6366f1" />
                </Pie>
                <Tooltip formatter={(value) => Number(value)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'bar') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tickFormatter={value => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return value;
                  }} 
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lunchCovers" stackId="covers" name="Lunch" fill="#f59e0b" />
                <Bar dataKey="dinnerCovers" stackId="covers" name="Dinner" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'line') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tickFormatter={value => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return value;
                  }} 
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalCovers" name="Total Covers" stroke={chartConfig.covers?.theme?.light || "#ec4899"} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'scatter') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="totalCovers" name="Total Covers" />
                <YAxis type="number" dataKey="totalRevenue" name="Revenue" tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'Revenue') return formatCurrency(Number(value));
                  return value;
                }} />
                <Scatter name="Covers vs Revenue" data={processedData} fill={chartConfig.covers?.theme?.light || "#ec4899"} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      }
    } else if (dataType === 'wages') {
      if (chartType === 'pie') {
        const fohTotal = processedData.reduce((sum, item) => sum + item.fohWages, 0);
        const kitchenTotal = processedData.reduce((sum, item) => sum + item.kitchenWages, 0);
        
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'FOH', value: fohTotal },
                    { name: 'Kitchen', value: kitchenTotal }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'bar') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tickFormatter={value => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return value;
                  }} 
                />
                <YAxis tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="fohWages" stackId="wages" name="FOH" fill="#10b981" />
                <Bar dataKey="kitchenWages" stackId="wages" name="Kitchen" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'line') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tickFormatter={value => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return value;
                  }} 
                />
                <YAxis tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="totalWages" name="Total Wages" stroke={chartConfig.wages?.theme?.light || "#8b5cf6"} />
                <Line type="monotone" dataKey="totalRevenue" name="Revenue" stroke={chartConfig.total?.theme?.light || "#f59e0b"} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'scatter') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="totalRevenue" name="Revenue" tickFormatter={(value) => `£${value}`} />
                <YAxis type="number" dataKey="totalWages" name="Wages" tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Scatter name="Revenue vs Wages" data={processedData} fill={chartConfig.wages?.theme?.light || "#8b5cf6"} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      }
    } else if (dataType === 'averageSpend') {
      if (chartType === 'bar') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tickFormatter={value => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return value;
                  }} 
                />
                <YAxis tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="averageSpend" name="Average Spend" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'line') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tickFormatter={value => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return value;
                  }} 
                />
                <YAxis tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="averageSpend" name="Average Spend" stroke="#ec4899" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else if (chartType === 'scatter') {
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="totalCovers" name="Covers" />
                <YAxis type="number" dataKey="averageSpend" name="Average Spend" tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'Average Spend') return formatCurrency(Number(value));
                  return value;
                }} />
                <Scatter name="Covers vs Average Spend" data={processedData} fill="#ec4899" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      } else {
        // Pie chart doesn't make sense for average spend, default to bar
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tickFormatter={value => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return value;
                  }} 
                />
                <YAxis tickFormatter={(value) => `£${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="averageSpend" name="Average Spend" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      }
    }
    
    // Default chart if nothing matches
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No visualization available for this data type and chart combination</p>
      </div>
    );
  };
  
  // Handle custom query from user
  const handleQuerySubmit = async () => {
    if (!userQuery.trim()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    setQueryResults([]);
    
    try {
      // Let's simulate an AI response by analyzing the query and returning appropriate results
      // In a real application, this would call an AI service to process the natural language query
      
      const lowerQuery = userQuery.toLowerCase();
      let customQueryResult = [];
      
      if (lowerQuery.includes('revenue') && lowerQuery.includes('month')) {
        setCustomQuery('Monthly revenue breakdown');
        customQueryResult = processedData.filter(d => d.monthName).map(d => ({
          period: d.monthName,
          foodRevenue: d.foodRevenue,
          beverageRevenue: d.beverageRevenue,
          totalRevenue: d.totalRevenue
        }));
      } else if (lowerQuery.includes('cover') && lowerQuery.includes('day')) {
        setCustomQuery('Average covers by day of week');
        customQueryResult = processedData.filter(d => d.dayOfWeek).map(d => ({
          day: d.dayOfWeek,
          lunchCovers: d.lunchCovers,
          dinnerCovers: d.dinnerCovers,
          totalCovers: d.totalCovers
        }));
      } else if (lowerQuery.includes('wage') || lowerQuery.includes('labour')) {
        setCustomQuery('Wage cost analysis');
        customQueryResult = processedData.filter(d => d.monthName || d.dayOfWeek).map(d => ({
          period: d.monthName || d.dayOfWeek,
          fohWages: d.fohWages,
          kitchenWages: d.kitchenWages,
          totalWages: d.totalWages,
          totalRevenue: d.totalRevenue,
          wagePercentage: d.totalRevenue > 0 ? (d.totalWages / d.totalRevenue) * 100 : 0
        }));
      } else if (lowerQuery.includes('comparison') || lowerQuery.includes('correlation')) {
        setCustomQuery('Revenue to covers correlation');
        customQueryResult = processedData.map(d => ({
          period: d.monthName || d.dayOfWeek || (d.date ? new Date(d.date).toLocaleDateString() : ''),
          totalRevenue: d.totalRevenue,
          totalCovers: d.totalCovers,
          averageSpend: d.averageSpend
        }));
      } else {
        // Default to showing some data
        setCustomQuery('General data overview');
        customQueryResult = processedData.map(d => ({
          period: d.monthName || d.dayOfWeek || (d.date ? new Date(d.date).toLocaleDateString() : ''),
          foodRevenue: d.foodRevenue,
          beverageRevenue: d.beverageRevenue,
          totalRevenue: d.totalRevenue,
          totalCovers: d.totalCovers
        }));
      }
      
      setQueryResults(customQueryResult);
    } catch (error) {
      console.error('Error processing query:', error);
      setErrorMessage('Error processing your query. Please try again with a different question.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container max-w-7xl py-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/performance/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Data Explorer
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <TavernLogo size="md" className="hidden md:block" />
        </div>
      </div>

      <Card className="border-purple-200 shadow-md">
        <CardHeader className="bg-purple-50/50">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            Ask about your data
          </CardTitle>
          <CardDescription>
            Use natural language to explore your business data
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 pb-4">
            <div className="flex-1">
              <Textarea 
                placeholder="Example: Show me the monthly revenue breakdown for this year" 
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="h-full min-h-[80px]"
              />
            </div>
            <Button 
              onClick={handleQuerySubmit} 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Analyze Data
                </div>
              )}
            </Button>
          </div>
          
          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {customQuery && queryResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-semibold">{customQuery}</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      {Object.keys(queryResults[0] || {}).map((key) => (
                        <th key={key} className="p-2 text-left text-sm font-medium text-gray-600">
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResults.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        {Object.entries(row).map(([key, value]) => (
                          <td key={key} className="p-2 border-t border-slate-200">
                            {typeof value === 'number' 
                              ? (key.includes('percentage') 
                                ? `${Number(value).toFixed(2)}%` 
                                : key.includes('revenue') || key.includes('wages') 
                                  ? formatCurrency(Number(value))
                                  : value)
                              : value as React.ReactNode}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="dataType">Data Type</Label>
          <Select
            value={dataType}
            onValueChange={setDataType}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              {dataTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="chartType">Chart Type</Label>
          <Select
            value={chartType}
            onValueChange={setChartType}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              {chartTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="aggregation">Aggregation</Label>
          <Select
            value={aggregation}
            onValueChange={setAggregation}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select aggregation" />
            </SelectTrigger>
            <SelectContent>
              {aggregationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {dataTypeOptions.find(o => o.value === dataType)?.label} Analysis
            {aggregation !== 'daily' && ` by ${aggregationOptions.find(o => o.value === aggregation)?.label}`}
          </CardTitle>
          <CardDescription>
            {selectedYear} data visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMasterDataLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-muted-foreground">Loading data...</p>
            </div>
          ) : (
            renderChart()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
