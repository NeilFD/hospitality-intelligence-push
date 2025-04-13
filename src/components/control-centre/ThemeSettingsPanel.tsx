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
import { Check, ChevronsUpDown, Copy, Loader2, SaveIcon, Palette, Sliders, Upload, Image } from 'lucide-react';

const presetThemes: PresetTheme[] = [{
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
  }
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
  }
}, {
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
}, {
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
}, {
  id: 'hi-purple',
  name: 'Hi Purple',
  colors: {
    primary: '#806cac',
    secondary: '#e0d9f0',
    accent: '#9d89c9',
    sidebar: '#705b9b',
    button: '#9d89c9',
    text: '#1A1F2C'
  }
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
    name: 'Default',
    primaryColor: '#ffffff',
    secondaryColor: '#f0f0f0',
    accentColor: '#007bff',
    sidebarColor: '#333333',
    buttonColor: '#007bff',
    textColor: '#212121',
    logoUrl: '',
    customFont: 'Arial, sans-serif',
    isDefault: true,
    isActive: true
  });

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
  }, [currentTheme]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;

    if (name === 'primaryColor') {
      setPrimaryRgb(hexToRgb(value));
    } else if (name === 'secondaryColor') {
      setSecondaryRgb(hexToRgb(value));
    } else if (name === 'accentColor') {
      setAccentRgb(hexToRgb(value));
    } else if (name === 'sidebarColor') {
      setSidebarRgb(hexToRgb(value));
    } else if (name === 'buttonColor') {
      setButtonRgb(hexToRgb(value));
    } else if (name === 'textColor') {
      setTextRgb(hexToRgb(value));
    }
    setActiveTheme(prev => ({
      ...prev,
      [name]: value
    }));
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
        data: bucketsList
      } = await supabase.storage.listBuckets();
      const logosBucketExists = bucketsList?.some(bucket => bucket.name === 'logos');
      if (!logosBucketExists) {
        const {
          error: createBucketError
        } = await supabase.storage.createBucket('logos', {
          public: true
        });
        if (createBucketError) {
          console.error('Error creating logos bucket:', createBucketError);
          toast.error('Error creating logos storage');
          setUploading(false);
          return;
        }
      }

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

  const saveTheme = async () => {
    try {
      setSaving(true);

      const {
        data,
        error
      } = await supabase.from('themes').update({
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
      }).eq('id', activeTheme.id);
      
      if (error) {
        console.error('Error updating theme:', error);
        toast.error('Failed to save theme settings');
        return;
      }
      
      if (activeTheme.customFont) {
        document.documentElement.style.setProperty('--app-font-family', activeTheme.customFont);
        document.documentElement.style.fontFamily = activeTheme.customFont;
      }
      
      const themeEvent = new CustomEvent('app-theme-updated', {
        detail: { theme: activeTheme }
      });
      console.log("Dispatching theme event with data:", activeTheme);
      window.dispatchEvent(themeEvent);
      
      applyThemeDirectly(activeTheme.name);
      
      toast.success('Theme settings saved successfully');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const applyThemeDirectly = (themeName: string) => {
    const html = document.documentElement;
    
    const themeClasses = ['theme-forest-green', 'theme-ocean-blue', 'theme-sunset-orange', 'theme-berry-purple', 'theme-dark-mode', 'theme-hi-purple'];
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
      html.classList.add('theme-hi-purple');
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

    setPrimaryRgb(hexToRgb(preset.colors.primary));
    setSecondaryRgb(hexToRgb(preset.colors.secondary));
    setAccentRgb(hexToRgb(preset.colors.accent));
    setSidebarRgb(hexToRgb(preset.colors.sidebar));
    setButtonRgb(hexToRgb(preset.colors.button));
    setTextRgb(hexToRgb(preset.colors.text));
    
    setSelectedPreset(preset.id);
    setPresetSelectAnimation(true);
    setTimeout(() => setPresetSelectAnimation(false), 800);
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
  }) => <div className="space-y-2">
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
    </div>;

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
      return "bg-[#e8f5e9] border-[#2e7d32]/30 focus:ring-[#2e7d32]/50";
    } else if (htmlElement.classList.contains('theme-ocean-blue')) {
      return "bg-[#e3f2fd] border-[#1976d2]/30 focus:ring-[#1976d2]/50";
    } else if (htmlElement.classList.contains('theme-sunset-orange')) {
      return "bg-[#fff3e0] border-[#ef6c00]/30 focus:ring-[#ef6c00]/50";
    } else if (htmlElement.classList.contains('theme-berry-purple')) {
      return "bg-[#f3e5f5] border-[#8e24aa]/30 focus:ring-[#8e24aa]/50";
    } else if (htmlElement.classList.contains('theme-dark-mode')) {
      return "bg-[#424242]/10 border-[#333333]/30 focus:ring-[#333333]/50";
    } else if (htmlElement.classList.contains('theme-hi-purple')) {
      return "bg-[#e0d9f0] border-[#9d89c9]/30 focus:ring-[#9d89c9]/50";
    } else {
      return "bg-muted/30 border-primary/30 focus:ring-primary/50";
    }
  };

  return <Card>
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
              Custom Colors
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
                    font-semibold 
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
                  {presetThemes.map(theme => (
                    <div 
                      key={theme.id} 
                      className={`
                        border rounded-md overflow-hidden cursor-pointer 
                        transition-all duration-300 
                        ${selectedPreset === theme.id ? 'ring-4 ring-purple-500 shadow-lg transform scale-105' : 'hover:shadow-md'}
                        ${presetSelectAnimation && selectedPreset === theme.id ? 'animate-pulse' : ''}
                      `}
                      onClick={() => applyPresetTheme(theme)}
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
                        {selectedPreset === theme.id && (
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      <div className={`p-2 text-center text-sm font-medium ${selectedPreset === theme.id ? 'bg-purple-100' : ''}`}>
                        {theme.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4 p-6 border rounded-lg">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Image className="mr-2 h-5 w-5" />
                  Brand Logo
                </h3>
                
                <div className="grid gap-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors">
                    {activeTheme.logoUrl ? <div className="relative w-full flex flex-col items-center">
                        <img src={activeTheme.logoUrl} alt="Logo" className="max-h-40 object-contain mb-4" />
                        <Label htmlFor="logoUrl" className="cursor-pointer px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center">
                          <Upload className="mr-2 h-4 w-4" />
                          Change Logo
                        </Label>
                      </div> : <div className="flex flex-col items-center text-center">
                        <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium">Upload logo</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Drag and drop or click to browse
                        </p>
                        <Label htmlFor="logoUrl" className="cursor-pointer px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center">
                          <Upload className="mr-2 h-4 w-4" />
                          Select File
                        </Label>
                      </div>}
                    <Input type="file" id="logoUrl" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    {uploading && <p className="mt-2 text-sm">Uploading logo...</p>}
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4">
                <Label htmlFor="customFont" className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-muted-foreground" />
                  Custom Font
                </Label>
                <Select 
                  onValueChange={handleSelectChange} 
                  defaultValue={activeTheme.customFont || undefined}
                >
                  <SelectTrigger 
                    className={`
                      w-full 
                      py-3 
                      px-4 
                      rounded-lg 
                      text-lg 
                      font-semibold 
                      shadow-sm 
                      transition-all 
                      duration-300 
                      border-2 
                      focus:outline-none 
                      focus:ring-2 
                      ${getThemeNameInputClasses()}
                    `}
                  >
                     <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    {availableFonts.map(font => (
                      <SelectItem 
                        key={font.value} 
                        value={font.value} 
                        style={{ 
                          fontFamily: font.value,
                          fontSize: "16px",
                          padding: "10px 8px 10px 28px",
                          marginBottom: "4px",
                          fontWeight: font.value.includes("Courier Prime") ? "normal" : "inherit"
                        }}
                      >
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active Theme</Label>
                <Switch id="isActive" checked={activeTheme.isActive} onCheckedChange={handleSwitchChange} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="primaryColor" className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded-full" style={{
                backgroundColor: activeTheme.primaryColor
              }}></div>
                Primary Color
              </Label>
              <div className="flex space-x-2 items-center">
                <div className="w-12 h-12 rounded-md" style={{
                backgroundColor: activeTheme.primaryColor
              }}></div>
                <Input type="text" id="primaryColor" name="primaryColor" value={activeTheme.primaryColor} onChange={handleInputChange} className="flex-grow" />
              </div>
              <div className="mt-2">
                <ColorSliderGroup name="primary" rgbValues={primaryRgb} onChange={handlePrimaryRgbChange} />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="secondaryColor" className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded-full" style={{
                backgroundColor: activeTheme.secondaryColor
              }}></div>
                Secondary Color
              </Label>
              <div className="flex space-x-2 items-center">
                <div className="w-12 h-12 rounded-md" style={{
                backgroundColor: activeTheme.secondaryColor
              }}></div>
                <Input type="text" id="secondaryColor" name="secondaryColor" value={activeTheme.secondaryColor} onChange={handleInputChange} className="flex-grow" />
              </div>
              <div className="mt-2">
                <ColorSliderGroup name="secondary" rgbValues={secondaryRgb} onChange={handleSecondaryRgbChange} />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="accentColor" className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded-full" style={{
                backgroundColor: activeTheme.accentColor
              }}></div>
                Accent Color
              </Label>
              <div className="flex space-x-2 items-center">
                <div className="w-12 h-12 rounded-md" style={{
                backgroundColor: activeTheme.accentColor
              }}></div>
                <Input type="text" id="accentColor" name="accentColor" value={activeTheme.accentColor} onChange={handleInputChange} className="flex-grow" />
              </div>
              <div className="mt-2">
                <ColorSliderGroup name="accent" rgbValues={accentRgb} onChange={handleAccentRgbChange} />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sidebarColor" className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded-full" style={{
                backgroundColor: activeTheme.sidebarColor
              }}></div>
                Sidebar Color
              </Label>
              <div className="flex space-x-2 items-center">
                <div className="w-12 h-12 rounded-md" style={{
                backgroundColor: activeTheme.sidebarColor
              }}></div>
                <Input type="text" id="sidebarColor" name="sidebarColor" value={activeTheme.sidebarColor} onChange={handleInputChange} className="flex-grow" />
              </div>
              <div className="mt-2">
                <ColorSliderGroup name="sidebar" rgbValues={sidebarRgb} onChange={handleSidebarRgbChange} />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="buttonColor" className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded-full" style={{
                backgroundColor: activeTheme.buttonColor
              }}></div>
                Button Color
              </Label>
              <div className="flex space-x-2 items-center">
                <div className="w-12 h-12 rounded-md" style={{
                backgroundColor: activeTheme.buttonColor
              }}></div>
                <Input type="text" id="buttonColor" name="buttonColor" value={activeTheme.buttonColor} onChange={handleInputChange} className="flex-grow" />
              </div>
              <div className="mt-2">
                <ColorSliderGroup name="button" rgbValues={buttonRgb} onChange={handleButtonRgbChange} />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="textColor" className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded-full" style={{
                backgroundColor: activeTheme.textColor
              }}></div>
                Text Color
              </Label>
              <div className="flex space-x-2 items-center">
                <div className="w-12 h-12 rounded-md" style={{
                backgroundColor: activeTheme.textColor
              }}></div>
                <Input type="text" id="textColor" name="textColor" value={activeTheme.textColor} onChange={handleInputChange} className="flex-grow" />
              </div>
              <div className="mt-2">
                <ColorSliderGroup name="text" rgbValues={textRgb} onChange={handleTextRgbChange} />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <Button variant="outline" onClick={() => setActiveTab("presets")} className="mr-2">
                Back to Presets
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleCopyClick}>
            {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {isCopied ? "Copied!" : "Copy Settings"}
          </Button>
          <Button 
            onClick={saveTheme} 
            disabled={saving}
            className={`relative ${selectedPreset ? 'bg-purple-700 hover:bg-purple-800' : ''}`}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedPreset && !saving && (
              <span className="absolute inset-0 bg-purple-500 animate-pulse rounded-md opacity-30"></span>
            )}
            Save Theme
          </Button>
        </div>
      </CardContent>
    </Card>;
}
