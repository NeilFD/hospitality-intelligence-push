
import React from 'react';
import { useWagesStore } from './WagesStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface WagesAnalyticsProps {
  year: number;
  month: number;
  viewType: 'weekly' | 'trends';
}

export function WagesAnalytics({ year, month, viewType }: WagesAnalyticsProps) {
  const { getMonthlyWages, getWeekdayTotals } = useWagesStore();
  const monthlyData = getMonthlyWages(year, month);
  const weekdayTotals = getWeekdayTotals(year, month);
  
  // Calculate overall totals
  const totals = monthlyData.reduce((acc, day) => {
    acc.fohWages += day.fohWages;
    acc.kitchenWages += day.kitchenWages;
    acc.totalWages += (day.fohWages + day.kitchenWages);
    acc.foodRevenue += day.foodRevenue;
    acc.bevRevenue += day.bevRevenue;
    acc.totalRevenue += (day.foodRevenue + day.bevRevenue);
    return acc;
  }, { 
    fohWages: 0, 
    kitchenWages: 0, 
    totalWages: 0,
    foodRevenue: 0, 
    bevRevenue: 0, 
    totalRevenue: 0 
  });
  
  // Prepare data for charts
  const wagesChartData = [
    { name: 'FOH', amount: totals.fohWages },
    { name: 'Kitchen', amount: totals.kitchenWages },
    { name: 'Total', amount: totals.totalWages }
  ];
  
  const weekdayChartData = Object.entries(weekdayTotals).map(([day, data]) => ({
    name: day.substring(0, 3),
    fohWages: data.fohWages,
    kitchenWages: data.kitchenWages,
    totalRevenue: data.totalRevenue,
    percentage: data.wagesPercentage
  }));
  
  const dailyChartData = monthlyData.map(day => ({
    name: `${day.day}`,
    fohWages: day.fohWages,
    kitchenWages: day.kitchenWages,
    totalWages: day.fohWages + day.kitchenWages,
    totalRevenue: day.foodRevenue + day.bevRevenue,
    percentage: day.foodRevenue + day.bevRevenue > 0 
      ? ((day.fohWages + day.kitchenWages) / (day.foodRevenue + day.bevRevenue)) * 100 
      : 0
  }));

  if (viewType === 'weekly') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Wages by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>FOH Wages</TableHead>
                  <TableHead>Kitchen Wages</TableHead>
                  <TableHead>Total Wages</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Wages %</TableHead>
                  <TableHead>Avg Per Day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(weekdayTotals).map(([day, data]) => (
                  <TableRow key={day}>
                    <TableCell className="font-medium">{day}</TableCell>
                    <TableCell>{formatCurrency(data.fohWages)}</TableCell>
                    <TableCell>{formatCurrency(data.kitchenWages)}</TableCell>
                    <TableCell>{formatCurrency(data.totalWages)}</TableCell>
                    <TableCell>{formatCurrency(data.totalRevenue)}</TableCell>
                    <TableCell className={data.wagesPercentage > 35 ? 'text-red-500' : 'text-green-500'}>
                      {data.wagesPercentage.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {data.count > 0 ? formatCurrency(data.totalWages / data.count) : '£0'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>TOTAL</TableCell>
                  <TableCell>{formatCurrency(totals.fohWages)}</TableCell>
                  <TableCell>{formatCurrency(totals.kitchenWages)}</TableCell>
                  <TableCell>{formatCurrency(totals.totalWages)}</TableCell>
                  <TableCell>{formatCurrency(totals.totalRevenue)}</TableCell>
                  <TableCell>
                    {totals.totalRevenue > 0 
                      ? ((totals.totalWages / totals.totalRevenue) * 100).toFixed(1) 
                      : '0.0'}%
                  </TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Wages by Day of Week</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ChartContainer
                config={{
                  fohWages: { color: "#4f46e5" },
                  kitchenWages: { color: "#059669" }
                }}
              >
                <BarChart data={weekdayChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fohWages" name="FOH Wages" fill="#4f46e5" />
                  <Bar dataKey="kitchenWages" name="Kitchen Wages" fill="#059669" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Daily Wage Percentages</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ChartContainer
                config={{
                  percentage: { color: "#d97706" }
                }}
              >
                <BarChart data={weekdayChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="percentage" name="Wages %" fill="#d97706" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Wage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold">{formatCurrency(totals.totalWages)}</div>
              <div className="grid grid-cols-2 gap-2 pt-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">FOH Wages</div>
                  <div className="text-xl font-semibold">{formatCurrency(totals.fohWages)}</div>
                  <div className="text-sm text-muted-foreground">
                    {((totals.fohWages / totals.totalWages) * 100).toFixed(1)}% of total
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Kitchen Wages</div>
                  <div className="text-xl font-semibold">{formatCurrency(totals.kitchenWages)}</div>
                  <div className="text-sm text-muted-foreground">
                    {((totals.kitchenWages / totals.totalWages) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Wages to Revenue Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                {totals.totalRevenue > 0 
                  ? ((totals.totalWages / totals.totalRevenue) * 100).toFixed(1) 
                  : '0.0'}%
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">FOH %</div>
                  <div className="text-xl font-semibold">
                    {totals.totalRevenue > 0 
                      ? ((totals.fohWages / totals.totalRevenue) * 100).toFixed(1) 
                      : '0.0'}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Kitchen %</div>
                  <div className="text-xl font-semibold">
                    {totals.totalRevenue > 0 
                      ? ((totals.kitchenWages / totals.totalRevenue) * 100).toFixed(1) 
                      : '0.0'}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
              <div className="grid grid-cols-2 gap-2 pt-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Food Revenue</div>
                  <div className="text-xl font-semibold">{formatCurrency(totals.foodRevenue)}</div>
                  <div className="text-sm text-muted-foreground">
                    {totals.totalRevenue > 0 
                      ? ((totals.foodRevenue / totals.totalRevenue) * 100).toFixed(1) 
                      : '0.0'}% of total
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Beverage Revenue</div>
                  <div className="text-xl font-semibold">{formatCurrency(totals.bevRevenue)}</div>
                  <div className="text-sm text-muted-foreground">
                    {totals.totalRevenue > 0 
                      ? ((totals.bevRevenue / totals.totalRevenue) * 100).toFixed(1) 
                      : '0.0'}% of total
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Daily Wage Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ChartContainer
            config={{
              fohWages: { color: "#4f46e5" },
              kitchenWages: { color: "#059669" },
              totalWages: { color: "#d97706" },
              totalRevenue: { color: "#0ea5e9" }
            }}
          >
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="fohWages" name="FOH Wages" fill="#4f46e5" />
              <Bar yAxisId="left" dataKey="kitchenWages" name="Kitchen Wages" fill="#059669" />
              <Bar yAxisId="left" dataKey="totalWages" name="Total Wages" fill="#d97706" />
              <Bar yAxisId="right" dataKey="totalRevenue" name="Revenue" fill="#0ea5e9" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
