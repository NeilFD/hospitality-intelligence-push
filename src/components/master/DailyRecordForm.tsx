import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency, formatPercentage } from '@/lib/utils';
import { MasterDailyRecord } from '@/types/master-record-types';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMasterDailyRecord } from '@/services/master-record-service';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from 'date-fns';

interface DailyRecordFormProps {
  date: string;
  dayOfWeek: string;
  initialData: MasterDailyRecord;
  forecastData?: {
    foodRevenue: number;
    beverageRevenue: number;
    totalRevenue: number;
  };
  onSave: (data: Partial<MasterDailyRecord>) => Promise<void>;
}

interface Variance {
  variance: number;
  percentage: number;
}

const DailyRecordForm = ({ date, dayOfWeek, initialData, forecastData, onSave }: DailyRecordFormProps) => {
  const [foodRevenue, setFoodRevenue] = useState<number>(initialData?.foodRevenue || 0);
  const [beverageRevenue, setBeverageRevenue] = useState<number>(initialData?.beverageRevenue || 0);
  const [lunchCovers, setLunchCovers] = useState<number>(initialData?.lunchCovers || 0);
  const [dinnerCovers, setDinnerCovers] = useState<number>(initialData?.dinnerCovers || 0);
  
  const [dayFohTeam, setDayFohTeam] = useState<string>(initialData?.dayFohTeam || '');
  const [dayFohManager, setDayFohManager] = useState<string>(initialData?.dayFohManager || '');
  const [dayKitchenTeam, setDayKitchenTeam] = useState<string>(initialData?.dayKitchenTeam || '');
  const [dayKitchenManager, setDayKitchenManager] = useState<string>(initialData?.dayKitchenManager || '');
  const [eveningFohTeam, setEveningFohTeam] = useState<string>(initialData?.eveningFohTeam || '');
  const [eveningFohManager, setEveningFohManager] = useState<string>(initialData?.eveningFohManager || '');
  const [eveningKitchenTeam, setEveningKitchenTeam] = useState<string>(initialData?.eveningKitchenTeam || '');
  const [eveningKitchenManager, setEveningKitchenManager] = useState<string>(initialData?.eveningKitchenManager || '');
  
  const [localEvents, setLocalEvents] = useState<string>(initialData?.localEvents || '');
  const [operationsNotes, setOperationsNotes] = useState<string>(initialData?.operationsNotes || '');
  
  const [previousWeekData, setPreviousWeekData] = useState<MasterDailyRecord | null>(null);
  
  useEffect(() => {
    const fetchPreviousWeekData = async () => {
      try {
        // Calculate previous week's date
        const currentDate = new Date(date);
        const previousWeekDate = new Date(currentDate);
        previousWeekDate.setDate(previousWeekDate.getDate() - 7);
        
        const previousData = await fetchMasterDailyRecord(formatDate(previousWeekDate));
        setPreviousWeekData(previousData);
      } catch (error) {
        console.error('Error fetching previous week data:', error);
      }
    };
    
    fetchPreviousWeekData();
  }, [date]);

  const getVarianceFromPreviousWeek = (current: number, previous: number | undefined) => {
    if (!previous) return { variance: 0, percentage: 0 };
    const variance = current - previous;
    const percentage = previous !== 0 ? (variance / previous) : 0;
    return { variance, percentage };
  };
  
  const totalRevenue = foodRevenue + beverageRevenue;
  const totalCovers = lunchCovers + dinnerCovers;
  const averageCoverSpend = totalCovers > 0 ? totalRevenue / totalCovers : 0;
  
  const handleSave = async () => {
    const dataToSave: Partial<MasterDailyRecord> = {
      id: initialData.id,
      date,
      dayOfWeek,
      year: initialData.year,
      month: initialData.month,
      weekNumber: initialData.weekNumber,
      foodRevenue,
      beverageRevenue,
      totalRevenue,
      lunchCovers,
      dinnerCovers,
      totalCovers,
      averageCoverSpend,
      dayFohTeam,
      dayFohManager,
      dayKitchenTeam,
      dayKitchenManager,
      eveningFohTeam,
      eveningFohManager,
      eveningKitchenTeam,
      eveningKitchenManager,
      localEvents,
      operationsNotes
    };
    
    await onSave(dataToSave);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        {dayOfWeek}, {format(new Date(date), 'MMM d, yyyy')}
      </h2>
      
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-semibold mb-2">Revenue</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Food Revenue</span>
              <span>{formatCurrency(foodRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Beverage Revenue</span>
              <span>{formatCurrency(beverageRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Revenue</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
            {forecastData && (
              <>
                <div className="flex justify-between items-center">
                  <span>Forecasted Food Revenue</span>
                  <span>{formatCurrency(forecastData.foodRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Forecasted Beverage Revenue</span>
                  <span>{formatCurrency(forecastData.beverageRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Forecasted Total Revenue</span>
                  <span>{formatCurrency(forecastData.totalRevenue)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2">Covers & Average Spend</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Lunch Covers</span>
                <div className="flex items-center gap-2">
                  <span>{initialData.lunchCovers}</span>
                  {previousWeekData && (
                    <div className="text-xs">
                      {getVarianceFromPreviousWeek(initialData.lunchCovers, previousWeekData.lunchCovers).percentage > 0 ? (
                        <div className="text-green-500 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {formatPercentage(getVarianceFromPreviousWeek(initialData.lunchCovers, previousWeekData.lunchCovers).percentage)} vs LW
                        </div>
                      ) : (
                        <div className="text-red-500 flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {formatPercentage(getVarianceFromPreviousWeek(initialData.lunchCovers, previousWeekData.lunchCovers).percentage)} vs LW
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Dinner Covers</span>
                <div className="flex items-center gap-2">
                  <span>{initialData.dinnerCovers}</span>
                  {previousWeekData && (
                    <div className="text-xs">
                      {getVarianceFromPreviousWeek(initialData.dinnerCovers, previousWeekData.dinnerCovers).percentage > 0 ? (
                        <div className="text-green-500 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {formatPercentage(getVarianceFromPreviousWeek(initialData.dinnerCovers, previousWeekData.dinnerCovers).percentage)} vs LW
                        </div>
                      ) : (
                        <div className="text-red-500 flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {formatPercentage(getVarianceFromPreviousWeek(initialData.dinnerCovers, previousWeekData.dinnerCovers).percentage)} vs LW
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Total Covers</span>
                <div className="flex items-center gap-2">
                  <span>{initialData.totalCovers}</span>
                  {previousWeekData && (
                    <div className="text-xs">
                      {getVarianceFromPreviousWeek(initialData.totalCovers, previousWeekData.totalCovers).percentage > 0 ? (
                        <div className="text-green-500 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {formatPercentage(getVarianceFromPreviousWeek(initialData.totalCovers, previousWeekData.totalCovers).percentage)} vs LW
                        </div>
                      ) : (
                        <div className="text-red-500 flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {formatPercentage(getVarianceFromPreviousWeek(initialData.totalCovers, previousWeekData.totalCovers).percentage)} vs LW
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Average Cover Spend</span>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(initialData.averageCoverSpend || 0)}</span>
                  {previousWeekData && (
                    <div className="text-xs">
                      {getVarianceFromPreviousWeek(initialData.averageCoverSpend || 0, previousWeekData.averageCoverSpend || 0).percentage > 0 ? (
                        <div className="text-green-500 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {formatPercentage(getVarianceFromPreviousWeek(initialData.averageCoverSpend || 0, previousWeekData.averageCoverSpend || 0).percentage)} vs LW
                        </div>
                      ) : (
                        <div className="text-red-500 flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {formatPercentage(getVarianceFromPreviousWeek(initialData.averageCoverSpend || 0, previousWeekData.averageCoverSpend || 0).percentage)} vs LW
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <h3 className="font-semibold mb-2">Team on Duty</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="dayFohTeam">Day FOH Team</Label>
                <Input type="text" id="dayFohTeam" value={dayFohTeam} onChange={(e) => setDayFohTeam(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dayFohManager">Day FOH Manager</Label>
                <Input type="text" id="dayFohManager" value={dayFohManager} onChange={(e) => setDayFohManager(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dayKitchenTeam">Day Kitchen Team</Label>
                <Input type="text" id="dayKitchenTeam" value={dayKitchenTeam} onChange={(e) => setDayKitchenTeam(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dayKitchenManager">Day Kitchen Manager</Label>
                <Input type="text" id="dayKitchenManager" value={dayKitchenManager} onChange={(e) => setDayKitchenManager(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eveningFohTeam">Evening FOH Team</Label>
                <Input type="text" id="eveningFohTeam" value={eveningFohTeam} onChange={(e) => setEveningFohTeam(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eveningFohManager">Evening FOH Manager</Label>
                <Input type="text" id="eveningFohManager" value={eveningFohManager} onChange={(e) => setEveningFohManager(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eveningKitchenTeam">Evening Kitchen Team</Label>
                <Input type="text" id="eveningKitchenTeam" value={eveningKitchenTeam} onChange={(e) => setEveningKitchenTeam(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eveningKitchenManager">Evening Kitchen Manager</Label>
                <Input type="text" id="eveningKitchenManager" value={eveningKitchenManager} onChange={(e) => setEveningKitchenManager(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-4">
        <CardContent>
          <h3 className="font-semibold mb-2">Contextual Information</h3>
          <div className="space-y-2">
            <div>
              <Label htmlFor="localEvents">Local Events</Label>
              <Input type="text" id="localEvents" value={localEvents} onChange={(e) => setLocalEvents(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="operationsNotes">Operations Notes</Label>
              <Input type="text" id="operationsNotes" value={operationsNotes} onChange={(e) => setOperationsNotes(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <button onClick={handleSave} className="bg-tavern-blue hover:bg-tavern-blue-dark text-white font-semibold py-2 px-4 rounded">
          Save Record
        </button>
      </div>
    </div>
  );
};

export default DailyRecordForm;
