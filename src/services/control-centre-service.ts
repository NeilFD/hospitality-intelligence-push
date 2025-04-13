
import { supabase } from '@/lib/supabase';
import { PermissionMatrix, ThemeSettings, TargetSettings } from '@/types/control-centre-types';

export interface ControlCentreState {
  permissionMatrix: PermissionMatrix[];
  currentTheme: ThemeSettings | null;
  availableThemes: ThemeSettings[];
  targetSettings: TargetSettings;
  isLoading: boolean;
  error: string | null;
  fetchPermissionMatrix: () => Promise<void>;
  updatePermissionMatrix: (permissionMatrix: PermissionMatrix[]) => Promise<void>;
  fetchThemes: () => Promise<void>;
  createTheme: (theme: Omit<ThemeSettings, 'id'>) => Promise<void>;
  updateTheme: (theme: ThemeSettings) => Promise<void>;
  setActiveTheme: (themeId: string) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;
  uploadLogo: (file: File) => Promise<string | null>;
  fetchTargetSettings: () => Promise<void>;
  updateTargetSettings: (settings: TargetSettings) => Promise<void>;
  duplicateDatabase: () => Promise<void>;
  clearError: () => void;
}

// Initialize basic data if needed
const initializeControlCentreDatabase = async () => {
  try {
    // Check if permission_matrix table exists
    const { data: matrixCheck, error: matrixError } = await supabase
      .from('permission_matrix')
      .select('id')
      .limit(1);
    
    // If not found, create initial data
    if (matrixError || (matrixCheck && matrixCheck.length === 0)) {
      // We'll implement this later if needed
      console.log('Matrix table needs initialization');
    }
    
    // Check if themes table exists
    const { data: themesCheck, error: themesError } = await supabase
      .from('themes')
      .select('id')
      .limit(1);
    
    // If not found, add default theme
    if (themesError || (themesCheck && themesCheck.length === 0)) {
      // We'll implement this later if needed
      console.log('Themes table needs initialization');
    }
  } catch (error) {
    console.error('Error initializing control centre database:', error);
  }
};

// Helper function to get all modules and pages for permission matrix
export const getModulesAndPages = async (): Promise<PermissionMatrix[]> => {
  try {
    // Simulated data structure - will be replaced with actual data from database
    const roles = ['GOD', 'Super User', 'Manager', 'Team Member'];
    const modules = [
      { id: 'food', name: 'Food Hub', type: 'food' },
      { id: 'beverage', name: 'Beverage Hub', type: 'beverage' },
      { id: 'pl', name: 'P&L', type: 'pl' },
      { id: 'wages', name: 'Wages', type: 'wages' },
      { id: 'performance', name: 'Performance', type: 'performance' },
      { id: 'team', name: 'Team', type: 'team' },
    ];
    
    const pages = {
      food: [
        { id: 'food-dashboard', name: 'Dashboard', url: '/food/dashboard' },
        { id: 'food-input-settings', name: 'Input Settings', url: '/food/input-settings' },
        { id: 'food-month-summary', name: 'Month Summary', url: '/food/month/{year}/{month}' },
        { id: 'food-annual-summary', name: 'Annual Summary', url: '/food/annual-summary' },
        { id: 'food-bible', name: 'Food Bible', url: '/food/bible' },
      ],
      beverage: [
        { id: 'beverage-dashboard', name: 'Dashboard', url: '/beverage/dashboard' },
        { id: 'beverage-input-settings', name: 'Input Settings', url: '/beverage/input-settings' },
        { id: 'beverage-month-summary', name: 'Month Summary', url: '/beverage/month/{year}/{month}' },
        { id: 'beverage-annual-summary', name: 'Annual Summary', url: '/beverage/annual-summary' },
        { id: 'beverage-bible', name: 'Beverage Bible', url: '/beverage/bible' },
      ],
      pl: [
        { id: 'pl-dashboard', name: 'Dashboard', url: '/pl/dashboard' },
      ],
      wages: [
        { id: 'wages-dashboard', name: 'Dashboard', url: '/wages/dashboard' },
      ],
      performance: [
        { id: 'performance-dashboard', name: 'Dashboard', url: '/performance/dashboard' },
      ],
      team: [
        { id: 'team-dashboard', name: 'Dashboard', url: '/team/dashboard' },
        { id: 'team-noticeboard', name: 'Noticeboard', url: '/team/noticeboard' },
        { id: 'team-chat', name: 'Team Chat', url: '/team/chat' },
        { id: 'team-knowledge', name: 'Knowledge Base', url: '/team/knowledge' },
      ],
    };
    
    // Generate permission matrix
    return roles.map(role => ({
      roleId: role as 'GOD' | 'Super User' | 'Manager' | 'Team Member',
      modulePermissions: modules.map(module => ({
        moduleId: module.id,
        moduleName: module.name,
        moduleType: module.type,
        hasAccess: role === 'GOD' || role === 'Super User' || role === 'Manager',
        pagePermissions: pages[module.id as keyof typeof pages].map(page => ({
          pageId: page.id,
          pageName: page.name,
          pageUrl: page.url,
          hasAccess: role === 'GOD' || role === 'Super User' || role === 'Manager',
        })),
      })),
    }));
  } catch (error) {
    console.error('Error getting modules and pages:', error);
    return [];
  }
};

// Get available fonts
export const availableFonts: { name: string; value: string }[] = [
  { name: 'Default System Font', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' },
  { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { name: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", system-ui, sans-serif' },
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Montserrat', value: 'Montserrat, system-ui, sans-serif' },
  { name: 'Poppins', value: 'Poppins, system-ui, sans-serif' },
  { name: 'Lato', value: 'Lato, system-ui, sans-serif' },
];

// Preset themes
export const presetThemes = [
  {
    id: 'default',
    name: 'Tavern Purple',
    colors: {
      primary: '#806cac',
      secondary: '#705b9b',
      accent: '#9d89c9',
      sidebar: '#806cac',
      button: '#806cac',
      text: '#333333',
    }
  },
  {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      primary: '#2c7a4e',
      secondary: '#1e5631',
      accent: '#4ca975',
      sidebar: '#2c7a4e',
      button: '#2c7a4e',
      text: '#333333',
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: {
      primary: '#0369a1',
      secondary: '#075985',
      accent: '#38bdf8',
      sidebar: '#0369a1',
      button: '#0369a1',
      text: '#333333',
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    colors: {
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#fb923c',
      sidebar: '#ea580c',
      button: '#ea580c',
      text: '#333333',
    }
  },
  {
    id: 'berry',
    name: 'Berry Purple',
    colors: {
      primary: '#7e22ce',
      secondary: '#6b21a8',
      accent: '#a855f7',
      sidebar: '#7e22ce',
      button: '#7e22ce',
      text: '#333333',
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#27272a',
      secondary: '#18181b',
      accent: '#3f3f46',
      sidebar: '#18181b',
      button: '#3f3f46',
      text: '#f4f4f5',
    }
  },
];

// This service will be expanded with actual database operations
// For now, it returns mock data to get the UI working
export const getControlCentreData = async () => {
  // Placeholder function
  return {
    permissionMatrix: await getModulesAndPages(),
    currentTheme: presetThemes[0],
    availableThemes: presetThemes,
    targetSettings: {
      foodGpTarget: 68,
      beverageGpTarget: 72,
      wageCostTarget: 28,
    },
  };
};

// Initialize the control centre database if needed
initializeControlCentreDatabase();
