import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from 'sonner';
import { ThemeSettings, PresetTheme, CustomFont } from '@/types/control-centre-types';
import { availableFonts } from '@/services/control-centre-service';
import { supabase } from '@/lib/supabase';
import { Check, ChevronsUpDown, Copy, Loader2, SaveIcon, Palette, Sliders, Upload, Image, Building, Edit, Trash2 } from 'lucide-react';
import { ColorPicker } from '@/components/ColorPicker';

const presetThemes: PresetTheme[] = [{
  id: 'berry-purple',
  name: 'Berry Purple',
  colors: {
    primary: '#6a1b9a',
    secondary: '#f3e5f5',
    accent: '#ab47bc',
    sidebar: '#8e24aa',
    button: '#9c27b0',
    text: '#212121'
  },
  isDefault: true
}, {
  id: 'forest-green',
  name: 'Forest Green',
  colors: {
    primary: '#1b5e20',
    secondary: '#e8f5e9',
    accent: '#66bb6a',
    sidebar: '#2e7d32',
    button: '#43a047',
    text: '#212121'
  },
  isDefault: false
}, {
  id: 'ocean-blue',
  name: 'Ocean Blue',
  colors: {
    primary: '#1565c0',
    secondary: '#e3f2fd',
    accent: '#42a5f5',
    sidebar: '#1976d2',
    button: '#2196f3',
    text: '#212121'
  },
  isDefault: false
}, {
  id: 'sunset-orange',
  name: 'Sunset Orange',
  colors: {
    primary: '#e65100',
    secondary: '#fff3e0',
    accent: '#ff9800',
    sidebar: '#ef6c00',
    button: '#f57c00',
    text: '#212121'
  },
  isDefault: false
}];

