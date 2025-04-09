
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
  const [foodGP, setFoodGP] = useState(0);
  const [beverageGP, setBeverageGP] = useState(0);
  const [combinedGP, setCombinedGP] = useState(0);
  const [foodRevenue, setFoodRevenue] = useState(0);
  const [foodCosts, setFoodCosts] = useState(0);
  const [beverageRevenue, setBeverageRevenue] = useState(0);
  const [beverageCosts, setBeverageCosts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCosts, setTotalCosts] = useState(0);
  const [previousMonthGP, setPreviousMonthGP] = useState(0);
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
      let foodRev = 0;
      let foodCost = 0;
      let bevRev = 0;
      let bevCost = 0;
      
      // Process current month's food data
      if (foodTrackerData && foodTrackerData.length > 0) {
        foodTrackerData.forEach(day => {
          const dayRevenue = Number(day.revenue) || 0;
          foodRev += dayRevenue;
          
          // Calculate costs
          let dayCosts = 0;
          if (day.purchases) {
            Object.values(day.purchases).forEach(amount => {
              dayCosts += Number(amount) || 0;
            });
          }
          
          let creditTotal = 0;
          if (day.creditNotes && Array.isArray(day.creditNotes)) {
            day.creditNotes.forEach(credit => {
              creditTotal += Number(credit) || 0;
            });
          }
          
          const staffFoodAllowance = Number(day.staffFoodAllowance) || 0;
          foodCost += dayCosts - creditTotal + staffFoodAllowance;
        });
      }
      
      // Process current month's beverage data
      if (bevTrackerData && bevTrackerData.length > 0) {
        bevTrackerData.forEach(day => {
          const dayRevenue = Number(day.revenue) || 0;
          bevRev += dayRevenue;
          
          // Calculate costs
          let dayCosts = 0;
          if (day.purchases) {
            Object.values(day.purchases).forEach(amount => {
              dayCosts += Number(amount) || 0;
            });
          }
          
          let creditTotal = 0;
          if (day.creditNotes && Array.isArray(day.creditNotes)) {
            day.creditNotes.forEach(credit => {
              creditTotal += Number(credit) || 0;
            });
          }
          
          const staffFoodAllowance = Number(day.staffFoodAllowance) || 0;
          bevCost += dayCosts - creditTotal + staffFoodAllowance;
        });
      }
      
      // Previous month calculations
      let prevFoodRev = 0;
      let prevFoodCost = 0;
      let prevBevRev = 0;
      let prevBevCost = 0;
      
      // Process previous month's food data
      if (prevFoodData && prevFoodData.length > 0) {
        prevFoodData.forEach(day => {
          const dayRevenue = Number(day.revenue) || 0;
          prevFoodRev += dayRevenue;
          
          // Calculate costs
          let dayCosts = 0;
          if (day.purchases) {
            Object.values(day.purchases).forEach(amount => {
              dayCosts += Number(amount) || 0;
            });
          }
          
          let creditTotal = 0;
          if (day.creditNotes && Array.isArray(day.creditNotes)) {
            day.creditNotes.forEach(credit => {
              creditTotal += Number(credit) || 0;
            });
          }
          
          const staffFoodAllowance = Number(day.staffFoodAllowance) || 0;
          prevFoodCost += dayCosts - creditTotal + staffFoodAllowance;
        });
      }
      
      // Process previous month's beverage data
      if (prevBevData && prevBevData.length > 0) {
        prevBevData.forEach(day => {
          const dayRevenue = Number(day.revenue) || 0;
          prevBevRev += dayRevenue;
          
          // Calculate costs
          let dayCosts = 0;
          if (day.purchases) {
            Object.values(day.purchases).forEach(amount => {
              dayCosts += Number(amount) || 0;
            });
          }
          
          let creditTotal = 0;
          if (day.creditNotes && Array.isArray(day.creditNotes)) {
            day.creditNotes.forEach(credit => {
              creditTotal += Number(credit) || 0;
            });
          }
          
          const staffFoodAllowance = Number(day.staffFoodAllowance) || 0;
          prevBevCost += dayCosts - creditTotal + staffFoodAllowance;
        });
      }
      
      // Calculate gross profits correctly
      const currentFoodGP = foodRev > 0 ? (foodRev - foodCost) / foodRev : 0;
      const currentBevGP = bevRev > 0 ? (bevRev - bevCost) / bevRev : 0;
      const combinedCurrentGP = (foodRev + bevRev) > 0 ? 
        ((foodRev + bevRev) - (foodCost + bevCost)) / (foodRev + bevRev) : 0;
        
      const prevCombinedGP = (prevFoodRev + prevBevRev) > 0 ? 
        ((prevFoodRev + prevBevRev) - (prevFoodCost + prevBevCost)) / (prevFoodRev + prevBevRev) : 0;
      
      console.log("GP Calculations:", {
        foodRevenue: foodRev,
        foodCosts: foodCost,
        foodGP: currentFoodGP,
        beverageRevenue: bevRev,
        beverageCosts: bevCost, 
        beverageGP: currentBevGP,
        combinedGP: combinedCurrentGP
      });
      
      // Set state values
      setFoodGP(currentFoodGP);
      setBeverageGP(currentBevGP);
      setCombinedGP(combinedCurrentGP);
      setPreviousMonthGP(prevCombinedGP);
      
      setFoodRevenue(foodRev);
      setFoodCosts(foodCost);
      setBeverageRevenue(bevRev);
      setBeverageCosts(bevCost);
      setTotalRevenue(foodRev + bevRev);
      setTotalCosts(foodCost + bevCost);
      
      // Weekly data processing
      processWeeklyData();
    };
    
    const processWeeklyData = () => {
      // Create map for weekly data
      const weekMap: Record<string, { 
        revenue: number, 
        foodCost: number, 
        bevCost: number, 
        foodRevenue: number, 
        bevRevenue: number 
      }> = {};
      
      // Process food data by week
      if (foodTrackerData) {
        foodTrackerData.forEach(day => {
          if (!day.date) return;
          
          // Extract week number
          const date = new Date(day.date);
          const weekOfMonth = Math.ceil(date.getDate() / 7);
          const weekKey = `Week ${weekOfMonth}`;
          
          if (!weekMap[weekKey]) {
            weekMap[weekKey] = { revenue: 0, foodCost: 0, bevCost: 0, foodRevenue: 0, bevRevenue: 0 };
          }
          
          const dayRevenue = Number(day.revenue) || 0;
          weekMap[weekKey].revenue += dayRevenue;
          weekMap[weekKey].foodRevenue += dayRevenue;
          
          // Calculate costs
          let dayCosts = 0;
          if (day.purchases) {
            Object.values(day.purchases).forEach(amount => {
              dayCosts += Number(amount) || 0;
            });
          }
          
          let creditTotal = 0;
          if (day.creditNotes && Array.isArray(day.creditNotes)) {
            day.creditNotes.forEach(credit => {
              creditTotal += Number(credit) || 0;
            });
          }
          
          const staffFoodAllowance = Number(day.staffFoodAllowance) || 0;
          weekMap[weekKey].foodCost += dayCosts - creditTotal + staffFoodAllowance;
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
            weekMap[weekKey] = { revenue: 0, foodCost: 0, bevCost: 0, foodRevenue: 0, bevRevenue: 0 };
          }
          
          const dayRevenue = Number(day.revenue) || 0;
          weekMap[weekKey].revenue += dayRevenue;
          weekMap[weekKey].bevRevenue += dayRevenue;
          
          // Calculate costs
          let dayCosts = 0;
          if (day.purchases) {
            Object.values(day.purchases).forEach(amount => {
              dayCosts += Number(amount) || 0;
            });
          }
          
          let creditTotal = 0;
          if (day.creditNotes && Array.isArray(day.creditNotes)) {
            day.creditNotes.forEach(credit => {
              creditTotal += Number(credit) || 0;
            });
          }
          
          const staffFoodAllowance = Number(day.staffFoodAllowance) || 0;
          weekMap[weekKey].bevCost += dayCosts - creditTotal + staffFoodAllowance;
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
        revenue: data.revenue,
        foodRevenue: data.foodRevenue,
        bevRevenue: data.bevRevenue
      }));
      
      const weeklyGP = sortedWeeks.map(([week, data]) => {
        // Calculate GP percentages correctly
        const foodGP = data.foodRevenue > 0 ? 
          ((data.foodRevenue - data.foodCost) / data.foodRevenue) * 100 : 0;
        const bevGP = data.bevRevenue > 0 ? 
          ((data.bevRevenue - data.bevCost) / data.bevRevenue) * 100 : 0;
        const combinedGP = (data.foodRevenue + data.bevRevenue) > 0 ? 
          (((data.foodRevenue + data.bevRevenue) - (data.foodCost + data.bevCost)) / 
          (data.foodRevenue + data.bevRevenue)) * 100 : 0;
        
        return {
          week,
          foodGP,
          bevGP,
          combinedGP
        };
      });
      
      console.log("Weekly data processed:", { weeklyRevenue, weeklyGP });
      
      setRevenueData(weeklyRevenue);
      setGpData(weeklyGP);
    };
    
    calculateInsights();
  }, [foodTrackerData, bevTrackerData, prevFoodData, prevBevData, isFoodLoading, isBevLoading]);
  
  // Calculate GP trend
  const gpTrend = combinedGP - previousMonthGP;
  const gpTrendPercentage = previousMonthGP ? (gpTrend / previousMonthGP) * 100 : 0;

  const chartConfig = {
    revenue: { color: "#344861", label: "Revenue" },
    foodRevenue: { color: "#16A34A", label: "Food Revenue" },
    bevRevenue: { color: "#2563EB", label: "Beverage Revenue" },
    foodGP: { color: "#16A34A", label: "Food GP %" },
    bevGP: { color: "#2563EB", label: "Beverage GP %" },
    combinedGP: { color: "#9333EA", label: "Combined GP %" }
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
              {totalRevenue > 0 && <TrendingUp className="h-5 w-5 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-tavern-blue">{formatCurrency(totalRevenue)}</div>
            <div className="mt-2 space-y-1">
              <div className="text-muted-foreground flex items-center gap-1">
                <span className="text-gray-500">Total Cost:</span>
                <span className="font-medium">{formatCurrency(totalCosts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500">Food:</span> 
                  <span className="font-medium">{formatCurrency(foodRevenue)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">Beverage:</span> 
                  <span className="font-medium">{formatCurrency(beverageRevenue)}</span>
                </div>
              </div>
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
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-tavern-blue mb-2">{formatPercentage(combinedGP)}</div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="flex flex-col">
                <span className="text-gray-500 text-sm">Food GP:</span>
                <span className="font-medium">{formatPercentage(foodGP)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-sm">Beverage GP:</span>
                <span className="font-medium">{formatPercentage(beverageGP)}</span>
              </div>
            </div>
            <div className={`flex items-center mt-2 text-xs ${gpTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {gpTrend >= 0 ? 
                <ArrowUp className="h-3 w-3 mr-1" /> : 
                <ArrowDown className="h-3 w-3 mr-1" />
              }
              {isNaN(gpTrendPercentage) || !isFinite(gpTrendPercentage) ? (
                <span className="font-medium">No previous data</span>
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
          <CardContent className="p-4 flex flex-col justify-center h-[calc(100%_-_3.5rem)]">
            <div className={`text-lg font-bold ${combinedGP >= 0.7 ? 'text-green-500' : combinedGP >= 0.65 ? 'text-amber-500' : 'text-red-500'}`}>
              {combinedGP >= 0.7 ? 'Excellent' : combinedGP >= 0.65 ? 'Good' : 'Needs Improvement'}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {combinedGP >= 0.7 ? 
                'Your business is performing above target.' : 
                combinedGP >= 0.65 ? 
                'Your business is meeting expected levels.' : 
                'Your business is below target levels.'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-72">
            {revenueData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for this month
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer>
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="week" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="foodRevenue" name="Food" fill="var(--color-foodRevenue)" stackId="a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bevRevenue" name="Beverage" fill="var(--color-bevRevenue)" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Weekly GP %</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-72">
            {gpData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for this month
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer>
                  <LineChart data={gpData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="week" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="foodGP" 
                      name="Food GP" 
                      stroke="var(--color-foodGP)" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bevGP" 
                      name="Beverage GP" 
                      stroke="var(--color-bevGP)" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="combinedGP" 
                      name="Combined GP" 
                      stroke="var(--color-combinedGP)" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
