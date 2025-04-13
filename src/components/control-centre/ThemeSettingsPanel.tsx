
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { ThemeSettings, PresetTheme, CustomFont } from '@/types/control-centre-types';
import { availableFonts } from '@/services/control-centre-service';
import { supabase } from '@/lib/supabase';
import { Check, ChevronsUpDown, Copy, Loader2, SaveIcon, Palette } from 'lucide-react';

interface ThemeSettingsPanelProps {
  currentTheme: ThemeSettings | null;
  availableThemes: ThemeSettings[];
}

// Preset themes
const presetThemes: PresetTheme[] = [
  {
    id: 'forest-green',
    name: 'Forest Green',
    colors: {
      primary: '#1b5e20',
      secondary: '#e8f5e9',
      accent: '#66bb6a',
      sidebar: '#2e7d32',
      button: '#43a047',
      text: '#212121'
    }
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    colors: {
      primary: '#1565c0',
      secondary: '#e3f2fd',
      accent: '#42a5f5',
      sidebar: '#1976d2',
      button: '#2196f3',
      text: '#212121'
    }
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    colors: {
      primary: '#e65100',
      secondary: '#fff3e0',
      accent: '#ff9800',
      sidebar: '#ef6c00',
      button: '#f57c00',
      text: '#212121'
    }
  },
  {
    id: 'berry-purple',
    name: 'Berry Purple',
    colors: {
      primary: '#6a1b9a',
      secondary: '#f3e5f5',
      accent: '#ab47bc',
      sidebar: '#8e24aa',
      button: '#9c27b0',
      text: '#212121'
    }
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    colors: {
      primary: '#212121',
      secondary: '#424242',
      accent: '#757575',
      sidebar: '#333333',
      button: '#616161',
      text: '#f5f5f5'
    }
  }
];

