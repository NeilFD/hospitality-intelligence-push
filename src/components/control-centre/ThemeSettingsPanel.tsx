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
import { Check, ChevronsUpDown, Copy, Loader2, SaveIcon, Palette, Sliders, Upload, Image, Building } from 'lucide-react';

const presetThemes: PresetTheme[] = [{
  id: 'hi-purple',
  name: 'Hi Purple',
  colors: {
    primary: '#6a1b9a',
    secondary: '#f3e5f5',
    accent: '#ab47bc',
    sidebar: '#8e24aa',
    button: '#9c27b0',
    text: '#212121'
  }
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
  // ... keep rest of the file the same
}
