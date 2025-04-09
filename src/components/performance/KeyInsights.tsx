
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { formatCurrency, formatPercentage, calculateGP } from '@/lib/date-utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchTrackerDataByMonth } from '@/services/kitchen-service';

export default function KeyInsights() {
  const { annualRecord, currentYear, currentMonth } = useStore();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [gpData, setGpData] = useState<any[]>([]);
  const [previousMonthGP, setPreviousMonthGP] = useState(0);
  const [currentMonthGP, setCurrentMonthGP] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyCosts, setMonthlyCosts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Query for food tracker data
  const { 
    data: foodTrackerData,
    isLoading: isFoodLoading 
  } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'food'],
    queryFn: () => fetchTrackerDataByMonth(currentYear, currentMonth, 'food'),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Query for beverage tracker data
  const { 
    data: bevTrackerData,
    isLoading: isBevLoading 
  } = useQuery({
    queryKey: ['tracker-data', currentYear, currentMonth, 'beverage'],
    queryFn: () => fetchTrackerDataByMonth(currentYear, currentMonth, 'beverage'),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Get previous month data
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const {
    data: prevFoodData
  } = useQuery({
    queryKey: ['tracker-data', prevYear, prevMonth, 'food'],
    queryFn: () => fetchTrackerDataByMonth(prevYear, prevMonth, 'food'),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  const {
    data: prevBevData
  } = useQuery({
    queryKey: ['tracker-data', prevYear, prevMonth, 'beverage'],
    queryFn: () => fetchTrackerDataByMonth(prevYear, prevMonth, 'beverage'),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  useEffect(() => {
    setIsLoading(isFoodLoading || isBevLoading);
    
    const calculateInsights = () => {
      console.log("Calculating insights with data:", { 
        foodTrackerData, 
        bevTrackerData, 
        prevFoodData, 
        prevBevData 
      });
      
      // Current month calculations
      let foodRevenue = 0;
      let foodCosts = 0;
      let bevRevenue = 0;
      let bevCosts = 0;
      
      // Process current month's food data
      if (foodTrackerData && foodTrackerData.length > 0) {
        foodTrackerData.forEach(day => {
          foodRevenue += Number(day.revenue) || 0;
          
          // Calculate costs
          const dayCosts = Object.values(day.purchases || {}).reduce(
            (sum, amount) => sum + Number(amount || 0), 
            0
          );
          const creditNotes = day.creditNotes?.reduce(
            (sum, credit) => sum + Number(credit || 0), 
            0
          ) || 0;
          
          foodCosts += dayCosts - creditNotes + (Number(day.staffFoodAllowance) || 0);
        });
      }
      
      // Process current month's beverage data
      if (bevTrackerData && bevTrackerData.length > 0) {
        bevTrackerData.forEach(day => {
          bevRevenue += Number(day.revenue) || 0;
          
          // Calculate costs
          const dayCosts = Object.values(day.purchases || {}).reduce(
            (sum, amount) => sum + Number(amount || 0), 
            0
          );
          const creditNotes = day.creditNotes?.reduce(
            (sum, credit) => sum + Number(credit || 0), 
            0
          ) || 0;
          
          bevCosts += dayCosts - creditNotes + (Number(day.staffFoodAllowance) || 0);
        });
      }
      
      // Previous month calculations
      let prevFoodRevenue = 0;
      let prevFoodCosts = 0;
      let prevBevRevenue = 0;
      let prevBevCosts = 0;
      
      // Process previous month's food data
      if (prevFoodData && prevFoodData.length > 0) {
        prevFoodData.forEach(day => {
          prevFoodRevenue += Number(day.revenue) || 0;
          
          // Calculate costs
          const dayCosts = Object.values(day.purchases || {}).reduce(
            (sum, amount) => sum + Number(amount || 0), 
            0
          );
          const creditNotes = day.creditNotes?.reduce(
            (sum, credit) => sum + Number(credit || 0), 
            0
          ) || 0;
          
          prevFoodCosts += dayCosts - creditNotes + (Number(day.staffFoodAllowance) || 0);
        });
      }
      
      // Process previous month's beverage data
      if (prevBevData && prevBevData.length > 0) {
        prevBevData.forEach(day => {
          prevBevRevenue += Number(day.revenue) || 0;
          
          // Calculate costs
          const dayCosts = Object.values(day.purchases || {}).reduce(
            (sum, amount) => sum + Number(amount || 0), 
            0
          );
          const creditNotes = day.creditNotes?.reduce(
            (sum, credit) => sum + Number(credit || 0), 
            0
          ) || 0;
          
          prevBevCosts += dayCosts - creditNotes + (Number(day.staffFoodAllowance) || 0);
        });
      }
      
      // Total for this month
      const totalRevenue = foodRevenue + bevRevenue;
      const totalCosts = foodCosts + bevCosts;
      
      // Total for previous month
      const prevTotalRevenue = prevFoodRevenue + prevBevRevenue;
      const prevTotalCosts = prevFoodCosts + prevBevCosts;
      
      setMonthlyRevenue(totalRevenue);
      setMonthlyCosts(totalCosts);
      
      // Calculate GP for this month
      const currGP = calculateGP(totalRevenue, totalCosts);
      setCurrentMonthGP(currGP);
      
      // Calculate GP for previous month
      const prevGP = calculateGP(prevTotalRevenue, prevTotalCosts);
      setPreviousMonthGP(prevGP);
      
      // Weekly data processing
      processWeeklyData();
    };
    
    const processWeeklyData = () => {
      // Create map for weekly data
      const weekMap: Record<string, { revenue: number, costs: number }> = {};
      
      // Process food data by week
      if (foodTrackerData) {
        foodTrackerData.forEach(day => {
          if (!day.date) return;
          
          // Extract week number
          const date = new Date(day.date);
          const weekOfMonth = Math.ceil(date.getDate() / 7);
          const weekKey = `Week ${weekOfMonth}`;
          
          if (!weekMap[weekKey]) {
            weekMap[weekKey] = { revenue: 0, costs: 0 };
          }
          
          weekMap[weekKey].revenue += Number(day.revenue) || 0;
          
          // Calculate costs
          const dayCosts = Object.values(day.purchases || {}).reduce(
            (sum, amount) => sum + Number(amount || 0), 
            0
          );
          const creditNotes = day.creditNotes?.reduce(
            (sum, credit) => sum + Number(credit || 0), 
            0
          ) || 0;
          
          weekMap[weekKey].costs += dayCosts - creditNotes + (Number(day.staffFoodAllowance) || 0);
        });
      }
      
      // Process beverage data by week
      if (bevTrackerData) {
        bevTrackerData.forEach(day => {
          if (!day.date) return;
          
          // Extract week number
          const date = new Date(day.date);
          const weekOfMonth = Math.ceil(date.getDate() / 7);
          const weekKey = `Week ${weekOfMonth}`;
          
          if (!weekMap[weekKey]) {
            weekMap[weekKey] = { revenue: 0, costs: 0 };
          }
          
          weekMap[weekKey].revenue += Number(day.revenue) || 0;
          
          // Calculate costs
          const dayCosts = Object.values(day.purchases || {}).reduce(
            (sum, amount) => sum + Number(amount || 0), 
            0
          );
          const creditNotes = day.creditNotes?.reduce(
            (sum, credit) => sum + Number(credit || 0), 
            0
          ) || 0;
          
          weekMap[weekKey].costs += dayCosts - creditNotes + (Number(day.staffFoodAllowance) || 0);
        });
      }
      
      // Sort by week number
      const sortedWeeks = Object.entries(weekMap)
        .sort((a, b) => {
          const aNum = parseInt(a[0].replace('Week ', ''));
          const bNum = parseInt(b[0].replace('Week ', ''));
          return aNum - bNum;
        });
      
      // Convert to arrays for charts
      const weeklyRevenue = sortedWeeks.map(([week, data]) => ({
        week,
        revenue: data.revenue
      }));
      
      const weeklyGP = sortedWeeks.map(([week, data]) => {
        const gp = calculateGP(data.revenue, data.costs);
        return {
          week,
          gp: gp * 100 // Convert to percentage for better visualization
        };
      });
      
      console.log("Weekly data processed:", { weeklyRevenue, weeklyGP });
      
      setRevenueData(weeklyRevenue);
      setGpData(weeklyGP);
    };
    
    calculateInsights();
  }, [foodTrackerData, bevTrackerData, prevFoodData, prevBevData, isFoodLoading, isBevLoading]);
  
  // Calculate GP trend
  const gpTrend = currentMonthGP - previousMonthGP;
  const gpTrendPercentage = previousMonthGP ? (gpTrend / previousMonthGP) * 100 : 0;

  const chartConfig = {
    revenue: { color: "#344861", label: "Revenue" },
    gp: { color: "#16A34A", label: "Gross Profit %" },
  };
  
  if (isLoading) {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-semibold text-tavern-blue flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="text-lg font-medium animate-pulse bg-gray-200 h-6 w-32 rounded"></CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-tavern-blue-light" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-tavern-blue flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        Key Insights
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <span>Monthly Revenue</span>
              {monthlyRevenue > 0 && <TrendingUp className="h-5 w-5 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-tavern-blue">{formatCurrency(monthlyRevenue)}</div>
            <div className="text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-gray-500">Cost:</span> 
              <span className="font-medium">{formatCurrency(monthlyCosts)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <span>Gross Profit</span>
              {gpTrend >= 0 ? 
                <TrendingUp className="h-5 w-5 text-green-500" /> : 
                <TrendingDown className="h-5 w-5 text-red-500" />
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-tavern-blue">{formatPercentage(currentMonthGP)}</div>
            <div className={`flex items-center mt-1 ${gpTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {gpTrend >= 0 ? 
                <ArrowUp className="h-4 w-4 mr-1" /> : 
                <ArrowDown className="h-4 w-4 mr-1" />
              }
              {isNaN(gpTrendPercentage) || !isFinite(gpTrendPercentage) ? (
                <span className="font-medium">No previous month data</span>
              ) : (
                <span className="font-medium">{Math.abs(gpTrendPercentage).toFixed(1)}% vs. last month</span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50 md:col-span-1 row-span-1">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-lg font-medium">Current Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className={`text-xl font-bold ${currentMonthGP >= 0.7 ? 'text-green-500' : currentMonthGP >= 0.65 ? 'text-amber-500' : 'text-red-500'}`}>
              {currentMonthGP >= 0.7 ? 'Excellent' : currentMonthGP >= 0.65 ? 'Good' : 'Needs Improvement'}
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {currentMonthGP >= 0.7 ? 
                'Your business is performing above target levels.' : 
                currentMonthGP >= 0.65 ? 
                'Your business is meeting expected performance levels.' : 
                'Your business is currently performing below target levels.'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-64">
            {revenueData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for this month
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full">
                <BarChart data={revenueData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Weekly GP %</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-64">
            {gpData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for this month
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full">
                <LineChart data={gpData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="gp" 
                    stroke="var(--color-gp)" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
