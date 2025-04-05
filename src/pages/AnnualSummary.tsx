import React, { useState } from 'react';
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
  
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  
  const getDefaultTargetGP = () => {
    const existingMonths = annualRecord.months.filter(m => m.year === annualRecord.year);
    if (existingMonths.length > 0) {
      const sortedMonths = [...existingMonths].sort((a, b) => b.month - a.month);
      return parseFloat((sortedMonths[0].gpTarget * 100).toFixed(2));
    }
    return 70;
  };
  
  const monthlyData = React.useMemo(() => {
    const months = [];
    const defaultTarget = getDefaultTargetGP();
    
    for (let i = 0; i < 12; i++) {
      const monthNumber = i + 1;
      const monthName = new Date(2023, i, 1).toLocaleString('default', { month: 'short' });
      
      const monthRecord = annualRecord.months.find(
        m => m.month === monthNumber && m.year === annualRecord.year
      );
      
      if (monthRecord) {
        let totalRevenue = 0;
        let totalPurchases = 0;
        
        monthRecord.weeks.forEach(week => {
          week.days.forEach(day => {
            totalRevenue += day.revenue;
            
            Object.values(day.purchases).forEach(amount => {
              totalPurchases += amount;
            });
            
            totalPurchases -= day.creditNotes.reduce((sum, amount) => sum + amount, 0);
          });
        });
        
        const grossProfit = totalRevenue - totalPurchases;
        const gpPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        
        months.push({
          name: monthName,
          month: monthNumber,
          revenue: totalRevenue,
          purchases: totalPurchases,
          grossProfit,
          gpPercentage: parseFloat(gpPercentage.toFixed(2)),
          target: parseFloat((monthRecord.gpTarget * 100).toFixed(2))
        });
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
      }
    }
    
    return months;
  }, [annualRecord]);
  
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
      
      totals.averageTargetGP = parseFloat(
        (monthlyData.reduce((sum, month) => sum + month.target, 0) / monthlyData.length).toFixed(2)
      );
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
                    <Maximize2Icon className="h-4 w-4" />
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
                    <Maximize2Icon className="h-4 w-4" />
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
