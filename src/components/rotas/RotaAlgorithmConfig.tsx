
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Briefcase, 
  UserCheck,
  Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator';

interface RotaAlgorithmConfigProps {
  location: any;
}

interface ConfigValues {
  salariedWeight: number;
  managerWeight: number;
  hiScoreWeight: number;
  enablePartShifts: boolean;
  minPartShiftHours: number;
  maxPartShiftHours: number;
}

export default function RotaAlgorithmConfig({ location }: RotaAlgorithmConfigProps) {
  const [config, setConfig] = useState<ConfigValues>({
    salariedWeight: 100,
    managerWeight: 50,
    hiScoreWeight: 1,
    enablePartShifts: true,
    minPartShiftHours: 3,
    maxPartShiftHours: 5,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (location?.id) {
      loadConfigFromDatabase();
    }
  }, [location?.id]);
  
  const loadConfigFromDatabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rota_algorithm_config')
        .select('*')
        .eq('location_id', location.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setConfig({
          salariedWeight: data.salaried_weight || 100,
          managerWeight: data.manager_weight || 50,
          hiScoreWeight: data.hi_score_weight || 1,
          enablePartShifts: data.enable_part_shifts !== false,
          minPartShiftHours: data.min_part_shift_hours || 3,
          maxPartShiftHours: data.max_part_shift_hours || 5,
        });
        
        console.log("Loaded algorithm config from database:", data);
      }
    } catch (error) {
      console.error("Error loading algorithm config:", error);
      toast.error("Failed to load algorithm configuration");
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveConfig = async () => {
    if (!location?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('rota_algorithm_config')
        .upsert({
          location_id: location.id,
          salaried_weight: config.salariedWeight,
          manager_weight: config.managerWeight,
          hi_score_weight: config.hiScoreWeight,
          enable_part_shifts: config.enablePartShifts,
          min_part_shift_hours: config.minPartShiftHours,
          max_part_shift_hours: config.maxPartShiftHours,
          last_updated: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast.success("Algorithm configuration saved");
    } catch (error) {
      console.error("Error saving algorithm config:", error);
      toast.error("Failed to save algorithm configuration");
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetToDefaults = () => {
    setConfig({
      salariedWeight: 100,
      managerWeight: 50,
      hiScoreWeight: 1,
      enablePartShifts: true,
      minPartShiftHours: 3,
      maxPartShiftHours: 5,
    });
    
    toast.info("Configuration reset to defaults");
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-500" />
          <CardTitle>Rota Algorithm Configuration</CardTitle>
        </div>
        <CardDescription>
          Adjust how the AI prioritizes staff when creating schedules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Staff Priority Weights</h3>
            <p className="text-sm text-muted-foreground">
              Control the importance of different factors when ranking staff for shifts
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="salaried-weight" className="font-medium">
                    Salaried Staff Priority
                  </Label>
                </div>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {config.salariedWeight}
                </span>
              </div>
              <Slider
                id="salaried-weight"
                min={0}
                max={200}
                step={5}
                value={[config.salariedWeight]}
                onValueChange={(value) => setConfig({...config, salariedWeight: value[0]})}
              />
              <p className="text-xs text-muted-foreground italic">
                Higher values prioritize salaried staff more when scheduling shifts
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="manager-weight" className="font-medium">
                    Manager Priority
                  </Label>
                </div>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {config.managerWeight}
                </span>
              </div>
              <Slider
                id="manager-weight"
                min={0}
                max={100}
                step={5}
                value={[config.managerWeight]}
                onValueChange={(value) => setConfig({...config, managerWeight: value[0]})}
              />
              <p className="text-xs text-muted-foreground italic">
                Lower values distribute shifts more evenly between managers and regular staff
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="hi-score-weight" className="font-medium">
                    Hi-Score Weight
                  </Label>
                </div>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {config.hiScoreWeight}
                </span>
              </div>
              <Slider
                id="hi-score-weight"
                min={0.1}
                max={5}
                step={0.1}
                value={[config.hiScoreWeight]}
                onValueChange={(value) => setConfig({...config, hiScoreWeight: value[0]})}
              />
              <p className="text-xs text-muted-foreground italic">
                Higher values give more priority to staff with higher performance scores
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Part Shift Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure how part shifts are generated and assigned
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="enable-part-shifts" className="font-medium">
                    Enable Part Shifts
                  </Label>
                </div>
                <Switch
                  id="enable-part-shifts"
                  checked={config.enablePartShifts}
                  onCheckedChange={(checked) => setConfig({...config, enablePartShifts: checked})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-part-shift">Minimum Hours</Label>
                  <Input
                    id="min-part-shift"
                    type="number"
                    min={1}
                    max={12}
                    value={config.minPartShiftHours}
                    onChange={(e) => setConfig({...config, minPartShiftHours: parseFloat(e.target.value) || 3})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-part-shift">Maximum Hours</Label>
                  <Input
                    id="max-part-shift"
                    type="number"
                    min={2}
                    max={12}
                    value={config.maxPartShiftHours}
                    onChange={(e) => setConfig({...config, maxPartShiftHours: parseFloat(e.target.value) || 5})}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={saveConfig} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
