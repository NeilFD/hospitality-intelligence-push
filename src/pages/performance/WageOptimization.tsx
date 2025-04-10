import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/date-utils';
import { useWagesStore } from '@/components/wages/WagesStore';
import { fetchMasterMonthlyRecords } from '@/services/master-record-service';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Bar, BarChart, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer } from "@/components/ui/chart";
import { MonthYearSelector } from '@/components/wages/MonthYearSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, TrendingUp, AlertCircle, ArrowRight, Info, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define UK hospitality wage benchmarks
const UK_WAGE_BENCHMARKS = {
  minimumWage: 10.42,
  // UK National Living Wage (2023)
  averageFOH: 11.50,
  // Average Front of House
  averageKitchen: 13.25,
  // Average Kitchen Staff
  averageIndustry: 12.35 // Average overall for hospitality
};

// Define colors for charts
const COLORS = {
  fohWages: '#4f46e5',
  kitchenWages: '#059669',
  totalWages: '#d97706',
  revenue: '#0ea5e9',
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
  dayOfWeek: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280']
};

// Define chart configurations
const CHART_CONFIG = {
  fohWages: {
    label: 'FOH Wages',
    color: COLORS.fohWages
  },
  kitchenWages: {
    label: 'Kitchen Wages',
    color: COLORS.kitchenWages
  },
  totalWages: {
    label: 'Total Wages',
    color: COLORS.totalWages
  },
  totalRevenue: {
    label: 'Total Revenue',
    color: COLORS.revenue
  },
  wagePercentage: {
    label: 'Wage %',
    color: COLORS.totalWages
  },
  averageWagePerDay: {
    label: 'Avg Wage/Day',
    color: COLORS.fohWages
  },
  wagePerCover: {
    label: 'Wage per Cover',
    color: COLORS.totalWages
  }
};
export default function WageOptimization() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isLoading, setIsLoading] = useState(true);
  const [wagesData, setWagesData] = useState<any[]>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    averageWagePerHour: 0,
    fohWagePerHour: 0,
    kitchenWagePerHour: 0,
    wageToRevenueRatio: 0,
    bestPerformingDay: '',
    worstPerformingDay: '',
    totalWages: 0,
    totalRevenue: 0,
    wagesPerCover: 0,
    wagesPercentage: 0
  });
  const [trends, setTrends] = useState<any[]>([]);
  const [dayTypeAnalysis, setDayTypeAnalysis] = useState<any[]>([]);
  const [wagePerCoverData, setWagePerCoverData] = useState<any[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);
  const {
    getMonthlyWages
  } = useWagesStore();

  // Assumed average hours worked per day by staff category
  const ESTIMATED_HOURS = {
    foh: {
      weekday: 24,
      // e.g., 3 staff × 8 hours
      weekend: 40 // e.g., 5 staff × 8 hours
    },
    kitchen: {
      weekday: 32,
      // e.g., 4 staff × 8 hours
      weekend: 40 // e.g., 5 staff × 8 hours
    }
  };
  const isWeekend = (dayOfWeek: string) => {
    return ['Friday', 'Saturday', 'Sunday'].includes(dayOfWeek);
  };
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch wages data
        const wages = await getMonthlyWages(selectedYear, selectedMonth);
        setWagesData(wages);

        // Fetch master data for the same period
        const master = await fetchMasterMonthlyRecords(selectedYear, selectedMonth);
        setMasterData(master);

        // Now process the data to extract insights
        processData(wages, master);
      } catch (error) {
        console.error('Error fetching wage optimization data:', error);
        toast.error('Failed to load wage data for analysis');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, selectedMonth, getMonthlyWages]);
  const processData = (wages: any[], master: any[]) => {
    // Create a map of master data by date for easy lookup
    const masterByDate: Record<string, any> = {};
    master.forEach(record => {
      masterByDate[record.date] = record;
    });

    // Combine wages with master data
    const combinedData = wages.map(wage => {
      const dateStr = `${wage.year}-${String(wage.month).padStart(2, '0')}-${String(wage.day).padStart(2, '0')}`;
      const masterRecord = masterByDate[dateStr] || {};
      return {
        ...wage,
        totalCovers: masterRecord.totalCovers || 0,
        lunchCovers: masterRecord.lunchCovers || 0,
        dinnerCovers: masterRecord.dinnerCovers || 0,
        weatherDescription: masterRecord.weatherDescription || '',
        temperature: masterRecord.temperature || null,
        totalRevenue: (wage.foodRevenue || 0) + (wage.bevRevenue || 0),
        dayCategory: isWeekend(wage.dayOfWeek) ? 'weekend' : 'weekday'
      };
    });

    // Calculate weekly trends
    calculateTrends(combinedData);

    // Analyze by day type (weekday vs weekend)
    analyzeDayTypes(combinedData);

    // Calculate wage per cover metrics
    calculateWagePerCover(combinedData);

    // Generate optimization suggestions
    generateSuggestions(combinedData);

    // Calculate overall metrics
    calculateMetrics(combinedData);
  };
  const calculateMetrics = (data: any[]) => {
    // Filter out days with no wages or revenue data
    const validData = data.filter(day => (day.fohWages > 0 || day.kitchenWages > 0) && day.totalRevenue > 0);
    if (validData.length === 0) {
      setMetrics({
        averageWagePerHour: 0,
        fohWagePerHour: 0,
        kitchenWagePerHour: 0,
        wageToRevenueRatio: 0,
        bestPerformingDay: '',
        worstPerformingDay: '',
        totalWages: 0,
        totalRevenue: 0,
        wagesPerCover: 0,
        wagesPercentage: 0
      });
      return;
    }

    // Calculate totals
    const totalWages = validData.reduce((sum, day) => sum + day.fohWages + day.kitchenWages, 0);
    const totalFOHWages = validData.reduce((sum, day) => sum + day.fohWages, 0);
    const totalKitchenWages = validData.reduce((sum, day) => sum + day.kitchenWages, 0);
    const totalRevenue = validData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalCovers = validData.reduce((sum, day) => sum + day.totalCovers, 0);

    // Estimate total hours worked
    let totalFOHHours = 0;
    let totalKitchenHours = 0;
    validData.forEach(day => {
      if (day.dayCategory === 'weekend') {
        totalFOHHours += ESTIMATED_HOURS.foh.weekend;
        totalKitchenHours += ESTIMATED_HOURS.kitchen.weekend;
      } else {
        totalFOHHours += ESTIMATED_HOURS.foh.weekday;
        totalKitchenHours += ESTIMATED_HOURS.kitchen.weekday;
      }
    });

    // Calculate hourly wages
    const fohWagePerHour = totalFOHHours > 0 ? totalFOHWages / totalFOHHours : 0;
    const kitchenWagePerHour = totalKitchenHours > 0 ? totalKitchenWages / totalKitchenHours : 0;
    const averageWagePerHour = totalFOHHours + totalKitchenHours > 0 ? totalWages / (totalFOHHours + totalKitchenHours) : 0;

    // Find best and worst performing days (by wage to revenue ratio)
    const daysWithRatios = validData.map(day => {
      const totalDayWages = day.fohWages + day.kitchenWages;
      const ratio = day.totalRevenue > 0 ? totalDayWages / day.totalRevenue : 1;
      return {
        ...day,
        ratio
      };
    });
    daysWithRatios.sort((a, b) => a.ratio - b.ratio);
    const bestPerformingDay = daysWithRatios.length > 0 ? `${daysWithRatios[0].dayOfWeek} (${(daysWithRatios[0].ratio * 100).toFixed(1)}%)` : '';
    const worstPerformingDay = daysWithRatios.length > 0 ? `${daysWithRatios[daysWithRatios.length - 1].dayOfWeek} (${(daysWithRatios[daysWithRatios.length - 1].ratio * 100).toFixed(1)}%)` : '';
    setMetrics({
      averageWagePerHour,
      fohWagePerHour,
      kitchenWagePerHour,
      wageToRevenueRatio: totalRevenue > 0 ? totalWages / totalRevenue : 0,
      bestPerformingDay,
      worstPerformingDay,
      totalWages,
      totalRevenue,
      wagesPerCover: totalCovers > 0 ? totalWages / totalCovers : 0,
      wagesPercentage: totalRevenue > 0 ? totalWages / totalRevenue * 100 : 0
    });
  };
  const calculateTrends = (data: any[]) => {
    // Group by week
    const weeklyData: Record<string, any> = {};
    data.forEach(day => {
      // Get the week number
      const date = new Date(day.year, day.month - 1, day.day);
      const weekNumber = Math.ceil((day.day + new Date(day.year, day.month - 1, 1).getDay()) / 7);
      const weekKey = `Week ${weekNumber}`;
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekNumber,
          fohWages: 0,
          kitchenWages: 0,
          totalWages: 0,
          totalRevenue: 0,
          totalCovers: 0,
          days: 0
        };
      }
      weeklyData[weekKey].fohWages += day.fohWages || 0;
      weeklyData[weekKey].kitchenWages += day.kitchenWages || 0;
      weeklyData[weekKey].totalWages += (day.fohWages || 0) + (day.kitchenWages || 0);
      weeklyData[weekKey].totalRevenue += day.totalRevenue || 0;
      weeklyData[weekKey].totalCovers += day.totalCovers || 0;
      weeklyData[weekKey].days++;
    });

    // Convert to array and calculate ratios
    const weeklyTrends = Object.keys(weeklyData).map(key => {
      const week = weeklyData[key];
      return {
        week: key,
        weekNumber: week.weekNumber,
        fohWages: week.fohWages,
        kitchenWages: week.kitchenWages,
        totalWages: week.totalWages,
        totalRevenue: week.totalRevenue,
        wagePercentage: week.totalRevenue > 0 ? week.totalWages / week.totalRevenue * 100 : 0,
        averageWagePerDay: week.days > 0 ? week.totalWages / week.days : 0,
        wagePerCover: week.totalCovers > 0 ? week.totalWages / week.totalCovers : 0
      };
    });

    // Sort by week number
    weeklyTrends.sort((a, b) => a.weekNumber - b.weekNumber);
    setTrends(weeklyTrends);
  };
  const analyzeDayTypes = (data: any[]) => {
    // Analyze by day of week
    const dayAnalysis: Record<string, any> = {};
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    dayOrder.forEach(day => {
      dayAnalysis[day] = {
        dayName: day,
        fohWages: 0,
        kitchenWages: 0,
        totalWages: 0,
        totalRevenue: 0,
        count: 0,
        totalCovers: 0
      };
    });
    data.forEach(day => {
      if (!dayAnalysis[day.dayOfWeek]) return;
      dayAnalysis[day.dayOfWeek].fohWages += day.fohWages || 0;
      dayAnalysis[day.dayOfWeek].kitchenWages += day.kitchenWages || 0;
      dayAnalysis[day.dayOfWeek].totalWages += (day.fohWages || 0) + (day.kitchenWages || 0);
      dayAnalysis[day.dayOfWeek].totalRevenue += day.totalRevenue || 0;
      dayAnalysis[day.dayOfWeek].totalCovers += day.totalCovers || 0;
      dayAnalysis[day.dayOfWeek].count++;
    });

    // Calculate average metrics by day of week
    const dayTypeData = dayOrder.map((day, index) => {
      const analysis = dayAnalysis[day];
      return {
        dayName: day,
        dayIndex: index,
        fohWages: analysis.fohWages,
        kitchenWages: analysis.kitchenWages,
        totalWages: analysis.totalWages,
        totalRevenue: analysis.totalRevenue,
        wagePercentage: analysis.totalRevenue > 0 ? analysis.totalWages / analysis.totalRevenue * 100 : 0,
        averageWages: analysis.count > 0 ? analysis.totalWages / analysis.count : 0,
        averageRevenue: analysis.count > 0 ? analysis.totalRevenue / analysis.count : 0,
        wagePerCover: analysis.totalCovers > 0 ? analysis.totalWages / analysis.totalCovers : 0,
        averageCovers: analysis.count > 0 ? analysis.totalCovers / analysis.count : 0,
        isWeekend: ['Friday', 'Saturday', 'Sunday'].includes(day)
      };
    });
    setDayTypeAnalysis(dayTypeData);
  };
  const calculateWagePerCover = (data: any[]) => {
    // Calculate wage per cover for each day
    const wagePerCoverData = data.filter(day => day.totalCovers > 0).map(day => {
      const totalDayWages = (day.fohWages || 0) + (day.kitchenWages || 0);
      return {
        day: day.day,
        date: `${day.day}/${day.month}`,
        dayOfWeek: day.dayOfWeek.substring(0, 3),
        wagePerCover: day.totalCovers > 0 ? totalDayWages / day.totalCovers : 0,
        totalCovers: day.totalCovers,
        totalWages: totalDayWages,
        isWeekend: isWeekend(day.dayOfWeek)
      };
    }).sort((a, b) => a.day - b.day);
    setWagePerCoverData(wagePerCoverData);
  };
  const generateSuggestions = (data: any[]) => {
    const suggestions: string[] = [];

    // Check if we have enough data
    if (data.filter(day => day.totalRevenue > 0).length < 3) {
      suggestions.push("Insufficient data for detailed analysis. Please ensure you have entered wages and revenue data for at least one week.");
      setOptimizationSuggestions(suggestions);
      return;
    }

    // Analyze day of week patterns
    const dayAnalysis = dayTypeAnalysis;
    if (dayAnalysis.length > 0) {
      // Find days with highest wage percentage
      dayAnalysis.sort((a, b) => b.wagePercentage - a.wagePercentage);
      if (dayAnalysis[0].wagePercentage > 35) {
        suggestions.push(`${dayAnalysis[0].dayName}s have the highest wage percentage at ${dayAnalysis[0].wagePercentage.toFixed(1)}%. Consider optimizing staffing levels or increasing revenue on these days.`);
      }

      // Find days with lowest covers but high wages
      dayAnalysis.sort((a, b) => a.averageCovers !== 0 && b.averageCovers !== 0 ? b.totalWages / b.averageCovers - a.totalWages / a.averageCovers : 0);
      if (dayAnalysis[0].averageCovers > 0 && dayAnalysis[0].totalWages > 0) {
        suggestions.push(`${dayAnalysis[0].dayName}s show a high wage to cover ratio. Consider adjusting staffing levels based on expected cover counts.`);
      }
    }

    // Compare to industry benchmarks
    if (metrics.fohWagePerHour > 0 && metrics.kitchenWagePerHour > 0) {
      if (metrics.fohWagePerHour > UK_WAGE_BENCHMARKS.averageFOH * 1.15) {
        suggestions.push(`FOH hourly wage (£${metrics.fohWagePerHour.toFixed(2)}) is significantly higher than industry average (£${UK_WAGE_BENCHMARKS.averageFOH.toFixed(2)}). Review staff scheduling and overtime.`);
      }
      if (metrics.kitchenWagePerHour > UK_WAGE_BENCHMARKS.averageKitchen * 1.15) {
        suggestions.push(`Kitchen hourly wage (£${metrics.kitchenWagePerHour.toFixed(2)}) is above industry average (£${UK_WAGE_BENCHMARKS.averageKitchen.toFixed(2)}). Consider kitchen workflow optimization.`);
      }
    }

    // Check overall wage percentage
    if (metrics.wagesPercentage > 35) {
      suggestions.push(`Overall wage percentage of ${metrics.wagesPercentage.toFixed(1)}% is higher than the recommended 30-35% target. Focus on increasing revenue or optimizing labor costs.`);
    } else if (metrics.wagesPercentage < 25) {
      suggestions.push(`Overall wage percentage of ${metrics.wagesPercentage.toFixed(1)}% is lower than typical industry rates. Ensure this isn't affecting service quality and customer satisfaction.`);
    }

    // Check for imbalance between FOH and kitchen wages
    const totalFOH = data.reduce((sum, day) => sum + (day.fohWages || 0), 0);
    const totalKitchen = data.reduce((sum, day) => sum + (day.kitchenWages || 0), 0);
    const totalWages = totalFOH + totalKitchen;
    if (totalWages > 0) {
      const fohPercentage = totalFOH / totalWages * 100;
      const kitchenPercentage = totalKitchen / totalWages * 100;
      if (fohPercentage > 65) {
        suggestions.push(`FOH wages represent ${fohPercentage.toFixed(1)}% of total wages, which is higher than typical. Evaluate FOH staffing efficiency.`);
      } else if (kitchenPercentage > 65) {
        suggestions.push(`Kitchen wages represent ${kitchenPercentage.toFixed(1)}% of total wages, which is higher than typical. Review kitchen staffing and workflow.`);
      }
    }

    // If we don't have many suggestions, add a generic one
    if (suggestions.length < 2) {
      suggestions.push("Consider implementing a labor scheduling system that aligns staffing with projected cover counts to optimize wage costs.");
    }
    setOptimizationSuggestions(suggestions);
  };
  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      return <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => <p key={`item-${index}`} style={{
          color: entry.color
        }}>
              {entry.name}: {entry.name.includes('percentage') ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)}
            </p>)}
        </div>;
    }
    return null;
  };
  return <div className="container py-6 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-tavern-blue/60 to-tavern-blue-dark/80 rounded-lg shadow-glass">
            <Sparkles className="h-5 w-5 text-white/90" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-tavern-blue via-tavern-blue-dark to-tavern-blue bg-clip-text text-transparent">
            Wage Optimization Analysis
          </h1>
        </div>
        <MonthYearSelector year={selectedYear} month={selectedMonth} onYearChange={setSelectedYear} onMonthChange={setSelectedMonth} />
      </div>
      
      {isLoading ? <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center text-muted-foreground">Loading wages analysis data...</div>
          </CardContent>
        </Card> : <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-1 h-full ${metrics.wagesPercentage > 35 ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Wage to Revenue</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Industry standard for hospitality wage cost is typically between 30-35% of revenue
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  {metrics.wagesPercentage.toFixed(1)}%
                </div>
                <div className="flex items-center text-sm">
                  {metrics.wagesPercentage > 35 ? <>
                      <TrendingUp className="text-red-500 h-4 w-4 mr-1" />
                      <span className="text-red-500">
                        {(metrics.wagesPercentage - 35).toFixed(1)}% above recommended
                      </span>
                    </> : <>
                      <TrendingDown className="text-green-500 h-4 w-4 mr-1" />
                      <span className="text-green-500">
                        Within recommended range
                      </span>
                    </>}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Total wages: {formatCurrency(metrics.totalWages)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total revenue: {formatCurrency(metrics.totalRevenue)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Hourly Wage Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">FOH Hourly Rate:</span>
                  <span className={`font-medium ${metrics.fohWagePerHour > UK_WAGE_BENCHMARKS.averageFOH * 1.1 ? 'text-red-500' : metrics.fohWagePerHour < UK_WAGE_BENCHMARKS.averageFOH * 0.9 ? 'text-amber-500' : 'text-green-500'}`}>
                    {formatCurrency(metrics.fohWagePerHour)}/hr
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Kitchen Hourly Rate:</span>
                  <span className={`font-medium ${metrics.kitchenWagePerHour > UK_WAGE_BENCHMARKS.averageKitchen * 1.1 ? 'text-red-500' : metrics.kitchenWagePerHour < UK_WAGE_BENCHMARKS.averageKitchen * 0.9 ? 'text-amber-500' : 'text-green-500'}`}>
                    {formatCurrency(metrics.kitchenWagePerHour)}/hr
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">UK Minimum Wage:</span>
                  <span className="font-medium text-muted-foreground">
                    {formatCurrency(UK_WAGE_BENCHMARKS.minimumWage)}/hr
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Industry Average:</span>
                  <span className="font-medium text-muted-foreground">
                    {formatCurrency(UK_WAGE_BENCHMARKS.averageIndustry)}/hr
                  </span>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Based on estimated hours and actual wage costs
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Customer Service Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  {formatCurrency(metrics.wagesPerCover)}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Average wage cost per cover
                </div>
                
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Best Performing Day:</span>
                  <span className="font-medium text-green-500">{metrics.bestPerformingDay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Worst Performing Day:</span>
                  <span className="font-medium text-red-500">{metrics.worstPerformingDay}</span>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Based on wage to revenue ratio
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="analytics" className="w-full mb-6">
            <TabsList className="grid grid-cols-4 mb-4 bg-gray-100">
              <TabsTrigger value="analytics" className="data-[state=active]:bg-tavern-green data-[state=active]:text-white">
                Performance Analytics
              </TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-tavern-green data-[state=active]:text-white">
                Trends & Patterns
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="data-[state=active]:bg-tavern-green data-[state=active]:text-white">
                Staff Cost Breakdown
              </TabsTrigger>
              <TabsTrigger value="optimization" className="data-[state=active]:bg-tavern-green data-[state=active]:text-white">
                Optimization Tips
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Wage to Cover Ratio By Day</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ChartContainer config={CHART_CONFIG}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wagePerCoverData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="wagePerCover" name="Wage per Cover" fill={COLORS.totalWages} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Wage to Revenue Ratio By Day</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ChartContainer config={CHART_CONFIG}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={wagesData.map(day => ({
                      date: day.day,
                      dayOfWeek: day.dayOfWeek.substring(0, 3),
                      totalWages: (day.fohWages || 0) + (day.kitchenWages || 0),
                      totalRevenue: (day.foodRevenue || 0) + (day.bevRevenue || 0),
                      wagePercentage: (day.foodRevenue || 0) + (day.bevRevenue || 0) > 0 ? ((day.fohWages || 0) + (day.kitchenWages || 0)) / ((day.foodRevenue || 0) + (day.bevRevenue || 0)) * 100 : 0
                    }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line type="monotone" dataKey="wagePercentage" name="Wage %" stroke={COLORS.fohWages} activeDot={{
                        r: 8
                      }} strokeWidth={2} />
                          <Line type="monotone" dataKey="totalWages" name="Total Wages" stroke={COLORS.kitchenWages} />
                          <Line type="monotone" dataKey="totalRevenue" name="Revenue" stroke={COLORS.revenue} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ChartContainer config={CHART_CONFIG}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line type="monotone" dataKey="wagePercentage" name="Wage %" stroke="#d97706" activeDot={{
                        r: 8
                      }} strokeWidth={2} />
                          <Line type="monotone" dataKey="averageWagePerDay" name="Avg Wage/Day" stroke="#4f46e5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Day of Week</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ChartContainer config={CHART_CONFIG}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dayTypeAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dayName" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="wagePercentage" name="Wage %" fill="#d97706" radius={[4, 4, 0, 0]}>
                            {dayTypeAnalysis.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS.dayOfWeek[index % COLORS.dayOfWeek.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Day of Week Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead className="text-right">Avg. Wages</TableHead>
                          <TableHead className="text-right">Avg. Revenue</TableHead>
                          <TableHead className="text-right">Wage %</TableHead>
                          <TableHead className="text-right">Wage/Cover</TableHead>
                          <TableHead className="text-right">Avg. Covers</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayTypeAnalysis.map(day => <TableRow key={day.dayName} className={day.isWeekend ? 'bg-muted/30' : ''}>
                            <TableCell className="font-medium">{day.dayName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(day.averageWages)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(day.averageRevenue)}</TableCell>
                            <TableCell className={`text-right ${day.wagePercentage > 35 ? 'text-red-500' : 'text-green-500'}`}>
                              {day.wagePercentage.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(day.wagePerCover)}</TableCell>
                            <TableCell className="text-right">{day.averageCovers.toFixed(0)}</TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>FOH vs Kitchen Wage Split</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ChartContainer config={CHART_CONFIG}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{
                        name: 'FOH',
                        value: wagesData.reduce((sum, day) => sum + (day.fohWages || 0), 0)
                      }, {
                        name: 'Kitchen',
                        value: wagesData.reduce((sum, day) => sum + (day.kitchenWages || 0), 0)
                      }]} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({
                        name,
                        percent
                      }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                            <Cell fill={COLORS.fohWages} />
                            <Cell fill={COLORS.kitchenWages} />
                          </Pie>
                          <Tooltip formatter={value => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                        <span className="text-sm">FOH Wages</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                        <span className="text-sm">Kitchen Wages</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Costs by Day of Week</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ChartContainer config={CHART_CONFIG}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dayTypeAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dayName" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="fohWages" name="FOH" stackId="a" fill={COLORS.fohWages} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="kitchenWages" name="Kitchen" stackId="a" fill={COLORS.kitchenWages} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Weekly Labor Cost Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ChartContainer config={CHART_CONFIG}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="fohWages" name="FOH Wages" fill={COLORS.fohWages} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="kitchenWages" name="Kitchen Wages" fill={COLORS.kitchenWages} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="totalRevenue" name="Revenue" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="optimization" className="space-y-6">
              {optimizationSuggestions.length > 0 && <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-slate-900">Optimization Opportunities</AlertTitle>
                  <AlertDescription className="bg-gray-400">
                    Based on your data, we've identified opportunities to optimize your wage costs.
                  </AlertDescription>
                </Alert>}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {optimizationSuggestions.map((suggestion, index) => <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex">
                        <ArrowRight className="h-5 w-5 mr-2 text-tavern-blue" />
                        <span>Suggestion {index + 1}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{suggestion}</p>
                    </CardContent>
                  </Card>)}
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Hospitality Industry Benchmarks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 text-sm font-medium">Wage % of Revenue</div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className={`h-2 rounded-full ${metrics.wagesPercentage <= 30 ? 'bg-green-500' : metrics.wagesPercentage <= 35 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{
                        width: `${Math.min(Math.max(metrics.wagesPercentage, 20), 50)}%`
                      }}></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>20% (Excellent)</span>
                          <span>30% (Good)</span>
                          <span>35% (Target)</span>
                          <span>40%+ (Poor)</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="mb-1 text-sm font-medium">Hourly Wage Rates</div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Role</TableHead>
                              <TableHead>UK Minimum</TableHead>
                              <TableHead>UK Average</TableHead>
                              <TableHead>Your Rate</TableHead>
                              <TableHead>Difference</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">FOH Staff</TableCell>
                              <TableCell>{formatCurrency(UK_WAGE_BENCHMARKS.minimumWage)}/hr</TableCell>
                              <TableCell>{formatCurrency(UK_WAGE_BENCHMARKS.averageFOH)}/hr</TableCell>
                              <TableCell>{formatCurrency(metrics.fohWagePerHour)}/hr</TableCell>
                              <TableCell className={metrics.fohWagePerHour > UK_WAGE_BENCHMARKS.averageFOH * 1.1 ? 'text-red-500' : metrics.fohWagePerHour < UK_WAGE_BENCHMARKS.averageFOH * 0.9 ? 'text-amber-500' : 'text-green-500'}>
                                {metrics.fohWagePerHour > UK_WAGE_BENCHMARKS.averageFOH ? `+${formatCurrency(metrics.fohWagePerHour - UK_WAGE_BENCHMARKS.averageFOH)}/hr` : `-${formatCurrency(UK_WAGE_BENCHMARKS.averageFOH - metrics.fohWagePerHour)}/hr`}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Kitchen Staff</TableCell>
                              <TableCell>{formatCurrency(UK_WAGE_BENCHMARKS.minimumWage)}/hr</TableCell>
                              <TableCell>{formatCurrency(UK_WAGE_BENCHMARKS.averageKitchen)}/hr</TableCell>
                              <TableCell>{formatCurrency(metrics.kitchenWagePerHour)}/hr</TableCell>
                              <TableCell className={metrics.kitchenWagePerHour > UK_WAGE_BENCHMARKS.averageKitchen * 1.1 ? 'text-red-500' : metrics.kitchenWagePerHour < UK_WAGE_BENCHMARKS.averageKitchen * 0.9 ? 'text-amber-500' : 'text-green-500'}>
                                {metrics.kitchenWagePerHour > UK_WAGE_BENCHMARKS.averageKitchen ? `+${formatCurrency(metrics.kitchenWagePerHour - UK_WAGE_BENCHMARKS.averageKitchen)}/hr` : `-${formatCurrency(UK_WAGE_BENCHMARKS.averageKitchen - metrics.kitchenWagePerHour)}/hr`}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>}
    </div>;
}