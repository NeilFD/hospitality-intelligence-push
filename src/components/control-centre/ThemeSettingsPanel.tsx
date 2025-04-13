import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { ThemeSettings, CustomFont } from '@/types/control-centre-types';
import { availableFonts } from '@/services/control-centre-service';
import { supabase } from '@/lib/supabase';
import { ColorPicker } from './ColorPicker';
import { PresetTheme } from '@/types/control-centre-types';

interface ThemeSettingsPanelProps {
  currentTheme: ThemeSettings | null;
  availableThemes: ThemeSettings[];
}

export const ThemeSettingsPanel: React.FC<ThemeSettingsPanelProps> = ({ currentTheme, availableThemes }) => {
  const [theme, setTheme] = useState<ThemeSettings>(currentTheme || {
    id: '',
    name: '',
    primaryColor: '#705b9b',
    secondaryColor: '#e0d9f0',
    accentColor: '#9d89c9',
    sidebarColor: '#806cac',
    buttonColor: '#705b9b',
    textColor: '#e0d9f0',
    logoUrl: null,
    customFont: null,
    isDefault: false,
    isActive: true,
    companyName: 'Hospitality Intelligence'
  });
  const [isNewTheme, setIsNewTheme] = useState(!currentTheme);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(currentTheme?.logoUrl || null);
  const [companyName, setCompanyName] = useState(currentTheme?.companyName || 'Hospitality Intelligence');
  
  useEffect(() => {
    setTheme(currentTheme || {
      id: '',
      name: '',
      primaryColor: '#705b9b',
      secondaryColor: '#e0d9f0',
      accentColor: '#9d89c9',
      sidebarColor: '#806cac',
      buttonColor: '#705b9b',
      textColor: '#e0d9f0',
      logoUrl: null,
      customFont: null,
      isDefault: false,
      isActive: true,
      companyName: 'Hospitality Intelligence'
    });
    setIsNewTheme(!currentTheme);
    setLogoPreviewUrl(currentTheme?.logoUrl || null);
    setCompanyName(currentTheme?.companyName || 'Hospitality Intelligence');
  }, [currentTheme]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTheme(prevTheme => ({
      ...prevTheme,
      [name]: value
    }));
  };
  
  const handleColorChange = (name: string, color: string) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      [name]: color
    }));
  };
  
  const handleFontChange = (font: CustomFont) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      customFont: font.value
    }));
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
    setTheme(prevTheme => ({
      ...prevTheme,
      companyName: e.target.value
    }));
  };
  
  const uploadLogo = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `lovable-uploads/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('theme-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        toast.error('Failed to upload logo.');
        return null;
      }
      
      const { data: logoUrl } = supabase.storage
        .from('theme-logos')
        .getPublicUrl(filePath);
      
      toast.success('Logo uploaded successfully!');
      return logoUrl.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo.');
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  const handleSaveTheme = async () => {
    let logoUrlToSave = theme.logoUrl;
    
    if (logoFile) {
      const uploadedLogoUrl = await uploadLogo(logoFile);
      if (uploadedLogoUrl) {
        logoUrlToSave = uploadedLogoUrl;
      } else {
        return;
      }
    }
    
    const themeToSave: ThemeSettings = {
      ...theme,
      logoUrl: logoUrlToSave,
      companyName: companyName
    };
    
    const result = await saveThemeSettings(themeToSave);
    
    if (result?.success) {
      toast.success('Theme settings saved successfully!');
    } else {
      toast.error('Failed to save theme settings.');
    }
  };
  
  const saveThemeSettings = async (theme: ThemeSettings) => {
    try {
      // Update existing theme
      if (theme.id) {
        const { error } = await supabase
          .from('themes')
          .update({
            name: theme.name,
            primary_color: theme.primaryColor,
            secondary_color: theme.secondaryColor,
            accent_color: theme.accentColor,
            sidebar_color: theme.sidebarColor,
            button_color: theme.buttonColor,
            text_color: theme.textColor,
            logo_url: theme.logoUrl,
            custom_font: theme.customFont,
            company_name: theme.companyName
          })
          .eq('id', theme.id);
          
        if (error) {
          throw error;
        }
        
        // If this is the active theme, dispatch the update events
        if (theme.isActive) {
          // Dispatch theme update event
          const themeEvent = new CustomEvent('app-theme-updated', {
            detail: { theme }
          });
          window.dispatchEvent(themeEvent);
          
          // Dispatch company name update event
          const companyNameEvent = new CustomEvent('company-name-updated', {
            detail: { companyName: theme.companyName }
          });
          window.dispatchEvent(companyNameEvent);
        }
        
        return { success: true };
      }
      
      // Create new theme
      const { data, error } = await supabase
        .from('themes')
        .insert({
          name: theme.name,
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor,
          sidebar_color: theme.sidebarColor,
          button_color: theme.buttonColor,
          text_color: theme.textColor,
          logo_url: theme.logoUrl,
          custom_font: theme.customFont,
          is_active: theme.isActive,
          company_name: theme.companyName
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Dispatch theme update event
      const themeEvent = new CustomEvent('app-theme-updated', {
        detail: { theme: data }
      });
      window.dispatchEvent(themeEvent);
      
      // Dispatch company name update event
      const companyNameEvent = new CustomEvent('company-name-updated', {
        detail: { companyName: theme.companyName }
      });
      window.dispatchEvent(companyNameEvent);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving theme settings:', error);
      return { error };
    }
  };
  
  const handleSetActive = async (isActive: boolean) => {
    try {
      // First, deactivate all other themes
      const { error: deactivateError } = await supabase
        .from('themes')
        .update({ is_active: false })
        .neq('id', theme.id);
      
      if (deactivateError) {
        console.error('Error deactivating other themes:', deactivateError);
        toast.error('Failed to deactivate other themes.');
        return;
      }
      
      // Then, activate the current theme
      const { error: activateError } = await supabase
        .from('themes')
        .update({ is_active: isActive })
        .eq('id', theme.id);
      
      if (activateError) {
        console.error('Error activating theme:', activateError);
        toast.error('Failed to activate theme.');
        return;
      }
      
      setTheme(prevTheme => ({ ...prevTheme, isActive }));
      
      // Dispatch theme update event
      const themeEvent = new CustomEvent('app-theme-updated', {
        detail: { theme: { ...theme, isActive } }
      });
      window.dispatchEvent(themeEvent);
      
      toast.success('Theme activation status updated successfully!');
    } catch (error) {
      console.error('Error updating theme active status:', error);
      toast.error('Failed to update theme active status.');
    }
  };
  
  const handleDeleteTheme = async () => {
    if (!theme.id) {
      toast.error('Cannot delete a theme that has not been saved.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', theme.id);
      
      if (error) {
        console.error('Error deleting theme:', error);
        toast.error('Failed to delete theme.');
        return;
      }
      
      toast.success('Theme deleted successfully!');
      // Additional logic to reset the form or navigate away
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast.error('Failed to delete theme.');
    }
  };
  
  const handleApplyPreset = useCallback((preset: PresetTheme) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      sidebarColor: preset.colors.sidebar,
      buttonColor: preset.colors.button,
      textColor: preset.colors.text,
    }));
  }, []);
  
  const presetThemes: PresetTheme[] = [
    {
      id: 'hi-purple',
      name: 'Hi Purple',
      colors: {
        primary: '#705b9b',
        secondary: '#e0d9f0',
        accent: '#9d89c9',
        sidebar: '#806cac',
        button: '#705b9b',
        text: '#e0d9f0',
      }
    },
    {
      id: 'forest-green',
      name: 'Forest Green',
      colors: {
        primary: '#1b5e20',
        secondary: '#e8f5e9',
        accent: '#4caf50',
        sidebar: '#388e3c',
        button: '#1b5e20',
        text: '#e8f5e9',
      }
    },
    {
      id: 'ocean-blue',
      name: 'Ocean Blue',
      colors: {
        primary: '#1565c0',
        secondary: '#e3f2fd',
        accent: '#2196f3',
        sidebar: '#1976d2',
        button: '#1565c0',
        text: '#e3f2fd',
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
        button: '#e65100',
        text: '#fff3e0',
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
        button: '#6a1b9a',
        text: '#f3e5f5',
      }
    },
    {
      id: 'dark-mode',
      name: 'Dark Mode',
      colors: {
        primary: '#212121',
        secondary: '#f5f5f5',
        accent: '#424242',
        sidebar: '#333333',
        button: '#212121',
        text: '#f5f5f5',
      }
    },
  ];
  
  return <Card>
      <CardHeader>
        <CardTitle>{isNewTheme ? 'Create New Theme' : 'Edit Theme'}</CardTitle>
        <CardDescription>
          Customize the look and feel of your application.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Theme Name</Label>
            <Input 
              type="text" 
              id="name" 
              name="name" 
              value={theme.name} 
              onChange={handleInputChange} 
              placeholder="Theme Name" 
            />
          </div>
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              type="text"
              id="companyName"
              name="companyName"
              value={companyName}
              onChange={handleCompanyNameChange}
              placeholder="Company Name"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Primary Color</Label>
            <ColorPicker color={theme.primaryColor} onChange={(color) => handleColorChange('primaryColor', color)} />
          </div>
          <div>
            <Label>Secondary Color</Label>
            <ColorPicker color={theme.secondaryColor} onChange={(color) => handleColorChange('secondaryColor', color)} />
          </div>
          <div>
            <Label>Accent Color</Label>
            <ColorPicker color={theme.accentColor} onChange={(color) => handleColorChange('accentColor', color)} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Sidebar Color</Label>
            <ColorPicker color={theme.sidebarColor} onChange={(color) => handleColorChange('sidebarColor', color)} />
          </div>
          <div>
            <Label>Button Color</Label>
            <ColorPicker color={theme.buttonColor} onChange={(color) => handleColorChange('buttonColor', color)} />
          </div>
          <div>
            <Label>Text Color</Label>
            <ColorPicker color={theme.textColor} onChange={(color) => handleColorChange('textColor', color)} />
          </div>
        </div>
        
        <div>
          <Label>Logo Upload</Label>
          <Input type="file" id="logo" accept="image/*" onChange={handleLogoChange} />
          {logoPreviewUrl && <div className="mt-2">
              <img src={logoPreviewUrl} alt="Logo Preview" className="max-h-32 object-contain rounded-md" />
            </div>}
        </div>
        
        <div>
          <Label htmlFor="customFont">Custom Font</Label>
          <Select onValueChange={(value) => handleFontChange(availableFonts.find(font => font.value === value) || availableFonts[0])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a font" defaultValue={theme.customFont || 'Default System Font'} />
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
        
        <div>
          <Label>Apply Preset Theme</Label>
          <div className="flex gap-2">
            {presetThemes.map(preset => (
              <Button 
                key={preset.id} 
                variant="outline" 
                size="sm" 
                onClick={() => handleApplyPreset(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="active">Set as Active Theme</Label>
          <Switch id="active" checked={theme.isActive} onCheckedChange={handleSetActive} />
        </div>
        
        <div className="flex justify-end space-x-2">
          {!isNewTheme && <Button variant="destructive" onClick={handleDeleteTheme}>
              Delete Theme
            </Button>}
          <Button onClick={handleSaveTheme} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Save Theme'}
          </Button>
        </div>
      </CardContent>
    </Card>;
};
