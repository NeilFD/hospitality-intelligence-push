
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash2, Loader2, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type RotaThresholdEditorProps = {
  location: any;
};

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const segments = [
  { value: 'day', label: 'Day Shift' },
  { value: 'evening', label: 'Evening Shift' },
];

type Threshold = {
  id?: string;
  name: string;
  day_of_week: string;
  segment: string;
  revenue_min: number;
  revenue_max: number;
  foh_min_staff: number;
  foh_max_staff: number;
  kitchen_min_staff: number;
  kitchen_max_staff: number;
  kp_min_staff: number;
  kp_max_staff: number;
  target_cost_percentage: number;
  isNew?: boolean;
};

export default function RotaThresholdEditor({ location }: RotaThresholdEditorProps) {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (location) {
      fetchThresholds();
    }
  }, [location]);

  const fetchThresholds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rota_revenue_thresholds')
        .select('*')
        .eq('location_id', location.id)
        .order('day_of_week')
        .order('segment')
        .order('revenue_min');
        
      if (error) throw error;
      
      setThresholds(data || []);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      toast.error('Failed to load revenue thresholds');
    } finally {
      setIsLoading(false);
    }
  };

  const addNewThreshold = () => {
    const newThreshold: Threshold = {
      name: `Threshold ${thresholds.length + 1}`,
      day_of_week: 'monday',
      segment: 'day',
      revenue_min: 0,
      revenue_max: 2000,
      foh_min_staff: 1,
      foh_max_staff: 4,
      kitchen_min_staff: 1,
      kitchen_max_staff: 2,
      kp_min_staff: 0,
      kp_max_staff: 1,
      target_cost_percentage: 28,
      isNew: true
    };
    
    setThresholds([...thresholds, newThreshold]);
  };

  const duplicateThreshold = (index: number) => {
    const thresholdToDuplicate = thresholds[index];
    const duplicatedThreshold: Threshold = {
      ...thresholdToDuplicate,
      name: `Copy of ${thresholdToDuplicate.name}`,
      isNew: true,
      id: undefined // Remove id to ensure it's treated as new
    };
    
    setThresholds([...thresholds, duplicatedThreshold]);
    
    // Scroll to the bottom to see the new threshold
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
    
    toast.success('Threshold duplicated');
  };

  const removeThreshold = async (index: number) => {
    const threshold = thresholds[index];
    
    // If it's a new threshold that hasn't been saved to the database
    if (threshold.isNew) {
      const newThresholds = [...thresholds];
      newThresholds.splice(index, 1);
      setThresholds(newThresholds);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('rota_revenue_thresholds')
        .delete()
        .eq('id', threshold.id);
        
      if (error) throw error;
      
      const newThresholds = [...thresholds];
      newThresholds.splice(index, 1);
      setThresholds(newThresholds);
      
      toast.success('Threshold deleted successfully');
    } catch (error) {
      console.error('Error deleting threshold:', error);
      toast.error('Failed to delete threshold');
    }
  };

  const updateThreshold = (index: number, field: string, value: any) => {
    const updatedThresholds = [...thresholds];
    updatedThresholds[index] = { ...updatedThresholds[index], [field]: value };
    setThresholds(updatedThresholds);
  };

  const saveThresholds = async () => {
    setIsSaving(true);
    
    try {
      // Separate new and existing thresholds
      const newThresholds = thresholds.filter(t => t.isNew);
      const existingThresholds = thresholds.filter(t => !t.isNew);
      
      // Insert new thresholds
      if (newThresholds.length > 0) {
        const thresholdsToInsert = newThresholds.map(t => ({
          ...t,
          location_id: location.id,
          isNew: undefined // Remove isNew flag
        }));
        
        const { error } = await supabase
          .from('rota_revenue_thresholds')
          .insert(thresholdsToInsert);
          
        if (error) throw error;
      }
      
      // Update existing thresholds
      for (const threshold of existingThresholds) {
        const { error } = await supabase
          .from('rota_revenue_thresholds')
          .update({
            name: threshold.name,
            day_of_week: threshold.day_of_week,
            segment: threshold.segment,
            revenue_min: threshold.revenue_min,
            revenue_max: threshold.revenue_max,
            foh_min_staff: threshold.foh_min_staff,
            foh_max_staff: threshold.foh_max_staff,
            kitchen_min_staff: threshold.kitchen_min_staff,
            kitchen_max_staff: threshold.kitchen_max_staff,
            kp_min_staff: threshold.kp_min_staff,
            kp_max_staff: threshold.kp_max_staff,
            target_cost_percentage: threshold.target_cost_percentage
          })
          .eq('id', threshold.id);
          
        if (error) throw error;
      }
      
      toast.success('Thresholds saved successfully');
      
      // Refresh the data
      fetchThresholds();
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast.error('Failed to save thresholds');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Thresholds Configuration</CardTitle>
        <CardDescription>
          Set staffing requirements based on revenue bands. The AI Rota Engine uses these thresholds to determine optimal staffing levels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {thresholds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No thresholds configured yet</p>
                <Button onClick={addNewThreshold}>Add First Threshold</Button>
              </div>
            ) : (
              <>
                {thresholds.map((threshold, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Threshold #{index + 1}</h3>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => duplicateThreshold(index)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Duplicate this threshold</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeThreshold(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`}>Threshold Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={threshold.name}
                        onChange={(e) => updateThreshold(index, 'name', e.target.value)}
                        placeholder="Enter a name for this threshold"
                      />
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`day-${index}`}>Day of Week</Label>
                        <Select
                          value={threshold.day_of_week}
                          onValueChange={(value) => updateThreshold(index, 'day_of_week', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`segment-${index}`}>Shift Segment</Label>
                        <Select
                          value={threshold.segment}
                          onValueChange={(value) => updateThreshold(index, 'segment', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select segment" />
                          </SelectTrigger>
                          <SelectContent>
                            {segments.map((segment) => (
                              <SelectItem key={segment.value} value={segment.value}>
                                {segment.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`revMin-${index}`}>Revenue Minimum (£)</Label>
                        <Input
                          id={`revMin-${index}`}
                          type="number"
                          min="0"
                          value={threshold.revenue_min}
                          onChange={(e) => updateThreshold(index, 'revenue_min', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`revMax-${index}`}>Revenue Maximum (£)</Label>
                        <Input
                          id={`revMax-${index}`}
                          type="number"
                          min={threshold.revenue_min}
                          value={threshold.revenue_max}
                          onChange={(e) => updateThreshold(index, 'revenue_max', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`target-${index}`}>Target Labour Cost (%)</Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          id={`target-${index}`}
                          defaultValue={[threshold.target_cost_percentage]}
                          min={15}
                          max={50}
                          step={0.5}
                          value={[threshold.target_cost_percentage]}
                          onValueChange={(values) => updateThreshold(index, 'target_cost_percentage', values[0])}
                          className="flex-1"
                        />
                        <div className="w-12 text-center font-mono">
                          {threshold.target_cost_percentage}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-4">Front of House Staffing</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`fohMin-${index}`}>Minimum FOH Staff</Label>
                          <Input
                            id={`fohMin-${index}`}
                            type="number"
                            min="0"
                            value={threshold.foh_min_staff}
                            onChange={(e) => updateThreshold(index, 'foh_min_staff', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`fohMax-${index}`}>Maximum FOH Staff</Label>
                          <Input
                            id={`fohMax-${index}`}
                            type="number"
                            min={threshold.foh_min_staff}
                            value={threshold.foh_max_staff}
                            onChange={(e) => updateThreshold(index, 'foh_max_staff', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-4">Kitchen Staffing</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`kitchenMin-${index}`}>Minimum Kitchen Staff</Label>
                          <Input
                            id={`kitchenMin-${index}`}
                            type="number"
                            min="0"
                            value={threshold.kitchen_min_staff}
                            onChange={(e) => updateThreshold(index, 'kitchen_min_staff', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`kitchenMax-${index}`}>Maximum Kitchen Staff</Label>
                          <Input
                            id={`kitchenMax-${index}`}
                            type="number"
                            min={threshold.kitchen_min_staff}
                            value={threshold.kitchen_max_staff}
                            onChange={(e) => updateThreshold(index, 'kitchen_max_staff', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-4">Kitchen Porter Staffing</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`kpMin-${index}`}>Minimum KP Staff</Label>
                          <Input
                            id={`kpMin-${index}`}
                            type="number"
                            min="0"
                            value={threshold.kp_min_staff}
                            onChange={(e) => updateThreshold(index, 'kp_min_staff', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`kpMax-${index}`}>Maximum KP Staff</Label>
                          <Input
                            id={`kpMax-${index}`}
                            type="number"
                            min={threshold.kp_min_staff}
                            value={threshold.kp_max_staff}
                            onChange={(e) => updateThreshold(index, 'kp_max_staff', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={addNewThreshold} 
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Another Threshold
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex justify-end w-full">
          <Button 
            onClick={saveThresholds}
            disabled={isLoading || isSaving || thresholds.length === 0}
            className="flex items-center gap-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save All Thresholds
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
