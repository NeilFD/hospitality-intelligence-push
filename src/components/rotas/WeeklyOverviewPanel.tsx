import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Plus, Copy, Calendar, Trash2, Clock, Edit, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ShiftRuleForm from './ShiftRuleForm';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { formatTime } from '@/lib/date-utils';

const days = [
  { id: 'mon', name: 'Monday' },
  { id: 'tue', name: 'Tuesday' },
  { id: 'wed', name: 'Wednesday' },
  { id: 'thu', name: 'Thursday' },
  { id: 'fri', name: 'Friday' },
  { id: 'sat', name: 'Saturday' },
  { id: 'sun', name: 'Sunday' }
];

export default function WeeklyOverviewPanel({ location, jobRoles }) {
  const [expandedDay, setExpandedDay] = useState('mon');
  const [openShiftRule, setOpenShiftRule] = useState<string | null>(null);
  const [shiftRules, setShiftRules] = useState<Record<string, any[]>>({});
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [currentDay, setCurrentDay] = useState('mon');
  const [editingHours, setEditingHours] = useState<{day: string, start: string, end: string} | null>(null);
  const [copyingShift, setCopyingShift] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [isCopyPopoverOpen, setIsCopyPopoverOpen] = useState(false);
  
  // Fetch shift rules when component mounts or location/jobRoles change
  useEffect(() => {
    if (location?.id) {
      fetchShiftRules();
    }
  }, [location]);
  
  const fetchShiftRules = async () => {
    try {
      const { data: rules, error } = await supabase
        .from('shift_rules')
        .select(`
          *,
          job_roles (*)
        `)
        .eq('location_id', location.id);
      
      if (error) {
        throw error;
      }
      
      // Group rules by day
      const rulesByDay = days.reduce((acc, day) => {
        acc[day.id] = rules.filter(rule => rule.day_of_week === day.id);
        return acc;
      }, {});
      
      setShiftRules(rulesByDay);
    } catch (error) {
      console.error('Error fetching shift rules:', error);
      toast.error("Error loading shift rules", {
        description: "There was a problem loading the shift rules."
      });
    }
  };
  
  const handleDeleteShiftRule = async (ruleId) => {
    try {
      const { error } = await supabase
        .from('shift_rules')
        .delete()
        .eq('id', ruleId);
      
      if (error) {
        throw error;
      }
      
      toast.success("Shift rule deleted", {
        description: "The shift rule has been removed."
      });
      
      fetchShiftRules();
    } catch (error) {
      console.error('Error deleting shift rule:', error);
      toast.error("Error deleting shift rule", {
        description: "There was a problem deleting the shift rule."
      });
    }
  };
  
  const handleAddShiftRule = (day) => {
    setCurrentDay(day);
    setIsAddingShift(true);
  };
  
  const handleCopyShift = (rule) => {
    // Initialize selectedDays with all days except the current one set to true
    const initialSelectedDays = days.reduce((acc, day) => {
      acc[day.id] = day.id !== rule.day_of_week;
      return acc;
    }, {});
    
    setSelectedDays(initialSelectedDays);
    setCopyingShift(rule);
    setIsCopyPopoverOpen(true);
  };
  
  const handleDaySelection = (dayId, checked) => {
    setSelectedDays(prev => ({
      ...prev,
      [dayId]: checked
    }));
  };
  
  const handleDuplicateToSelectedDays = async () => {
    if (!copyingShift) return;
    
    try {
      // Get array of day IDs that are selected
      const selectedDayIds = Object.entries(selectedDays)
        .filter(([_, isSelected]) => isSelected)
        .map(([dayId]) => dayId);
      
      if (selectedDayIds.length === 0) {
        toast.info("No days selected", {
          description: "Please select at least one day to copy the shift to."
        });
        return;
      }
      
      // Create new shift rules for selected days
      const newRules = selectedDayIds.map(dayId => ({
        location_id: location.id,
        day_of_week: dayId,
        job_role_id: copyingShift.job_role_id,
        start_time: copyingShift.start_time,
        end_time: copyingShift.end_time,
        min_staff: copyingShift.min_staff,
        max_staff: copyingShift.max_staff,
        revenue_to_staff_ratio: copyingShift.revenue_to_staff_ratio,
        priority: copyingShift.priority,
        required_skill_level: copyingShift.required_skill_level
      }));
      
      const { error } = await supabase
        .from('shift_rules')
        .insert(newRules);
      
      if (error) {
        throw error;
      }
      
      const selectedDayNames = selectedDayIds.map(id => 
        days.find(day => day.id === id)?.name
      ).join(', ');
      
      toast.success("Shift rule duplicated", {
        description: `The shift rule has been duplicated to: ${selectedDayNames}`
      });
      
      fetchShiftRules();
      setIsCopyPopoverOpen(false);
      setCopyingShift(null);
    } catch (error) {
      console.error('Error duplicating shift rules:', error);
      toast.error("Error duplicating shift rules", {
        description: "There was a problem duplicating the shift rules."
      });
    }
  };

  const getOpeningHours = (day) => {
    if (location?.opening_hours && location.opening_hours[day]) {
      return {
        start: location.opening_hours[day].start_time,
        end: location.opening_hours[day].end_time
      };
    }
    return { start: '09:00', end: '23:00' };
  };

  const startEditingHours = (day) => {
    const hours = getOpeningHours(day);
    setEditingHours({
      day,
      start: hours.start,
      end: hours.end
    });
  };

  const handleTimeChange = (field, value) => {
    if (!editingHours) return;
    
    setEditingHours({
      ...editingHours,
      [field]: value
    });
  };

  const saveOpeningHours = async () => {
    if (!editingHours || !location?.id) return;
    
    try {
      // Get current opening hours or initialize empty object
      const updatedOpeningHours = location.opening_hours ? 
        { ...location.opening_hours } : 
        days.reduce((acc, day) => {
          acc[day.id] = {
            start_time: '09:00',
            end_time: '23:00'
          };
          return acc;
        }, {});
      
      // Update the specific day's hours
      updatedOpeningHours[editingHours.day] = {
        start_time: editingHours.start,
        end_time: editingHours.end
      };
      
      // Update location in database
      const { error } = await supabase
        .from('locations')
        .update({ opening_hours: updatedOpeningHours })
        .eq('id', location.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      location.opening_hours = updatedOpeningHours;
      
      toast.success("Opening hours updated", {
        description: `${days.find(d => d.id === editingHours.day)?.name} hours updated successfully.`
      });
      
      // Reset editing state
      setEditingHours(null);
    } catch (error) {
      console.error('Error updating opening hours:', error);
      toast.error("Error updating hours", {
        description: "There was a problem updating the opening hours."
      });
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Weekly Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion
          type="single"
          collapsible
          value={expandedDay}
          onValueChange={setExpandedDay}
          className="space-y-2"
        >
          {days.map((day) => {
            const openingHours = getOpeningHours(day.id);
            const dayRules = shiftRules[day.id] || [];
            const isEditing = editingHours?.day === day.id;
            
            return (
              <AccordionItem 
                value={day.id}
                key={day.id}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold">{day.name}</span>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                          <span>Editing...</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {openingHours.start} - {openingHours.end}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {dayRules.length} shift{dayRules.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Opening Hours</h4>
                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="grid grid-cols-2 gap-2 w-56">
                              <Input
                                type="time"
                                value={editingHours.start}
                                onChange={(e) => handleTimeChange('start', e.target.value)}
                                className="text-sm"
                              />
                              <Input
                                type="time"
                                value={editingHours.end}
                                onChange={(e) => handleTimeChange('end', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingHours(null)}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={saveOpeningHours}>
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-sm text-muted-foreground">
                              {openingHours.start} - {openingHours.end}
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0"
                              onClick={() => startEditingHours(day.id)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => handleAddShiftRule(day.id)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Shift</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Shift Requirements</h4>
                      
                      {dayRules.length === 0 ? (
                        <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          <AlertDescription>
                            No shift rules defined for {day.name} yet.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-2">
                          {dayRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="p-3 border rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{rule.job_roles?.title || 'Unknown Role'}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatTime(rule.start_time)} - {formatTime(rule.end_time)} • 
                                    {rule.min_staff === rule.max_staff ? 
                                      ` ${rule.min_staff} staff` : 
                                      ` ${rule.min_staff}-${rule.max_staff} staff`
                                    }
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Popover open={isCopyPopoverOpen && copyingShift?.id === rule.id}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopyShift(rule)}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-4">
                                      <div className="space-y-4">
                                        <h4 className="font-medium">Copy shift to days</h4>
                                        <div className="space-y-2">
                                          {days.map((day) => (
                                            day.id !== rule.day_of_week && (
                                              <div key={day.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                  id={`copy-${day.id}`} 
                                                  checked={!!selectedDays[day.id]}
                                                  onCheckedChange={(checked) => 
                                                    handleDaySelection(day.id, !!checked)
                                                  }
                                                />
                                                <Label htmlFor={`copy-${day.id}`}>{day.name}</Label>
                                              </div>
                                            )
                                          ))}
                                        </div>
                                        <div className="flex justify-between pt-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                              setIsCopyPopoverOpen(false);
                                              setCopyingShift(null);
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button 
                                            size="sm"
                                            onClick={handleDuplicateToSelectedDays}
                                          >
                                            <Check className="mr-1 h-4 w-4" /> Copy
                                          </Button>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteShiftRule(rule.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      
      <ShiftRuleForm
        isOpen={isAddingShift}
        onClose={() => setIsAddingShift(false)}
        onSubmitComplete={fetchShiftRules}
        locationId={location?.id}
        jobRoles={jobRoles}
        day={currentDay}
      />
    </Card>
  );
}
