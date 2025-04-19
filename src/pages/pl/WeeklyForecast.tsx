import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowUpRight, Droplets, Thermometer, Wind } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useForecastData } from './hooks/useForecastData';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RevenueTagManager } from './components/revenue-tags/RevenueTagManager';

export default function WeeklyForecast() {
  const { 
    forecastData, 
    isLoading, 
    error,
    refreshForecast,
    totalForecastedRevenue,
    totalForecastedFoodRevenue,
    totalForecastedBevRevenue
  } = useForecastData();
  
  if (error) {
    return (
      <div className="container py-8 text-[#48495e]">
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={refreshForecast} variant="outline" className="flex items-center gap-2">
              <RefreshCw size={16} />
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8 text-[#48495e]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#342640]">Weekly Revenue Forecast</h1>
        <Button onClick={refreshForecast} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh Forecast
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Total Forecast</CardTitle>
            <CardDescription>Expected revenue for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{formatCurrency(totalForecastedRevenue)}</span>
                <div className="text-sm text-muted-foreground mt-2">
                  Based on weather forecast and historical patterns
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Food Revenue</CardTitle>
            <CardDescription>Expected food sales</CardDescription>
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
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Beverage Revenue</CardTitle>
            <CardDescription>Expected beverage sales</CardDescription>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <RevenueTagManager
        tags={[]} // TODO: Pass actual tags
        taggedDates={[]} // TODO: Pass actual tagged dates
        onAddTag={(tag) => {
          // TODO: Implement tag creation
          console.log('Adding tag:', tag);
        }}
        onTagDate={(date, tagId, impacts) => {
          // TODO: Implement date tagging
          console.log('Tagging date:', { date, tagId, impacts });
        }}
      />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Daily Forecast Breakdown</CardTitle>
          <CardDescription>7-day forecast with weather impacts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Weather</TableHead>
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
                        <span>{day.weatherDescription}</span>
                        <div className="flex items-center text-xs text-gray-500 ml-1">
                          <Thermometer size={12} className="mr-1" />
                          {day.temperature}°C
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
        <CardFooter className="text-sm text-muted-foreground">
          Forecast calculated based on historical data and weather pattern analysis.
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Forecast Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-4">
            <p>
              This forecast is generated using a combination of historical sales data and weather forecasts. 
              The system analyzes how different weather conditions have affected sales on specific days of the week
              over the past three months to create predictions.
            </p>
            <p>
              The confidence score indicates how reliable each prediction is based on the amount of historical data available
              and the consistency of patterns observed. Higher confidence means more reliable forecasts.
            </p>
            <p>
              Additional factors that influence the forecast:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Temperature effects on food vs. beverage sales</li>
              <li>Precipitation impact on overall footfall</li>
              <li>Day of week patterns and seasonal trends</li>
              <li>Recent sales performance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const WeatherIcon: React.FC<{ description: string }> = ({ description }) => {
  const desc = description.toLowerCase();
  
  if (desc === 'no weather data' || desc === 'n/a') {
    return <div className="text-gray-400 text-xs">N/A</div>;
  }
  
  if (desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle')) {
    return <Droplets size={18} className="text-blue-500" />;
  } else if (desc.includes('cloud')) {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
      <path d="M17.5 17H9C6.79086 17 5 15.2091 5 13C5 10.7909 6.79086 9 9 9C9.12581 9 9.25033 9.00461 9.37308 9.01379C10.0483 7.21021 11.8742 6 14 6C16.7614 6 19 8.23858 19 11C19 12.1394 18.5889 13.1869 17.9008 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>;
  } else if (desc.includes('sun') || desc.includes('clear')) {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-500">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 21V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.9498 7.05025L18.364 5.63604" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.63608 18.364L7.05029 16.9498" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 12L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 12L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.9498 16.9498L18.364 18.364" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.63608 5.63602L7.05029 7.05023" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>;
  } else if (desc.includes('fog') || desc.includes('mist')) {
    return <Wind size={18} className="text-gray-400" />;
  } else if (desc.includes('thunder') || desc.includes('storm')) {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-600">
      <path d="M13 9L10 15H14L11 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3L17 7H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>;
  }
  
  // Default icon
  return <Thermometer size={18} className="text-gray-500" />;
};

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  let variant = "outline";
  let label = "Low";
  
  if (confidence >= 80) {
    variant = "default";
    label = "High";
  } else if (confidence >= 60) {
    variant = "secondary";
    label = "Medium";
  }
  
  return (
    <Badge variant={variant as any} className="whitespace-nowrap">
      {label} ({confidence}%)
    </Badge>
  );
};
