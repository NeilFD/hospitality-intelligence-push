
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/lib/store';
import { formatCurrency, formatPercentage, calculateGP } from '@/lib/date-utils';
import { fetchTrackerDataByMonth, fetchTrackerPurchases } from '@/services/kitchen-service';
import { fetchMonthlyRevenueData, fetchMasterMonthlyRecords } from '@/services/master-record-service';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, ChevronRight, Info, RefreshCcw } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useWagesStore } from '@/components/wages/WagesStore';
import { TavernLogo } from '@/components/TavernLogo';

export default function FoodBeverageAnalysis() {
  const { currentYear, currentMonth } = useStore();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedTab, setSelectedTab] = useState('food');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  
  // Fetch food tracker data
  const { data: foodTrackerData, isLoading: isFoodDataLoading } = useQuery({
    queryKey: ['tracker-data', selectedYear, selectedMonth, 'food'],
    queryFn: () => fetchTrackerDataByMonth(selectedYear, selectedMonth, 'food'),
    staleTime: 10 * 60 * 1000 
  });
  
  // Fetch beverage tracker data
  const { data: bevTrackerData, isLoading: isBevDataLoading } = useQuery({
    queryKey: ['tracker-data', selectedYear, selectedMonth, 'beverage'],
    queryFn: () => fetchTrackerDataByMonth(selectedYear, selectedMonth, 'beverage'),
    staleTime: 10 * 60 * 1000
  });
  
  // Fetch master records
  const { data: masterRecords, isLoading: isMasterDataLoading } = useQuery({
    queryKey: ['master-records', selectedYear, selectedMonth],
    queryFn: () => fetchMasterMonthlyRecords(selectedYear, selectedMonth),
    staleTime: 10 * 60 * 1000
  });
  
  // Fetch monthly revenue summary
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-data', selectedYear, selectedMonth],
    queryFn: () => fetchMonthlyRevenueData(selectedYear, selectedMonth),
    staleTime: 10 * 60 * 1000
  });
  
  // Fetch wage data
  const { getMonthlyWages, isLoading: isWagesLoading } = useWagesStore();
  const [wagesData, setWagesData] = useState([]);
  
  useEffect(() => {
    const fetchWages = async () => {
      const data = await getMonthlyWages(selectedYear, selectedMonth);
      setWagesData(data);
    };
    
    fetchWages();
  }, [selectedYear, selectedMonth, getMonthlyWages]);

  // Calculate summary metrics
  const [dailyData, setDailyData] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    food: { revenue: 0, cost: 0, gp: 0, avgSpend: 0 },
    beverage: { revenue: 0, cost: 0, gp: 0, avgSpend: 0 },
    combined: { revenue: 0, cost: 0, gp: 0, ratio: 0 }
  });
  
  useEffect(() => {
    if (masterRecords && foodTrackerData && bevTrackerData) {
      // Create a lookup map for food and beverage tracker data
      const foodDataMap = {};
      const bevDataMap = {};
      
      foodTrackerData.forEach(item => {
        foodDataMap[item.date] = item;
      });
      
      bevTrackerData.forEach(item => {
        bevDataMap[item.date] = item;
      });
      
      // Process daily data
      const processed = masterRecords.map(record => {
        const date = record.date;
        const foodData = foodDataMap[date];
        const bevData = bevDataMap[date];
        
        const foodRevenue = record.foodRevenue || 0;
        const bevRevenue = record.beverageRevenue || 0;
        const foodCost = foodData ? parseFloat(foodData.staff_food_allowance || 0) : 0;
        const bevCost = bevData ? parseFloat(bevData.staff_food_allowance || 0) : 0;
        
        return {
          date,
          dayOfWeek: record.dayOfWeek,
          foodRevenue,
          bevRevenue,
          totalRevenue: foodRevenue + bevRevenue,
          foodCost,
          bevCost,
          totalCost: foodCost + bevCost,
          foodGP: calculateGP(foodRevenue, foodCost),
          bevGP: calculateGP(bevRevenue, bevCost),
          totalGP: calculateGP(foodRevenue + bevRevenue, foodCost + bevCost),
          lunchCovers: record.lunchCovers || 0,
          dinnerCovers: record.dinnerCovers || 0,
          totalCovers: record.totalCovers || 0,
          foodRevenuePerCover: record.totalCovers ? foodRevenue / record.totalCovers : 0,
          bevRevenuePerCover: record.totalCovers ? bevRevenue / record.totalCovers : 0,
          totalRevenuePerCover: record.totalCovers ? (foodRevenue + bevRevenue) / record.totalCovers : 0,
          fbRatio: bevRevenue > 0 ? foodRevenue / bevRevenue : 0,
          weather: record.weatherDescription || 'Unknown'
        };
      });
      
      setDailyData(processed);
      
      // Calculate summary metrics
      const totals = processed.reduce((acc, day) => {
        acc.foodRevenue += day.foodRevenue;
        acc.bevRevenue += day.bevRevenue;
        acc.foodCost += day.foodCost;
        acc.bevCost += day.bevCost;
        acc.covers += day.totalCovers;
        return acc;
      }, { foodRevenue: 0, bevRevenue: 0, foodCost: 0, bevCost: 0, covers: 0 });
      
      setSummaryMetrics({
        food: {
          revenue: totals.foodRevenue,
          cost: totals.foodCost,
          gp: calculateGP(totals.foodRevenue, totals.foodCost),
          avgSpend: totals.covers > 0 ? totals.foodRevenue / totals.covers : 0
        },
        beverage: {
          revenue: totals.bevRevenue,
          cost: totals.bevCost,
          gp: calculateGP(totals.bevRevenue, totals.bevCost),
          avgSpend: totals.covers > 0 ? totals.bevRevenue / totals.covers : 0
        },
        combined: {
          revenue: totals.foodRevenue + totals.bevRevenue,
          cost: totals.foodCost + totals.bevCost,
          gp: calculateGP(totals.foodRevenue + totals.bevRevenue, totals.foodCost + totals.bevCost),
          ratio: totals.bevRevenue > 0 ? totals.foodRevenue / totals.bevRevenue : 0
        }
      });
    }
  }, [masterRecords, foodTrackerData, bevTrackerData]);
  
  // Prepare data for charts
  const dailyRevenueChartData = dailyData.map(day => ({
    date: new Date(day.date).getDate(),
    foodRevenue: day.foodRevenue,
    bevRevenue: day.bevRevenue
  }));
  
  const weekdayAveragesData = React.useMemo(() => {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return weekdays.map(day => {
      const daysData = dailyData.filter(d => d.dayOfWeek === day);
      const count = daysData.length;
      if (count === 0) return { dayOfWeek: day, foodRevenue: 0, bevRevenue: 0, totalRevenue: 0, gp: 0 };
      
      const foodRevenue = daysData.reduce((sum, d) => sum + d.foodRevenue, 0) / count;
      const bevRevenue = daysData.reduce((sum, d) => sum + d.bevRevenue, 0) / count;
      const totalRevenue = foodRevenue + bevRevenue;
      const foodCost = daysData.reduce((sum, d) => sum + d.foodCost, 0) / count;
      const bevCost = daysData.reduce((sum, d) => sum + d.bevCost, 0) / count;
      const gp = calculateGP(totalRevenue, foodCost + bevCost);
      
      return {
        dayOfWeek: day,
        foodRevenue,
        bevRevenue,
        totalRevenue,
        gp
      };
    });
  }, [dailyData]);
  
  const chartConfig = {
    food: { 
      label: 'Food', 
      theme: { light: '#10b981', dark: '#047857' }
    },
    beverage: { 
      label: 'Beverage', 
      theme: { light: '#6366f1', dark: '#4338ca' }
    },
    combined: { 
      label: 'Combined', 
      theme: { light: '#f59e0b', dark: '#d97706' }
    }
  };
  
  // Calculate trends and insights
  const getFoodBeverageInsights = () => {
    const insights = [];
    
    // Food to beverage ratio insight
    if (summaryMetrics.combined.ratio > 0) {
      const fbRatio = summaryMetrics.combined.ratio;
      insights.push({
        title: 'Food to Beverage Ratio',
        description: fbRatio > 2.5 
          ? 'Your food sales significantly outpace beverage sales. Consider promoting drink pairings or special beverage offers.'
          : fbRatio < 1.5
            ? 'You have strong beverage sales relative to food. Consider promoting higher-margin food items to increase overall GP.'
            : 'Your food to beverage ratio is well-balanced.',
        icon: <Info />,
        value: `${fbRatio.toFixed(2)}:1`
      });
    }
    
    // Day of week insight
    if (weekdayAveragesData.length) {
      const bestDay = [...weekdayAveragesData].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
      const worstDay = [...weekdayAveragesData].sort((a, b) => a.totalRevenue - b.totalRevenue)[0];
      
      insights.push({
        title: 'Day of Week Analysis',
        description: `${bestDay.dayOfWeek} shows your highest average revenue at ${formatCurrency(bestDay.totalRevenue)}. Consider applying these successful strategies to ${worstDay.dayOfWeek}, your lowest day.`,
        icon: <TrendingUp />,
        value: `${bestDay.dayOfWeek}`
      });
    }
    
    // GP insight
    if (selectedTab === 'food') {
      insights.push({
        title: 'Food GP Performance',
        description: summaryMetrics.food.gp < 0.65 
          ? 'Your food GP is below target. Review portion sizes, ingredient costs, and consider menu engineering to improve profitability.'
          : 'Your food GP is performing well. Continue monitoring for consistency.',
        icon: summaryMetrics.food.gp < 0.65 ? <AlertCircle /> : <TrendingUp />,
        value: formatPercentage(summaryMetrics.food.gp)
      });
    } else if (selectedTab === 'beverage') {
      insights.push({
        title: 'Beverage GP Performance',
        description: summaryMetrics.beverage.gp < 0.70 
          ? 'Your beverage GP is below target. Review pour costs, pricing strategy, and staff training.'
          : 'Your beverage GP is performing well. Continue monitoring for consistency.',
        icon: summaryMetrics.beverage.gp < 0.70 ? <AlertCircle /> : <TrendingUp />,
        value: formatPercentage(summaryMetrics.beverage.gp)
      });
    }
    
    return insights;
  };
  
  const insights = getFoodBeverageInsights();
  
  const loading = isFoodDataLoading || isBevDataLoading || isMasterDataLoading || isWagesLoading;
  
  const handleRefresh = () => {
    // This will trigger React Query's refetch for all queries
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-green-700 to-emerald-800 bg-clip-text text-transparent">
            Food & Beverage Analysis
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center gap-1">
            <RefreshCcw className="h-4 w-4" />
            Refresh Data
          </Button>
          <TavernLogo size="md" className="hidden md:block" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
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
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="food">Food Analysis</TabsTrigger>
          <TabsTrigger value="beverage">Beverage Analysis</TabsTrigger>
          <TabsTrigger value="combined">Combined Analysis</TabsTrigger>
        </TabsList>

        {loading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tavern-blue"></div>
              <p className="mt-4 text-muted-foreground">Loading analysis data...</p>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <CardHeader className="bg-slate-50 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {insight.icon}
                      {insight.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="mb-2 text-2xl font-semibold text-center">{insight.value}</div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <TabsContent value="food" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Food Revenue</CardTitle>
                    <CardDescription>Monthly total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(summaryMetrics.food.revenue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Food GP</CardTitle>
                    <CardDescription>Gross profit percentage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatPercentage(summaryMetrics.food.gp)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Avg Spend per Cover</CardTitle>
                    <CardDescription>Food only</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(summaryMetrics.food.avgSpend)}</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Daily Food Revenue</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(date) => {
                          if (typeof date === 'string') {
                            return new Date(date).getDate();
                          }
                          return date;
                        }} />
                        <YAxis tickFormatter={(value) => `£${value}`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded shadow-md">
                                  <p className="font-semibold">{new Date(data.date).toLocaleDateString('en-GB')}</p>
                                  <p>Revenue: {formatCurrency(data.foodRevenue)}</p>
                                  <p>GP: {formatPercentage(data.foodGP)}</p>
                                  <p>Covers: {data.totalCovers}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="foodRevenue" fill="#10b981" name="Food Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Food Performance by Day of Week</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekdayAveragesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dayOfWeek" />
                        <YAxis tickFormatter={(value) => `£${value}`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded shadow-md">
                                  <p className="font-semibold">{data.dayOfWeek}</p>
                                  <p>Avg Revenue: {formatCurrency(data.foodRevenue)}</p>
                                  <p>Avg GP: {formatPercentage(data.gp)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="foodRevenue" fill="#10b981" name="Food Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="beverage" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Beverage Revenue</CardTitle>
                    <CardDescription>Monthly total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(summaryMetrics.beverage.revenue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Beverage GP</CardTitle>
                    <CardDescription>Gross profit percentage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatPercentage(summaryMetrics.beverage.gp)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Avg Spend per Cover</CardTitle>
                    <CardDescription>Beverage only</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(summaryMetrics.beverage.avgSpend)}</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Daily Beverage Revenue</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(date) => {
                          if (typeof date === 'string') {
                            return new Date(date).getDate();
                          }
                          return date;
                        }} />
                        <YAxis tickFormatter={(value) => `£${value}`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded shadow-md">
                                  <p className="font-semibold">{new Date(data.date).toLocaleDateString('en-GB')}</p>
                                  <p>Revenue: {formatCurrency(data.bevRevenue)}</p>
                                  <p>GP: {formatPercentage(data.bevGP)}</p>
                                  <p>Covers: {data.totalCovers}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="bevRevenue" fill="#6366f1" name="Beverage Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Beverage Performance by Day of Week</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekdayAveragesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dayOfWeek" />
                        <YAxis tickFormatter={(value) => `£${value}`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded shadow-md">
                                  <p className="font-semibold">{data.dayOfWeek}</p>
                                  <p>Avg Revenue: {formatCurrency(data.bevRevenue)}</p>
                                  <p>Avg GP: {formatPercentage(data.gp)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="bevRevenue" fill="#6366f1" name="Beverage Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="combined" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Revenue</CardTitle>
                    <CardDescription>Food and Beverage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(summaryMetrics.combined.revenue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Combined GP</CardTitle>
                    <CardDescription>Overall gross profit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatPercentage(summaryMetrics.combined.gp)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Food:Beverage Ratio</CardTitle>
                    <CardDescription>Revenue proportion</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summaryMetrics.combined.ratio.toFixed(2)}:1</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(date) => {
                          if (typeof date === 'string') {
                            return new Date(date).getDate();
                          }
                          return date;
                        }} />
                        <YAxis tickFormatter={(value) => `£${value}`} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded shadow-md">
                                  <p className="font-semibold">{new Date(data.date).toLocaleDateString('en-GB')}</p>
                                  <p>Food: {formatCurrency(data.foodRevenue)}</p>
                                  <p>Beverage: {formatCurrency(data.bevRevenue)}</p>
                                  <p>Total: {formatCurrency(data.totalRevenue)}</p>
                                  <p>Covers: {data.totalCovers}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="foodRevenue" stackId="revenue" fill="#10b981" name="Food" />
                        <Bar dataKey="bevRevenue" stackId="revenue" fill="#6366f1" name="Beverage" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Food', value: summaryMetrics.food.revenue },
                              { name: 'Beverage', value: summaryMetrics.beverage.revenue }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#6366f1" />
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weekdayAveragesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="dayOfWeek" />
                          <YAxis tickFormatter={(value) => `£${value}`} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Line type="monotone" dataKey="totalRevenue" stroke="#f59e0b" name="Total" />
                          <Line type="monotone" dataKey="foodRevenue" stroke="#10b981" name="Food" />
                          <Line type="monotone" dataKey="bevRevenue" stroke="#6366f1" name="Beverage" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
