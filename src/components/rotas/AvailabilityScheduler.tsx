import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const days = [
  { id: 'mon', name: 'Monday' },
  { id: 'tue', name: 'Tuesday' },
  { id: 'wed', name: 'Wednesday' },
  { id: 'thu', name: 'Thursday' },
  { id: 'fri', name: 'Friday' },
  { id: 'sat', name: 'Saturday' },
  { id: 'sun', name: 'Sunday' }
];

const timeSlots = [];
for (let hour = 0; hour < 24; hour++) {
  timeSlots.push({
    value: `${hour.toString().padStart(2, '0')}:00`,
    label: `${hour}:00`
  });
}

export default function AvailabilityScheduler({ value, onChange }) {
  const [availability, setAvailability] = useState([]);

  // Initialize with the provided value or empty array
  useEffect(() => {
    if (Array.isArray(value)) {
      setAvailability(value);
    } else {
      setAvailability([]);
    }
  }, [value]);

  const isAvailable = (day) => {
    return availability.some(a => a.day === day);
  };

  const getTimeBlocks = (day) => {
    return availability.filter(a => a.day === day);
  };

  const toggleDayAvailability = (day, isChecked) => {
    if (isChecked) {
      // Add default time block for the day (9am to 5pm)
      const newBlock = {
        day,
        start: '09:00',
        end: '17:00'
      };
      const newAvailability = [...availability, newBlock];
      setAvailability(newAvailability);
      onChange(newAvailability);
    } else {
      // Remove all time blocks for the day
      const newAvailability = availability.filter(a => a.day !== day);
      setAvailability(newAvailability);
      onChange(newAvailability);
    }
  };

  const updateTimeBlock = (index, field, value) => {
    const newAvailability = [...availability];
    newAvailability[index][field] = value;
    
    // Ensure end time is after start time
    if (field === 'start' && value >= newAvailability[index].end) {
      // Find next time slot for end
      const startIndex = timeSlots.findIndex(slot => slot.value === value);
      if (startIndex < timeSlots.length - 1) {
        newAvailability[index].end = timeSlots[startIndex + 1].value;
      }
    }
    
    setAvailability(newAvailability);
    onChange(newAvailability);
  };

  const addTimeBlock = (day) => {
    // Find existing blocks for this day
    const dayBlocks = availability.filter(a => a.day === day);
    
    // Default new block from 9am to 5pm, or non-overlapping with existing blocks
    let start = '09:00', end = '17:00';
    if (dayBlocks.length > 0) {
      const lastBlock = dayBlocks[dayBlocks.length - 1];
      const lastEndIndex = timeSlots.findIndex(slot => slot.value === lastBlock.end);
      if (lastEndIndex < timeSlots.length - 2) {
        start = timeSlots[lastEndIndex].value;
        end = timeSlots[lastEndIndex + 2].value;
      }
    }
    
    const newBlock = { day, start, end };
    const newAvailability = [...availability, newBlock];
    setAvailability(newAvailability);
    onChange(newAvailability);
  };

  const removeTimeBlock = (index) => {
    const newAvailability = [...availability];
    const day = newAvailability[index].day;
    newAvailability.splice(index, 1);
    
    // If this was the last block for the day, toggle the day off
    if (!newAvailability.some(a => a.day === day)) {
      // No need to do anything special here, as the day is no longer in the availability
    }
    
    setAvailability(newAvailability);
    onChange(newAvailability);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Set which days and times this team member is available to work.
      </p>
      
      <div className="space-y-6">
        {days.map(day => (
          <div key={day.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id={`day-${day.id}`}
                  checked={isAvailable(day.id)}
                  onCheckedChange={(checked) => toggleDayAvailability(day.id, checked)}
                />
                <Label htmlFor={`day-${day.id}`} className="font-medium">
                  {day.name}
                </Label>
              </div>
              
              {isAvailable(day.id) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addTimeBlock(day.id)}
                  className="text-xs h-7 px-2"
                >
                  + Add Time Block
                </Button>
              )}
            </div>
            
            {isAvailable(day.id) && (
              <div className="pl-6 space-y-2">
                {getTimeBlocks(day.id).map((block, index) => {
                  const blockIndex = availability.findIndex(a => a === block);
                  return (
                    <div key={blockIndex} className="flex items-center gap-2">
                      <Select 
                        value={block.start} 
                        onValueChange={(value) => updateTimeBlock(blockIndex, 'start', value)}
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-auto" align="start">
                          <ScrollArea className="h-[200px]">
                            {timeSlots.map(slot => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.label}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      
                      <span className="text-muted-foreground">to</span>
                      
                      <Select 
                        value={block.end} 
                        onValueChange={(value) => updateTimeBlock(blockIndex, 'end', value)}
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-auto" align="start">
                          <ScrollArea className="h-[200px]">
                            {timeSlots.map(slot => (
                              <SelectItem 
                                key={slot.value} 
                                value={slot.value}
                                disabled={slot.value <= block.start}
                              >
                                {slot.label}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeTimeBlock(blockIndex)}
                      >
                        &times;
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
