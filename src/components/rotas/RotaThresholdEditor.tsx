
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Save, Trash2, Loader2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getDefaultRevenueBands, formatRevenueBand, getStaffSummary } from './StaffRankingUtils';

type RotaThresholdEditorProps = {
  location: any;
};

type Threshold = {
  id?: string;
  name: string;
  day_of_week?: string;
  segment?: string;
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
  isExpanded?: boolean;
  isSaving?: boolean;
  location_id?: string;
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
      // Fetch the latest thresholds
      const { data, error } = await supabase
        .from('rota_revenue_thresholds')
        .select('*')
        .eq('location_id', location.id)
        .order('revenue_min');
        
      if (error) throw error;
      
      let formattedThresholds: Threshold[];
      
      // If no thresholds exist, set up default ones
      if (!data || data.length === 0) {
        formattedThresholds = getDefaultRevenueBands().map(band => ({
          ...band,
          isExpanded: false,
          isNew: true,
          location_id: location.id
        }));
      } else {
        // Format existing thresholds
        formattedThresholds = data.map(threshold => ({
          ...threshold,
          // If name doesn't exist, generate one from revenue band
          name: threshold.name || `Band: ${formatRevenueBand(threshold.revenue_min, threshold.revenue_max)}`,
          isExpanded: false
        }));
      }
      
      setThresholds(formattedThresholds);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      toast.error('Failed to load revenue thresholds');
    } finally {
      setIsLoading(false);
    }
  };

  const addNewThreshold = () => {
    // Get the highest max revenue to determine new band
    const highestMax = thresholds.reduce((max, t) => Math.max(max, t.revenue_max || 0), 0);
    
    const newThreshold: Threshold = {
      name: `New Revenue Band`,
      revenue_min: highestMax + 1,
      revenue_max: highestMax + 1000,
      foh_min_staff: 2,
      foh_max_staff: 4,
      kitchen_min_staff: 1,
      kitchen_max_staff: 2,
      kp_min_staff: 0,
      kp_max_staff: 1,
      target_cost_percentage: 28,
      isNew: true,
      isExpanded: true,
      location_id: location.id
    };
    
    setThresholds([...thresholds, newThreshold]);
  };

  const duplicateThreshold = (index: number) => {
    const thresholdToDuplicate = thresholds[index];
    const duplicatedThreshold: Threshold = {
      ...thresholdToDuplicate,
      name: `Copy of ${thresholdToDuplicate.name}`,
      isNew: true,
      id: undefined, // Remove id to ensure it's treated as new
      isExpanded: true
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

  const toggleThresholdExpansion = (index: number) => {
    const updatedThresholds = [...thresholds];
    updatedThresholds[index] = { 
      ...updatedThresholds[index], 
      isExpanded: !updatedThresholds[index].isExpanded 
    };
    setThresholds(updatedThresholds);
  };

  const saveThreshold = async (index: number) => {
    const threshold = thresholds[index];
    const updatedThresholds = [...thresholds];
    
    // Set saving indicator for this specific threshold
    updatedThresholds[index] = { 
      ...updatedThresholds[index],
      isSaving: true 
    };
    setThresholds(updatedThresholds);
    
    try {
      // Make sure location_id is set before saving
      const thresholdToSave = {
        name: threshold.name,
        revenue_min: threshold.revenue_min,
        revenue_max: threshold.revenue_max,
        foh_min_staff: threshold.foh_min_staff,
        foh_max_staff: threshold.foh_max_staff,
        kitchen_min_staff: threshold.kitchen_min_staff,
        kitchen_max_staff: threshold.kitchen_max_staff,
        kp_min_staff: threshold.kp_min_staff,
        kp_max_staff: threshold.kp_max_staff,
        target_cost_percentage: threshold.target_cost_percentage,
        location_id: location.id
      };
      
      // For new thresholds
      if (threshold.isNew) {
        const { data, error } = await supabase
          .from('rota_revenue_thresholds')
          .insert(thresholdToSave)
          .select('*')
          .single();
          
        if (error) {
          console.error("Error saving new threshold:", error);
          throw error;
        }
        
        // Update threshold with returned ID and mark as saved (not new anymore)
        updatedThresholds[index] = { 
          ...updatedThresholds[index],
          ...data,
          name: threshold.name, // Keep the name in our local state
          isExpanded: false,
          isSaving: false,
          isNew: false
        };
      } 
      // For existing thresholds
      else {
        const { error } = await supabase
          .from('rota_revenue_thresholds')
          .update(thresholdToSave)
          .eq('id', threshold.id);
          
        if (error) {
          console.error("Error updating threshold:", error);
          throw error;
        }
        
        // Mark as saved and collapse
        updatedThresholds[index] = { 
          ...updatedThresholds[index],
          isExpanded: false,
          isSaving: false,
          isNew: false
        };
      }
      
      setThresholds(updatedThresholds);
      toast.success('Threshold saved successfully');
    } catch (error: any) {
      console.error('Error saving threshold:', error);
      // Reset the saving state on error
      updatedThresholds[index] = { 
        ...updatedThresholds[index],
        isSaving: false
      };
      setThresholds(updatedThresholds);
      toast.error(`Failed to save threshold: ${error.message || 'Unknown error'}`);
    }
  };

  const saveAllThresholds = async () => {
    setIsSaving(true);
    
    try {
      // Separate new and existing thresholds
      const newThresholds = thresholds.filter(t => t.isNew);
      const existingThresholds = thresholds.filter(t => !t.isNew);
      
      // Insert new thresholds
      if (newThresholds.length > 0) {
        const thresholdsToInsert = newThresholds.map(t => ({
          name: t.name,
          revenue_min: t.revenue_min,
          revenue_max: t.revenue_max,
          foh_min_staff: t.foh_min_staff,
          foh_max_staff: t.foh_max_staff,
          kitchen_min_staff: t.kitchen_min_staff,
          kitchen_max_staff: t.kitchen_max_staff,
          kp_min_staff: t.kp_min_staff,
          kp_max_staff: t.kp_max_staff,
          target_cost_percentage: t.target_cost_percentage,
          location_id: location.id
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
      
      toast.success('All thresholds saved successfully');
      
      // Refresh the data and collapse all thresholds
      fetchThresholds();
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast.error('Failed to save thresholds');
    } finally {
      setIsSaving(false);
    }
  };

  // Sort thresholds by revenue range
  const sortedThresholds = [...thresholds].sort((a, b) => a.revenue_min - b.revenue_min);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Bands Configuration</CardTitle>
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
            {sortedThresholds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No revenue bands configured yet</p>
                <Button onClick={addNewThreshold}>Add First Revenue Band</Button>
              </div>
            ) : (
              <>
                {sortedThresholds.map((threshold, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleThresholdExpansion(index)}
                          className="h-8 w-8"
                        >
                          {threshold.isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <h3 className="text-lg font-medium">
                            {threshold.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatRevenueBand(threshold.revenue_min, threshold.revenue_max)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {threshold.isExpanded && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => saveThreshold(index)}
                            disabled={threshold.isSaving}
                          >
                            {threshold.isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" /> Save
                              </>
                            )}
                          </Button>
                        )}
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
                              <p>Duplicate this revenue band</p>
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

                    {threshold.isExpanded ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`}>Band Name</Label>
                          <Input
                            id={`name-${index}`}
                            value={threshold.name}
                            onChange={(e) => updateThreshold(index, 'name', e.target.value)}
                            placeholder="Enter a name for this revenue band"
                          />
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
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground grid sm:grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Revenue Range:</span> £{threshold.revenue_min} - £{threshold.revenue_max}
                        </div>
                        <div>
                          <span className="font-medium">Target Labour:</span> {threshold.target_cost_percentage}%
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-medium">Staffing:</span> {getStaffSummary(
                            threshold.foh_min_staff,
                            threshold.foh_max_staff,
                            threshold.kitchen_min_staff,
                            threshold.kitchen_max_staff,
                            threshold.kp_min_staff,
                            threshold.kp_max_staff
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={addNewThreshold} 
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Another Revenue Band
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
            onClick={saveAllThresholds}
            disabled={isLoading || isSaving || thresholds.length === 0}
            className="flex items-center gap-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving All...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save All Bands
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
