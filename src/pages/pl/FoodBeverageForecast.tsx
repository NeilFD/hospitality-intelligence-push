import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForecastData } from './hooks/useForecastData';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { WeatherIcon, Thermometer, Droplets, Wind, ConfidenceBadge } from '@/components/ui/icons';

export default function FoodBeverageForecast() {
  const [activeTab, setActiveTab] = useState<string>('combined');
  
  const { 
    forecastData, 
    isLoading, 
    refreshForecast,
    totalForecastedRevenue,
    totalForecastedFoodRevenue,
    totalForecastedBevRevenue
  } = useForecastData();
  
  // Prepare chart data
  const chartData = forecastData.map(day => ({
    name: format(parseISO(day.date), 'EEE'),
    Food: Math.round(day.foodRevenue),
    Beverage: Math.round(day.beverageRevenue),
    Total: Math.round(day.totalRevenue),
    date: format(parseISO(day.date), 'dd MMM'),
    weather: day.weatherDescription,
    temp: `${day.temperature}°C`
  }));
  
  return (
    <div className="container py-8 text-[#48495e]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#342640]">Food & Beverage Forecast</h1>
        <Button onClick={refreshForecast} variant="outline">
          Refresh Data
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Total Revenue Forecast</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{formatCurrency(totalForecastedRevenue)}</span>
                <div className="flex justify-between mt-2 text-sm">
                  <div>
                    <span className="text-gray-500">Food: </span>
                    <span className="font-medium">{formatCurrency(totalForecastedFoodRevenue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Beverage: </span>
                    <span className="font-medium">{formatCurrency(totalForecastedBevRevenue)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Food Revenue</CardTitle>
            <CardDescription>Forecast breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{formatCurrency(totalForecastedFoodRevenue)}</span>
                <div className="text-sm text-muted-foreground mt-2">
                  {formatPercentage(totalForecastedFoodRevenue / totalForecastedRevenue)} of total forecast
                </div>
                <div className="text-sm mt-1">
                  <span className="text-gray-500">Daily average: </span>
                  <span className="font-medium">
                    {formatCurrency(totalForecastedFoodRevenue / (forecastData.length || 1))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Beverage Revenue</CardTitle>
            <CardDescription>Forecast breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{formatCurrency(totalForecastedBevRevenue)}</span>
                <div className="text-sm text-muted-foreground mt-2">
                  {formatPercentage(totalForecastedBevRevenue / totalForecastedRevenue)} of total forecast
                </div>
                <div className="text-sm mt-1">
                  <span className="text-gray-500">Daily average: </span>
                  <span className="font-medium">
                    {formatCurrency(totalForecastedBevRevenue / (forecastData.length || 1))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Daily Forecast Breakdown</CardTitle>
          <CardDescription>7-day forecast with weather impacts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead className="min-w-[200px]">Weather Forecast</TableHead>
                  <TableHead className="text-right">Food Revenue</TableHead>
                  <TableHead className="text-right">Beverage Revenue</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastData.map(day => (
                  <TableRow key={day.date}>
                    <TableCell>{format(parseISO(day.date), 'dd MMM')}</TableCell>
                    <TableCell>{day.dayOfWeek}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <WeatherIcon description={day.weatherDescription} />
                        <div className="flex flex-col">
                          <span className="font-medium">{day.weatherDescription}</span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Thermometer size={12} className="mr-1" />
                              {day.temperature}°C
                            </span>
                            {day.precipitation > 0 && (
                              <span className="flex items-center">
                                <Droplets size={12} className="mr-1" />
                                {day.precipitation}mm
                              </span>
                            )}
                            <span className="flex items-center">
                              <Wind size={12} className="mr-1" />
                              {day.windSpeed} mph
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(day.foodRevenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(day.beverageRevenue)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(day.totalRevenue)}</TableCell>
                    <TableCell className="text-right">
                      <ConfidenceBadge confidence={day.confidence} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekly Revenue Breakdown</CardTitle>
          <CardDescription>Visualizing food and beverage forecasts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <Tabs defaultValue="combined" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="combined">Combined View</TabsTrigger>
                <TabsTrigger value="food">Food Revenue</TabsTrigger>
                <TabsTrigger value="beverage">Beverage Revenue</TabsTrigger>
              </TabsList>
              
              <TabsContent value="combined" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={0}
                      label={{ value: 'Day of Week', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Revenue (£)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `£${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [`£${value}`, '']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return `${payload[0].payload.date} - ${payload[0].payload.weather}, ${payload[0].payload.temp}`;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Food" fill="#8884d8" name="Food Revenue" />
                    <Bar dataKey="Beverage" fill="#82ca9d" name="Beverage Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="food" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={0}
                      label={{ value: 'Day of Week', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Food Revenue (£)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `£${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [`£${value}`, '']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return `${payload[0].payload.date} - ${payload[0].payload.weather}, ${payload[0].payload.temp}`;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Food" fill="#8884d8" name="Food Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="beverage" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={0}
                      label={{ value: 'Day of Week', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Beverage Revenue (£)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `£${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [`£${value}`, '']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return `${payload[0].payload.date} - ${payload[0].payload.weather}, ${payload[0].payload.temp}`;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Beverage" fill="#82ca9d" name="Beverage Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Weather Impact Analysis</CardTitle>
          <CardDescription>How weather affects your food and beverage sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <p>Based on historical data analysis, here are the key weather impacts on your business:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Hot Weather (&gt;25°C)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Beverage sales increase by approximately 10%</li>
                  <li>Food sales typically decrease by 5%</li>
                  <li>Higher demand for outdoor seating</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Cold Weather (&lt;10°C)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Food sales increase by approximately 5%</li>
                  <li>Beverage sales decrease by 10%</li>
                  <li>Hot beverages and comfort foods are most popular</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Rainy Days</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Overall foot traffic decreases by 15-20%</li>
                  <li>Food delivery orders increase</li>
                  <li>Longer average dining times</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Clear, Sunny Days</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Higher overall revenue</li>
                  <li>More even distribution between food and beverage</li>
                  <li>Higher turnover rate with shorter dining times</li>
                </ul>
              </div>
            </div>
            
            <p className="mt-4">
              This forecast uses a sophisticated algorithm that analyzes historical sales data in relation 
              to recorded weather conditions to predict future revenue with high accuracy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
