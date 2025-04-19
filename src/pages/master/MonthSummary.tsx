import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Edit } from 'lucide-react';
import { fetchMasterMonthlyRecords } from '@/services/master-record-service';
import { RevenueForecast, MasterDailyRecord } from '@/types/master-record-types';
import { generateRevenueForecast } from '@/services/forecast-service';

const MasterMonthSummary = () => {
  const params = useParams<{ year: string; month: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MasterDailyRecord[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, RevenueForecast>>({});
  
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
  const month = params.month ? parseInt(params.month, 10) : new Date().getMonth() + 1;
  
  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      try {
        const fetchedRecords = await fetchMasterMonthlyRecords(year, month);
        setRecords(fetchedRecords);
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const forecastData = await generateRevenueForecast(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        );
        
        const forecastMap: Record<string, RevenueForecast> = {};
        forecastData.forEach(forecast => {
          forecastMap[forecast.date] = forecast;
        });
        setForecasts(forecastMap);
        
      } catch (error) {
        console.error('Error loading monthly records:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecords();
  }, [year, month]);
  
  const recordsByWeek: Record<number, MasterDailyRecord[]> = {};
  records.forEach(record => {
    const hasData = record.foodRevenue > 0 || record.beverageRevenue > 0 || 
                   record.lunchCovers > 0 || record.dinnerCovers > 0;
    
    const recordDate = new Date(record.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastOrToday = recordDate <= today;
    
    if (!recordsByWeek[record.weekNumber]) {
      recordsByWeek[record.weekNumber] = [];
    }
    recordsByWeek[record.weekNumber].push(record);
  });
  
  const filteredWeeks: Record<number, MasterDailyRecord[]> = {};
  Object.entries(recordsByWeek).forEach(([weekNum, weekRecords]) => {
    const weekNumber = parseInt(weekNum);
    
    const weekHasData = weekRecords.some(record => 
      record.foodRevenue > 0 || record.beverageRevenue > 0 || 
      record.lunchCovers > 0 || record.dinnerCovers > 0);
    
    const weekContainsPastOrToday = weekRecords.some(record => {
      const recordDate = new Date(record.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return recordDate <= today;
    });
    
    if (weekHasData || weekContainsPastOrToday) {
      filteredWeeks[weekNumber] = weekRecords;
    }
  });
  
  const totalFoodRevenue = records.reduce((sum, record) => sum + record.foodRevenue, 0);
  const totalBeverageRevenue = records.reduce((sum, record) => sum + record.beverageRevenue, 0);
  const totalRevenue = totalFoodRevenue + totalBeverageRevenue;
  const totalLunchCovers = records.reduce((sum, record) => sum + record.lunchCovers, 0);
  const totalDinnerCovers = records.reduce((sum, record) => sum + record.dinnerCovers, 0);
  const totalCovers = totalLunchCovers + totalDinnerCovers;
  
  const weeklyForecasts: Record<number, { 
    forecastRevenue: number, 
    actualRevenue: number,
    variance: number,
    variancePercentage: number 
  }> = {};
  
  Object.entries(recordsByWeek).forEach(([weekNum, weekRecords]) => {
    const weekForecast = weekRecords.reduce((sum, record) => {
      const forecast = forecasts[record.date];
      return sum + (forecast ? forecast.foodRevenue + forecast.beverageRevenue : 0);
    }, 0);
    
    const actualRevenue = weekRecords.reduce((sum, record) => 
      sum + record.foodRevenue + record.beverageRevenue, 0);
      
    const variance = actualRevenue - weekForecast;
    const variancePercentage = weekForecast > 0 ? (variance / weekForecast) * 100 : 0;
    
    weeklyForecasts[parseInt(weekNum)] = {
      forecastRevenue: weekForecast,
      actualRevenue,
      variance,
      variancePercentage
    };
  });
  
  const navigateToWeek = (weekNumber: number) => {
    navigate(`/master/week/${year}/${month}/${weekNumber}`);
  };
  
  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-xl">Master Records - {format(new Date(year, month - 1, 1), 'MMMM yyyy')}</CardTitle>
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
            </span>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Monthly Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">£{totalFoodRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Food Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">£{totalBeverageRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Beverage Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalCovers}</div>
                  <p className="text-xs text-muted-foreground">Total Covers</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <h3 className="text-lg font-medium my-4">Weekly Breakdown</h3>
          
          {Object.entries(filteredWeeks).map(([weekNum, weekRecords]) => {
            const weekNumber = parseInt(weekNum);
            const weekTotal = weekRecords.reduce((sum, record) => sum + record.foodRevenue + record.beverageRevenue, 0);
            const weekCovers = weekRecords.reduce((sum, record) => sum + record.lunchCovers + record.dinnerCovers, 0);
            const weekForecast = weeklyForecasts[weekNumber];
            
            return (
              <Card key={`week-${weekNumber}`} className="mb-6">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-md">
                    Week {weekNumber} &mdash; 
                    <span className="text-sm font-normal ml-2 text-muted-foreground">
                      {weekRecords.length > 0 && 
                        `${format(new Date(weekRecords[0].date), 'MMM d')} - ${format(new Date(weekRecords[weekRecords.length - 1].date), 'MMM d')}`
                      }
                    </span>
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateToWeek(weekNumber)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Actual Revenue:</p>
                      <p className="text-lg font-bold">£{weekTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Forecast Revenue:</p>
                      <p className="text-lg font-bold">£{weekForecast.forecastRevenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Variance:</p>
                      <p className={`text-lg font-bold ${weekForecast.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {weekForecast.variance >= 0 ? '+' : ''}£{weekForecast.variance.toFixed(2)}
                        <span className="text-sm ml-1">
                          ({weekForecast.variancePercentage >= 0 ? '+' : ''}
                          {weekForecast.variancePercentage.toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Covers:</p>
                      <p className="text-lg font-bold">{weekCovers}</p>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Food Revenue</TableHead>
                        <TableHead>Food Forecast</TableHead>
                        <TableHead>Food Variance</TableHead>
                        <TableHead>Bev Revenue</TableHead>
                        <TableHead>Bev Forecast</TableHead>
                        <TableHead>Bev Variance</TableHead>
                        <TableHead>Total Revenue</TableHead>
                        <TableHead>Total Forecast</TableHead>
                        <TableHead>Total Variance</TableHead>
                        <TableHead>Covers</TableHead>
                        <TableHead>Weather</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weekRecords.map(record => {
                        const forecast = forecasts[record.date] || { foodRevenue: 0, beverageRevenue: 0 };
                        const foodVariance = record.foodRevenue - forecast.foodRevenue;
                        const bevVariance = record.beverageRevenue - forecast.beverageRevenue;
                        const totalVariance = foodVariance + bevVariance;
                        
                        return (
                          <TableRow key={record.date}>
                            <TableCell>
                              {format(new Date(record.date), 'EEE, MMM d')}
                            </TableCell>
                            <TableCell>£{record.foodRevenue.toFixed(2)}</TableCell>
                            <TableCell>£{forecast.foodRevenue.toFixed(2)}</TableCell>
                            <TableCell className={foodVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {foodVariance >= 0 ? '+' : ''}£{foodVariance.toFixed(2)}
                            </TableCell>
                            <TableCell>£{record.beverageRevenue.toFixed(2)}</TableCell>
                            <TableCell>£{forecast.beverageRevenue.toFixed(2)}</TableCell>
                            <TableCell className={bevVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {bevVariance >= 0 ? '+' : ''}£{bevVariance.toFixed(2)}
                            </TableCell>
                            <TableCell>£{(record.foodRevenue + record.beverageRevenue).toFixed(2)}</TableCell>
                            <TableCell>£{(forecast.foodRevenue + forecast.beverageRevenue).toFixed(2)}</TableCell>
                            <TableCell className={totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {totalVariance >= 0 ? '+' : ''}£{totalVariance.toFixed(2)}
                            </TableCell>
                            <TableCell>{record.lunchCovers + record.dinnerCovers}</TableCell>
                            <TableCell>{record.weatherDescription || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-medium">
                        <TableCell>Week Total</TableCell>
                        <TableCell>£{weekRecords.reduce((sum, r) => sum + r.foodRevenue, 0).toFixed(2)}</TableCell>
                        <TableCell>£{weekRecords.reduce((sum, r) => sum + (forecasts[r.date]?.foodRevenue || 0), 0).toFixed(2)}</TableCell>
                        <TableCell 
                          className={
                            weekRecords.reduce((sum, r) => sum + (r.foodRevenue - (forecasts[r.date]?.foodRevenue || 0)), 0) >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }
                        >
                          £{weekRecords.reduce((sum, r) => sum + (r.foodRevenue - (forecasts[r.date]?.foodRevenue || 0)), 0).toFixed(2)}
                        </TableCell>
                        <TableCell>£{weekRecords.reduce((sum, r) => sum + r.beverageRevenue, 0).toFixed(2)}</TableCell>
                        <TableCell>£{weekRecords.reduce((sum, r) => sum + (forecasts[r.date]?.beverageRevenue || 0), 0).toFixed(2)}</TableCell>
                        <TableCell 
                          className={
                            weekRecords.reduce((sum, r) => sum + (r.beverageRevenue - (forecasts[r.date]?.beverageRevenue || 0)), 0) >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }
                        >
                          £{weekRecords.reduce((sum, r) => sum + (r.beverageRevenue - (forecasts[r.date]?.beverageRevenue || 0)), 0).toFixed(2)}
                        </TableCell>
                        <TableCell>£{weekTotal.toFixed(2)}</TableCell>
                        <TableCell>£{weekForecast.forecastRevenue.toFixed(2)}</TableCell>
                        <TableCell 
                          className={
                            weekForecast.variance >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }
                        >
                          £{weekForecast.variance.toFixed(2)}
                        </TableCell>
                        <TableCell>{weekCovers}</TableCell>
                        <TableCell>—</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterMonthSummary;
