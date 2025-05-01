
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { TimePickerInput } from '@/components/ui/time-picker-input';
import { useToast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/lib/supabase';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, MinusCircle, AlertCircle, Clock } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Type for day of week
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// Define schema for trough period
const troughPeriodSchema = z.object({
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  max_staff_override: z.number().min(0, "Must be 0 or greater"),
});

// Updated form schema to include troughs
const formSchema = z.object({
  name: z.string().optional(),
  day_of_week: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  job_role_id: z.string().uuid(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  min_staff: z.number().min(1, "Must be at least 1"),
  max_staff: z.number().min(1, "Must be at least 1"),
  priority: z.number().min(1).max(5).default(3),
  troughPeriods: z.array(troughPeriodSchema).optional(),
});

// Form validation type
type FormValues = z.infer<typeof formSchema>;

interface ShiftRuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitComplete: () => void;
  locationId: string;
  jobRoles: any[];
  day?: string | null;
  editingShift?: any | null;
}

export default function ShiftRuleForm({
  isOpen,
  onClose,
  onSubmitComplete,
  locationId,
  jobRoles,
  day = null,
  editingShift = null,
}: ShiftRuleFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [troughPeriods, setTroughPeriods] = useState<any[]>([]);

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      day_of_week: (day as DayOfWeek) || 'mon',
      job_role_id: '',
      start_time: '09:00',
      end_time: '17:00',
      min_staff: 1,
      max_staff: 1,
      priority: 3,
      troughPeriods: [],
    },
  });

  // Load trough periods if the shift exists
  const loadTroughPeriodsData = async (shiftId: string) => {
    if (!shiftId) return [];
    
    try {
      const { data, error } = await supabase
        .from('shift_troughs')
        .select('*')
        .eq('shift_rule_id', shiftId)
        .order('start_time');
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading trough periods:', error);
      return [];
    }
  };

  // Load editing shift data when provided
  useEffect(() => {
    const loadShiftData = async () => {
      if (editingShift) {
        // Load main shift data
        form.reset({
          name: editingShift.name || '',
          day_of_week: editingShift.day_of_week as DayOfWeek,
          job_role_id: editingShift.job_role_id,
          start_time: editingShift.start_time,
          end_time: editingShift.end_time,
          min_staff: editingShift.min_staff,
          max_staff: editingShift.max_staff,
          priority: editingShift.priority,
          troughPeriods: [],
        });
        
        // Load trough periods if the shift exists
        if (editingShift.id) {
          const troughData = await loadTroughPeriodsData(editingShift.id);
          setTroughPeriods(troughData);
        }
      } else {
        // Reset form for a new shift
        form.reset({
          name: '',
          day_of_week: (day as DayOfWeek) || 'mon',
          job_role_id: jobRoles.length > 0 ? jobRoles[0].id : '',
          start_time: '09:00',
          end_time: '17:00',
          min_staff: 1,
          max_staff: 1,
          priority: 3,
          troughPeriods: [],
        });
        setTroughPeriods([]);
      }
    };

    if (isOpen) {
      loadShiftData();
    }
  }, [isOpen, editingShift, form, day, jobRoles]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      let shiftRuleId: string;
      
      // 1. Insert/update the main shift rule
      if (editingShift) {
        // Update existing shift rule
        const { error } = await supabase
          .from('shift_rules')
          .update({
            name: values.name,
            day_of_week: values.day_of_week,
            job_role_id: values.job_role_id,
            start_time: values.start_time,
            end_time: values.end_time,
            min_staff: values.min_staff,
            max_staff: values.max_staff,
            priority: values.priority,
          })
          .eq('id', editingShift.id);
        
        if (error) throw error;
        shiftRuleId = editingShift.id;
        
      } else {
        // Insert new shift rule
        const { data, error } = await supabase
          .from('shift_rules')
          .insert({
            name: values.name,
            day_of_week: values.day_of_week,
            job_role_id: values.job_role_id,
            location_id: locationId,
            start_time: values.start_time,
            end_time: values.end_time,
            min_staff: values.min_staff,
            max_staff: values.max_staff,
            priority: values.priority,
          })
          .select('id')
          .single();
        
        if (error) throw error;
        shiftRuleId = data.id;
      }
      
      // 2. Handle trough periods - delete existing ones first
      if (editingShift) {
        const { error: deleteError } = await supabase
          .from('shift_troughs')
          .delete()
          .eq('shift_rule_id', shiftRuleId);
          
        if (deleteError) throw deleteError;
      }
      
      // 3. Insert new trough periods if any
      if (troughPeriods.length > 0) {
        const troughsToInsert = troughPeriods.map(trough => ({
          shift_rule_id: shiftRuleId,
          start_time: trough.start_time,
          end_time: trough.end_time,
          max_staff_override: trough.max_staff_override,
        }));
        
        const { error: insertTroughsError } = await supabase
          .from('shift_troughs')
          .insert(troughsToInsert);
          
        if (insertTroughsError) throw insertTroughsError;
      }
      
      toast({
        title: `Shift ${editingShift ? 'Updated' : 'Created'}`,
        description: `The shift has been successfully ${editingShift ? 'updated' : 'created'}.`,
      });
      
      onSubmitComplete();
      onClose();
    } catch (error) {
      console.error('Error saving shift rule:', error);
      toast({
        variant: "destructive",
        title: "Error Saving Shift",
        description: "There was a problem saving the shift rule.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add a new trough period
  const addTroughPeriod = () => {
    // Default start/end times positioned in middle of shift
    const shiftStart = form.getValues('start_time');
    const shiftEnd = form.getValues('end_time');
    
    // Parse times and calculate mid-point for default trough position
    const defaultStart = '14:00';
    const defaultEnd = '16:00';
    
    setTroughPeriods([
      ...troughPeriods,
      {
        start_time: defaultStart,
        end_time: defaultEnd,
        max_staff_override: Math.max(1, form.getValues('max_staff') - 1)
      }
    ]);
  };
  
  // Remove a trough period
  const removeTroughPeriod = (index: number) => {
    const newTroughPeriods = [...troughPeriods];
    newTroughPeriods.splice(index, 1);
    setTroughPeriods(newTroughPeriods);
  };
  
  // Update a trough period field
  const updateTroughPeriod = (index: number, field: string, value: any) => {
    const newTroughPeriods = [...troughPeriods];
    newTroughPeriods[index] = {
      ...newTroughPeriods[index],
      [field]: value
    };
    setTroughPeriods(newTroughPeriods);
  };
  
  const getDayName = (dayCode: string) => {
    const days: Record<string, string> = {
      'mon': 'Monday',
      'tue': 'Tuesday',
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday',
    };
    return days[dayCode] || dayCode;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editingShift ? 'Edit Shift' : 'Create New Shift'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift Name (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Morning FOH Staff" {...field} />
                  </FormControl>
                  <FormDescription>
                    If left blank, the role name will be used.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Day of Week Field */}
            <FormField
              control={form.control}
              name="day_of_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of Week</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={day !== null}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                        <SelectItem key={day} value={day}>
                          {getDayName(day)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select which day of the week this shift applies to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Job Role Field */}
            <FormField
              control={form.control}
              name="job_role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobRoles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The job role that staff will be assigned to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Time Range Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <TimePickerInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <TimePickerInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Staff Range Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_staff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Staff</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Slider
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                          min={1}
                          max={10}
                          step={1}
                          className="flex-1 mr-4"
                        />
                        <span className="w-8 text-center">{field.value}</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="max_staff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Staff</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Slider
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                          min={1}
                          max={10}
                          step={1}
                          className="flex-1 mr-4"
                        />
                        <span className="w-8 text-center">{field.value}</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Priority Field */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Slider
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        min={1}
                        max={5}
                        step={1}
                        className="flex-1 mr-4"
                      />
                      <div className="w-32 text-center">
                        {field.value === 1 && "Very Low"}
                        {field.value === 2 && "Low"}
                        {field.value === 3 && "Normal"}
                        {field.value === 4 && "High"}
                        {field.value === 5 && "Critical"}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Higher priority shifts will be filled first during scheduling.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trough Periods Section */}
            <Separator className="my-4" />
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="troughs">
                <AccordionTrigger className="flex items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Trough Periods (Quiet Times)</span>
                    {troughPeriods.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {troughPeriods.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <p className="text-sm text-muted-foreground flex-1">
                        Define periods with reduced staffing requirements during predictable quiet times.
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Troughs let you reduce staffing during predictably quiet periods without creating multiple shift rules.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {troughPeriods.map((trough, index) => (
                      <Card key={index} className="border border-muted">
                        <CardContent className="pt-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-semibold">Trough Period {index + 1}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTroughPeriod(index)}
                              >
                                <MinusCircle className="w-4 h-4 text-destructive" />
                                <span className="sr-only">Remove trough period</span>
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <FormLabel className="text-xs" htmlFor={`trough-start-${index}`}>
                                  Start Time
                                </FormLabel>
                                <TimePickerInput 
                                  value={trough.start_time} 
                                  onChange={(value) => updateTroughPeriod(index, 'start_time', value)}
                                  id={`trough-start-${index}`}
                                />
                              </div>
                              
                              <div>
                                <FormLabel className="text-xs" htmlFor={`trough-end-${index}`}>
                                  End Time
                                </FormLabel>
                                <TimePickerInput 
                                  value={trough.end_time} 
                                  onChange={(value) => updateTroughPeriod(index, 'end_time', value)}
                                  id={`trough-end-${index}`}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <FormLabel className="text-xs" htmlFor={`trough-staff-${index}`}>
                                Max Staff During Trough
                              </FormLabel>
                              <div className="flex items-center">
                                <Slider
                                  id={`trough-staff-${index}`}
                                  value={[trough.max_staff_override]}
                                  onValueChange={(values) => updateTroughPeriod(index, 'max_staff_override', values[0])}
                                  min={0}
                                  max={form.getValues('max_staff')}
                                  step={1}
                                  className="flex-1 mr-4"
                                />
                                <span className="w-8 text-center">{trough.max_staff_override}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Must be less than or equal to max staff ({form.getValues('max_staff')})
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={addTroughPeriod}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Trough Period
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingShift ? 'Update Shift' : 'Create Shift')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
