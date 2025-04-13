import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { ThemeSettings } from '@/types/control-centre-types';
import { availableFonts } from '@/services/control-centre-service';
import { supabase } from '@/lib/supabase';
import { Check, ChevronsUpDown, Copy, Loader2 } from 'lucide-react';

interface ThemeSettingsPanelProps {
  currentTheme: ThemeSettings | null;
  availableThemes: ThemeSettings[];
}

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
    setActiveTheme(currentTheme || {
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      setUploading(true);
      const file = event.target.files[0];
      
      // Generate a unique file name for the logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
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
      const event = new CustomEvent('app-logo-updated', { 
        detail: { logoUrl } 
      });
      window.dispatchEvent(event);
      
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand & Theme Settings</CardTitle>
        <CardDescription>
          Customize the look and feel of your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <Select onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a font" defaultValue={activeTheme.customFont} />
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
