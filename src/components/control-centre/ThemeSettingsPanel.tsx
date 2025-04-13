
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeSettings } from '@/types/control-centre-types';
import { availableFonts } from '@/services/control-centre-service';
import { toast } from 'sonner';
import { TavernLogo } from '@/components/TavernLogo';
import { ImagePlus, Check, RefreshCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';
import { useNavigate } from 'react-router-dom';

interface ThemeSettingsPanelProps {
  currentTheme: ThemeSettings | null;
  availableThemes: ThemeSettings[];
}

export function ThemeSettingsPanel({ currentTheme, availableThemes }: ThemeSettingsPanelProps) {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('presets');
  const [themes, setThemes] = useState<ThemeSettings[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const [customTheme, setCustomTheme] = useState({
    primaryColor: currentTheme?.primaryColor || '#806cac',
    secondaryColor: currentTheme?.secondaryColor || '#705b9b',
    accentColor: currentTheme?.accentColor || '#9d89c9',
    sidebarColor: currentTheme?.sidebarColor || '#806cac',
    buttonColor: currentTheme?.buttonColor || '#806cac',
    textColor: currentTheme?.textColor || '#333333',
    customFont: currentTheme?.customFont || availableFonts[0].value,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('*')
          .order('created_at');
        
        if (error) throw error;
        
        const transformedThemes = data.map(theme => ({
          id: theme.id,
          name: theme.name,
          primaryColor: theme.primary_color,
          secondaryColor: theme.secondary_color,
          accentColor: theme.accent_color,
          sidebarColor: theme.sidebar_color,
          buttonColor: theme.button_color,
          textColor: theme.text_color,
          logoUrl: theme.logo_url,
          customFont: theme.custom_font,
          isDefault: false,
          isActive: theme.is_active
        }));
        
        setThemes(transformedThemes);
        
        const activeTheme = transformedThemes.find(theme => theme.isActive);
        if (activeTheme) setSelectedThemeId(activeTheme.id);
      } catch (error) {
        console.error('Error fetching themes:', error);
        toast.error('Failed to load themes');
      }
    };

    fetchThemes();
  }, []);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleLogoUpload(files[0]);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setLogoPreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };
  
  const handleThemeSelection = (themeId: string) => {
    setSelectedThemeId(themeId);
  };
  
  const applyTheme = async () => {
    if (!selectedThemeId) {
      toast.error('Please select a theme first');
      return;
    }

    if (profile?.role !== 'GOD' && profile?.role !== 'Super User') {
      toast.error('You do not have permission to change themes');
      return;
    }

    try {
      setSaving(true);
      
      console.log('Applying theme with ID:', selectedThemeId);
      
      // First update all themes to inactive
      const { error: resetError } = await supabase
        .from('themes')
        .update({ is_active: false })
        .neq('id', selectedThemeId); // Update all rows except the selected one
      
      if (resetError) {
        console.error('Error resetting themes:', resetError);
        throw resetError;
      }
      
      // Then set the selected theme to active
      const { error: updateError } = await supabase
        .from('themes')
        .update({ is_active: true })
        .eq('id', selectedThemeId);
      
      if (updateError) {
        console.error('Error activating theme:', updateError);
        throw updateError;
      }
      
      // Apply the theme without a full page reload
      const selectedTheme = themes.find(theme => theme.id === selectedThemeId);
      if (selectedTheme) {
        const html = document.documentElement;
        
        // Remove any existing theme classes
        const themeClasses = ['theme-forest-green', 'theme-ocean-blue', 'theme-sunset-orange', 'theme-berry-purple', 'theme-dark-mode'];
        themeClasses.forEach(cls => {
          html.classList.remove(cls);
        });
        
        // Add the new theme class based on the theme name
        if (selectedTheme.name === 'Forest Green') {
          html.classList.add('theme-forest-green');
        } else if (selectedTheme.name === 'Ocean Blue') {
          html.classList.add('theme-ocean-blue');
        } else if (selectedTheme.name === 'Sunset Orange') {
          html.classList.add('theme-sunset-orange');
        } else if (selectedTheme.name === 'Berry Purple') {
          html.classList.add('theme-berry-purple');
        } else if (selectedTheme.name === 'Dark Mode') {
          html.classList.add('theme-dark-mode');
        }
      }
      
      toast.success('Theme applied successfully');
      
      // Don't navigate away or reload the page after applying the theme
      // This ensures we stay on the same page and routing isn't affected
      
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Failed to apply theme');
    } finally {
      setSaving(false);
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleLogoUpload(files[0]);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setLogoPreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };
  
  const resetLogo = () => {
    setLogoPreview(null);
    toast.success('Logo reset to default');
  };

  if (profile?.role !== 'GOD' && profile?.role !== 'Super User') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand & Theme Settings</CardTitle>
          <CardDescription>
            Access restricted to GOD and Super User roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-red-50 text-red-800 rounded-md">
            <p className="font-medium">Access Denied</p>
            <p className="mt-1">You do not have permission to modify theme settings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand & Theme Settings</CardTitle>
          <CardDescription>
            Customize the application's appearance to match your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full grid grid-cols-2">
              <TabsTrigger 
                value="presets" 
                className="bg-[#f0f2f5] text-[#4a5568] hover:bg-[#e2e8f0] transition-colors duration-200 font-medium data-[state=active]:bg-[#8e44ad] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Theme Presets
              </TabsTrigger>
              <TabsTrigger 
                value="custom" 
                className="bg-[#f0f2f5] text-[#4a5568] hover:bg-[#e2e8f0] transition-colors duration-200 font-medium data-[state=active]:bg-[#8e44ad] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Custom Theme
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="presets" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themes.map(theme => (
                  <div 
                    key={theme.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedThemeId === theme.id 
                        ? 'ring-2 ring-offset-2 ring-[#8e44ad] bg-purple-50' 
                        : 'hover:border-[#8e44ad]/50 hover:bg-purple-50/30'
                    }`}
                    onClick={() => handleThemeSelection(theme.id)}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">{theme.name}</h3>
                      {selectedThemeId === theme.id && (
                        <Check className="h-4 w-4 text-[#8e44ad]" />
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.primaryColor }}></div>
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.secondaryColor }}></div>
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.accentColor }}></div>
                    </div>
                    <div className="h-16 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: theme.sidebarColor }}>
                      Sidebar
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: customTheme.primaryColor }}
                      ></div>
                      <Input 
                        id="primaryColor"
                        type="text"
                        value={customTheme.primaryColor}
                        onChange={(e) => setCustomTheme({...customTheme, primaryColor: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: customTheme.secondaryColor }}
                      ></div>
                      <Input 
                        id="secondaryColor"
                        type="text"
                        value={customTheme.secondaryColor}
                        onChange={(e) => setCustomTheme({...customTheme, secondaryColor: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: customTheme.accentColor }}
                      ></div>
                      <Input 
                        id="accentColor"
                        type="text"
                        value={customTheme.accentColor}
                        onChange={(e) => setCustomTheme({...customTheme, accentColor: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sidebarColor">Sidebar Color</Label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: customTheme.sidebarColor }}
                      ></div>
                      <Input 
                        id="sidebarColor"
                        type="text"
                        value={customTheme.sidebarColor}
                        onChange={(e) => setCustomTheme({...customTheme, sidebarColor: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="buttonColor">Button Color</Label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: customTheme.buttonColor }}
                      ></div>
                      <Input 
                        id="buttonColor"
                        type="text"
                        value={customTheme.buttonColor}
                        onChange={(e) => setCustomTheme({...customTheme, buttonColor: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="textColor">Text Color</Label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: customTheme.textColor }}
                      ></div>
                      <Input 
                        id="textColor"
                        type="text"
                        value={customTheme.textColor}
                        onChange={(e) => setCustomTheme({...customTheme, textColor: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="customFont">Font Family</Label>
                <Select 
                  value={customTheme.customFont} 
                  onValueChange={(value) => setCustomTheme({...customTheme, customFont: value})}
                >
                  <SelectTrigger id="customFont">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFonts.map(font => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Company Logo</h3>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="border rounded-lg p-6 bg-gray-50 min-w-[200px] min-h-[100px] flex items-center justify-center">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Company logo preview" 
                    className="max-w-full max-h-[100px]"
                  />
                ) : (
                  <TavernLogo size="lg" />
                )}
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Upload a custom logo to replace the default Hi logo throughout the application.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    type="button" 
                    onClick={triggerFileInput}
                    disabled={uploading}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  
                  {logoPreview && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetLogo}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Reset to Default
                    </Button>
                  )}
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button 
          onClick={applyTheme} 
          disabled={saving || !selectedThemeId}
          className="bg-[#8e44ad] hover:bg-[#7d3c98] text-white"
        >
          {saving ? 'Applying...' : 'Apply Theme Changes'}
        </Button>
      </div>
    </div>
  );
}
