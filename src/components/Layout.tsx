
import React, { useState, useEffect, useMemo, ReactNode } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Settings, Calendar, ChartBar, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, LogOut, User, Clipboard, MessageSquare, Users, Book, Wallet, Sliders, Bell } from "lucide-react";
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
  
  // Get the HTML element with class names to detect current theme
  const htmlElement = document.documentElement;
  const hasForestGreenTheme = htmlElement.classList.contains('theme-forest-green');
  const hasOceanBlueTheme = htmlElement.classList.contains('theme-ocean-blue');
  const hasSunsetOrangeTheme = htmlElement.classList.contains('theme-sunset-orange');
  const hasBerryPurpleTheme = htmlElement.classList.contains('theme-berry-purple');
  const hasDarkModeTheme = htmlElement.classList.contains('theme-dark-mode');
  
  // Determine sidebar background color based on theme
  const getSidebarBgColor = () => {
    if (hasForestGreenTheme) return "bg-[#1b5e20]";
    if (hasOceanBlueTheme) return "bg-[#1565c0]";
    if (hasSunsetOrangeTheme) return "bg-[#e65100]";
    if (hasBerryPurpleTheme) return "bg-[#6a1b9a]";
    if (hasDarkModeTheme) return "bg-[#1a1a1a]";
    return "bg-[#806cac]"; // Default purple
  };
  
  // Determine sidebar hover color based on theme
  const getSidebarHoverColor = () => {
    if (hasForestGreenTheme) return "bg-[#2e7d32]/20";
    if (hasOceanBlueTheme) return "bg-[#1976d2]/20";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00]/20";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa]/20";
    if (hasDarkModeTheme) return "bg-white/10";
    return "bg-white/10"; // Default
  };
  
  // Determine active item background color based on theme
  const getActiveItemBgColor = () => {
    if (hasForestGreenTheme) return "bg-[#2e7d32]";
    if (hasOceanBlueTheme) return "bg-[#1976d2]";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00]";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa]";
    if (hasDarkModeTheme) return "bg-[#333333]";
    return "bg-[#705b9b]"; // Default
  };
  
  // Determine module active item background color based on theme
  const getModuleActiveBgColor = () => {
    if (hasForestGreenTheme) return "bg-white text-[#1b5e20]";
    if (hasOceanBlueTheme) return "bg-white text-[#1565c0]";
    if (hasSunsetOrangeTheme) return "bg-white text-[#e65100]";
    if (hasBerryPurpleTheme) return "bg-white text-[#6a1b9a]";
    if (hasDarkModeTheme) return "bg-white text-[#1a1a1a]";
    return "bg-white text-[#806cac]"; // Default
  };
  
  // Determine control center background color based on theme
  const getControlCenterBgColor = () => {
    if (hasForestGreenTheme) return "bg-[#2e7d32]";
    if (hasOceanBlueTheme) return "bg-[#1976d2]";
    if (hasSunsetOrangeTheme) return "bg-[#ef6c00]";
    if (hasBerryPurpleTheme) return "bg-[#8e24aa]";
    if (hasDarkModeTheme) return "bg-[#333333]";
    return "bg-[#705b9b]"; // Default
  };
  
  // Determine text color based on theme
  const getTextColor = () => {
    if (hasForestGreenTheme) return "text-[#e8f5e9]";
    if (hasOceanBlueTheme) return "text-[#e3f2fd]";
    if (hasSunsetOrangeTheme) return "text-[#fff3e0]";
    if (hasBerryPurpleTheme) return "text-[#f3e5f5]";
    if (hasDarkModeTheme) return "text-[#f5f5f5]";
    return "text-[#e0d9f0]"; // Default
  };
  
  // Determine separator color based on theme
  const getSeparatorBgColor = () => {
    if (hasForestGreenTheme) return "bg-[#4c8c4a]/20";
    if (hasOceanBlueTheme) return "bg-[#42a5f5]/20";
    if (hasSunsetOrangeTheme) return "bg-[#ff9800]/20";
    if (hasBerryPurpleTheme) return "bg-[#ab47bc]/20";
    if (hasDarkModeTheme) return "bg-white/20";
    return "bg-[#9d89c9]/20"; // Default
  };
  
  const handleControlCentreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Control Centre clicked, navigating to /control-centre');
    navigate('/control-centre');
  };
  
  const ControlCentreLink = () => {
    return (
      <a 
        href="/control-centre" 
        className={cn(
          "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
          location.pathname === '/control-centre' ? getControlCenterBgColor() + " text-white font-medium" : "text-white hover:" + getSidebarHoverColor()
        )}
        title={sidebarCollapsed ? "Control Centre" : undefined}
        onClick={handleControlCentreClick}
      >
        <div className={sidebarCollapsed ? "mx-auto" : ""}>
          <Sliders className="h-4 w-4 mr-2" />
        </div>
        {!sidebarCollapsed && <span>Control Centre</span>}
      </a>
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
          },
          {
            name: `${prefix} Weekly Tracker`,
            path: `/${currentModule}/weekly-tracker`,
            icon: <Calendar className="mr-2 h-4 w-4" />
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
             module.type === 'team' ? 'Team' : module.name,
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

  const Sidebar = <div className={cn("h-full flex flex-col", getSidebarBgColor())}>
      <div className="p-4 flex flex-col items-center">
        <SidebarLogo size="md" className="mb-3" />
        <p className={cn("text-sm mt-1", getTextColor())}>Hospitality Intelligence</p>
      </div>
      
      <Separator className={getSeparatorBgColor()} />
      
      <div className="p-2 my-2">
        <div className={cn("px-3 py-1", !sidebarCollapsed && "mb-2")}>
          {!sidebarCollapsed && <p className={cn("text-xs font-semibold uppercase tracking-wider", getTextColor())}>
              Modules
            </p>}
        </div>
        
        <nav className="space-y-1">
          {moduleNavItems.map(item => <Link key={item.path} to={item.path} className={cn("flex items-center px-3 py-2 rounded-md text-sm transition-colors", currentModule === item.type ? getModuleActiveBgColor() + " font-medium" : "text-white hover:" + getSidebarHoverColor())} title={sidebarCollapsed ? item.name : undefined} onClick={() => handleModuleSelect(item.type as ModuleType)}>
              <div className={sidebarCollapsed ? "mx-auto" : ""}>
                {item.icon}
              </div>
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>)}
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
          {getModuleNavItems.map(item => <Link key={item.path} to={item.path} className={cn("flex items-center px-3 py-2 rounded-md text-sm transition-colors", location.pathname === item.path ? getActiveItemBgColor() + " text-white font-medium" : "text-white hover:" + getSidebarHoverColor())} title={sidebarCollapsed ? item.name : undefined}>
              <div className={sidebarCollapsed ? "mx-auto" : ""}>
                {item.icon}
              </div>
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>)}
        </nav>
      </div>
      
      <>
        <Separator className={getSeparatorBgColor()} />
        <div className="p-2">
          <ControlCentreLink />
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
