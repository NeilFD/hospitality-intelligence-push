
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { formatCurrency, formatPercentage, calculateGP } from '@/lib/date-utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export default function KeyInsights() {
  const { annualRecord, currentYear, currentMonth } = useStore();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [gpData, setGpData] = useState<any[]>([]);
  const [previousMonthGP, setPreviousMonthGP] = useState(0);
  const [currentMonthGP, setCurrentMonthGP] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyCosts, setMonthlyCosts] = useState(0);

  useEffect(() => {
    // Calculate data for charts and metrics
    const calculateInsights = () => {
      if (!annualRecord || !annualRecord.months) return;

      const currentMonthData = annualRecord.months.find(
        m => m.year === currentYear && m.month === currentMonth
      );
      
      const previousMonthData = annualRecord.months.find(m => {
        if (currentMonth === 1) {
          return m.year === currentYear - 1 && m.month === 12;
        } else {
          return m.year === currentYear && m.month === currentMonth - 1;
        }
      });

      let weeklyRevenue: any[] = [];
      let weeklyGP: any[] = [];
      let totalRevenue = 0;
      let totalCost = 0;
      
      // Process current month data for weekly breakdown
      if (currentMonthData && currentMonthData.weeks) {
        const weekMap: Record<number, { revenue: number, costs: number }> = {};
        
        // Initialize all potential weeks in the month (1-5)
        for (let i = 1; i <= 5; i++) {
          weekMap[i] = { revenue: 0, costs: 0 };
        }
        
        // Populate with actual data
        currentMonthData.weeks.forEach(week => {
          let weekRevenue = 0;
          let weekCosts = 0;
          
          week.days.forEach(day => {
            weekRevenue += day.revenue || 0;
            
            const dayCosts = Object.values(day.purchases).reduce(
              (sum: number, amount: number) => sum + amount, 
              0
            );
            const creditNotes = day.creditNotes.reduce(
              (sum: number, credit: number) => sum + credit, 
              0
            );
            weekCosts += dayCosts - creditNotes + (day.staffFoodAllowance || 0);
            
            totalRevenue += day.revenue || 0;
            totalCost += dayCosts - creditNotes + (day.staffFoodAllowance || 0);
          });
          
          weekMap[week.weekNumber] = {
            revenue: weekRevenue,
            costs: weekCosts
          };
        });
        
        // Convert to arrays for charts
        weeklyRevenue = Object.entries(weekMap).map(([week, data]) => ({
          week: `Week ${week}`,
          revenue: data.revenue
        }));
        
        weeklyGP = Object.entries(weekMap).map(([week, data]) => {
          const gp = calculateGP(data.revenue, data.costs);
          return {
            week: `Week ${week}`,
            gp: gp * 100 // Convert to percentage for better visualization
          };
        });
      }
      
      // Calculate month-to-month GP comparison
      let currGP = calculateGP(totalRevenue, totalCost);
      setCurrentMonthGP(currGP);
      setMonthlyRevenue(totalRevenue);
      setMonthlyCosts(totalCost);
      
      if (previousMonthData) {
        let prevRevenue = 0;
        let prevCost = 0;
        
        previousMonthData.weeks.forEach(week => {
          week.days.forEach(day => {
            prevRevenue += day.revenue || 0;
            
            const dayCosts = Object.values(day.purchases).reduce(
              (sum: number, amount: number) => sum + amount, 
              0
            );
            const creditNotes = day.creditNotes.reduce(
              (sum: number, credit: number) => sum + credit, 
              0
            );
            prevCost += dayCosts - creditNotes + (day.staffFoodAllowance || 0);
          });
        });
        
        setPreviousMonthGP(calculateGP(prevRevenue, prevCost));
      }
      
      setRevenueData(weeklyRevenue);
      setGpData(weeklyGP);
    };
    
    calculateInsights();
  }, [annualRecord, currentYear, currentMonth]);
  
  // Calculate GP trend
  const gpTrend = currentMonthGP - previousMonthGP;
  const gpTrendPercentage = (gpTrend / previousMonthGP) * 100;

  const chartConfig = {
    revenue: { color: "#344861", label: "Revenue" },
    gp: { color: "#16A34A", label: "Gross Profit %" },
  };
  
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
              <span className="font-medium">{Math.abs(gpTrendPercentage).toFixed(1)}% vs. last month</span>
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
            <ChartContainer config={chartConfig} className="h-full">
              <BarChart data={revenueData}>
                <XAxis dataKey="week" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg rounded-xl overflow-hidden border-none bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Weekly GP %</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-64">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
