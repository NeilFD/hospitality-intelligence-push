
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Edit } from 'lucide-react';
import { fetchMasterMonthlyRecords } from '@/services/master-record-service';
import { MasterDailyRecord } from '@/types/master-record-types';

const MasterMonthSummary = () => {
  const params = useParams<{ year: string; month: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MasterDailyRecord[]>([]);
  
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
  const month = params.month ? parseInt(params.month, 10) : new Date().getMonth() + 1;
  
  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      try {
        const fetchedRecords = await fetchMasterMonthlyRecords(year, month);
        setRecords(fetchedRecords);
      } catch (error) {
        console.error('Error loading monthly records:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecords();
  }, [year, month]);
  
  // Group by week
  const recordsByWeek: Record<number, MasterDailyRecord[]> = {};
  records.forEach(record => {
    if (!recordsByWeek[record.weekNumber]) {
      recordsByWeek[record.weekNumber] = [];
    }
    recordsByWeek[record.weekNumber].push(record);
  });
  
  // Calculate totals
  const totalFoodRevenue = records.reduce((sum, record) => sum + record.foodRevenue, 0);
  const totalBeverageRevenue = records.reduce((sum, record) => sum + record.beverageRevenue, 0);
  const totalRevenue = totalFoodRevenue + totalBeverageRevenue;
  const totalLunchCovers = records.reduce((sum, record) => sum + record.lunchCovers, 0);
  const totalDinnerCovers = records.reduce((sum, record) => sum + record.dinnerCovers, 0);
  const totalCovers = totalLunchCovers + totalDinnerCovers;
  
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
          
          {Object.entries(recordsByWeek).map(([weekNum, weekRecords]) => {
            const weekNumber = parseInt(weekNum);
            const weekTotal = weekRecords.reduce((sum, record) => sum + record.foodRevenue + record.beverageRevenue, 0);
            const weekCovers = weekRecords.reduce((sum, record) => sum + record.lunchCovers + record.dinnerCovers, 0);
            
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
                      <p className="text-sm font-medium">Revenue:</p>
                      <p className="text-lg font-bold">£{weekTotal.toFixed(2)}</p>
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
                        <TableHead>Bev Revenue</TableHead>
                        <TableHead>Covers</TableHead>
                        <TableHead>Weather</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weekRecords.map(record => (
                        <TableRow key={record.date}>
                          <TableCell>
                            {format(new Date(record.date), 'EEE, MMM d')}
                          </TableCell>
                          <TableCell>£{record.foodRevenue.toFixed(2)}</TableCell>
                          <TableCell>£{record.beverageRevenue.toFixed(2)}</TableCell>
                          <TableCell>{record.lunchCovers + record.dinnerCovers}</TableCell>
                          <TableCell>{record.weatherDescription || '—'}</TableCell>
                        </TableRow>
                      ))}
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
