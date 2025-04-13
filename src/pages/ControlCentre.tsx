
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from '@/services/auth-service';
import { getControlCentreData } from '@/services/control-centre-service';
import { PermissionMatrixPanel } from '@/components/control-centre/PermissionMatrixPanel';
import { ThemeSettingsPanel } from '@/components/control-centre/ThemeSettingsPanel';
import { TargetSettingsPanel } from '@/components/control-centre/TargetSettingsPanel';
import { DatabasePanel } from '@/components/control-centre/DatabasePanel';
import { Navigate } from 'react-router-dom';

export default function ControlCentre() {
  const {
    profile
  } = useAuthStore();
  const [activeTab, setActiveTab] = useState('permissions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [themeState, setThemeState] = useState({
    hasForestGreenTheme: false,
    hasOceanBlueTheme: false,
    hasSunsetOrangeTheme: false,
    hasBerryPurpleTheme: false,
    hasDarkModeTheme: false,
    hasHiPurpleTheme: false
  });
  
  // Check for theme changes when the component mounts and when theme changes
  useEffect(() => {
    const checkThemeClasses = () => {
      const htmlElement = document.documentElement;
      setThemeState({
        hasForestGreenTheme: htmlElement.classList.contains('theme-forest-green'),
        hasOceanBlueTheme: htmlElement.classList.contains('theme-ocean-blue'),
        hasSunsetOrangeTheme: htmlElement.classList.contains('theme-sunset-orange'),
        hasBerryPurpleTheme: htmlElement.classList.contains('theme-berry-purple'),
        hasDarkModeTheme: htmlElement.classList.contains('theme-dark-mode'),
        hasHiPurpleTheme: htmlElement.classList.contains('theme-hi-purple')
      });
    };
    
    checkThemeClasses();
    
    // Listen for theme changes
    const handleThemeChange = () => {
      checkThemeClasses();
    };
    
    document.addEventListener('themeClassChanged', handleThemeChange);
    
    return () => {
      document.removeEventListener('themeClassChanged', handleThemeChange);
    };
  }, []);
  
  const getPermissionsTabStyle = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-[#2e7d32] text-white hover:bg-[#1b5e20] data-[state=active]:bg-[#1b5e20] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasOceanBlueTheme) return "bg-[#1976d2] text-white hover:bg-[#1565c0] data-[state=active]:bg-[#1565c0] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00] text-white hover:bg-[#e65100] data-[state=active]:bg-[#e65100] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa] text-white hover:bg-[#6a1b9a] data-[state=active]:bg-[#6a1b9a] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasDarkModeTheme) return "bg-[#444444] text-white hover:bg-[#333333] data-[state=active]:bg-[#333333] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasHiPurpleTheme) return "bg-[#9d89c9] text-white hover:bg-[#806cac] data-[state=active]:bg-[#806cac] data-[state=active]:text-white data-[state=active]:shadow-md";
    return "bg-[#9d89c9] text-white hover:bg-[#806cac] data-[state=active]:bg-[#806cac] data-[state=active]:text-white data-[state=active]:shadow-md";
  };

  const getThemeTabStyle = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-[#2e7d32] text-white hover:bg-[#1b5e20] data-[state=active]:bg-[#1b5e20] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasOceanBlueTheme) return "bg-[#1976d2] text-white hover:bg-[#1565c0] data-[state=active]:bg-[#1565c0] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00] text-white hover:bg-[#e65100] data-[state=active]:bg-[#e65100] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa] text-white hover:bg-[#6a1b9a] data-[state=active]:bg-[#6a1b9a] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasDarkModeTheme) return "bg-[#444444] text-white hover:bg-[#333333] data-[state=active]:bg-[#333333] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasHiPurpleTheme) return "bg-[#9d89c9] text-white hover:bg-[#806cac] data-[state=active]:bg-[#806cac] data-[state=active]:text-white data-[state=active]:shadow-md";
    return "bg-[#9d89c9] text-white hover:bg-[#806cac] data-[state=active]:bg-[#806cac] data-[state=active]:text-white data-[state=active]:shadow-md";
  };
  
  const getTargetsTabStyle = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-[#2e7d32] text-white hover:bg-[#1b5e20] data-[state=active]:bg-[#1b5e20] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasOceanBlueTheme) return "bg-[#1976d2] text-white hover:bg-[#1565c0] data-[state=active]:bg-[#1565c0] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00] text-white hover:bg-[#e65100] data-[state=active]:bg-[#e65100] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa] text-white hover:bg-[#6a1b9a] data-[state=active]:bg-[#6a1b9a] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasDarkModeTheme) return "bg-[#444444] text-white hover:bg-[#333333] data-[state=active]:bg-[#333333] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasHiPurpleTheme) return "bg-[#9d89c9] text-white hover:bg-[#806cac] data-[state=active]:bg-[#806cac] data-[state=active]:text-white data-[state=active]:shadow-md";
    return "bg-[#9d89c9] text-white hover:bg-[#806cac] data-[state=active]:bg-[#806cac] data-[state=active]:text-white data-[state=active]:shadow-md";
  };
  
  const getDatabaseTabStyle = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-[#4c8c4a] text-white hover:bg-[#388e3c] data-[state=active]:bg-[#388e3c] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasOceanBlueTheme) return "bg-[#42a5f5] text-white hover:bg-[#1e88e5] data-[state=active]:bg-[#1e88e5] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasSunsetOrangeTheme) return "bg-[#ff9800] text-white hover:bg-[#f57c00] data-[state=active]:bg-[#f57c00] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasBerryPurpleTheme) return "bg-[#ab47bc] text-white hover:bg-[#9c27b0] data-[state=active]:bg-[#9c27b0] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasDarkModeTheme) return "bg-[#757575] text-white hover:bg-[#616161] data-[state=active]:bg-[#616161] data-[state=active]:text-white data-[state=active]:shadow-md";
    if (hasHiPurpleTheme) return "bg-[#b39ddb] text-white hover:bg-[#9575cd] data-[state=active]:bg-[#9575cd] data-[state=active]:text-white data-[state=active]:shadow-md";
    return "bg-[#d63384] text-white hover:bg-[#c2185b] font-medium transition-colors duration-200 data-[state=active]:bg-[#a61d6c] data-[state=active]:text-white data-[state=active]:shadow-md";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const controlCentreData = await getControlCentreData();
        setData(controlCentreData);
        setError(null);
      } catch (err) {
        setError('Failed to load Control Centre data');
        console.error('Error loading Control Centre data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (profile?.role !== 'GOD' && profile?.role !== 'Super User') {
    return <Navigate to="/" replace />;
  }

  const isGodUser = profile?.role === 'GOD';
  
  return <div className="container py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Control Centre</h1>
        <p className="text-muted-foreground mt-1">
          Configure system settings and user permissions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger 
            value="permissions" 
            className={`font-medium transition-colors duration-200 ${getPermissionsTabStyle()}`}
          >
            Permissions
          </TabsTrigger>
          <TabsTrigger 
            value="theme" 
            className={`font-medium transition-colors duration-200 ${getThemeTabStyle()}`}
          >
            Brand & Theme
          </TabsTrigger>
          <TabsTrigger 
            value="targets" 
            className={`font-medium transition-colors duration-200 ${getTargetsTabStyle()}`}
          >
            Business Targets
          </TabsTrigger>
          {isGodUser && <TabsTrigger 
            value="database" 
            className={getDatabaseTabStyle()}
          >
            Database
          </TabsTrigger>}
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          {loading ? <Card>
              <CardContent className="pt-6">
                <div className="h-96 flex items-center justify-center">
                  <p>Loading permissions data...</p>
                </div>
              </CardContent>
            </Card> : <PermissionMatrixPanel permissionMatrix={data?.permissionMatrix || []} />}
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          {loading ? <Card>
              <CardContent className="pt-6">
                <div className="h-96 flex items-center justify-center">
                  <p>Loading theme settings...</p>
                </div>
              </CardContent>
            </Card> : <ThemeSettingsPanel currentTheme={data?.currentTheme} availableThemes={data?.availableThemes || []} />}
        </TabsContent>

        <TabsContent value="targets" className="space-y-6">
          {loading ? <Card>
              <CardContent className="pt-6">
                <div className="h-96 flex items-center justify-center">
                  <p>Loading target settings...</p>
                </div>
              </CardContent>
            </Card> : <TargetSettingsPanel targetSettings={data?.targetSettings} />}
        </TabsContent>

        {isGodUser && <TabsContent value="database" className="space-y-6">
            <DatabasePanel />
          </TabsContent>}
      </Tabs>

      {error && <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>}
    </div>;
}
