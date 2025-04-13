
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TargetSettings } from '@/types/control-centre-types';
import { updateTargetSettings } from '@/services/control-centre-service';
import { Percent, FileUp } from 'lucide-react';
import { toast } from 'sonner';

interface TargetSettingsPanelProps {
  targetSettings: TargetSettings;
}

export function TargetSettingsPanel({ targetSettings }: TargetSettingsPanelProps) {
  const [settings, setSettings] = useState<TargetSettings>(targetSettings || {
    foodGpTarget: 68,
    beverageGpTarget: 72,
    wageCostTarget: 28,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSettingChange = (key: keyof TargetSettings, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSettings(prev => ({
        ...prev,
        [key]: numValue
      }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        setUploading(true);
        setFileName(files[0].name);
        
        // Here we would process the budget sheet
        // For now, just simulate a delay and show a success message
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success('Budget sheet uploaded successfully');
      } catch (error) {
        console.error('Error uploading budget sheet:', error);
        toast.error('Failed to upload budget sheet');
      } finally {
        setUploading(false);
      }
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Call the function to update target settings in Supabase
      const result = await updateTargetSettings(settings);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      toast.success('Business targets saved successfully');
    } catch (error) {
      console.error('Error saving business targets:', error);
      toast.error('Failed to save business targets');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Targets</CardTitle>
          <CardDescription>
            Set financial targets for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="foodGpTarget">Food GP Target (%)</Label>
              <div className="relative">
                <Input 
                  id="foodGpTarget"
                  type="number"
                  value={settings.foodGpTarget}
                  onChange={(e) => handleSettingChange('foodGpTarget', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="beverageGpTarget">Beverage GP Target (%)</Label>
              <div className="relative">
                <Input 
                  id="beverageGpTarget"
                  type="number"
                  value={settings.beverageGpTarget}
                  onChange={(e) => handleSettingChange('beverageGpTarget', e.target.value)}
                  min="0" 
                  max="100" 
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <Percent className="h-4 w-4 text-muted-text" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wageCostTarget">Wage Cost Target (%)</Label>
              <div className="relative">
                <Input 
                  id="wageCostTarget"
                  type="number"
                  value={settings.wageCostTarget}
                  onChange={(e) => handleSettingChange('wageCostTarget', e.target.value)}
                  min="0" 
                  max="100"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <Percent className="h-4 w-4 text-muted-text" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Budget Sheet Upload</CardTitle>
          <CardDescription>
            Upload your budget sheet for P&L Tracker integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload your budget spreadsheet to set targets for your P&L Tracker. The file should contain columns for Category, Budget Item, and monthly budget amounts.
            </p>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="cursor-pointer">
                <label>
                  <FileUp className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Budget File'}
                  <input 
                    type="file" 
                    accept=".csv,.xlsx,.xls"
                    className="hidden" 
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </Button>
              {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
            </div>
            
            <div className="mt-4 bg-muted/50 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">Expected File Format</h4>
              <p className="text-sm text-muted-foreground">
                The file should contain columns for Category, Budget Item, and monthly budget amounts. Download a template for reference.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Target Settings'}
        </Button>
      </div>
    </div>
  );
}
