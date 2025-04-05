
import React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import { ModuleType } from '@/types/kitchen-ledger';
import { ChartBarIcon } from 'lucide-react';

interface AnnualSummaryProps {
  modulePrefix?: string;
  moduleType?: ModuleType;
}

export default function AnnualSummary({ modulePrefix = "", moduleType = "food" }: AnnualSummaryProps) {
  const pageTitle = modulePrefix ? `${modulePrefix} Annual Summary` : "Annual Summary";
  const annualRecord = useStore(state => state.annualRecord);
  
  // Process data for charts
  const monthlyData = React.useMemo(() => {
    const months = [];
    
    // Process each month
    for (let i = 0; i < 12; i++) {
      const monthNumber = i + 1;
      const monthName = new Date(2023, i, 1).toLocaleString('default', { month: 'short' });
      
      const monthRecord = annualRecord.months.find(
        m => m.month === monthNumber && m.year === annualRecord.year
      );
      
      if (monthRecord) {
        // Calculate totals
        let totalRevenue = 0;
        let totalPurchases = 0;
        
        monthRecord.weeks.forEach(week => {
          week.days.forEach(day => {
            totalRevenue += day.revenue;
            
            // Sum purchases for each supplier
            Object.values(day.purchases).forEach(amount => {
              totalPurchases += amount;
            });
            
            // Subtract credit notes
            totalPurchases -= day.creditNotes.reduce((sum, amount) => sum + amount, 0);
          });
        });
        
        // Calculate GP
        const grossProfit = totalRevenue - totalPurchases;
        const gpPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        
        months.push({
          name: monthName,
          month: monthNumber,
          revenue: totalRevenue,
          purchases: totalPurchases,
          grossProfit,
          gpPercentage: parseFloat(gpPercentage.toFixed(2)),
          target: monthRecord.gpTarget * 100
        });
      } else {
        // Add placeholder for months without data
        months.push({
          name: monthName,
          month: monthNumber,
          revenue: 0,
          purchases: 0,
          grossProfit: 0,
          gpPercentage: 0,
          target: 68
        });
      }
    }
    
    return months;
  }, [annualRecord]);
  
  // Calculate annual totals
  const annualTotals = React.useMemo(() => {
    const totals = {
      revenue: 0,
      purchases: 0,
      grossProfit: 0,
      gpPercentage: 0,
      averageTargetGP: 0
    };
    
    if (monthlyData.length > 0) {
      totals.revenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
      totals.purchases = monthlyData.reduce((sum, month) => sum + month.purchases, 0);
      totals.grossProfit = totals.revenue - totals.purchases;
      totals.gpPercentage = totals.revenue > 0 
        ? parseFloat(((totals.grossProfit / totals.revenue) * 100).toFixed(2))
        : 0;
      
      // Calculate average target GP
      const monthsWithData = monthlyData.filter(month => month.revenue > 0);
      totals.averageTargetGP = monthsWithData.length > 0
        ? parseFloat((monthsWithData.reduce((sum, month) => sum + month.target, 0) / monthsWithData.length).toFixed(2))
        : 68; // Default target
    }
    
    return totals;
  }, [monthlyData]);
  
  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#0ea5e9"
    },
    purchases: {
      label: "Purchases",
      color: "#f43f5e"
    },
    grossProfit: {
      label: "Gross Profit",
      color: "#10b981"
    },
    gpPercentage: {
      label: "GP %",
      color: "#8b5cf6"
    },
    target: {
      label: "Target GP %",
      color: "#d946ef"
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold text-tavern-blue mb-6">{pageTitle}</h1>
      
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${annualTotals.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Annual GP %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{annualTotals.gpPercentage}%</div>
            <p className="text-xs text-muted-foreground">Target: {annualTotals.averageTargetGP}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Annual Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${annualTotals.grossProfit.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Monthly Revenue & Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <ChartTooltipContent
                            className="bg-background border-border"
                            payload={payload}
                          />
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill={chartConfig.revenue.color} />
                  <Bar dataKey="purchases" name="Purchases" fill={chartConfig.purchases.color} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Monthly Gross Profit %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <ChartTooltipContent
                            className="bg-background border-border"
                            payload={payload}
                          />
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="gpPercentage" 
                    name="GP %" 
                    stroke={chartConfig.gpPercentage.color} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="Target GP %" 
                    stroke={chartConfig.target.color}
                    strokeDasharray="5 5" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance Table</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue ($)</TableHead>
                <TableHead className="text-right">Purchases ($)</TableHead>
                <TableHead className="text-right">Gross Profit ($)</TableHead>
                <TableHead className="text-right">GP %</TableHead>
                <TableHead className="text-right">Target GP %</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((month) => (
                <TableRow key={month.name}>
                  <TableCell>{month.name}</TableCell>
                  <TableCell className="text-right">{month.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{month.purchases.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{month.grossProfit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{month.gpPercentage}%</TableCell>
                  <TableCell className="text-right">{month.target}%</TableCell>
                  <TableCell className={`text-right ${month.gpPercentage >= month.target ? 'text-green-600' : 'text-red-600'}`}>
                    {(month.gpPercentage - month.target).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{annualTotals.revenue.toFixed(2)}</TableCell>
                <TableCell className="text-right">{annualTotals.purchases.toFixed(2)}</TableCell>
                <TableCell className="text-right">{annualTotals.grossProfit.toFixed(2)}</TableCell>
                <TableCell className="text-right">{annualTotals.gpPercentage}%</TableCell>
                <TableCell className="text-right">{annualTotals.averageTargetGP}%</TableCell>
                <TableCell className={`text-right ${annualTotals.gpPercentage >= annualTotals.averageTargetGP ? 'text-green-600' : 'text-red-600'}`}>
                  {(annualTotals.gpPercentage - annualTotals.averageTargetGP).toFixed(2)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
