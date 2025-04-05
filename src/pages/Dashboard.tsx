
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Calendar, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { 
  calculateGP, 
  formatCurrency, 
  formatPercentage, 
  getMonthName 
} from '@/lib/date-utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell 
} from 'recharts';
import StatusBox from '@/components/StatusBox';

export default function Dashboard() {
  const currentYear = useStore(state => state.currentYear);
  const currentMonth = useStore(state => state.currentMonth);
  const annualRecord = useStore(state => state.annualRecord);
  
  // Get current month and last 6 months for trends
  const currentMonthRecord = annualRecord.months.find(
    m => m.year === currentYear && m.month === currentMonth
  );
  
  // Generate months data for charts
  const getLastSixMonths = () => {
    const result = [];
    let year = currentYear;
    let month = currentMonth;
    
    for (let i = 0; i < 6; i++) {
      // Go back one month
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }
      
      const monthRecord = annualRecord.months.find(
        m => m.year === year && m.month === month
      );
      
      if (monthRecord) {
        result.unshift(monthRecord); // Add to beginning to maintain chronological order
      }
    }
    
    // Add current month if available
    if (currentMonthRecord) {
      result.push(currentMonthRecord);
    }
    
    return result;
  };
  
  const monthsData = getLastSixMonths();
  
  // Calculate monthly performance data
  const monthlyPerformance = monthsData.map(month => {
    // Calculate total revenue
    const totalRevenue = month.weeks.reduce((sum, week) => {
      const weekRevenue = week.days.reduce((daySum, day) => daySum + day.revenue, 0);
      return sum + weekRevenue;
    }, 0);
    
    // Calculate total costs
    const totalCosts = month.weeks.reduce((sum, week) => {
      const weekCosts = week.days.reduce((daySum, day) => {
        const dayCosts = Object.values(day.purchases).reduce((purchaseSum, amount) => purchaseSum + amount, 0);
        const creditNotes = day.creditNotes.reduce((creditSum, credit) => creditSum + credit, 0);
        return daySum + dayCosts - creditNotes + day.staffFoodAllowance;
      }, 0);
      return sum + weekCosts;
    }, 0);
    
    // Calculate GP
    const gpPercentage = calculateGP(totalRevenue, totalCosts);
    
    return {
      name: `${getMonthName(month.month).substring(0, 3)} ${month.year}`,
      revenue: totalRevenue,
      costs: totalCosts,
      gp: gpPercentage,
      target: month.gpTarget
    };
  });
  
  // Calculate current month summary
  const currentMonthSummary = currentMonthRecord ? {
    totalRevenue: currentMonthRecord.weeks.reduce((sum, week) => {
      const weekRevenue = week.days.reduce((daySum, day) => daySum + day.revenue, 0);
      return sum + weekRevenue;
    }, 0),
    totalCosts: currentMonthRecord.weeks.reduce((sum, week) => {
      const weekCosts = week.days.reduce((daySum, day) => {
        const dayCosts = Object.values(day.purchases).reduce((purchaseSum, amount) => purchaseSum + amount, 0);
        const creditNotes = day.creditNotes.reduce((creditSum, credit) => creditSum + credit, 0);
        return daySum + dayCosts - creditNotes + day.staffFoodAllowance;
      }, 0);
      return sum + weekCosts;
    }, 0)
  } : { totalRevenue: 0, totalCosts: 0 };
  
  const currentMonthGP = calculateGP(currentMonthSummary.totalRevenue, currentMonthSummary.totalCosts);
  const gpTarget = currentMonthRecord?.gpTarget || 0.68; // Default to 68% if not set
  const gpDifference = currentMonthGP - gpTarget;
  
  const gpStatus = 
    gpDifference >= 0.02 ? 'good' : 
    gpDifference >= -0.02 ? 'warning' : 
    'bad';
    
  // Calculate top suppliers
  const getTopSuppliers = () => {
    if (!currentMonthRecord) return [];
    
    const supplierTotals: Record<string, { id: string, name: string, amount: number }> = {};
    
    currentMonthRecord.suppliers.forEach(supplier => {
      supplierTotals[supplier.id] = {
        id: supplier.id,
        name: supplier.name,
        amount: 0
      };
    });
    
    currentMonthRecord.weeks.forEach(week => {
      week.days.forEach(day => {
        Object.entries(day.purchases).forEach(([supplierId, amount]) => {
          if (supplierTotals[supplierId]) {
            supplierTotals[supplierId].amount += amount;
          }
        });
      });
    });
    
    return Object.values(supplierTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };
  
  const topSuppliers = getTopSuppliers();
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tavern-blue">Kitchen Performance Dashboard</h1>
        <Button variant="outline" asChild>
          <Link to="/input-settings">
            Configure Settings <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Month Performance</CardTitle>
            <CardDescription>
              {getMonthName(currentMonth)} {currentYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatusBox 
                label="Current GP %" 
                value={formatPercentage(currentMonthGP)} 
                status={gpStatus} 
              />
              <StatusBox 
                label="Revenue" 
                value={formatCurrency(currentMonthSummary.totalRevenue)} 
                status="neutral" 
              />
              <StatusBox 
                label="Food Costs" 
                value={formatCurrency(currentMonthSummary.totalCosts)} 
                status="neutral" 
              />
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                GP Target: {formatPercentage(gpTarget)}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/month/${currentYear}/${currentMonth}`}>
                  View Month <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Food Suppliers</CardTitle>
            <CardDescription>
              Current month spending by supplier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSuppliers}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis 
                    tickFormatter={(value) => `£${(value / 1000).toFixed(1)}k`}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#4B6584" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>GP % Trend</CardTitle>
            <CardDescription>Last 6 months performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyPerformance}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    domain={[0.4, 0.8]} 
                  />
                  <Tooltip 
                    formatter={(value: number) => formatPercentage(value)}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="gp" 
                    name="GP %" 
                    stroke="#78E08F" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="Target" 
                    stroke="#F7B731" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Calendar</CardTitle>
            <CardDescription>View weekly and monthly trackers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const monthName = getMonthName(month);
                const isCurrentMonth = month === currentMonth;
                
                return (
                  <Link 
                    key={month} 
                    to={`/month/${currentYear}/${month}`}
                    className="no-underline"
                  >
                    <div 
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all ${
                        isCurrentMonth ? 'bg-primary/10 border-primary' : ''
                      }`}
                    >
                      <Calendar className="h-6 w-6 text-tavern-blue" />
                      <span className="mt-2 font-medium">{monthName}</span>
                      <span className="text-xs text-muted-foreground">{currentYear}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
