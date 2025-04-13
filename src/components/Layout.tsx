import React, { useState, useEffect, useMemo, ReactNode } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, Settings, Calendar, ChartBar, ChevronLeft, ChevronRight, 
  PanelLeftClose, PanelLeft, LogOut, User, Clipboard, MessageSquare, 
  Users, Book, Wallet, Sliders, Bell 
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import SidebarLogo from "./SidebarLogo"; 
import { TavernLogo } from "./TavernLogo";
import { useAuthStore } from "@/services/auth-service";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
    hasBerryPurpleTheme: false,
    hasDarkModeTheme: false,
    hasHiPurpleTheme: false
  });
  
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
    
    const handleThemeChange = () => {
      checkThemeClasses();
    };
    
    document.addEventListener('themeClassChanged', handleThemeChange);
    
    return () => {
      document.removeEventListener('themeClassChanged', handleThemeChange);
    };
  }, []);
  
  const getSidebarBgColor = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-[#1b5e20]";
    if (hasOceanBlueTheme) return "bg-[#1565c0]";
    if (hasSunsetOrangeTheme) return "bg-[#e65100]";
    if (hasBerryPurpleTheme) return "bg-[#6a1b9a]";
    if (hasDarkModeTheme) return "bg-[#1a1a1a]";
    if (hasHiPurpleTheme) return "bg-[#806cac]";
    return "bg-[#806cac]";
  };
  
  const getSidebarHoverColor = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-[#2e7d32]/20";
    if (hasOceanBlueTheme) return "bg-[#1976d2]/20";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00]/20";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa]/20";
    if (hasDarkModeTheme) return "bg-white/10";
    if (hasHiPurpleTheme) return "bg-white/10";
    return "bg-white/10";
  };
  
  const getActiveItemBgColor = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-[#2e7d32]";
    if (hasOceanBlueTheme) return "bg-[#1976d2]";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00]";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa]";
    if (hasDarkModeTheme) return "bg-[#333333]";
    if (hasHiPurpleTheme) return "bg-[#9d89c9]";
    return "bg-[#705b9b]";
  };
  
  const getModuleActiveBgColor = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-white text-[#1b5e20]";
    if (hasOceanBlueTheme) return "bg-white text-[#1565c0]";
    if (hasSunsetOrangeTheme) return "bg-white text-[#e65100]";
    if (hasBerryPurpleTheme) return "bg-white text-[#6a1b9a]";
    if (hasDarkModeTheme) return "bg-white text-[#1a1a1a]";
    if (hasHiPurpleTheme) return "bg-white text-[#806cac]";
    return "bg-white text-[#806cac]";
  };
  
  const getControlCenterBgColor = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-[#2e7d32]";
    if (hasOceanBlueTheme) return "bg-[#1976d2]";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00]";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa]";
    if (hasDarkModeTheme) return "bg-[#333333]";
    if (hasHiPurpleTheme) return "bg-[#9d89c9]";
    return "bg-[#705b9b]";
  };
  
  const getTextColor = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "text-[#e8f5e9]";
    if (hasOceanBlueTheme) return "text-[#e3f2fd]";
    if (hasSunsetOrangeTheme) return "text-[#fff3e0]";
    if (hasBerryPurpleTheme) return "text-[#f3e5f5]";
    if (hasDarkModeTheme) return "text-[#f5f5f5]";
    if (hasHiPurpleTheme) return "text-[#e0d9f0]";
    return "text-[#e0d9f0]";
  };
  
  const getSeparatorBgColor = () => {
    const { hasForestGreenTheme, hasOceanBlueTheme, hasSunsetOrangeTheme, hasBerryPurpleTheme, hasDarkModeTheme, hasHiPurpleTheme } = themeState;
    
    if (hasForestGreenTheme) return "bg-[#4c8c4a]/20";
    if (hasOceanBlueTheme) return "bg-[#42a5f5]/20";
    if (hasSunsetOrangeTheme) return "bg-[#ff9800]/20";
    if (hasBerryPurpleTheme) return "bg-[#ab47bc]/20";
    if (hasDarkModeTheme) return "bg-white/20";
    if (hasHiPurpleTheme) return "bg-[#9d89c9]/20";
    return "bg-[#9d89c9]/20";
  };
  
  const ControlCentreLink = () => {
    return (
      <Link 
        to="/control-centre"
        className={cn(
          "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
          location.pathname === '/control-centre' ? getControlCenterBgColor() + " text-white font-medium" : "text-white hover:" + getSidebarHoverColor()
        )}
      >
        <div className={sidebarCollapsed ? "mx-auto" : ""}>
          <Sliders className="h-4 w-4 mr-2" />
        </div>
        {!sidebarCollapsed && <span>Control Centre</span>}
      </Link>
    );
  };
  
  useEffect(() => {
    console.log('Current user profile:', profile);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Current user:', user);
  }, [profile, isAuthenticated, user]);
  
  useEffect(() => {
    console.log('Modules in sidebar:', modules);
    console.log('Current module:', currentModule);
    
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
    return [...modules].sort((a, b) => a.displayOrder - b.displayOrder);
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
        return [
          {
            name: `${prefix} Dashboard`,
            path: `/${currentModule}/dashboard`,
            icon: <Home className="mr-2 h-4 w-4" />
          },
          {
            name: `${prefix} Input Settings`,
            path: `/${currentModule}/input-settings`,
            icon: <Settings className="mr-2 h-4 w-4" />
          },
          {
            name: `${prefix} Month Summary`,
            path: `/${currentModule}/month/${currentYear}/${currentMonth}`,
            icon: <Calendar className="mr-2 h-4 w-4" />
          },
          {
            name: `${prefix} Annual Summary`,
            path: `/${currentModule}/annual-summary`,
            icon: <ChartBar className="mr-2 h-4 w-4" />
          },
          {
            name: `${prefix} Bible`,
            path: `/${currentModule}/bible`,
            icon: <Book className="mr-2 h-4 w-4" />
          }
        ];
      case 'pl':
        return [{
          name: "P&L Dashboard",
          path: "/pl/dashboard",
          icon: <Home className="mr-2 h-4 w-4" />
        }];
      case 'wages':
        return [{
          name: "Wages Dashboard",
          path: "/wages/dashboard",
          icon: <Home className="mr-2 h-4 w-4" />
        }];
      case 'performance':
        return [{
          name: "Performance Dashboard",
          path: "/performance/dashboard",
          icon: <Home className="mr-2 h-4 w-4" />
        }];
      case 'master':
        return [
          {
            name: "Daily Dashboard",
            path: "/master/dashboard",
            icon: <Home className="mr-2 h-4 w-4" />
          },
          {
            name: "Weekly Input",
            path: "/master/weekly-input",
            icon: <Calendar className="mr-2 h-4 w-4" />
          },
          {
            name: "Month Summary",
            path: "/master/month-summary",
            icon: <ChartBar className="mr-2 h-4 w-4" />
          }
        ];
      case 'team':
        return [
          {
            name: "Team Dashboard",
            path: "/team/dashboard",
            icon: <Home className="mr-2 h-4 w-4" />
          },
          {
            name: "Noticeboard",
            path: "/team/noticeboard",
            icon: <Clipboard className="mr-2 h-4 w-4" />
          },
          {
            name: "Team Chat",
            path: "/team/chat",
            icon: <MessageSquare className="mr-2 h-4 w-4" />
          },
          {
            name: "Knowledge Base",
            path: "/team/knowledge",
            icon: <Book className="mr-2 h-4 w-4" />
          }
        ];
      default:
        return [];
    }
  }, [currentModule, currentYear, currentMonth]);
  
  const moduleNavItems = useMemo(() => {
    return sortedModules.map(module => ({
      name: module.type === 'master' ? 'Daily Info' : 
           module.type === 'team' ? 'Team' : 
           module.type === 'pl' ? 'P&L Tracker' : 
           module.type === 'wages' ? 'Wages Tracker' : 
           module.type === 'food' ? 'Food Hub' : 
           module.type === 'beverage' ? 'Beverage Hub' : 
           module.type === 'performance' ? 'Performance and Analysis' :
           module.name,
      path: `/${module.type}/dashboard`,
      icon: <ModuleIcon type={module.type} className="mr-2 h-4 w-4" />,
      type: module.type
    }));
  }, [sortedModules]);
  
  const handleModuleSelect = (moduleType: ModuleType) => {
    setCurrentModule(moduleType);
  };
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  const isAdminUser = true;
  
  const ProfileAvatar = () => <div className="flex flex-col items-center">
      <Avatar className="h-9 w-9 bg-primary text-white">
        {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="Profile" className="object-cover" /> : <AvatarFallback>{getUserInitials()}</AvatarFallback>}
      </Avatar>
      {profile && <span className="text-primary hover:text-primary/80 transition-colors duration-300 text-xs mt-1 font-medium">
          {profile.first_name || 'User'}
        </span>}
    </div>;

  const [companyName, setCompanyName] = useState('Hospitality Intelligence');

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('company_name')
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching company name:', error);
          return;
        }

        if (data && data.company_name) {
          setCompanyName(data.company_name);
        }
      } catch (err) {
        console.error('Error in fetchCompanyName:', err);
      }
    };

    fetchCompanyName();

    const handleCompanyNameUpdate = (event: any) => {
      if (event.detail && event.detail.companyName) {
        setCompanyName(event.detail.companyName);
      }
    };

    window.addEventListener('company-name-updated', handleCompanyNameUpdate);
    
    return () => {
      window.removeEventListener('company-name-updated', handleCompanyNameUpdate);
    };
  }, []);

  const Sidebar = <div className={cn("h-full flex flex-col", getSidebarBgColor())}>
      <div className="p-4 flex flex-col items-center">
        <SidebarLogo size="md" className="mb-3" />
        <p className={cn("text-sm mt-1", getTextColor())}>{companyName}</p>
      </div>
      
      <Separator className={getSeparatorBgColor()} />
      
      <div className="p-2 my-2">
        <div className={cn("px-3 py-1", !sidebarCollapsed && "mb-2")}>
          {!sidebarCollapsed && <p className={cn("text-xs font-semibold uppercase tracking-wider", getTextColor())}>
              Modules
            </p>}
        </div>
        
        <nav className="space-y-1">
          {moduleNavItems.map(item => (
            sidebarCollapsed ? (
              <TooltipProvider key={item.path}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm transition-colors", 
                        currentModule === item.type 
                          ? getModuleActiveBgColor() + " font-medium" 
                          : "text-white hover:" + getSidebarHoverColor()
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
                  currentModule === item.type 
                    ? getModuleActiveBgColor() + " font-medium" 
                    : "text-white hover:" + getSidebarHoverColor()
                )} 
                onClick={() => handleModuleSelect(item.type as ModuleType)}
              >
                <div className="flex items-center">
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </div>
              </Link>
            )
          ))}
        </nav>
      </div>
      
      <Separator className={getSeparatorBgColor()} />
      
      <div className="flex-1 p-2">
        <div className={cn("px-3 py-1", !sidebarCollapsed && "mb-2")}>
          {!sidebarCollapsed && <p className={cn("text-xs font-semibold uppercase tracking-wider", getTextColor())}>
              {sortedModules.find(m => m.type === currentModule)?.name || 'Navigation'}
            </p>}
        </div>
        
        <nav className="space-y-1">
          {getModuleNavItems.map(item => 
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
          {sidebarCollapsed ? (
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
          )}
        </div>
      </>
      
      <div className="p-4">
        {!sidebarCollapsed && <p className={cn("text-xs", getTextColor())}>© 2025 Hi</p>}
      </div>
    </div>;

  return <div className="flex h-screen bg-background overflow-hidden">
      {isMobile ? <>
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
        </> : <>
          <div className={cn("flex-shrink-0 transition-all duration-300", sidebarCollapsed ? "w-20" : "w-64")}>
            {Sidebar}
          </div>
          <div className="flex-1 overflow-auto relative">
            <div className="flex items-center justify-between px-8 py-2">
              <Button variant="outline" size="icon" onClick={toggleSidebar} className="z-40 text-primary">
                {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
              <TavernLogo size="lg" />
              
              <div className="flex items-center gap-3">
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
        </>}
    </div>;
};

export default Layout;
