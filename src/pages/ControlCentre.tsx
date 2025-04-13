
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
  
  // Get the HTML element with class names to detect current theme
  const htmlElement = document.documentElement;
  const hasForestGreenTheme = htmlElement.classList.contains('theme-forest-green');
  const hasOceanBlueTheme = htmlElement.classList.contains('theme-ocean-blue');
  const hasSunsetOrangeTheme = htmlElement.classList.contains('theme-sunset-orange');
  const hasBerryPurpleTheme = htmlElement.classList.contains('theme-berry-purple');
  const hasDarkModeTheme = htmlElement.classList.contains('theme-dark-mode');
  
  // Determine button background color based on theme
  const getButtonBgColor = () => {
    if (hasForestGreenTheme) return "bg-[#1b5e20] hover:bg-[#2e7d32]";
    if (hasOceanBlueTheme) return "bg-[#1565c0] hover:bg-[#1976d2]";
    if (hasSunsetOrangeTheme) return "bg-[#e65100] hover:bg-[#ef6c00]";
    if (hasBerryPurpleTheme) return "bg-[#6a1b9a] hover:bg-[#8e24aa]";
    if (hasDarkModeTheme) return "bg-[#333333] hover:bg-[#444444]";
    return "bg-[#8e44ad] hover:bg-[#7d3c98]"; // Default purple
  };

  // Determine active tab highlight color based on theme
  const getActiveTabColor = () => {
    if (hasForestGreenTheme) return "data-[state=active]:bg-[#2e7d32]";
    if (hasOceanBlueTheme) return "data-[state=active]:bg-[#1976d2]";
    if (hasSunsetOrangeTheme) return "data-[state=active]:bg-[#ef6c00]";
    if (hasBerryPurpleTheme) return "data-[state=active]:bg-[#8e24aa]";
    if (hasDarkModeTheme) return "data-[state=active]:bg-[#444444]";
    return "data-[state=active]:bg-[#6c3483]"; // Default purple
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

  // Only allow GOD and Super User access
  if (profile?.role !== 'GOD' && profile?.role !== 'Super User') {
    return <Navigate to="/" replace />;
  }

  // Only GOD users can access the database panel
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
            className={`${getButtonBgColor()} text-white font-medium transition-colors duration-200 ${getActiveTabColor()} data-[state=active]:shadow-md`}
          >
            Permissions
          </TabsTrigger>
          <TabsTrigger 
            value="theme" 
            className={`${getButtonBgColor()} text-white font-medium transition-colors duration-200 ${getActiveTabColor()} data-[state=active]:shadow-md`}
          >
            Brand & Theme
          </TabsTrigger>
          <TabsTrigger 
            value="targets" 
            className={`${getButtonBgColor()} text-white font-medium transition-colors duration-200 ${getActiveTabColor()} data-[state=active]:shadow-md`}
          >
            Business Targets
          </TabsTrigger>
          {isGodUser && <TabsTrigger 
            value="database" 
            className="bg-[#e84393] hover:bg-[#d63384] text-white font-medium transition-colors duration-200 data-[state=active]:bg-[#c2185b] data-[state=active]:shadow-md"
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
