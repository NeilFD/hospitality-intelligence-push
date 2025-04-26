import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { DayPicker } from "react-day-picker"
import { formatCurrency } from '@/lib/date-utils';
import { MasterDailyRecord } from '@/types/master-record-types';
import { upsertMasterDailyRecord } from '@/services/master-record-service';
import { toast } from "sonner";

interface DailyRecordFormProps {
  date: string;
  dayOfWeek: string;
  initialData?: MasterDailyRecord;
  forecastData?: {
    foodRevenue: number;
    beverageRevenue: number;
    totalRevenue: number;
  };
  onSave?: (data: MasterDailyRecord) => void;
}

const DailyRecordForm = ({ date, dayOfWeek, initialData, forecastData, onSave }: DailyRecordFormProps) => {
  const [formData, setFormData] = useState<Partial<MasterDailyRecord>>({
    date,
    dayOfWeek,
    foodRevenue: 0,
    beverageRevenue: 0,
    lunchCovers: 0,
    dinnerCovers: 0,
    weatherDescription: '',
    temperature: 0,
    precipitation: 0,
    windSpeed: 0,
    dayFohTeam: '',
    dayFohManager: '',
    dayKitchenTeam: '',
    dayKitchenManager: '',
    eveningFohTeam: '',
    eveningFohManager: '',
    eveningKitchenTeam: '',
    eveningKitchenManager: '',
    localEvents: '',
    operationsNotes: ''
  });
  
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date,
        dayOfWeek
      });
    } else {
      setFormData({
        date,
        dayOfWeek,
        foodRevenue: 0,
        beverageRevenue: 0,
        lunchCovers: 0,
        dinnerCovers: 0,
        weatherDescription: '',
        temperature: 0,
        precipitation: 0,
        windSpeed: 0,
        dayFohTeam: '',
        dayFohManager: '',
        dayKitchenTeam: '',
        dayKitchenManager: '',
        eveningFohTeam: '',
        eveningFohManager: '',
        eveningKitchenTeam: '',
        eveningKitchenManager: '',
        localEvents: '',
        operationsNotes: ''
      });
    }
  }, [initialData, date, dayOfWeek]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let parsedValue: string | number = value;
    
    if (name === 'foodRevenue' || 
        name === 'beverageRevenue' || 
        name === 'lunchCovers' || 
        name === 'dinnerCovers' ||
        name === 'temperature' ||
        name === 'precipitation' ||
        name === 'windSpeed') {
      parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) {
        parsedValue = 0;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setFormData(prev => ({
        ...prev,
        date: formattedDate,
        dayOfWeek: format(date, 'EEEE')
      }));
    }
    setDatePickerOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    try {
      console.log('Submitting form data:', formData);
      
      const savedData = await upsertMasterDailyRecord({
        ...formData,
        date,
        dayOfWeek
      });
      
      console.log('Record saved successfully:', savedData);
      
      if (onSave) {
        onSave(savedData);
      }
      
      toast.success('Record saved successfully');
    } catch (error) {
      console.error('Error saving daily record:', error);
      toast.error('Failed to save record. Please try again.');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gray-50 py-2 px-4">
        <CardTitle className="text-lg">
          {dayOfWeek}, {date}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(new Date(formData.date), "yyyy-MM-dd") : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DayPicker
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Input
                type="text"
                id="dayOfWeek"
                name="dayOfWeek"
                value={formData.dayOfWeek || ''}
                readOnly
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="foodRevenue">Food Revenue</Label>
              <Input
                type="number"
                id="foodRevenue"
                name="foodRevenue"
                value={formData.foodRevenue !== undefined ? formData.foodRevenue : ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="beverageRevenue">Beverage Revenue</Label>
              <Input
                type="number"
                id="beverageRevenue"
                name="beverageRevenue"
                value={formData.beverageRevenue !== undefined ? formData.beverageRevenue : ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lunchCovers">Lunch Covers</Label>
              <Input
                type="number"
                id="lunchCovers"
                name="lunchCovers"
                value={formData.lunchCovers !== undefined ? formData.lunchCovers : ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="dinnerCovers">Dinner Covers</Label>
              <Input
                type="number"
                id="dinnerCovers"
                name="dinnerCovers"
                value={formData.dinnerCovers !== undefined ? formData.dinnerCovers : ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                type="number"
                id="temperature"
                name="temperature"
                value={formData.temperature !== undefined ? formData.temperature : ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="precipitation">Precipitation</Label>
              <Input
                type="number"
                id="precipitation"
                name="precipitation"
                value={formData.precipitation !== undefined ? formData.precipitation : ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="windSpeed">Wind Speed</Label>
              <Input
                type="number"
                id="windSpeed"
                name="windSpeed"
                value={formData.windSpeed !== undefined ? formData.windSpeed : ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="weatherDescription">Weather Description</Label>
            <Input
              type="text"
              id="weatherDescription"
              name="weatherDescription"
              value={formData.weatherDescription || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dayFohTeam">Day FOH Team</Label>
              <Input
                type="text"
                id="dayFohTeam"
                name="dayFohTeam"
                value={formData.dayFohTeam || ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="dayFohManager">Day FOH Manager</Label>
              <Input
                type="text"
                id="dayFohManager"
                name="dayFohManager"
                value={formData.dayFohManager || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dayKitchenTeam">Day Kitchen Team</Label>
              <Input
                type="text"
                id="dayKitchenTeam"
                name="dayKitchenTeam"
                value={formData.dayKitchenTeam || ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="dayKitchenManager">Day Kitchen Manager</Label>
              <Input
                type="text"
                id="dayKitchenManager"
                name="dayKitchenManager"
                value={formData.dayKitchenManager || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eveningFohTeam">Evening FOH Team</Label>
              <Input
                type="text"
                id="eveningFohTeam"
                name="eveningFohTeam"
                value={formData.eveningFohTeam || ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="eveningFohManager">Evening FOH Manager</Label>
              <Input
                type="text"
                id="eveningFohManager"
                name="eveningFohManager"
                value={formData.eveningFohManager || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eveningKitchenTeam">Evening Kitchen Team</Label>
              <Input
                type="text"
                id="eveningKitchenTeam"
                name="eveningKitchenTeam"
                value={formData.eveningKitchenTeam || ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="eveningKitchenManager">Evening Kitchen Manager</Label>
              <Input
                type="text"
                id="eveningKitchenManager"
                name="eveningKitchenManager"
                value={formData.eveningKitchenManager || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="localEvents">Local Events</Label>
            <Textarea
              id="localEvents"
              name="localEvents"
              value={formData.localEvents || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div>
            <Label htmlFor="operationsNotes">Operations Notes</Label>
            <Textarea
              id="operationsNotes"
              name="operationsNotes"
              value={formData.operationsNotes || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <Button type="submit">Save Record</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DailyRecordForm;