export function ThemeSettingsPanel({ currentTheme, availableThemes }: ThemeSettingsPanelProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeSettings>(currentTheme || {
    id: '',
    name: 'Default',
    primaryColor: '#ffffff',
    secondaryColor: '#f0f0f0',
    accentColor: '#007bff',
    sidebarColor: '#333333',
    buttonColor: '#007bff',
    textColor: '#000000',
    logoUrl: '',
    customFont: 'Arial, sans-serif',
    isDefault: true,
    isActive: true
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  useEffect(() => {
    if (currentTheme) {
      setActiveTheme(currentTheme);
    }
  }, [currentTheme]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActiveTheme(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (value: string) => {
    setActiveTheme(prev => ({
      ...prev,
      customFont: value
    }));
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setActiveTheme(prev => ({
      ...prev,
      isActive: checked
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      setUploading(true);
      const file = e.target.files[0];
      
      // Generate a unique file name for the logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Check if logos bucket exists, create if doesn't
      const { data: bucketsList } = await supabase.storage.listBuckets();
      const logosBucketExists = bucketsList?.some(bucket => bucket.name === 'logos');
      
      if (!logosBucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket('logos', {
          public: true
        });
        
        if (createBucketError) {
          console.error('Error creating logos bucket:', createBucketError);
          toast.error('Error creating logos storage');
          setUploading(false);
          return;
        }
      }
      
      // Upload the file to the 'logos' bucket in Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        toast.error('Error uploading logo');
        setUploading(false);
        return;
      }
      
      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase
        .storage
        .from('logos')
        .getPublicUrl(filePath);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        toast.error('Error getting logo URL');
        setUploading(false);
        return;
      }
      
      const logoUrl = publicUrlData.publicUrl;
      
      // Update the activeTheme state with the new logo URL
      setActiveTheme(prev => ({
        ...prev,
        logoUrl
      }));
      
      // Save the logo URL in localStorage for immediate use
      localStorage.setItem('app-logo-url', logoUrl);
      
      // Dispatch a custom event to notify other components about the logo change
      const logoEvent = new CustomEvent('app-logo-updated', { 
        detail: { logoUrl } 
      });
      window.dispatchEvent(logoEvent);
      
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error in logo upload process:', error);
      toast.error('An unexpected error occurred during logo upload');
    } finally {
      setUploading(false);
    }
  };
  
  const saveTheme = async () => {
    try {
      setSaving(true);
      
      // Update the theme in the database
      const { data, error } = await supabase
        .from('themes')
        .update({
          name: activeTheme.name,
          primary_color: activeTheme.primaryColor,
          secondary_color: activeTheme.secondaryColor,
          accent_color: activeTheme.accentColor,
          sidebar_color: activeTheme.sidebarColor,
          button_color: activeTheme.buttonColor,
          text_color: activeTheme.textColor,
          logo_url: activeTheme.logoUrl,
          custom_font: activeTheme.customFont,
          is_active: activeTheme.isActive
        })
        .eq('id', activeTheme.id);
      
      if (error) {
        console.error('Error updating theme:', error);
        toast.error('Failed to save theme settings');
        return;
      }
      
      toast.success('Theme settings saved successfully');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCopyClick = () => {
    navigator.clipboard.writeText(JSON.stringify(activeTheme, null, 2));
    setIsCopied(true);
    toast.success('Theme settings copied to clipboard');
    
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const applyPresetTheme = (preset: PresetTheme) => {
    setActiveTheme(prev => ({
      ...prev,
      name: preset.name,
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      sidebarColor: preset.colors.sidebar,
      buttonColor: preset.colors.button,
      textColor: preset.colors.text
    }));
    
    toast.success(`${preset.name} theme applied! Remember to save your changes.`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand & Theme Settings</CardTitle>
        <CardDescription>
          Customize the look and feel of your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Themes Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Preset Themes
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {presetThemes.map(theme => (
              <div 
                key={theme.id} 
                className="border rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => applyPresetTheme(theme)}
              >
                <div className="h-16" style={{ backgroundColor: theme.colors.primary }}></div>
                <div className="p-2 text-center text-sm font-medium">{theme.name}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="name">Theme Name</Label>
          <Input 
            type="text" 
            id="name" 
            name="name"
            value={activeTheme.name} 
            onChange={handleInputChange} 
          />
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="primaryColor">Primary Color</Label>
          <Input 
            type="color" 
            id="primaryColor" 
            name="primaryColor"
            value={activeTheme.primaryColor} 
            onChange={handleInputChange} 
          />
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <Input 
            type="color" 
            id="secondaryColor" 
            name="secondaryColor"
            value={activeTheme.secondaryColor} 
            onChange={handleInputChange} 
          />
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="accentColor">Accent Color</Label>
          <Input 
            type="color" 
            id="accentColor" 
            name="accentColor"
            value={activeTheme.accentColor} 
            onChange={handleInputChange} 
          />
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="sidebarColor">Sidebar Color</Label>
          <Input 
            type="color" 
            id="sidebarColor" 
            name="sidebarColor"
            value={activeTheme.sidebarColor} 
            onChange={handleInputChange} 
          />
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="buttonColor">Button Color</Label>
          <Input 
            type="color" 
            id="buttonColor" 
            name="buttonColor"
            value={activeTheme.buttonColor} 
            onChange={handleInputChange} 
          />
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="textColor">Text Color</Label>
          <Input 
            type="color" 
            id="textColor" 
            name="textColor"
            value={activeTheme.textColor} 
            onChange={handleInputChange} 
          />
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="logoUrl">Logo</Label>
          <Input 
            type="file" 
            id="logoUrl" 
            accept="image/*"
            onChange={handleLogoUpload} 
          />
          {uploading && <p>Uploading logo...</p>}
          {activeTheme.logoUrl && <img src={activeTheme.logoUrl} alt="Logo" className="max-h-32" />}
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="customFont">Custom Font</Label>
          <Select onValueChange={handleSelectChange} defaultValue={activeTheme.customFont || undefined}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              {availableFonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="isActive">Active Theme</Label>
          <Switch 
            id="isActive" 
            checked={activeTheme.isActive} 
            onCheckedChange={handleSwitchChange} 
          />
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleCopyClick}>
            {isCopied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {isCopied ? "Copied!" : "Copy Settings"}
          </Button>
          <Button onClick={saveTheme} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Theme
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
