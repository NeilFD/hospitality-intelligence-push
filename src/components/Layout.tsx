import { useState, useEffect, useMemo, ReactNode } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Settings, Calendar, ChartBar, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, LogOut, User, Sandwich, Wine, BarChart, DollarSign, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { TavernLogo } from "./TavernLogo";
import { useAuthStore } from "@/services/auth-service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ModuleType } from "@/types/kitchen-ledger";
import { useCurrentModule, useSetCurrentModule, useModules } from "@/lib/store";

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
  
  useEffect(() => {
    console.log("Available modules:", modules);
    console.log("Current module:", currentModule);
  }, [modules, currentModule]);
  
  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [modules]);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/login');
  };
  
  const getUserInitials = () => {
    if (!profile) return '?';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  const getModuleIcon = (type: ModuleType) => {
    switch (type) {
      case 'food':
        return <Sandwich className="mr-2 h-4 w-4" />;
      case 'beverage':
        return <Wine className="mr-2 h-4 w-4" />;
      case 'pl':
        return <span className="mr-2 h-4 w-4 text-lg font-bold">£</span>;
      case 'wages':
        return <Clock className="mr-2 h-4 w-4" />;
      case 'performance':
        return <BarChart className="mr-2 h-4 w-4" />;
      case 'master':
        return <Calendar className="mr-2 h-4 w-4" />;
      default:
        return <ChartBar className="mr-2 h-4 w-4" />;
    }
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
        }];
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
        return [{
          name: "Daily Info Dashboard",
          path: "/master/dashboard",
          icon: <Home className="mr-2 h-4 w-4" />
        }];
      default:
        return [];
    }
  }, [currentModule, currentYear, currentMonth]);
  
  const moduleNavItems = useMemo(() => {
    const modulesList = [...sortedModules];
    
    if (!modulesList.some(mod => mod.type === 'master')) {
      modulesList.push({
        id: 'master-module',
        type: 'master',
        name: 'Daily Info',
        enabled: true,
        displayOrder: 0
      });
    }
    
    return modulesList.map(module => ({
      name: module.type === 'master' ? 'Daily Info' : module.name,
      path: `/${module.type}/dashboard`,
      icon: getModuleIcon(module.type),
      type: module.type
    }));
  }, [sortedModules]);
  
  const handleModuleSelect = (moduleType: ModuleType) => {
    setCurrentModule(moduleType);
    console.log(`Setting current module to: ${moduleType}`);
  };
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  const Sidebar = (
    <div className="h-full flex flex-col bg-[#48495E]">
      <div className="p-4 flex flex-col items-center">
        <TavernLogo size="md" className="mb-3" />
        <p className="text-tavern-blue-light text-sm mt-1">Pub Tracker</p>
      </div>
      <Separator className="bg-tavern-blue-light/20" />
      
      <div className="p-2 my-2">
        <div className="px-3 py-1 mb-2">
          <p className="text-xs font-semibold text-tavern-blue-light uppercase tracking-wider">
            Modules
          </p>
        </div>
        
        <ModuleNavigation />
      </div>
      
      <Separator className="bg-tavern-blue-light/20" />
      
      <div className="flex-1 p-2">
        <div className="px-3 py-1 mb-2">
          <p className="text-xs font-semibold text-tavern-blue-light uppercase tracking-wider">
            Navigation
          </p>
        </div>
        
        <ModuleSubNavigation />
      </div>
      
      <div className="p-4">
        <p className="text-xs text-tavern-blue-light">© 2025 The Tavern</p>
      </div>
    </div>
  );

  const ProfileAvatar = () => {
    const { profile } = useAuthStore();
    
    const getUserInitials = () => {
      if (!profile) return '?';
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };
    
    return (
      <div className="flex flex-col items-center">
        <Avatar className="h-9 w-9 bg-tavern-blue text-white">
          {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="Profile" className="object-cover" /> : <AvatarFallback>{getUserInitials()}</AvatarFallback>}
        </Avatar>
        {profile && <span className="text-tavern-blue hover:text-tavern-green transition-colors duration-300 text-xs mt-1 font-medium">
            {profile.first_name || 'User'}
          </span>}
      </div>
    );
  };

  const ModuleNavigation = () => {
    const location = useLocation();
    const modules = useModules();
    const currentModule = useCurrentModule();
    const setCurrentModule = useSetCurrentModule();
    const isSidebarCollapsed = false;
    
    const sortedModules = useMemo(() => {
      const modulesList = [...modules];
      
      if (!modulesList.some(mod => mod.type === 'master')) {
        modulesList.push({
          id: 'master-module',
          type: 'master',
          name: 'Daily Info',
          enabled: true,
          displayOrder: 0
        });
      }
      
      return modulesList.sort((a, b) => a.displayOrder - b.displayOrder);
    }, [modules]);
    
    const getModuleIcon = (type: ModuleType) => {
      switch (type) {
        case 'food':
          return <Sandwich className="mr-2 h-4 w-4" />;
        case 'beverage':
          return <Wine className="mr-2 h-4 w-4" />;
        case 'pl':
          return <span className="mr-2 h-4 w-4 text-lg font-bold">£</span>;
        case 'wages':
          return <Clock className="mr-2 h-4 w-4" />;
        case 'performance':
          return <BarChart className="mr-2 h-4 w-4" />;
        case 'master':
          return <Calendar className="mr-2 h-4 w-4" />;
        default:
          return <ChartBar className="mr-2 h-4 w-4" />;
      }
    };
    
    const handleModuleSelect = (moduleType: ModuleType) => {
      setCurrentModule(moduleType);
      console.log(`Setting current module to: ${moduleType}`);
    };
    
    return (
      <nav className="space-y-1">
        {sortedModules.map(item => (
          <Link 
            key={item.type} 
            to={`/${item.type}/dashboard`} 
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm transition-colors", 
              currentModule === item.type 
                ? "bg-white text-[#48495E] font-medium" 
                : "text-white hover:bg-white/10"
            )}
            title={isSidebarCollapsed ? (item.type === 'master' ? 'Daily Info' : item.name) : undefined}
            onClick={() => handleModuleSelect(item.type)}
          >
            <div className={isSidebarCollapsed ? "mx-auto" : ""}>
              {getModuleIcon(item.type)}
            </div>
            {!isSidebarCollapsed && <span>{item.type === 'master' ? 'Daily Info' : item.name}</span>}
          </Link>
        ))}
      </nav>
    );
  };

  const ModuleSubNavigation = () => {
    const location = useLocation();
    const currentModule = useCurrentModule();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const isSidebarCollapsed = false;
    
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
          }];
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
          return [{
            name: "Daily Info Dashboard",
            path: "/master/dashboard",
            icon: <Home className="mr-2 h-4 w-4" />
          }];
        default:
          return [];
      }
    }, [currentModule, currentYear, currentMonth]);
    
    return (
      <nav className="space-y-1">
        {getModuleNavItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm transition-colors", 
              location.pathname === item.path 
                ? "bg-tavern-blue-dark text-white font-medium" 
                : "text-white hover:bg-white/10"
            )}
            title={isSidebarCollapsed ? item.name : undefined}
          >
            <div className={isSidebarCollapsed ? "mx-auto" : ""}>
              {item.icon}
            </div>
            {!isSidebarCollapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    );
  };

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
            <div className="absolute top-4 left-0 right-0 flex justify-between px-4">
              <div className="w-8"></div>
              <TavernLogo size="md" />
              {isAuthenticated && <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto bg-transparent hover:bg-transparent">
                      <ProfileAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="text-sm font-medium">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
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
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>}
            </div>
            {children}
          </div>
        </> : <>
          <div className={cn("flex-shrink-0 transition-all duration-300", sidebarCollapsed ? "w-20" : "w-64")}>
            {Sidebar}
          </div>
          <div className="flex-1 overflow-auto relative">
            <div className="flex items-center justify-between px-8 py-4">
              <Button variant="outline" size="icon" onClick={toggleSidebar} className="z-40 text-gray-800">
                {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
              <TavernLogo size="lg" />
              
              {isAuthenticated && <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto bg-transparent hover:bg-transparent">
                      <ProfileAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="text-sm font-medium">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
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
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>}
            </div>
            {children}
          </div>
        </>}
    </div>;
};

export default Layout;