const hexToRgb = (hex: string): {
  r: number;
  g: number;
  b: number;
} => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {
    r: 0,
    g: 0,
    b: 0
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

interface ThemeSettingsPanelProps {
  currentTheme: ThemeSettings | null;
  availableThemes: ThemeSettings[];
}

export function ThemeSettingsPanel({
  currentTheme,
  availableThemes
}: ThemeSettingsPanelProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeSettings>(currentTheme || {
    id: '',
    name: 'Hi',
    primaryColor: '#6a1b9a',
    secondaryColor: '#f3e5f5',
    accentColor: '#ab47bc',
    sidebarColor: '#8e24aa',
    buttonColor: '#9c27b0',
    textColor: '#212121',
    logoUrl: '',
    customFont: 'Arial, sans-serif',
    isDefault: true,
    isActive: true,
    companyName: 'My Company'
  });

  const [allThemes, setAllThemes] = useState<ThemeSettings[]>(availableThemes || []);
  const [primaryRgb, setPrimaryRgb] = useState(hexToRgb(activeTheme.primaryColor));
  const [secondaryRgb, setSecondaryRgb] = useState(hexToRgb(activeTheme.secondaryColor));
  const [accentRgb, setAccentRgb] = useState(hexToRgb(activeTheme.accentColor));
  const [sidebarRgb, setSidebarRgb] = useState(hexToRgb(activeTheme.sidebarColor));
  const [buttonRgb, setButtonRgb] = useState(hexToRgb(activeTheme.buttonColor));
  const [textRgb, setTextRgb] = useState(hexToRgb(activeTheme.textColor));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("presets");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [presetSelectAnimation, setPresetSelectAnimation] = useState(false);

  const fetchThemes = async () => {
    try {
      const { data: themesData, error: themeError } = await supabase
        .from('themes')
        .select('*')
        .order('created_at');
      
      if (themeError) {
        console.error('Error fetching themes:', themeError);
        return;
      }
      
      if (!themesData) {
        return;
      }
      
      const updatedThemes = themesData.map(themeData => ({
        id: themeData.id,
        name: themeData.name === 'Hi' ? 'Berry Purple' : themeData.name,
        primaryColor: themeData.primary_color,
        secondaryColor: themeData.secondary_color,
        accentColor: themeData.accent_color,
        sidebarColor: themeData.sidebar_color,
        buttonColor: themeData.button_color,
        textColor: themeData.text_color,
        logoUrl: themeData.logo_url,
        customFont: themeData.custom_font,
        isDefault: false,
        isActive: themeData.is_active,
        companyName: themeData.company_name || 'My Company'
      }));
      
      console.log('Fetched themes:', updatedThemes);
      setAllThemes(updatedThemes);
    } catch (err) {
      console.error('Error fetching themes:', err);
    }
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap';
    
    if (!document.head.querySelector('link[href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap"]')) {
      document.head.appendChild(link);
      console.log("Courier Prime font link added to document head");
    } else {
      console.log("Courier Prime font link already exists in document head");
    }
    
    console.log("Font options available:", availableFonts);
    
    const courierPrimeFont = availableFonts.find(font => font.value.includes("Courier Prime"));
    if (courierPrimeFont) {
      console.log("Courier Prime font is available in options:", courierPrimeFont);
    } else {
      console.log("Courier Prime font not found in available options");
    }
    
    fetchThemes();
    
    return () => {
      const existingLink = document.head.querySelector('link[href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap"]');
      if (existingLink && existingLink === link) {
        document.head.removeChild(link);
      }
    };
  }, []);

  useEffect(() => {
    if (currentTheme) {
      setActiveTheme(currentTheme);
      setPrimaryRgb(hexToRgb(currentTheme.primaryColor));
      setSecondaryRgb(hexToRgb(currentTheme.secondaryColor));
      setAccentRgb(hexToRgb(currentTheme.accentColor));
      setSidebarRgb(hexToRgb(currentTheme.sidebarColor));
      setButtonRgb(hexToRgb(currentTheme.buttonColor));
      setTextRgb(hexToRgb(currentTheme.textColor));
    }
    
    if (availableThemes && availableThemes.length > 0) {
      setAllThemes(availableThemes);
    }
    
    const fetchCompanyName = async () => {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('company_name')
          .eq('id', 1)
          .single();
          
        if (error) {
          console.error('Error fetching company name:', error);
          return;
        }
        
        if (data && data.company_name) {
          console.log('Fetched company name from database:', data.company_name);
          setActiveTheme(prev => ({
            ...prev,
            companyName: data.company_name
          }));
        }
      } catch (err) {
        console.error('Error in fetchCompanyName:', err);
      }
    };
    
    fetchCompanyName();
  }, [currentTheme, availableThemes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'primaryColor') {
      setPrimaryRgb(hexToRgb(value));
      setActiveTheme(prev => ({
        ...prev,
        primaryColor: value
      }));
    } else if (name === 'secondaryColor') {
      setSecondaryRgb(hexToRgb(value));
      setActiveTheme(prev => ({
        ...prev,
        secondaryColor: value
      }));
    } else if (name === 'accentColor') {
      setAccentRgb(hexToRgb(value));
      setActiveTheme(prev => ({
        ...prev,
        accentColor: value
      }));
    } else if (name === 'sidebarColor') {
      setSidebarRgb(hexToRgb(value));
      setActiveTheme(prev => ({
        ...prev,
        sidebarColor: value
      }));
    } else if (name === 'buttonColor') {
      setButtonRgb(hexToRgb(value));
      setActiveTheme(prev => ({
        ...prev,
        buttonColor: value
      }));
    } else if (name === 'textColor') {
      setTextRgb(hexToRgb(value));
      setActiveTheme(prev => ({
        ...prev,
        textColor: value
      }));
    } else if (name === 'name' || name === 'companyName') {
      setActiveTheme(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePrimaryRgbChange = (values: number[]) => {
    const [r, g, b] = values;
    setPrimaryRgb({
      r,
      g,
      b
    });
    const hex = rgbToHex(r, g, b);
    setActiveTheme(prev => ({
      ...prev,
      primaryColor: hex
    }));
  };
  const handleSecondaryRgbChange = (values: number[]) => {
    const [r, g, b] = values;
    setSecondaryRgb({
      r,
      g,
      b
    });
    const hex = rgbToHex(r, g, b);
    setActiveTheme(prev => ({
      ...prev,
      secondaryColor: hex
    }));
  };
  const handleAccentRgbChange = (values: number[]) => {
    const [r, g, b] = values;
    setAccentRgb({
      r,
      g,
      b
    });
    const hex = rgbToHex(r, g, b);
    setActiveTheme(prev => ({
      ...prev,
      accentColor: hex
    }));
  };
  const handleSidebarRgbChange = (values: number[]) => {
    const [r, g, b] = values;
    setSidebarRgb({
      r,
      g,
      b
    });
    const hex = rgbToHex(r, g, b);
    setActiveTheme(prev => ({
      ...prev,
      sidebarColor: hex
    }));
  };
  const handleButtonRgbChange = (values: number[]) => {
    const [r, g, b] = values;
    setButtonRgb({
      r,
      g,
      b
    });
    const hex = rgbToHex(r, g, b);
    setActiveTheme(prev => ({
      ...prev,
      buttonColor: hex
    }));
  };
  const handleTextRgbChange = (values: number[]) => {
    const [r, g, b] = values;
    setTextRgb({
      r,
      g,
      b
    });
    const hex = rgbToHex(r, g, b);
    setActiveTheme(prev => ({
      ...prev,
      textColor: hex
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

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const {
        error: uploadError,
        data
      } = await supabase.storage.from('logos').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        toast.error('Error uploading logo');
        setUploading(false);
        return;
      }

      const {
        data: publicUrlData
      } = supabase.storage.from('logos').getPublicUrl(filePath);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        toast.error('Error getting logo URL');
        setUploading(false);
        return;
      }
      
      const logoUrl = publicUrlData.publicUrl;

      setActiveTheme(prev => ({
        ...prev,
        logoUrl
      }));

      localStorage.setItem('app-logo-url', logoUrl);

      const logoEvent = new CustomEvent('app-logo-updated', {
        detail: {
          logoUrl
        }
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

  const saveThemeSettings = async (theme: any) => {
    try {
      console.log("Saving theme settings with company name:", theme.companyName);
      
      if (theme.id) {
        const { error } = await supabase.from('themes').update({
          name: theme.name,
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor,
          sidebar_color: theme.sidebarColor,
          button_color: theme.buttonColor,
          text_color: theme.textColor,
          logo_url: theme.logoUrl,
          custom_font: theme.customFont,
          company_name: theme.companyName,
          is_active: theme.isActive
        }).eq('id', theme.id);
        
        if (error) {
          console.error("Error updating theme:", error);
          throw error;
        }
        
        if (theme.isActive) {
          const themeEvent = new CustomEvent('app-theme-updated', {
            detail: {
              theme
            }
          });
          window.dispatchEvent(themeEvent);
          
          const companyNameEvent = new CustomEvent('company-name-updated', {
            detail: {
              companyName: theme.companyName
            }
          });
          window.dispatchEvent(companyNameEvent);
          
          localStorage.setItem('company-name', theme.companyName);
          console.log("Updated company name in localStorage:", theme.companyName);
        }
        
        return {
          success: true
        };
      }
      
      const { data, error } = await supabase.from('themes').insert({
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
      }).select().single();
      
      if (error) {
        console.error("Error creating theme:", error);
        throw error;
      }
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error saving theme settings:', error);
      return {
        error
      };
    }
  };

  const saveTheme = async () => {
    try {
      setSaving(true);

      const { error: companyNameError } = await supabase
        .from('company_settings')
        .update({ company_name: activeTheme.companyName })
        .eq('id', 1);
      
      if (companyNameError) {
        console.error('Error updating company name:', companyNameError);
        toast.error('Failed to save company name');
        return;
      }

      const companyNameEvent = new CustomEvent('company-name-updated', {
        detail: {
          companyName: activeTheme.companyName
        }
      });
      window.dispatchEvent(companyNameEvent);
      
      // Deactivate all themes first
      await supabase
        .from('themes')
        .update({ is_active: false })
        .neq('id', 0);
      
      const newTheme = {
        id: activeTheme.id,
        name: activeTheme.name,
        primaryColor: activeTheme.primaryColor,
        secondaryColor: activeTheme.secondaryColor,
        accentColor: activeTheme.accentColor,
        sidebarColor: activeTheme.sidebarColor,
        buttonColor: activeTheme.buttonColor,
        textColor: activeTheme.textColor,
        logoUrl: activeTheme.logoUrl,
        customFont: activeTheme.customFont,
        isActive: true,
        companyName: activeTheme.companyName
      };
      
      const saveResult = await saveThemeSettings(newTheme);
      
      if ('error' in saveResult) {
        console.error('Error saving theme:', saveResult.error);
        toast.error('Failed to save theme settings');
        return;
      }
      
      // Force immediate theme application with detailed theme information
      const themeEvent = new CustomEvent('app-theme-updated', {
        detail: {
          theme: {
            name: newTheme.name,
            primaryColor: newTheme.primaryColor,
            secondaryColor: newTheme.secondaryColor,
            accentColor: newTheme.accentColor,
            sidebarColor: newTheme.sidebarColor,
            buttonColor: newTheme.buttonColor,
            textColor: newTheme.textColor,
            customFont: newTheme.customFont,
            companyName: newTheme.companyName,
            logoUrl: newTheme.logoUrl
          }
        }
      });
      window.dispatchEvent(themeEvent);
      
      // Apply theme directly - added for extra reliability
      const html = document.documentElement;
      
      // Remove all existing theme classes
      const themeClasses = [
        'theme-forest-green', 
        'theme-ocean-blue', 
        'theme-sunset-orange', 
        'theme-berry-purple', 
        'theme-dark-mode', 
        'theme-hi-purple',
        'theme-purple-700',
        'theme-tavern-blue',
        'hi',
        'theme-hi'
      ];
      
      themeClasses.forEach(cls => {
        html.classList.remove(cls);
      });

      // Apply class based on theme
      if (newTheme.name === 'Forest Green') {
        html.classList.add('theme-forest-green');
      } else if (newTheme.name === 'Ocean Blue') {
        html.classList.add('theme-ocean-blue');
      } else if (newTheme.name === 'Sunset Orange') {
        html.classList.add('theme-sunset-orange');
      } else if (newTheme.name === 'Berry Purple') {
        html.classList.add('theme-berry-purple');
      } else if (newTheme.name === 'Dark Mode') {
        html.classList.add('theme-dark-mode');
      } else {
        // For custom themes like NFD Theme
        html.classList.add('theme-purple-700');
        console.log('Applied custom theme class directly for:', newTheme.name);
      }
      
      // Force a direct document event
      document.dispatchEvent(new Event('themeClassChanged'));
      
      // Apply custom font if available
      if (newTheme.customFont) {
        const fontName = newTheme.customFont.split(',')[0].trim().replace(/[\"']/g, '');
        if (!document.querySelector(`link[href*="${fontName}"]`)) {
          const formattedFontName = fontName.replace(/\s+/g, '+');
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@400;700&display=swap`;
          document.head.appendChild(link);
          console.log(`Added Google Font link for: ${fontName}`);
        }
        
        // Apply font to html and body
        document.documentElement.style.setProperty('--app-font-family', newTheme.customFont);
        document.documentElement.style.fontFamily = newTheme.customFont;
        document.body.style.fontFamily = newTheme.customFont;
      }
      
      // Update localStorage for immediate effect
      localStorage.setItem('app-active-theme', newTheme.name);
      
      // Fetch updated themes
      fetchThemes();
      
      if (activeTab === 'custom' && !activeTheme.id) {
        setActiveTab('presets');
        toast.success('Theme saved! You can now select it from the presets.');
      } else {
        toast.success('Theme updated successfully');
      }
      
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const applyThemeDirectly = (themeName: string) => {
    const html = document.documentElement;
    
    const themeClasses = [
      'theme-forest-green', 
      'theme-ocean-blue', 
      'theme-sunset-orange', 
      'theme-berry-purple', 
      'theme-dark-mode', 
      'theme-hi-purple',
      'theme-tavern-blue',
      'theme-purple-700'
    ];
    
    themeClasses.forEach(cls => {
      html.classList.remove(cls);
    });
    
    if (themeName === 'Forest Green') {
      html.classList.add('theme-forest-green');
    } else if (themeName === 'Ocean Blue') {
      html.classList.add('theme-ocean-blue');
    } else if (themeName === 'Sunset Orange') {
      html.classList.add('theme-sunset-orange');
    } else if (themeName === 'Berry Purple') {
      html.classList.add('theme-berry-purple');
    } else if (themeName === 'Dark Mode') {
      html.classList.add('theme-dark-mode');
    } else if (themeName === 'Hi Purple') {
      html.classList.add('theme-berry-purple');
    } else {
      html.classList.add('theme-purple-700');
      console.log('Applied custom theme class for:', themeName);
    }
    
    document.dispatchEvent(new Event('themeClassChanged'));
    console.log('Theme applied directly:', themeName);
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(JSON.stringify(activeTheme, null, 2));
    setIsCopied(true);
    toast.success('Theme settings copied to clipboard');
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const createCombinedThemesList = (): PresetTheme[] => {
    const basePresets = presetThemes.map(preset => ({
      id: preset.id,
      name: preset.name,
      colors: preset.colors,
      isDefault: preset.id === 'berry-purple'
    }));
    
    const customThemes = allThemes
      .filter(theme => 
        !presetThemes.some(preset => preset.name === theme.name) &&
        theme.name !== 'Hi'
      )
      .map(theme => ({
        id: `custom-${theme.id}`,
        name: theme.name,
        colors: {
          primary: theme.primaryColor,
          secondary: theme.secondaryColor,
          accent: theme.accentColor,
          sidebar: theme.sidebarColor,
          button: theme.buttonColor,
          text: theme.textColor
        },
        isDefault: false,
        isCustom: true,
        originalTheme: theme
      } as PresetTheme));
    
    return [...basePresets, ...customThemes];
  };

  const getCustomThemeFromPreset = (presetId: string) => {
    if (presetId.startsWith('custom-')) {
      const themeId = presetId.replace('custom-', '');
      return allThemes.find(theme => theme.id === themeId);
    }
    return null;
  };

  const applyPresetTheme = (preset: any) => {
    if (preset.isCustom && preset.originalTheme) {
      setActiveTheme({
        ...preset.originalTheme,
        isActive: true
      });
      setPrimaryRgb(hexToRgb(preset.originalTheme.primaryColor));
      setSecondaryRgb(hexToRgb(preset.originalTheme.secondaryColor));
      setAccentRgb(hexToRgb(preset.originalTheme.accentColor));
      setSidebarRgb(hexToRgb(preset.originalTheme.sidebarColor));
      setButtonRgb(hexToRgb(preset.originalTheme.buttonColor));
      setTextRgb(hexToRgb(preset.originalTheme.textColor));
    } else {
      setActiveTheme(prev => ({
        ...prev,
        name: preset.name,
        primaryColor: preset.colors.primary,
        secondaryColor: preset.colors.secondary,
        accentColor: preset.colors.accent,
        sidebarColor: preset.colors.sidebar,
        buttonColor: preset.colors.button,
        textColor: preset.colors.text,
        isActive: true
      }));

      setPrimaryRgb(hexToRgb(preset.colors.primary));
      setSecondaryRgb(hexToRgb(preset.colors.secondary));
      setAccentRgb(hexToRgb(preset.colors.accent));
      setSidebarRgb(hexToRgb(preset.colors.sidebar));
      setButtonRgb(hexToRgb(preset.colors.button));
      setTextRgb(hexToRgb(preset.colors.text));
    }
    
    setSelectedPreset(preset.id);
    setPresetSelectAnimation(true);
    setTimeout(() => setPresetSelectAnimation(false), 800);
    
    applyThemeDirectly(preset.name);
  };

  const ColorSliderGroup = ({
    name,
    rgbValues,
    onChange
  }: {
    name: string;
    rgbValues: {
      r: number;
      g: number;
      b: number;
    };
    onChange: (values: number[]) => void;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center">
        <div className="w-6 h-6 mr-2" style={{
          backgroundColor: `rgb(${rgbValues.r}, 0, 0)`
        }}></div>
        <Slider defaultValue={[rgbValues.r]} max={255} step={1} value={[rgbValues.r]} onValueChange={values => onChange([values[0], rgbValues.g, rgbValues.b])} className="flex-1" />
        <span className="ml-2 w-8 text-center text-xs">{rgbValues.r}</span>
      </div>
      <div className="flex items-center">
        <div className="w-6 h-6 mr-2" style={{
          backgroundColor: `rgb(0, ${rgbValues.g}, 0)`
        }}></div>
        <Slider defaultValue={[rgbValues.g]} max={255} step={1} value={[rgbValues.g]} onValueChange={values => onChange([rgbValues.r, values[0], rgbValues.b])} className="flex-1" />
        <span className="ml-2 w-8 text-center text-xs">{rgbValues.g}</span>
      </div>
      <div className="flex items-center">
        <div className="w-6 h-6 mr-2" style={{
          backgroundColor: `rgb(0, 0, ${rgbValues.b})`
        }}></div>
        <Slider defaultValue={[rgbValues.b]} max={255} step={1} value={[rgbValues.b]} onValueChange={values => onChange([rgbValues.r, rgbValues.g, values[0]])} className="flex-1" />
        <span className="ml-2 w-8 text-center text-xs">{rgbValues.b}</span>
      </div>
    </div>
  );

  const getActiveThemeClasses = () => {
    const htmlElement = document.documentElement;
    
    if (htmlElement.classList.contains('theme-forest-green')) {
      return 'bg-[#1b5e20] text-white';
    } else if (htmlElement.classList.contains('theme-ocean-blue')) {
      return 'bg-[#1565c0] text-white';
    } else if (htmlElement.classList.contains('theme-sunset-orange')) {
      return 'bg-[#e65100] text-white';
    } else if (htmlElement.classList.contains('theme-berry-purple')) {
      return 'bg-[#6a1b9a] text-white';
    } else if (htmlElement.classList.contains('theme-dark-mode')) {
      return 'bg-[#333333] text-white';
    } else if (htmlElement.classList.contains('theme-hi-purple')) {
      return 'bg-[#806cac] text-white';
    } else {
      return 'bg-purple-700 text-white';
    }
  };

  const getActiveThemeBorder = () => {
    const htmlElement = document.documentElement;
    
    if (htmlElement.classList.contains('theme-forest-green')) {
      return 'border-[#1b5e20]';
    } else if (htmlElement.classList.contains('theme-ocean-blue')) {
      return 'border-[#1565c0]';
    } else if (htmlElement.classList.contains('theme-sunset-orange')) {
      return 'border-[#e65100]';
    } else if (htmlElement.classList.contains('theme-berry-purple')) {
      return 'border-[#6a1b9a]';
    } else if (htmlElement.classList.contains('theme-dark-mode')) {
      return 'border-[#333333]';
    } else if (htmlElement.classList.contains('theme-hi-purple')) {
      return 'border-[#806cac]';
    } else {
      return 'border-purple-800';
    }
  };

  const getThemeNameInputClasses = () => {
    const htmlElement = document.documentElement;
    
    if (htmlElement.classList.contains('theme-forest-green')) {
      return "bg-transparent border-[#2e7d32]/30 focus:ring-[#2e7d32]/50";
    } else if (htmlElement.classList.contains('theme-ocean-blue')) {
      return "bg-transparent border-[#1976d2]/30 focus:ring-[#1976d2]/50";
    } else if (htmlElement.classList.contains('theme-sunset-orange')) {
      return "bg-transparent border-[#ef6c00]/30 focus:ring-[#ef6c00]/50";
    } else if (htmlElement.classList.contains('theme-berry-purple')) {
      return "bg-transparent border-[#8e24aa]/30 focus:ring-[#8e24aa]/50";
    } else if (htmlElement.classList.contains('theme-dark-mode')) {
      return "bg-transparent border-[#333333]/30 focus:ring-[#333333]/50";
    } else if (htmlElement.classList.contains('theme-hi-purple')) {
      return "bg-transparent border-[#9d89c9]/30 focus:ring-[#9d89c9]/50";
    } else {
      return "bg-transparent border-primary/30 focus:ring-primary/50";
    }
  };

  const currentLogoUrl = activeTheme.logoUrl || localStorage.getItem('app-logo-url') || "/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png";

  const combinedThemes = createCombinedThemesList();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand & Theme Settings</CardTitle>
        <CardDescription>
          Customize the look and feel of your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6 p-1 bg-purple-100 rounded-lg">
            <TabsTrigger 
              value="presets" 
              className={`
                flex-1 
                transition-all 
                duration-300 
                ease-in-out
                ${activeTab === 'presets' 
                  ? `${getActiveThemeClasses()} shadow-md` 
                  : 'bg-transparent text-purple-900 hover:bg-purple-200'}
                rounded-md
                py-2
                flex 
                items-center 
                justify-center
                gap-2
                font-medium
                border
                ${activeTab === 'presets' 
                  ? `${getActiveThemeBorder()}` 
                  : 'border-purple-200 hover:border-purple-300'}
              `}
            >
              <Palette className="h-4 w-4" />
              Preset Themes & Logo
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              className={`
                flex-1 
                transition-all 
                duration-300 
                ease-in-out
                ${activeTab === 'custom' 
                  ? `${getActiveThemeClasses()} shadow-md` 
                  : 'bg-transparent text-purple-900 hover:bg-purple-200'}
                rounded-md
                py-2
                flex 
                items-center 
                justify-center
                gap-2
                font-medium
                border
                ${activeTab === 'custom' 
                  ? `${getActiveThemeBorder()}` 
                  : 'border-purple-200 hover:border-purple-300'}
              `}
            >
              <Sliders className="h-4 w-4" />
              Create Theme
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="presets" className="space-y-6">
            <div className="grid gap-6">
              <div className="grid gap-4">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  Theme Name
                </Label>
                <Input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={activeTheme.name} 
                  onChange={handleInputChange} 
                  className={`
                    w-full 
                    py-3 
                    px-4 
                    rounded-lg 
                    text-lg 
                    font-normal 
                    shadow-sm 
                    transition-all 
                    duration-300 
                    border-2 
                    focus:outline-none 
                    focus:ring-2 
                    ${getThemeNameInputClasses()}
                  `}
                  placeholder="Enter a theme name"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Select a Preset Theme
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {combinedThemes.map(theme => (
                    <div 
                      key={theme.id} 
                      className={`
                        border rounded-md overflow-hidden cursor-pointer 
                        transition-all duration-300 
                        ${selectedPreset === theme.id ? 'ring-4 ring-purple-500 shadow-lg transform scale-105' : 'hover:shadow-md'}
                        ${presetSelectAnimation && selectedPreset === theme.id ? 'animate-pulse' : ''}
                        relative
                        group
                      `}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.theme-actions')) {
                          e.stopPropagation();
                          return;
                        }
                        applyPresetTheme(theme);
                      }}
                    >
                      <div className="h-24 relative" style={{
                        backgroundColor: theme.colors.primary
                      }}>
                        <div className="h-8 w-full" style={{
                          backgroundColor: theme.colors.sidebar
                        }}></div>
                        <div className="flex justify-center mt-2">
                          <div className="h-8 w-16 rounded" style={{
                            backgroundColor: theme.colors.button
                          }}></div>
                        </div>
                        {theme.isDefault && (
                          <div className="absolute top-1 left-1 bg-white/50 text-xs px-1 rounded">
                            Default
                          </div>
                        )}
                        {theme.isCustom && (
                          <>
                            <div className="absolute top-1 right-1 bg-white/50 text-xs px-1 rounded">
                              Custom
                            </div>
                            <div className="theme-actions absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-white/90 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (theme.originalTheme) {
                                    setActiveTheme(theme.originalTheme);
                                    setActiveTab('custom');
                                  }
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (theme.originalTheme?.id) {
                                    const { error } = await supabase
                                      .from('themes')
                                      .delete()
                                      .eq('id', theme.originalTheme.id);
                                    
                                    if (error) {
                                      toast.error('Failed to delete theme');
                                      return;
                                    }
                                    
                                    toast.success('Theme deleted successfully');
                                    fetchThemes();
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                        {selectedPreset === theme.id && (
                          <div className="absolute bottom-1 right-1">
                            <Check className="h-5 w-5 text-white bg-green-500 rounded-full p-1" />
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-center text-sm font-medium">
                        {theme.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <Label htmlFor="fontSelect" className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  Font Style
                </Label>
                <Select 
                  value={activeTheme.customFont || ''} 
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger id="fontSelect" className="w-full">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFonts.map((font) => (
                      <SelectItem 
                        key={font.value} 
                        value={font.value} 
                        style={{ fontFamily: font.value }}
                      >
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div 
                  className="p-4 border rounded-md mt-2 text-center text-lg" 
                  style={{ fontFamily: activeTheme.customFont || 'inherit' }}
                >
                  Sample text with the {activeTheme.customFont?.split(",")[0].replace(/['"]/g, '') || 'selected'} font
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Label className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-muted-foreground" />
                  Logo Image
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-3">
                    <div className="border p-4 rounded-md bg-gray-50 flex items-center justify-center h-40">
                      {currentLogoUrl ? (
                        <img 
                          src={currentLogoUrl} 
                          alt="Company Logo" 
                          className="max-h-32 max-w-full object-contain" 
                        />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <Upload className="mx-auto h-10 w-10 mb-2" />
                          <p>No logo uploaded</p>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="relative"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </>
                      )}
                      <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={handleLogoUpload}
                        accept="image/*"
                        disabled={uploading}
                      />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input 
                        id="companyName"
                        name="companyName"
                        className="mt-1"
                        value={activeTheme.companyName}
                        onChange={handleInputChange}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={saveTheme}
                        disabled={saving}
                        className="w-full"
                        size="lg"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <SaveIcon className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-4">
                <Label htmlFor="customName" className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  Theme Name
                </Label>
                <Input 
                  type="text" 
                  id="customName" 
                  name="name" 
                  value={activeTheme.name} 
                  onChange={handleInputChange} 
                  className={`
                    w-full 
                    py-3 
                    px-4 
                    rounded-lg 
                    text-lg 
                    font-normal 
                    shadow-sm 
                    transition-all 
                    duration-300 
                    border-2 
                    focus:outline-none 
                    focus:ring-2 
                    ${getThemeNameInputClasses()}
                  `}
                  placeholder="Enter a theme name"
                />
              </div>

              <div className="pt-4 grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <ColorPicker
                      color={activeTheme.primaryColor}
                      onChange={(color) => handleInputChange({ target: { name: 'primaryColor', value: color } } as any)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <ColorPicker
                      color={activeTheme.secondaryColor}
                      onChange={(color) => handleInputChange({ target: { name: 'secondaryColor', value: color } } as any)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <ColorPicker
                      color={activeTheme.accentColor}
                      onChange={(color) => handleInputChange({ target: { name: 'accentColor', value: color } } as any)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sidebarColor">Sidebar Color</Label>
                    <ColorPicker
                      color={activeTheme.sidebarColor}
                      onChange={(color) => handleInputChange({ target: { name: 'sidebarColor', value: color } } as any)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buttonColor">Button Color</Label>
                    <ColorPicker
                      color={activeTheme.buttonColor}
                      onChange={(color) => handleInputChange({ target: { name: 'buttonColor', value: color } } as any)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="textColor">Text Color</Label>
                    <ColorPicker
                      color={activeTheme.textColor}
                      onChange={(color) => handleInputChange({ target: { name: 'textColor', value: color } } as any)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={saveTheme}
                    disabled={saving}
                    className="w-full"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <SaveIcon className="mr-2 h-4 w-4" />
                        Save Theme
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
