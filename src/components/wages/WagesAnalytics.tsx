import React, { useState, useEffect } from 'react';
import { useWagesStore } from './WagesStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { formatCurrency } from '@/lib/date-utils';
import { ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from "sonner";
import { fetchMasterMonthlyRecords } from '@/services/master-record-service';

interface WagesAnalyticsProps {
  year: number;
  month: number;
  viewType: 'weekly' | 'trends';
}

interface VisibleSeries {
  fohWages: boolean;
  kitchenWages: boolean;
  totalWages: boolean;
  totalRevenue: boolean;
}

interface WeekdayTotal {
  fohWages: number;
  kitchenWages: number;
  foodRevenue: number;
  bevRevenue: number;
  totalWages: number;
  totalRevenue: number;
  wagesPercentage: number;
  count: number;
}

interface WeekdayTotals {
  [day: string]: WeekdayTotal;
}

export function WagesAnalytics({ year, month, viewType }: WagesAnalyticsProps) {
  const { getMonthlyWages, getWeekdayTotals } = useWagesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weekdayTotals, setWeekdayTotals] = useState<WeekdayTotals>({});
  const [masterRecords, setMasterRecords] = useState<any[]>([]);
  
  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
    fohWages: true,
    kitchenWages: true,
    totalWages: true,
    totalRevenue: true
  });
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const wagesData = await getMonthlyWages(year, month);
        
        console.log(`Fetching master records for year=${year}, month=${month}`);
        const masterData = await fetchMasterMonthlyRecords(year, month);
        setMasterRecords(masterData);
        
        console.log('Master records fetched:', masterData.length);
        
        const masterRecordsMap: Record<number, any> = {};
        masterData.forEach(record => {
          const day = parseInt(record.date.split('-')[2]);
          masterRecordsMap[day] = record;
          console.log(`Master record for day ${day}: food=${record.foodRevenue}, bev=${record.beverageRevenue}`);
        });
        
        const updatedData = wagesData.map(day => {
          const masterRecord = masterRecordsMap[day.day];
          if (masterRecord) {
            return {
              ...day,
              foodRevenue: masterRecord.foodRevenue || 0,
              bevRevenue: masterRecord.beverageRevenue || 0
            };
          }
          return day;
        });
        
        setMonthlyData(updatedData);
        
        const totals = await getWeekdayTotals(year, month);
        
        const updatedTotals: WeekdayTotals = { ...totals };
        Object.keys(updatedTotals).forEach(day => {
          updatedTotals[day].foodRevenue = 0;
          updatedTotals[day].bevRevenue = 0;
          updatedTotals[day].totalRevenue = 0;
        });
        
        updatedData.forEach(day => {
          const dayOfWeek = day.dayOfWeek;
          if (updatedTotals[dayOfWeek]) {
            updatedTotals[dayOfWeek].foodRevenue += day.foodRevenue || 0;
            updatedTotals[dayOfWeek].bevRevenue += day.bevRevenue || 0;
            updatedTotals[dayOfWeek].totalRevenue += (day.foodRevenue || 0) + (day.bevRevenue || 0);
          }
        });
        
        Object.keys(updatedTotals).forEach(day => {
          const data = updatedTotals[day];
          data.wagesPercentage = data.totalRevenue > 0 
            ? (data.totalWages / data.totalRevenue) * 100
            : 0;
        });
        
        setWeekdayTotals(updatedTotals);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year, month, getMonthlyWages, getWeekdayTotals]);
  
  const masterTotals = masterRecords.reduce((acc, record) => {
    acc.foodRevenue += record.foodRevenue || 0;
    acc.bevRevenue += record.beverageRevenue || 0;
    return acc;
  }, { foodRevenue: 0, bevRevenue: 0 });
  
  const wagesTotals = monthlyData.reduce((acc, day) => {
    acc.fohWages += day.fohWages || 0;
    acc.kitchenWages += day.kitchenWages || 0;
    return acc;
  }, { fohWages: 0, kitchenWages: 0 });
  
  const totals = {
    fohWages: wagesTotals.fohWages,
    kitchenWages: wagesTotals.kitchenWages,
    totalWages: wagesTotals.fohWages + wagesTotals.kitchenWages,
    foodRevenue: masterTotals.foodRevenue,
    bevRevenue: masterTotals.bevRevenue,
    totalRevenue: masterTotals.foodRevenue + masterTotals.bevRevenue
  };
  
  console.log('WagesAnalytics - Calculated totals:', {
    foodRevenue: totals.foodRevenue,
    bevRevenue: totals.bevRevenue,
    totalRevenue: totals.totalRevenue,
    totalWages: totals.totalWages,
    days: monthlyData.length,
    masterRecordsCount: masterRecords.length
  });
  
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
  
  const dailyChartData = monthlyData.map(day => {
    const masterRecord = masterRecords.find(r => {
      const recordDay = parseInt(r.date.split('-')[2]);
      return recordDay === day.day;
    });
    
    const foodRevenue = masterRecord ? (masterRecord.foodRevenue || 0) : (day.foodRevenue || 0);
    const bevRevenue = masterRecord ? (masterRecord.beverageRevenue || 0) : (day.bevRevenue || 0);
    const totalRevenue = foodRevenue + bevRevenue;
    
    return {
      name: `${day.day}`,
      fohWages: day.fohWages || 0,
      kitchenWages: day.kitchenWages || 0,
      totalWages: (day.fohWages || 0) + (day.kitchenWages || 0),
      totalRevenue: totalRevenue,
      percentage: totalRevenue > 0 
        ? (((day.fohWages || 0) + (day.kitchenWages || 0)) / totalRevenue) * 100 
        : 0
    };
  });

  const CustomLegend = () => {
    const allSeries = [
      { dataKey: 'fohWages', value: 'FOH Wages', color: '#4f46e5' },
      { dataKey: 'kitchenWages', value: 'Kitchen Wages', color: '#059669' },
      { dataKey: 'totalWages', value: 'Total Wages', color: '#d97706' },
      { dataKey: 'totalRevenue', value: 'Revenue', color: '#0ea5e9' }
    ];
    
    const toggleItem = (dataKey: keyof VisibleSeries) => {
      const visibleCount = Object.values(visibleSeries).filter(Boolean).length;
      
      if (visibleSeries[dataKey] && visibleCount <= 1) {
        toast.info("At least one series must remain visible");
        return;
      }
      
      setVisibleSeries(prev => ({
        ...prev,
        [dataKey]: !prev[dataKey]
      }));
    };
    
    return (
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        {allSeries.map((entry, index) => {
          const isActive = visibleSeries[entry.dataKey as keyof VisibleSeries];
          return (
            <div 
              key={`item-${index}`}
              className={`flex items-center gap-2 px-3 py-1 cursor-pointer rounded-md transition-all ${isActive ? 'opacity-100' : 'opacity-50'}`}
              onClick={() => toggleItem(entry.dataKey as keyof VisibleSeries)}
            >
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: entry.color }} 
              />
              <span>{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center text-muted-foreground">Loading analytics data...</div>
        </CardContent>
      </Card>
    );
  }

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
          <p className="text-sm text-muted-foreground">Click on legend items to toggle visibility</p>
        </CardHeader>
        <CardContent className="h-[500px] w-full">
          <ChartContainer
            config={{
              fohWages: { color: "#4f46e5" },
              kitchenWages: { color: "#059669" },
              totalWages: { color: "#d97706" },
              totalRevenue: { color: "#0ea5e9" }
            }}
          >
            <BarChart 
              data={dailyChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                height={60}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}  
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend 
                content={<CustomLegend />}
                wrapperStyle={{ paddingTop: 20, bottom: 0 }}
              />
              {visibleSeries.fohWages && (
                <Bar 
                  yAxisId="left" 
                  dataKey="fohWages" 
                  name="FOH Wages" 
                  fill="#4f46e5" 
                />
              )}
              {visibleSeries.kitchenWages && (
                <Bar 
                  yAxisId="left" 
                  dataKey="kitchenWages" 
                  name="Kitchen Wages" 
                  fill="#059669" 
                />
              )}
              {visibleSeries.totalWages && (
                <Bar 
                  yAxisId="left" 
                  dataKey="totalWages" 
                  name="Total Wages" 
                  fill="#d97706" 
                />
              )}
              {visibleSeries.totalRevenue && (
                <Bar 
                  yAxisId="right" 
                  dataKey="totalRevenue" 
                  name="Revenue" 
                  fill="#0ea5e9" 
                />
              )}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
