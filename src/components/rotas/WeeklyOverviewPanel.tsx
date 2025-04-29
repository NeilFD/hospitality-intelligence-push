import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Plus, Copy, Calendar, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      toast("Error loading shift rules", {
        description: "There was a problem loading the shift rules.",
        style: { backgroundColor: "#f44336", color: "#fff" },
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
      
      toast("Shift rule deleted", {
        description: "The shift rule has been removed.",
      });
      
      fetchShiftRules();
    } catch (error) {
      console.error('Error deleting shift rule:', error);
      toast("Error deleting shift rule", {
        description: "There was a problem deleting the shift rule.",
        style: { backgroundColor: "#f44336", color: "#fff" },
      });
    }
  };
  
  const handleAddShiftRule = (day) => {
    setCurrentDay(day);
    setIsAddingShift(true);
  };
  
  const handleDuplicateToOtherDays = async (rule) => {
    try {
      // Create new shift rules for all other days
      const otherDays = days.filter(day => day.id !== rule.day_of_week);
      
      const newRules = otherDays.map(day => ({
        location_id: location.id,
        day_of_week: day.id,
        job_role_id: rule.job_role_id,
        start_time: rule.start_time,
        end_time: rule.end_time,
        min_staff: rule.min_staff,
        max_staff: rule.max_staff,
        revenue_to_staff_ratio: rule.revenue_to_staff_ratio,
        priority: rule.priority,
        required_skill_level: rule.required_skill_level
      }));
      
      const { error } = await supabase
        .from('shift_rules')
        .insert(newRules);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Shift rule duplicated',
        description: `The shift rule has been duplicated to all other days.`,
      });
      
      fetchShiftRules();
    } catch (error) {
      console.error('Error duplicating shift rules:', error);
      toast({
        title: 'Error duplicating shift rules',
        description: 'There was a problem duplicating the shift rules.',
        variant: 'destructive',
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
                      <Badge variant="outline" className="text-xs">
                        {openingHours.start} - {openingHours.end}
                      </Badge>
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
                        <p className="text-sm text-muted-foreground">
                          {openingHours.start} - {openingHours.end}
                        </p>
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDuplicateToOtherDays(rule)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
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
