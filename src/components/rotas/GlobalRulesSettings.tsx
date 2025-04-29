
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Save } from 'lucide-react';

export default function GlobalRulesSettings({ location, globalConstraints, setGlobalConstraints }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    wage_target_type: 'percent',
    wage_target_value: 28,
    max_shifts_per_week: 5,
    min_rest_hours_between_shifts: 11,
    max_consecutive_days_worked: 6
  });

  // Initialize with the provided value
  useEffect(() => {
    if (globalConstraints) {
      setFormData({
        wage_target_type: globalConstraints.wage_target_type || 'percent',
        wage_target_value: globalConstraints.wage_target_value || 28,
        max_shifts_per_week: globalConstraints.max_shifts_per_week || 5,
        min_rest_hours_between_shifts: globalConstraints.min_rest_hours_between_shifts || 11,
        max_consecutive_days_worked: globalConstraints.max_consecutive_days_worked || 6
      });
    }
  }, [globalConstraints]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!location?.id) {
      toast({
        title: 'Cannot save settings',
        description: 'Location data is not available.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      let result;
      
      if (globalConstraints?.id) {
        result = await supabase
          .from('global_constraints')
          .update({
            ...formData,
            location_id: location.id,
          })
          .eq('id', globalConstraints.id);
      } else {
        result = await supabase
          .from('global_constraints')
          .insert({
            ...formData,
            location_id: location.id,
          })
          .select();
      }
      
      const { data, error } = result;
      
      if (error) throw error;
      
      toast({
        title: 'Settings saved',
        description: 'The global rules have been updated successfully.',
      });
      
      setGlobalConstraints(data?.[0] || null);
    } catch (error) {
      console.error('Error saving global rules:', error);
      toast({
        title: 'Error saving settings',
        description: error.message || 'There was a problem saving the settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWageTargetLabel = () => {
    switch (formData.wage_target_type) {
      case 'percent':
        return 'Wage Target (% of revenue)';
      case 'absolute':
        return 'Wage Target (fixed £ amount per week)';
      case 'hours':
        return 'Wage Target (maximum hours per week)';
      default:
        return 'Wage Target';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="wage_target_type">Wage Target Type</Label>
            <Select 
              id="wage_target_type"
              value={formData.wage_target_type} 
              onValueChange={(value) => handleChange('wage_target_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage of Revenue</SelectItem>
                <SelectItem value="absolute">Fixed Amount (£)</SelectItem>
                <SelectItem value="hours">Maximum Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="wage_target_value">{getWageTargetLabel()}</Label>
            <Input
              id="wage_target_value"
              type="number"
              min="0"
              step={formData.wage_target_type === 'percent' ? "0.1" : "1"}
              value={formData.wage_target_value}
              onChange={(e) => handleChange('wage_target_value', parseFloat(e.target.value))}
            />
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="font-medium mb-4">Legal Constraints</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_shifts">Maximum Shifts per Week</Label>
                <Input
                  id="max_shifts"
                  type="number"
                  min="1"
                  max="7"
                  value={formData.max_shifts_per_week}
                  onChange={(e) => handleChange('max_shifts_per_week', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rest_hours">Minimum Rest Hours Between Shifts</Label>
                <Input
                  id="rest_hours"
                  type="number"
                  min="8"
                  max="24"
                  value={formData.min_rest_hours_between_shifts}
                  onChange={(e) => handleChange('min_rest_hours_between_shifts', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="consecutive_days">Maximum Consecutive Days Worked</Label>
              <Input
                id="consecutive_days"
                type="number"
                min="1"
                max="14"
                value={formData.max_consecutive_days_worked}
                onChange={(e) => handleChange('max_consecutive_days_worked', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
        
        <div className="pt-6 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
