export interface PermissionMatrix {
  roleId: 'GOD' | 'Super User' | 'Manager' | 'Team Member';
  modulePermissions: ModulePermission[];
}

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  moduleType: string;
  hasAccess: boolean;
  pagePermissions: PagePermission[];
}

export interface PagePermission {
  pageId: string;
  pageName: string;
  pageUrl: string;
  hasAccess: boolean;
}

export interface ThemeSettings {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  sidebarColor: string;
  buttonColor: string;
  textColor: string;
  logoUrl: string | null;
  customFont: string | null;
  isDefault: boolean;
  isActive: boolean;
  companyName: string;
}

export interface TargetSettings {
  foodGpTarget: number;
  beverageGpTarget: number;
  wageCostTarget: number;
}

export type CustomFont = {
  name: string;
  value: string;
};

export type PresetTheme = {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    sidebar: string;
    button: string;
    text: string;
  }
};
