import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  ChartContainer,
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
import { ChartBarIcon, Maximize2Icon, Minimize2Icon } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useQuery } from '@tanstack/react-query';
import { fetchTrackerDataByMonth } from '@/services/kitchen-service';

interface AnnualSummaryProps {
  modulePrefix?: string;
  moduleType?: ModuleType;
  chartMargins?: {
    top: number;
    right: number;
    left: number;
    bottom: number;
  };
}

export default function AnnualSummary({ 
  modulePrefix = "", 
  moduleType = "food", 
  chartMargins = { top: 20, right: 50, left: -30, bottom: 20 } 
}: AnnualSummaryProps) {
  const pageTitle = modulePrefix ? `${modulePrefix} Annual Summary` : "Annual Summary";
  const annualRecord = useStore(state => state.annualRecord);
  const isMobile = useIsMobile();
  const currentYear = annualRecord.year;
  
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [annualTotals, setAnnualTotals] = useState({
    revenue: 0,
    purchases: 0,
    grossProfit: 0,
    gpPercentage: 0,
    averageTargetGP: 0
  });
  
  const fetchAndUpdateData = async () => {
    const months = [];
    const defaultTarget = getDefaultTargetGP();
    
    let totalRevenue = 0;
    let totalPurchases = 0;
    let totalTargets = 0;
    let monthsWithData = 0;
    
    for (let i = 0; i < 12; i++) {
      const monthNumber = i + 1;
      const monthName = new Date(2023, i, 1).toLocaleString('default', { month: 'short' });
      
      try {
        const trackerData = await fetchTrackerDataByMonth(currentYear, monthNumber, moduleType);
        
        if (trackerData && trackerData.length > 0) {
          console.log(`Found ${trackerData.length} tracker days for month ${monthNumber}`);
          
          let monthRevenue = 0;
          let monthCost = 0;
          
          for (const day of trackerData) {
            monthRevenue += day.revenue || 0;
            
            const purchasesResponse = await fetch(`https://kfiergoryrnjkewmeriy.supabase.co/rest/v1/tracker_purchases?tracker_data_id=eq.${day.id}`, {
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWVyZ29yeXJuamtld21lcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDk0NDMsImV4cCI6MjA1OTQyNTQ0M30.FJ2lWSSJBfGy3rUUmIYZwPMd6fFlBTO1xHjZrMwT_wY',
                'Content-Type': 'application/json'
              },
            });
            
            const creditNotesResponse = await fetch(`https://kfiergoryrnjkewmeriy.supabase.co/rest/v1/tracker_credit_notes?tracker_data_id=eq.${day.id}`, {
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWVyZ29yeXJuamtld21lcml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDk0NDMsImV4cCI6MjA1OTQyNTQ0M30.FJ2lWSSJBfGy3rUUmIYZwPMd6fFlBTO1xHjZrMwT_wY',
                'Content-Type': 'application/json'
              },
            });
            
            const purchases = await purchasesResponse.json();
            const creditNotes = await creditNotesResponse.json();
            
            const purchasesTotal = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
            const creditNotesTotal = creditNotes.reduce((sum, cn) => sum + (cn.amount || 0), 0);
            const dayCost = purchasesTotal - creditNotesTotal + (day.staff_food_allowance || 0);
            
            monthCost += dayCost;
          }
          
          const grossProfit = monthRevenue - monthCost;
          const gpPercentage = monthRevenue > 0 ? (grossProfit / monthRevenue) * 100 : 0;
          
          const monthRecord = annualRecord.months.find(
            m => m.month === monthNumber && m.year === currentYear
          );
          
          const target = monthRecord ? parseFloat((monthRecord.gpTarget * 100).toFixed(2)) : defaultTarget;
          
          months.push({
            name: monthName,
            month: monthNumber,
            revenue: monthRevenue,
            purchases: monthCost,
            grossProfit,
            gpPercentage: parseFloat(gpPercentage.toFixed(2)),
            target
          });
          
          totalRevenue += monthRevenue;
          totalPurchases += monthCost;
          totalTargets += target;
          monthsWithData++;
          
          console.log(`Month ${monthName}: Revenue ${monthRevenue}, Cost ${monthCost}, GP% ${gpPercentage.toFixed(2)}%`);
        } else {
          const monthRecord = annualRecord.months.find(
            m => m.month === monthNumber && m.year === currentYear
          );
          
          if (monthRecord) {
            let monthRevenue = 0;
            let monthCost = 0;
            
            monthRecord.weeks.forEach(week => {
              week.days.forEach(day => {
                monthRevenue += day.revenue || 0;
                
                const dayPurchases = day.purchases ? 
                  Object.values(day.purchases).reduce((sum, amount) => sum + Number(amount), 0) : 0;
                monthCost += dayPurchases;
                
                monthCost -= day.creditNotes.reduce((sum, amount) => sum + amount, 0);
              });
            });
            
            const grossProfit = monthRevenue - monthCost;
            const gpPercentage = monthRevenue > 0 ? (grossProfit / monthRevenue) * 100 : 0;
            const target = parseFloat((monthRecord.gpTarget * 100).toFixed(2));
            
            months.push({
              name: monthName,
              month: monthNumber,
              revenue: monthRevenue,
              purchases: monthCost,
              grossProfit,
              gpPercentage: parseFloat(gpPercentage.toFixed(2)),
              target
            });
            
            totalRevenue += monthRevenue;
            totalPurchases += monthCost;
            totalTargets += target;
            monthsWithData++;
          } else {
            months.push({
              name: monthName,
              month: monthNumber,
              revenue: 0,
              purchases: 0,
              grossProfit: 0,
              gpPercentage: 0,
              target: defaultTarget
            });
            
            totalTargets += defaultTarget;
            monthsWithData++;
          }
        }
      } catch (error) {
        console.error(`Error processing month ${monthNumber}:`, error);
        
        months.push({
          name: monthName,
          month: monthNumber,
          revenue: 0,
          purchases: 0,
          grossProfit: 0,
          gpPercentage: 0,
          target: defaultTarget
        });
        
        totalTargets += defaultTarget;
        monthsWithData++;
      }
    }
    
    const totalGrossProfit = totalRevenue - totalPurchases;
    const totalGpPercentage = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
    const averageTargetGP = monthsWithData > 0 ? totalTargets / monthsWithData : defaultTarget;
    
    setMonthlyData(months);
    setAnnualTotals({
      revenue: totalRevenue,
      purchases: totalPurchases,
      grossProfit: totalGrossProfit,
      gpPercentage: parseFloat(totalGpPercentage.toFixed(2)),
      averageTargetGP: parseFloat(averageTargetGP.toFixed(2))
    });
  };
  
  const getDefaultTargetGP = () => {
    const existingMonths = annualRecord.months.filter(m => m.year === annualRecord.year);
    if (existingMonths.length > 0) {
      const sortedMonths = [...existingMonths].sort((a, b) => b.month - a.month);
      return parseFloat((sortedMonths[0].gpTarget * 100).toFixed(2));
    }
    return 70;
  };
  
  useEffect(() => {
    fetchAndUpdateData();
  }, [currentYear, moduleType, annualRecord]);
  
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

  const toggleChartExpansion = (chartId: string) => {
    if (expandedChart === chartId) {
      setExpandedChart(null);
    } else {
      setExpandedChart(chartId);
    }
  };
  
  if (isMobile && !expandedChart) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold text-tavern-blue mb-6">{pageTitle}</h1>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{annualTotals.revenue.toFixed(2)}</div>
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
              <div className="text-2xl font-bold">£{annualTotals.grossProfit.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
        
        <Carousel className="mb-6">
          <CarouselContent>
            <CarouselItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5" />
                    Monthly Revenue & Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center min-h-[200px]">
                  <Button 
                    variant="outline" 
                    onClick={() => toggleChartExpansion('revenue')}
                    className="flex items-center gap-2 border-tavern-green bg-tavern-green/10 hover:bg-tavern-green/20 text-tavern-green-dark"
                  >
                    <Maximize2Icon 
                      className="h-5 w-5 text-tavern-blue" 
                      strokeWidth={2.5}
                    />
                    View Chart
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>
            
            <CarouselItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5" />
                    Monthly Gross Profit %
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center min-h-[200px]">
                  <Button 
                    variant="outline" 
                    onClick={() => toggleChartExpansion('gp')}
                    className="flex items-center gap-2 border-tavern-green bg-tavern-green/10 hover:bg-tavern-green/20 text-tavern-green-dark"
                  >
                    <Maximize2Icon 
                      className="h-5 w-5 text-tavern-blue" 
                      strokeWidth={2.5}
                    />
                    View Chart
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-2">
            <CarouselPrevious className="static transform-none" />
            <CarouselNext className="static transform-none" />
          </div>
        </Carousel>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Revenue (£)</TableHead>
                    <TableHead className="text-right">Purchases (£)</TableHead>
                    <TableHead className="text-right">GP %</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((month) => (
                    <TableRow key={month.name}>
                      <TableCell>{month.name}</TableCell>
                      <TableCell className="text-right">£{month.revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">£{month.purchases.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{month.gpPercentage}%</TableCell>
                      <TableCell className={`text-right ${month.gpPercentage >= month.target ? 'text-green-600' : 'text-red-600'}`}>
                        {month.target}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (expandedChart) {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-tavern-blue">{pageTitle}</h1>
          <Button 
            variant="outline" 
            onClick={() => setExpandedChart(null)}
            className="flex items-center gap-2"
          >
            <Minimize2Icon className="h-4 w-4" />
            Back to Summary
          </Button>
        </div>
        
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              {expandedChart === 'revenue' ? 'Monthly Revenue & Purchases' : 'Monthly Gross Profit %'}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer config={chartConfig} className="h-[70vh]">
              <ResponsiveContainer width="100%" height="99%">
                {expandedChart === 'revenue' ? (
                  <BarChart
                    data={monthlyData}
                    margin={chartMargins}
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
                ) : (
                  <LineChart
                    data={monthlyData}
                    margin={chartMargins}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
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
                )}
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold text-tavern-blue mb-6">{pageTitle}</h1>
      
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{annualTotals.revenue.toFixed(2)}</div>
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
            <div className="text-2xl font-bold">£{annualTotals.grossProfit.toFixed(2)}</div>
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
          <CardContent className="overflow-visible p-0">
            <div className="px-0 py-6">
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={chartMargins}
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toggleChartExpansion('revenue')}
              className="flex items-center gap-1 border-tavern-green bg-tavern-green/10 hover:bg-tavern-green/20 text-tavern-green-dark"
            >
              <Maximize2Icon className="h-3 w-3" />
              Expand
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Monthly Gross Profit %
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible p-0">
            <div className="px-0 py-6">
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={chartMargins}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toggleChartExpansion('gp')}
              className="flex items-center gap-1 border-tavern-green bg-tavern-green/10 hover:bg-tavern-green/20 text-tavern-green-dark"
            >
              <Maximize2Icon className="h-3 w-3" />
              Expand
            </Button>
          </CardFooter>
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
                <TableHead className="text-right">Revenue (£)</TableHead>
                <TableHead className="text-right">Purchases (£)</TableHead>
                <TableHead className="text-right">Gross Profit (£)</TableHead>
                <TableHead className="text-right">GP %</TableHead>
                <TableHead className="text-right">Target GP %</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((month) => (
                <TableRow key={month.name}>
                  <TableCell>{month.name}</TableCell>
                  <TableCell className="text-right">£{month.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">£{month.purchases.toFixed(2)}</TableCell>
                  <TableCell className="text-right">£{month.grossProfit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{month.gpPercentage}%</TableCell>
                  <TableCell className="text-right">{month.target}%</TableCell>
                  <TableCell className={`text-right ${month.gpPercentage >= month.target ? 'text-green-600' : 'text-red-600'}`}>
                    {(month.gpPercentage - month.target).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">£{annualTotals.revenue.toFixed(2)}</TableCell>
                <TableCell className="text-right">£{annualTotals.purchases.toFixed(2)}</TableCell>
                <TableCell className="text-right">£{annualTotals.grossProfit.toFixed(2)}</TableCell>
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
