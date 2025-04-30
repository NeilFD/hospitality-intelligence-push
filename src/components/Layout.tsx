import React, { useState, useEffect, useMemo, ReactNode } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Settings, Calendar, ChartBar, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, LogOut, User, Clipboard, MessageSquare, Users, Book, Wallet, Sliders, Bell, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SidebarLogo } from "./SidebarLogo";
import { TavernLogo } from "./TavernLogo";
import { useAuthStore } from "@/services/auth-service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ModuleType } from "@/types/kitchen-ledger";
import { useCurrentModule, useSetCurrentModule, useModules } from "@/lib/store";
import { ModuleIcon } from "./ModuleIcons";
import NotificationsDropdown from "./notifications/NotificationsDropdown";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";

interface LayoutProps {
  children: ReactNode;
}

interface ModulePermission {
  moduleId: string;
  hasAccess: boolean;
}

interface PagePermission {
  pageId: string;
  pageUrl: string;
  hasAccess: boolean;
}

const Layout = ({
  children
}: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const {
    user,
    profile,
    isAuthenticated,
    logout
  } = useAuthStore();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentModule = useCurrentModule();
  const setCurrentModule = useSetCurrentModule();
  const modules = useModules();
  const [themeState, setThemeState] = useState({
    hasForestGreenTheme: false,
    hasOceanBlueTheme: false,
    hasSunsetOrangeTheme: false,
    hasBerryPurpleTheme: true,
    hasDarkModeTheme: false,
    hasHiPurpleTheme: false
  });

  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);
  const [pagePermissions, setPagePermissions] = useState<PagePermission[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    const updateThemeState = () => {
      const html = document.documentElement;
      const newThemeState = {
        hasForestGreenTheme: html.classList.contains('theme-forest-green'),
        hasOceanBlueTheme: html.classList.contains('theme-ocean-blue'),
        hasSunsetOrangeTheme: html.classList.contains('theme-sunset-orange'),
        hasBerryPurpleTheme: html.classList.contains('theme-berry-purple'),
        hasDarkModeTheme: html.classList.contains('theme-dark-mode'),
        hasHiPurpleTheme: html.classList.contains('theme-hi-purple')
      };
      
      if (JSON.stringify(newThemeState) !== JSON.stringify(themeState)) {
        console.log('Theme state updated:', newThemeState);
        setThemeState(newThemeState);
      }
    };
    
    updateThemeState();
    
    document.addEventListener('themeClassChanged', updateThemeState);
    
    return () => {
      document.removeEventListener('themeClassChanged', updateThemeState);
    };
  }, [themeState]);

  useEffect(() => {
    const checkStoredTheme = () => {
      const savedThemeName = localStorage.getItem('app-active-theme');
      if (savedThemeName) {
        const newThemeState = {
          hasForestGreenTheme: savedThemeName === 'Forest Green',
          hasOceanBlueTheme: savedThemeName === 'Ocean Blue',
          hasSunsetOrangeTheme: savedThemeName === 'Sunset Orange',
          hasBerryPurpleTheme: savedThemeName === 'Hi' || savedThemeName === 'Berry Purple',
          hasDarkModeTheme: savedThemeName === 'Dark Mode',
          hasHiPurpleTheme: savedThemeName === 'Hi Purple'
        };
        
        if (JSON.stringify(newThemeState) !== JSON.stringify(themeState)) {
          console.log('Theme state updated from localStorage:', newThemeState);
          setThemeState(newThemeState);
        }
      }
    };
    
    checkStoredTheme();
  }, []);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!isAuthenticated || !profile || !profile.role) {
        return;
      }

      try {
        if (profile.role === 'GOD' || profile.role === 'Super User') {
          console.log('User has GOD or Super User role - setting all permissions to true');
          const allModules = modules.map(m => ({
            moduleId: m.type,
            hasAccess: true
          }));
          setModulePermissions(allModules);
          setPermissionsLoaded(true);
          return;
        }

        const { data: moduleAccess, error: moduleError } = await supabase
          .from('permission_access')
          .select('module_id, has_access')
          .eq('role_id', profile.role);

        if (moduleError) {
          console.error('Error fetching module permissions:', moduleError);
          return;
        }

        const { data: pageAccess, error: pageError } = await supabase
          .from('permission_page_access')
          .select('page_id, has_access')
          .eq('role_id', profile.role);

        if (pageError) {
          console.error('Error fetching page permissions:', pageError);
          return;
        }

        const { data: pages, error: pagesError } = await supabase
          .from('permission_pages')
          .select('page_id, page_url');

        if (pagesError) {
          console.error('Error fetching pages:', pagesError);
          return;
        }

        const modulePerms = moduleAccess.map(item => ({
          moduleId: item.module_id,
          hasAccess: item.has_access
        }));
        
        setModulePermissions(modulePerms);

        const pagesWithAccess = pageAccess.map(item => {
          const pageInfo = pages.find(p => p.page_id === item.page_id);
          return {
            pageId: item.page_id,
            pageUrl: pageInfo?.page_url || '',
            hasAccess: item.has_access
          };
        });

        setPagePermissions(pagesWithAccess);
        setPermissionsLoaded(true);
        
        console.log('Loaded permissions:', {
          modulePermissions: modulePerms,
          pagePermissions: pagesWithAccess
        });
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    fetchUserPermissions();
  }, [isAuthenticated, profile, modules]);

  useEffect(() => {
    const path = location.pathname;
    console.log('Layout mounting with path:', path);
    
    if (path.includes('/home')) {
      console.log('Layout: Setting current module to home from path');
      setCurrentModule('home');
    } else if (path.includes('/food')) {
      console.log('Layout: Setting current module to food from path');
      setCurrentModule('food');
    } else if (path.includes('/beverage')) {
      console.log('Layout: Setting current module to beverage from path');
      setCurrentModule('beverage');
    } else if (path.includes('/pl')) {
      console.log('Layout: Setting current module to pl from path');
      setCurrentModule('pl');
    } else if (path.includes('/wages')) {
      console.log('Layout: Setting current module to wages from path');
      setCurrentModule('wages');
    } else if (path.includes('/team')) {
      console.log('Layout: Setting current module to team from path');
      setCurrentModule('team');
    } else if (path.includes('/hiq')) {
      console.log('Layout: Setting current module to hiq from path');
      setCurrentModule('hiq');
    }
  }, [location.pathname, setCurrentModule]);

  const hasModuleAccess = (moduleId: string) => {
    if (!profile || !permissionsLoaded) return false;

    if (profile.role === 'GOD' || profile.role === 'Super User') {
      return true;
    }
    
    const modulePermission = modulePermissions.find(p => p.moduleId === moduleId);
    const hasAccess = modulePermission ? modulePermission.hasAccess : false;
    
    console.log(`Module access check for ${moduleId}: ${hasAccess}`);
    return hasAccess;
  };

  const hasPageAccess = (pageUrl: string) => {
    if (!profile || !permissionsLoaded) return false;

    if (profile.role === 'GOD' || profile.role === 'Super User') {
      return true;
    }

    const exactPageMatch = pagePermissions.find(p => p.pageUrl === pageUrl);
    if (exactPageMatch) {
      return exactPageMatch.hasAccess;
    }

    for (const page of pagePermissions) {
      if (page.pageUrl.includes('{')) {
        const pageUrlPattern = page.pageUrl.replace(/\{[^}]+\}/g, '[^/]+]');
        const pageRegex = new RegExp(`^${pageUrlPattern}$`);
        
        if (pageRegex.test(pageUrl) && page.hasAccess) {
          return true;
        }
      }
    }

    return false;
  };

  const hasControlCentreAccess = () => {
    return profile?.role === 'GOD' || profile?.role === 'Super User';
  };

  const getSidebarBgColor = () => {
    const {
      hasForestGreenTheme,
      hasOceanBlueTheme,
      hasSunsetOrangeTheme,
      hasBerryPurpleTheme,
      hasDarkModeTheme,
      hasHiPurpleTheme
    } = themeState;
    if (hasForestGreenTheme) return "bg-[#1b5e20]";
    if (hasOceanBlueTheme) return "bg-[#1565c0]";
    if (hasSunsetOrangeTheme) return "bg-[#e65100]";
    if (hasBerryPurpleTheme) return "bg-[#6a1b9a]";
    if (hasDarkModeTheme) return "bg-[#1a1a1a]";
    if (hasHiPurpleTheme) return "bg-[#806cac]";
    return "bg-[#806cac]";
  };

  const getSidebarHoverColor = () => {
    const {
      hasForestGreenTheme,
      hasOceanBlueTheme,
      hasSunsetOrangeTheme,
      hasBerryPurpleTheme,
      hasDarkModeTheme,
      hasHiPurpleTheme
    } = themeState;
    if (hasForestGreenTheme) return "bg-[#2e7d32]/20";
    if (hasOceanBlueTheme) return "bg-[#1976d2]/20";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00]/20";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa]/20";
    if (hasDarkModeTheme) return "bg-white/10";
    if (hasHiPurpleTheme) return "bg-white/10";
    return "bg-white/10";
  };

  const getActiveItemBgColor = () => {
    const {
      hasForestGreenTheme,
      hasOceanBlueTheme,
      hasSunsetOrangeTheme,
      hasBerryPurpleTheme,
      hasDarkModeTheme,
      hasHiPurpleTheme
    } = themeState;
    if (hasForestGreenTheme) return "bg-[#2e7d32]";
    if (hasOceanBlueTheme) return "bg-[#1976d2]";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00]";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa]";
    if (hasDarkModeTheme) return "bg-[#333333]";
    if (hasHiPurpleTheme) return "bg-[#9d89c9]";
    return "bg-[#705b9b]";
  };

  const getModuleActiveBgColor = () => {
    const {
      hasForestGreenTheme,
      hasOceanBlueTheme,
      hasSunsetOrangeTheme,
      hasBerryPurpleTheme,
      hasDarkModeTheme,
      hasHiPurpleTheme
    } = themeState;
    if (hasForestGreenTheme) return "bg-white text-[#1b5e20]";
    if (hasOceanBlueTheme) return "bg-white text-[#1565c0]";
    if (hasSunsetOrangeTheme) return "bg-white text-[#e65100]";
    if (hasBerryPurpleTheme) return "bg-white text-[#6a1b9a]";
    if (hasDarkModeTheme) return "bg-white text-[#1a1a1a]";
    if (hasHiPurpleTheme) return "bg-white text-[#806cac]";
    return "bg-white text-[#806cac]";
  };

  const getControlCenterBgColor = () => {
    const {
      hasForestGreenTheme,
      hasOceanBlueTheme,
      hasSunsetOrangeTheme,
      hasBerryPurpleTheme,
      hasDarkModeTheme,
      hasHiPurpleTheme
    } = themeState;
    if (hasForestGreenTheme) return "bg-[#2e7d32]";
    if (hasOceanBlueTheme) return "bg-[#1976d2]";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00]";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa]";
    if (hasDarkModeTheme) return "bg-[#333333]";
    if (hasHiPurpleTheme) return "bg-[#9d89c9]";
    return "bg-[#705b9b]";
  };

  const getTextColor = () => {
    const {
      hasForestGreenTheme,
      hasOceanBlueTheme,
      hasSunsetOrangeTheme,
      hasBerryPurpleTheme,
      hasDarkModeTheme,
      hasHiPurpleTheme
    } = themeState;
    if (hasForestGreenTheme) return "text-[#e8f5e9]";
    if (hasOceanBlueTheme) return "text-[#e3f2fd]";
    if (hasSunsetOrangeTheme) return "text-[#fff3e0]";
    if (hasBerryPurpleTheme) return "text-[#f3e5f5]";
    if (hasDarkModeTheme) return "text-[#f5f5f5]";
    if (hasHiPurpleTheme) return "text-[#e0d9f0]";
    return "text-[#e0d9f0]";
  };

  const getSeparatorBgColor = () => {
    const {
      hasForestGreenTheme,
      hasOceanBlueTheme,
      hasSunsetOrangeTheme,
      hasBerryPurpleTheme,
      hasDarkModeTheme,
      hasHiPurpleTheme
    } = themeState;
    if (hasForestGreenTheme) return "bg-[#4c8c4a]/20";
    if (hasOceanBlueTheme) return "bg-[#42a5f5]/20";
    if (hasSunsetOrangeTheme) return "bg-[#ff9800]/20";
    if (hasBerryPurpleTheme) return "bg-[#ab47bc]/20";
    if (hasDarkModeTheme) return "bg-white/20";
    if (hasHiPurpleTheme) return "bg-[#9d89c9]/20";
    return "bg-[#9d89c9]/20";
  };

  const ControlCentreLink = () => {
    if (!hasControlCentreAccess()) {
      return null;
    }

    return <Link to="/control-centre" className={cn("flex items-center px-3 py-2 rounded-md text-sm transition-colors", location.pathname === '/control-centre' ? getControlCenterBgColor() + " text-white font-medium" : "text-white hover:" + getSidebarHoverColor())}>
        <div className={sidebarCollapsed ? "mx-auto" : ""}>
          <Sliders className="h-4 w-4 mr-2" />
        </div>
        {!sidebarCollapsed && <span>Control Centre</span>}
      </Link>;
  };

  useEffect(() => {
    console.log('Current user profile:', profile);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Current user:', user);
  }, [profile, isAuthenticated, user]);

  useEffect(() => {
    console.log('Modules in sidebar:', modules);
    console.log('Current module:', currentModule);
    console.log('Module permissions:', modulePermissions);
    const clearLocalStorageCache = () => {
      const storeData = localStorage.getItem('tavern-kitchen-ledger');
      if (storeData) {
        try {
          const parsedData = JSON.parse(storeData);
          if (parsedData.state && parsedData.state.modules) {
            parsedData.state.modules.forEach((module: any) => {
              if (module.type === 'food') {
                module.name = 'Food Hub';
              } else if (module.type === 'beverage') {
                module.name = 'Beverage Hub';
              }
            });
            localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
            console.log('Updated modules in localStorage:', parsedData.state.modules);
          }
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }
      }
    };
    clearLocalStorageCache();
  }, []);

  const sortedModules = useMemo(() => {
    // Filter out 'performance' module so it doesn't show as a top-level item
    return [...modules].filter(module => module.type !== 'performance').sort((a, b) => a.displayOrder - b.displayOrder);
  }, [modules]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    try {
      if (isAuthenticated) {
        await logout();
        toast.success('You have been logged out');
      }
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  const getUserInitials = () => {
    if (!profile) return '?';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getModuleNavItems = useMemo(() => {
    switch (currentModule) {
      case 'food':
      case 'beverage':
        const prefix = currentModule === 'food' ? 'Food' : 'Beverage';
        return [{
          name: `${prefix} Dashboard`,
          path: `/${currentModule}/dashboard`,
          icon: <Home className="mr-2 h-4 w-4" />
        }, {
          name: `${prefix} Input Settings`,
          path: `/${currentModule}/input-settings`,
          icon: <Settings className="mr-2 h-4 w-4" />
        }, {
          name: `${prefix} Month Summary`,
          path: `/${currentModule}/month/${currentYear}/${currentMonth}`,
          icon: <Calendar className="mr-2 h-4 w-4" />
        }, {
          name: `${prefix} Annual Summary`,
          path: `/${currentModule}/annual-summary`,
          icon: <ChartBar className="mr-2 h-4 w-4" />
        }, {
          name: `${prefix} Bible`,
          path: `/${currentModule}/bible`,
          icon: <Book className="mr-2 h-4 w-4" />
        }];
      case 'pl':
        return [{
          name: "P&L Dashboard",
          path: "/pl/dashboard",
          icon: <Home className="mr-2 h-4 w-4" />
        }, {
          name: "Food & Beverage Forecast",
          path: "/pl/food-beverage-forecast",
          icon: <TrendingUp className="mr-2 h-4 w-4" />
        }, {
          name: "Weekly Forecast",
          path: "/pl/weekly-forecast",
          icon: <Calendar className="mr-2 h-4 w-4" />
        }];
      case 'wages':
        return [{
          name: "Wages Dashboard",
          path: "/wages/dashboard",
          icon: <Home className="mr-2 h-4 w-4" />
        }];
      case 'master':
        return [{
          name: "Daily Dashboard",
          path: "/master/dashboard",
          icon: <Home className="mr-2 h-4 w-4" />
        }, {
          name: "Weekly Input",
          path: "/master/weekly-input",
          icon: <Calendar className="mr-2 h-4 w-4" />
        }, {
          name: "Month Summary",
          path: "/master/month-summary",
          icon: <ChartBar className="mr-2 h-4 w-4" />
        }];
      case 'team':
        return [{
          name: "Team Dashboard",
          path: "/team/dashboard",
          icon: <Home className="mr-2 h-4 w-4" />
        }, {
          name: "Noticeboard",
          path: "/team/noticeboard",
          icon: <Clipboard className="mr-2 h-4 w-4" />
        }, {
          name: "Team Chat",
          path: "/team/chat",
          icon: <MessageSquare className="mr-2 h-4 w-4" />
        }, {
          name: "Knowledge Base",
          path: "/team/knowledge",
          icon: <Book className="mr-2 h-4 w-4" />
        }];
      case 'hiq':
        return [{
          name: "HiQ Dashboard",
          path: "/hiq/dashboard",
          icon: <Home className="mr-2 h-4 w-4" />
        }, {
          name: "Performance and Analysis",
          path: "/hiq/performance",
          icon: <ChartBar className="mr-2 h-4 w-4" />
        }];
      default:
        return [];
    }
  }, [currentModule, currentYear, currentMonth]);

  const moduleNavItems = useMemo(() => {
    // Filter out any 'performance' module to avoid showing it as a top-level item
    return sortedModules
      .filter(module => module.type !== 'performance')
      .map(module => ({
        name: module.type === 'master' ? 'Daily Info' : module.type === 'team' ? 'Team' : module.type === 'pl' ? 'P&L Tracker' : module.type === 'wages' ? 'Wages Tracker' : module.type === 'food' ? 'Food Hub' : module.type === 'beverage' ? 'Beverage Hub' : module.name,
        path: `/${module.type}/dashboard`,
        icon: <ModuleIcon type={module.type} className="mr-2 h-4 w-4" />,
        type: module.type
      }));
  }, [sortedModules]);

  const filteredModuleNavItems = useMemo(() => {
    if (!permissionsLoaded) {
      console.log('Permissions not loaded yet');
      return [];
    }
    
    const filtered = moduleNavItems.filter(item => {
      const hasAccess = hasModuleAccess(item.type as string);
      console.log(`Module ${item.type} access: ${hasAccess}`);
      return hasAccess;
    });
    
    console.log('Filtered module nav items:', filtered);
    return filtered;
  }, [moduleNavItems, modulePermissions, permissionsLoaded, profile]);

  const filteredModuleNav = useMemo(() => {
    return getModuleNavItems.filter(item => hasPageAccess(item.path));
  }, [getModuleNavItems, pagePermissions, permissionsLoaded, profile]);

  const handleModuleSelect = (moduleType: ModuleType) => {
    console.log('Selected module:', moduleType);
    setCurrentModule(moduleType);
    handleMobileNavigation();
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleMobileNavigation = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  const ProfileAvatar = () => (
    <div className="flex flex-col items-center">
      <Avatar className="h-9 w-9 bg-primary text-white">
        {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="Profile" className="object-cover" /> : <AvatarFallback>{getUserInitials()}</AvatarFallback>}
      </Avatar>
      {profile && (
        <span className="text-primary hover:text-primary/80 transition-colors duration-300 text-xs mt-1 font-medium">
          {profile.first_name || 'User'}
        </span>
      )}
    </div>
  );

  const Sidebar = (
    <div className={cn("h-full flex flex-col", getSidebarBgColor())}>
      <div className="p-4 flex flex-col items-center">
        <SidebarLogo size="md" className="mb-3" />
      </div>
      
      <Separator className={getSeparatorBgColor()} />
      
      <div className="p-2 my-2">
        <div className={cn("px-3 py-1", !sidebarCollapsed && "mb-2")}>
          {!sidebarCollapsed && (
            <p className={cn("text-xs font-semibold uppercase tracking-wider", getTextColor())}>
              Modules
            </p>
          )}
        </div>
        
        <nav className="space-y-1">
          {filteredModuleNavItems.map(item => 
            sidebarCollapsed ? (
              <TooltipProvider key={item.path}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm transition-colors", 
                        currentModule === item.type ? getModuleActiveBgColor() + " font-medium" : "text-white hover:" + getSidebarHoverColor()
                      )} 
                      onClick={() => handleModuleSelect(item.type as ModuleType)}
                    >
                      <div className="mx-auto flex items-center">
                        {item.icon}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Link 
                key={item.path} 
                to={item.path} 
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm transition-colors", 
                  currentModule === item.type ? getModuleActiveBgColor() + " font-medium" : "text-white hover:" + getSidebarHoverColor()
                )} 
                onClick={() => handleModuleSelect(item.type as ModuleType)}
              >
                <div className="flex items-center">
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </div>
              </Link>
            )
          )}
        </nav>
      </div>
      
      <Separator className={getSeparatorBgColor()} />
      
      <div className="flex-1 p-2">
        <div className={cn("px-3 py-1", !sidebarCollapsed && "mb-2")}>
          {!sidebarCollapsed && (
            <p className={cn("text-xs font-semibold uppercase tracking-wider", getTextColor())}>
              {sortedModules.find(m => m.type === currentModule)?.name || 'Navigation'}
            </p>
          )}
        </div>
        
        <nav className="space-y-1">
          {filteredModuleNav.map(item => 
            sidebarCollapsed ? (
              <TooltipProvider key={item.path}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm transition-colors", 
                        location.pathname === item.path ? getActiveItemBgColor() + " text-white font-medium" : "text-white hover:" + getSidebarHoverColor()
                      )} 
                      onClick={handleMobileNavigation}
                    >
                      <div className="mx-auto">
                        {item.icon}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Link 
                key={item.path} 
                to={item.path} 
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm transition-colors", 
                  location.pathname === item.path ? getActiveItemBgColor() + " text-white font-medium" : "text-white hover:" + getSidebarHoverColor()
                )} 
                onClick={handleMobileNavigation}
              >
                <div className="flex items-center">
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </div>
              </Link>
            )
          )}
        </nav>
      </div>
      
      <>
        <Separator className={getSeparatorBgColor()} />
        <div className="p-2">
          {hasControlCentreAccess() && (
            sidebarCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      to="/control-centre" 
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm transition-colors", 
                        location.pathname === '/control-centre' ? getControlCenterBgColor() + " text-white font-medium" : "text-white hover:" + getSidebarHoverColor()
                      )}
                    >
                      <div className="mx-auto">
                        <Sliders className="h-4 w-4" />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Control Centre</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <ControlCentreLink />
            )
          )}
        </div>
      </>
      
      <div className="p-4">
        {!sidebarCollapsed && <p className={cn("text-xs", getTextColor())}>© 2025 Hi</p>}
      </div>
    </div>
  );

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {isMobile ? (
        <>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="fixed left-4 top-4 z-40 md:hidden text-zinc-800">
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              {Sidebar}
            </SheetContent>
          </Sheet>
          <div className="flex-1 overflow-auto pt-16">
            <div className="absolute top-2 left-0 right-0 flex justify-between px-4">
              <div className="w-8"></div>
              <TavernLogo size="md" />
              <div className="flex items-center gap-2">
                <NotificationsDropdown />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto bg-transparent hover:bg-transparent">
                      <ProfileAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    {isAuthenticated && profile ? (
                      <>
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-0.5 leading-none">
                            <p className="text-sm font-medium">
                              {profile?.first_name} {profile?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user?.email} - {profile?.role || 'User'}
                            </p>
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="cursor-pointer flex w-full items-center">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-0.5 leading-none">
                          <p className="text-sm font-medium">Not logged in</p>
                        </div>
                      </div>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isAuthenticated ? 'Logout' : 'Login'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {children}
          </div>
        </>
      ) : (
        <>
          <div className={cn("flex-shrink-0 transition-all duration-300", sidebarCollapsed ? "w-20" : "w-64")}>
            {Sidebar}
          </div>
          <div className="flex-1 overflow-auto relative">
            <div className="flex items-center justify-between px-8 py-2">
              <Button variant="outline" size="icon" onClick={toggleSidebar} className="z-40 text-primary">
                {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
              <TavernLogo size="md" />
              <div className="flex items-center gap-2">
                <NotificationsDropdown />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto bg-transparent hover:bg-transparent">
                      <ProfileAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    {isAuthenticated && profile ? (
                      <>
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-0.5 leading-none">
                            <p className="text-sm font-medium">
                              {profile?.first_name} {profile?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user?.email} - {profile?.role || 'User'}
                            </p>
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="cursor-pointer flex w-full items-center">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-0.5 leading-none">
                          <p className="text-sm font-medium">Not logged in</p>
                        </div>
                      </div>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isAuthenticated ? 'Logout' : 'Login'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {children}
          </div>
        </>
      )}
    </div>
  );
};

export default Layout;
